// Configuration management for Phrasing application
require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },

  // Paths
  paths: {
    markdownFiles: process.env.MD_PATH || './md_files',
    publicDir: process.env.PUBLIC_DIR || './public',
    templatesDir: process.env.TEMPLATES_DIR || './src/templates',
    staticMaxAge: process.env.STATIC_MAX_AGE || '1d',
  },

  // Cache settings
  cache: {
    duration: parseInt(process.env.CACHE_DURATION) || 5 * 60 * 1000, // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
    enabled: process.env.CACHE_ENABLED !== 'false',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests, please try again later',
  },

  // Security
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ['\'self\''],
          styleSrc: ['\'self\'', '\'unsafe-inline\''],
          scriptSrc: ['\'self\'', 'cdnjs.cloudflare.com'],
          fontSrc: ['\'self\''],
          imgSrc: ['\'self\'', 'data:'],
          connectSrc: ['\'self\''],
        },
      },
    },
    cors: {
      origin: process.env.CORS_ORIGIN || false,
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  },

  // Search configuration
  search: {
    resultsPerPage: parseInt(process.env.SEARCH_RESULTS_PER_PAGE) || 20,
    maxSearchResults: parseInt(process.env.MAX_SEARCH_RESULTS) || 500,
    fuzzyThreshold: parseFloat(process.env.FUZZY_THRESHOLD) || 0.3,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    file: process.env.LOG_FILE || './logs/app.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
  },

  // Analytics (placeholder for future)
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    trackingId: process.env.ANALYTICS_TRACKING_ID,
  },

  // Development settings
  development: {
    hotReload: process.env.HOT_RELOAD !== 'false',
    debugMode: process.env.DEBUG_MODE === 'true',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true',
  },
};

// Validation
const validateConfig = () => {
  const errors = [];

  if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
    errors.push('Invalid port number');
  }

  if (config.cache.duration < 1000) {
    errors.push('Cache duration must be at least 1 second');
  }

  if (config.rateLimit.max < 1) {
    errors.push('Rate limit max must be at least 1');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
};

// Environment-specific overrides
if (config.server.env === 'production') {
  config.logging.level = 'warn';
  config.development.debugMode = false;
  config.development.verboseLogging = false;
}

if (config.server.env === 'test') {
  config.cache.enabled = false;
  config.logging.level = 'error';
}

// Validate configuration on load
validateConfig();

module.exports = config;
