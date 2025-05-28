const winston = require('winston');
const path = require('path');
const config = require('../config');

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Production format (JSON for better parsing)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: config.server.env === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { 
    service: 'phrasing-app',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.server.env,
    pid: process.pid
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      silent: config.server.env === 'test',
      handleExceptions: true,
      handleRejections: true,
    }),
    
    // File transport
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  
  // Exit on error false to prevent logger from exiting process
  exitOnError: false,
});

// Helper methods for common logging patterns
logger.request = (method, meta = {}) => {
  if (typeof method === 'object' && meta.path) {
    // Called as middleware (req, res, next)
    const req = method;
    const res = meta;
    const next = arguments[2];
    
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, url, ip, headers } = req;
      const { statusCode } = res;
      
      const logData = {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        ip: ip || headers['x-forwarded-for'] || 'unknown',
        userAgent: headers['user-agent'] || 'unknown',
      };
      
      if (statusCode >= 400) {
        logger.warn('HTTP Request', logData);
      } else {
        logger.info('HTTP Request', logData);
      }
    });
    
    if (next) {next();}
  } else {
    // Called as direct log method
    logger.info('HTTP Request', { method, ...meta });
  }
};

logger.error = (message, meta = {}) => {
  let errorData;
  
  if (typeof message === 'string') {
    errorData = { message, ...meta };
  } else {
    // Message is an error object
    errorData = {
      message: message.message || 'Unknown error',
      stack: message.stack,
      ...meta
    };
  }
  
  winston.Logger.prototype.error.call(logger, errorData);
};

logger.performance = (operation, duration, meta = {}) => {
  logger.info('Performance', {
    operation,
    duration: `${duration}ms`,
    ...meta
  });
};

logger.security = (event, details = {}) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

logger.cache = (action, key, hit = false, meta = {}) => {
  if (config.development.verboseLogging) {
    logger.debug('Cache', {
      action,
      key,
      hit,
      ...meta
    });
  }
};

// Development helpers
if (config.server.env === 'development') {
  logger.dev = (...args) => logger.debug('[DEV]', ...args);
} else {
  logger.dev = () => {}; // No-op in production
}

// Graceful error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  console.error('Unhandled Rejection:', reason);
});

module.exports = logger;
