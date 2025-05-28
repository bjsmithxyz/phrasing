// Phase 2 Implementation - Modular Phrasing Server
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import modules
const config = require('./src/config');
const logger = require('./src/utils/logger');
const cache = require('./src/utils/cache');
const fileManager = require('./src/utils/fileManager');
const routes = require('./src/routes');

const app = express();

// Initialize logger
logger.info('server_starting', {
  env: config.server.env,
  port: config.server.port,
  host: config.server.host,
});

// Initialize file manager
fileManager.initialize(config.paths.markdownFiles)
  .then(() => {
    logger.info('file_manager_initialized', {
      markdownPath: config.paths.markdownFiles,
    });
  })
  .catch((error) => {
    logger.error('file_manager_init_failed', {
      error: error.message,
      stack: error.stack,
    });
  });

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, config.paths.templatesDir));

// Security middleware
app.use(helmet(config.security.helmet));
app.use(cors(config.security.cors));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/search', limiter);

// Compression
app.use(compression());

// Logging middleware
app.use((req, res, next) => {
  logger.request(req.method, {
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
  });
  next();
});

// Static files
app.use(express.static(config.paths.publicDir, {
  maxAge: config.paths.staticMaxAge,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, _next) => {
  logger.error('unhandled_error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  const isProduction = config.server.env === 'production';
  res.status(err.status || 500);
  
  res.render('error', {
    title: 'Error - Phrasing',
    message: isProduction ? 'Internal Server Error' : err.message,
    error: isProduction ? {} : err,
    statusCode: err.status || 500,
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('page_not_found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).render('error', {
    title: 'Page Not Found - Phrasing',
    message: 'The page you are looking for could not be found.',
    error: {},
    statusCode: 404,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('server_shutdown_start', { signal: 'SIGTERM' });
  
  // Clear cache
  cache.clear();
  
  // Stop file watcher
  fileManager.cleanup();
  
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('server_shutdown_start', { signal: 'SIGINT' });
  
  // Clear cache
  cache.clear();
  
  // Stop file watcher
  fileManager.cleanup();
  
  process.exit(0);
});

// Start server
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info('server_started', {
    port: config.server.port,
    host: config.server.host,
    env: config.server.env,
    cacheEnabled: config.cache.enabled,
  });

  console.log(`🚀 Phrasing server running at http://${config.server.host}:${config.server.port}`);
  console.log(`📝 Environment: ${config.server.env}`);
  console.log(`💾 Cache: ${config.cache.enabled ? 'enabled' : 'disabled'}`);
  console.log(`📁 Markdown files: ${config.paths.markdownFiles}`);
});

// Handle server errors
server.on('error', (error) => {
  logger.error('server_error', {
    error: error.message,
    code: error.code,
    port: config.server.port,
  });
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${config.server.port} is already in use`);
    process.exit(1);
  }
});

module.exports = app;