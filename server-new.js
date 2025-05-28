// Phrasing - Searchable Phrase Collection
// Phase 2: Template Engine, Testing, Code Organization

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import our modules
const config = require('./src/config');
const logger = require('./src/utils/logger');
const cache = require('./src/utils/cache');
const fileManager = require('./src/utils/fileManager');
const routes = require('./src/routes');

// Initialize Express app
const app = express();

// Configure EJS template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, config.paths.templatesDir));

// Trust proxy in production (for rate limiting behind reverse proxy)
if (config.server.env === 'production') {
  app.set('trust proxy', 1);
}

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests',
    message: config.rateLimit.message,
    retryAfter: `${config.rateLimit.windowMs / 60000} minutes`,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks in development
    return config.server.env === 'development' && req.path === '/health';
  },
});

// Security middleware
app.use(limiter);
app.use(helmet(config.security.helmet));
app.use(cors(config.security.cors));
app.use(compression());

// Request logging middleware
app.use(logger.request);

// Static files middleware
app.use(express.static(path.join(__dirname, config.paths.publicDir), {
  maxAge: config.paths.staticMaxAge,
  etag: true,
  lastModified: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Development middleware
if (config.server.env === 'development') {
  // File watcher for auto-cache invalidation
  fileManager.watchFiles((eventType, filename) => {
    logger.dev('File changed, invalidating cache', { eventType, filename });
    cache.invalidate('.*'); // Invalidate all cache entries
  });

  // Development route for cache management
  app.get('/dev/cache', (req, res) => {
    const action = req.query.action;
    
    if (action === 'clear') {
      cache.clear();
      return res.json({ message: 'Cache cleared', stats: cache.getStats() });
    }
    
    if (action === 'stats') {
      return res.json(cache.getStats());
    }
    
    res.json({
      message: 'Development cache management',
      actions: ['clear', 'stats'],
      stats: cache.getStats(),
    });
  });
}

// Use routes
app.use(routes);

// 404 handler - must come after all routes
app.use('*', (req, res) => {
  logger.security('404_access', {
    ip: req.ip,
    path: req.originalUrl,
    userAgent: req.get('User-Agent'),
    referrer: req.get('Referrer'),
  });

  if (req.accepts('html')) {
    res.status(404).render('error', {
      title: 'Page Not Found',
      statusCode: 404,
      message: 'The page you are looking for does not exist.',
      details: config.server.env === 'development' ? `Path: ${req.originalUrl}` : null,
    });
  } else {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource does not exist',
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled application error', error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  if (req.accepts('html')) {
    res.status(500).render('error', {
      title: 'Internal Server Error',
      statusCode: 500,
      message: 'Something went wrong on the server',
      details: config.server.env === 'development' ? error.message : null,
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong on the server',
      timestamp: new Date().toISOString(),
      ...(config.server.env === 'development' && { details: error.message }),
    });
  }
});

// Startup validation
async function validateStartup() {
  try {
    logger.info('Starting application validation...');
    
    // Validate markdown directory
    await fileManager.validateDirectory();
    logger.info('✓ Markdown directory validated');
    
    // Validate template directory
    const templatesPath = path.join(__dirname, config.paths.templatesDir);
    const fs = require('fs').promises;
    await fs.access(templatesPath);
    logger.info('✓ Templates directory validated');
    
    // Test cache functionality
    cache.set('startup_test', 'ok');
    const testValue = cache.get('startup_test');
    if (testValue !== 'ok') {
      throw new Error('Cache functionality test failed');
    }
    cache.delete('startup_test');
    logger.info('✓ Cache functionality validated');
    
    logger.info('✅ Application validation completed successfully');
    return true;
  } catch (error) {
    logger.error('❌ Application validation failed', error);
    return false;
  }
}

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Cleanup operations
    cache.clear();
    logger.info('Cache cleared');
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Start server
let server;

const startServer = async () => {
  try {
    // Validate application before starting
    const isValid = await validateStartup();
    if (!isValid && config.server.env === 'production') {
      logger.error('Application validation failed, exiting...');
      process.exit(1);
    }

    // Start server
    server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 Phrasing server started`, {
        port: config.server.port,
        host: config.server.host,
        environment: config.server.env,
        pid: process.pid,
        version: process.env.npm_package_version || '1.0.0',
      });
      
      logger.info(`📝 Application URLs:`, {
        main: `http://${config.server.host}:${config.server.port}`,
        health: `http://${config.server.host}:${config.server.port}/health`,
        api: `http://${config.server.host}:${config.server.port}/api`,
      });

      if (config.server.env === 'development') {
        logger.info('🔧 Development features enabled:');
        logger.info(`   • File watching: enabled`);
        logger.info(`   • Cache management: /dev/cache`);
        logger.info(`   • Debug logging: enabled`);
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.server.port} is already in use`);
      } else {
        logger.error('Server error', error);
      }
      process.exit(1);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

// Export app for testing
module.exports = app;
