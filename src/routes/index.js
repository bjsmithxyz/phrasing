const express = require('express');
const { query, validationResult } = require('express-validator');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');
const fileManager = require('../utils/fileManager');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const config = require('../config');

const router = express.Router();

// Configure markdown-it
const md = new MarkdownIt();
const slugify = s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));
const uniqueSlug = (slug, slugs) => {
  let uniq = slug;
  let i = 2;
  while (slugs[uniq]) {
    uniq = `${slug}-${i++}`;
  }
  slugs[uniq] = true;
  return uniq;
};

const slugs = {};
md.use(anchor, { slugify: s => uniqueSlug(slugify(s), slugs) });

/**
 * Validation middleware
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.security('validation_failed', {
      ip: req.ip,
      errors: errors.array(),
      path: req.path,
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

/**
 * Error handler for routes
 */
const handleRouteError = (res, error, message = 'An error occurred', statusCode = 500) => {
  logger.error(message, error, {
    statusCode,
    url: res.req?.url,
    method: res.req?.method,
    ip: res.req?.ip,
  });

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(config.server.env === 'development' && { details: error.message }),
  });
};

/**
 * Generate HTML content from markdown
 */
const generateHTMLContent = (contents) => {
  let htmlIndexContent = '<div class="index">';
  let htmlMainContent = '';

  contents.forEach((content) => {
    const html = md.render(content);
    htmlMainContent += html;

    // Generate index
    let isFileIndexOpen = false;
    const regex = /<h([123]) id="(.*?)">(.*?)<\/h[123]>/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const hLevel = match[1];
      if (hLevel === '1') {
        if (isFileIndexOpen) {htmlIndexContent += '</div></div>';}
        htmlIndexContent += `<div class="file-index"><a href="#${match[2]}">${match[3]}</a><div class="sub-index">`;
        isFileIndexOpen = true;
      } else {
        htmlIndexContent += `<a href="#${match[2]}">${match[3]}</a> `;
      }
    }
    
    if (isFileIndexOpen) {htmlIndexContent += '</div></div>';}
  });

  htmlIndexContent += '</div>';
  htmlMainContent += '<a id="top-link" href="#">top</a>';

  return { htmlIndexContent, htmlMainContent };
};

/**
 * GET /api/data - Get all file contents as JSON
 */
router.get('/api/data', [
  query('format').optional().isIn(['json', 'raw']).withMessage('Format must be json or raw'),
], validateRequest, async (req, res) => {
  try {
    const fileContents = await fileManager.getAllFileContents();
    
    if (fileContents.contents.length === 0) {
      return res.status(404).json({
        error: 'No content available',
        message: 'No markdown files found or all files failed to load',
        timestamp: new Date().toISOString(),
      });
    }

    const response = req.query.format === 'raw' ? 
      fileContents.contents : 
      fileContents;

    res.set('Cache-Control', 'public, max-age=300');
    res.json(response);
  } catch (error) {
    handleRouteError(res, error, 'Failed to load content data');
  }
});

/**
 * GET /api/search - Search through content
 */
router.get('/api/search', [
  query('q').notEmpty().trim().isLength({ min: 1, max: 500 }).withMessage('Query must be 1-500 characters'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('mode').optional().isIn(['fuzzy', 'exact']).withMessage('Mode must be fuzzy or exact'),
], validateRequest, async (req, res) => {
  try {
    const { q: query, page = 1, limit = config.search.resultsPerPage, mode = 'fuzzy' } = req.query;
    const start = Date.now();

    const fileContents = await fileManager.getAllFileContents();
    
    if (fileContents.contents.length === 0) {
      return res.status(404).json({
        error: 'No content to search',
        timestamp: new Date().toISOString(),
      });
    }

    // Perform search (this is a simplified version - in production you'd use a proper search engine)
    const results = [];
    const searchRegex = mode === 'exact' ? 
      new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') :
      new RegExp(query.split('').join('.*'), 'gi');

    fileContents.contents.forEach((content, index) => {
      const matches = content.match(searchRegex);
      if (matches) {
        // Extract context around matches
        const lines = content.split('\n');
        const matchingLines = lines.filter(line => searchRegex.test(line));
        
        matchingLines.forEach(line => {
          const lineIndex = lines.indexOf(line);
          const context = lines.slice(Math.max(0, lineIndex - 1), lineIndex + 2).join('\n');
          
          results.push({
            file: fileContents.files[index],
            line: lineIndex + 1,
            content: line.trim(),
            context: context.trim(),
            matches: matches.length,
          });
        });
      }
    });

    // Pagination
    const totalResults = results.length;
    const totalPages = Math.ceil(totalResults / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);

    const searchTime = Date.now() - start;

    logger.performance('search_query', searchTime, {
      query,
      mode,
      totalResults,
      page,
      limit,
    });

    res.json({
      query,
      mode,
      results: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalResults,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      searchTime: `${searchTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleRouteError(res, error, 'Search failed');
  }
});

/**
 * GET /api/stats - Get application statistics
 */
router.get('/api/stats', async (req, res) => {
  try {
    const [fileStats, cacheStats] = await Promise.all([
      fileManager.getFileStats(),
      cache.getStats(),
    ]);

    res.json({
      files: fileStats,
      cache: cacheStats,
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform,
        environment: config.server.env,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleRouteError(res, error, 'Failed to get statistics');
  }
});

/**
 * GET /health - Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Basic health checks
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };

    // Test critical dependencies
    try {
      await fileManager.validateDirectory();
      health.fileSystem = 'ok';
    } catch {
      health.fileSystem = 'error';
      health.status = 'degraded';
    }

    health.cache = {
      status: cache.enabled ? 'enabled' : 'disabled',
      size: cache.getStats().size,
    };

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * GET / - Main application page
 */
router.get('/', async (req, res) => {
  try {
    const fileContents = await fileManager.getAllFileContents();
    
    if (fileContents.contents.length === 0) {
      return res.render('error', {
        title: 'No Content Available',
        statusCode: 404,
        message: 'No markdown files found in the content directory.',
        details: fileContents.metadata.failedFiles?.length > 0 ? 
          `Failed to read ${fileContents.metadata.failedFiles.length} files` : 
          'Content directory is empty',
      });
    }

    const { htmlIndexContent, htmlMainContent } = generateHTMLContent(fileContents.contents);
    const stats = await fileManager.getFileStats();

    res.render('index', {
      title: 'Searchable Phrase Collection',
      description: 'Browse and search through curated phrase collections with powerful search capabilities',
      indexHtml: htmlIndexContent,
      contentHtml: htmlMainContent,
      stats: {
        totalFiles: stats.totalFiles,
        totalPhrases: stats.totalLines,
        cacheSize: cache.getStats().size,
      },
    });
  } catch (error) {
    logger.error('Failed to render main page', error);
    res.render('error', {
      title: 'Application Error',
      statusCode: 500,
      message: 'Failed to load the application',
      details: error.message,
    });
  }
});

module.exports = router;
