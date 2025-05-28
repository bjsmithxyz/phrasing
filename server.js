const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Constants and settings
const app = express();
const port = process.env.PORT || 8080;
const mdPath = path.join(__dirname, '/md_files');
const md = new MarkdownIt();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security and performance middleware
app.use(limiter);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));
app.use(cors());
app.use(compression());

// Middleware for static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// Custom slugify function for markdown-it-anchor
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
let slugs = {};
md.use(anchor, { slugify: s => uniqueSlug(slugify(s), slugs) });

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
const getCacheKey = (type, params = '') => `${type}_${params}`;
const isValidCache = (item) => item && (Date.now() - item.timestamp) < CACHE_DURATION;
const setCache = (key, data) => cache.set(key, { data, timestamp: Date.now() });
const getCache = (key) => {
  const item = cache.get(key);
  return isValidCache(item) ? item.data : null;
};

// Error handling helper
const handleError = (res, error, message = 'An error occurred') => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
};

// File validation helper
const isValidMarkdownFile = (filename) => {
  return filename.endsWith('.md') && !filename.startsWith('.');
};

// HTML template helpers
const getHTMLHead = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phrasing - Searchable Phrase Collection</title>
    <link rel="stylesheet" href="/css/styles.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.6/fuse.min.js"></script>
</head>
<body>
`;

const getHTMLFooter = () => `
    <script src="/js/app.js"></script>
    <script src="/js/search.js"></script>
</body>
</html>
`;

// Middleware to serve file contents
app.get('/data', async (req, res) => {
  const cacheKey = getCacheKey('fileContents');
  
  // Check cache first
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    // Validate directory exists
    await fs.access(mdPath);
    
    const files = await fs.readdir(mdPath);
    const markdownFiles = files.filter(isValidMarkdownFile);
    
    if (markdownFiles.length === 0) {
      return res.status(404).json({ 
        error: 'No markdown files found',
        timestamp: new Date().toISOString() 
      });
    }

    const fileContentsPromises = markdownFiles.map(async file => {
      try {
        return await fs.readFile(path.join(mdPath, file), 'utf8');
      } catch (error) {
        console.warn(`Failed to read file ${file}:`, error.message);
        return ''; // Return empty string for failed files
      }
    });
    
    const fileContents = await Promise.all(fileContentsPromises);
    const validContents = fileContents.filter(content => content.length > 0);
    
    // Cache the results
    setCache(cacheKey, validContents);
    
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(validContents);
  } catch(error) {
    handleError(res, error, 'Failed to load markdown files');
  }
});

// Middleware to serve index page
app.get('/', async (req, res) => {
  const cacheKey = getCacheKey('mainPage');
  
  // Check cache first
  const cachedHTML = getCache(cacheKey);
  if (cachedHTML) {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    return res.send(cachedHTML);
  }

  let htmlIndexContent = `<div class="index">`;
  let htmlMainContent = "";

  try {
    // Validate directory exists
    await fs.access(mdPath);
    
    const files = await fs.readdir(mdPath);
    const markdownFiles = files.filter(isValidMarkdownFile);
    
    if (markdownFiles.length === 0) {
      const errorHTML = getHTMLHead() + 
        `<div style="text-align: center; margin-top: 50px;">
          <h1>No Content Available</h1>
          <p>No markdown files found in the content directory.</p>
        </div>` + 
        getHTMLFooter();
      return res.send(errorHTML);
    }

    const fileContentsPromises = markdownFiles.map(async file => {
      try {
        return await fs.readFile(path.join(mdPath, file), 'utf8');
      } catch (error) {
        console.warn(`Failed to read file ${file}:`, error.message);
        return ''; // Return empty string for failed files
      }
    });
    
    const fileContents = await Promise.all(fileContentsPromises);
    const validContents = fileContents.filter(content => content.length > 0);

    validContents.forEach((contents, index) => {
      const html = md.render(contents);
      htmlMainContent += html;

      // Generate index
      let isFileIndexOpen = false;
      const regex = /<h([123]) id="(.*?)">(.*?)<\/h[123]>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
          let hLevel = match[1];
          if (hLevel === "1") {
            if (isFileIndexOpen) htmlIndexContent += `</div></div>`;
            htmlIndexContent += `<div class="file-index"><a href="#${match[2]}">${match[3]}</a><div class="sub-index">`;
            isFileIndexOpen = true;
          } else {
            htmlIndexContent += `<a href="#${match[2]}">${match[3]}</a> `;
          }
      }
      if (isFileIndexOpen) htmlIndexContent += `</div></div>`;
    });

    htmlIndexContent += `</div>`;
    htmlMainContent += `<a id="top-link" href="#">top</a>`;

    // Add search bar
    htmlIndexContent += `
    <input id="search-input" type="text" placeholder="Search...">
    <div id="content"></div>
    `;

    const fullHTML = getHTMLHead() + htmlIndexContent + htmlMainContent + getHTMLFooter();
    
    // Cache the result
    setCache(cacheKey, fullHTML);
    
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.send(fullHTML);

  } catch(error) {
    handleError(res, error, 'Failed to generate page content');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cache_size: cache.size
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});
