const express = require('express');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');
const fileManager = require('../utils/fileManager');

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
 * Helper function to process markdown content into HTML
 */
const processMarkdownContent = (fileContents) => {
  let htmlIndexContent = '<div class="index">';
  let htmlMainContent = '';

  fileContents.contents.forEach((content, index) => {
    const filename = fileContents.files[index];
    const title = filename.replace('.md', '').replace(/\./g, ' ');
    
    // Create index entry
    htmlIndexContent += `<a href="#${filename.replace('.md', '')}">${title}</a>`;
    
    // Create main content section
    const htmlContent = md.render(content);
    htmlMainContent += `<section id="${filename.replace('.md', '')}" class="content-section">
      <h2 class="section-title">${title}</h2>
      ${htmlContent}
    </section>`;
  });

  htmlIndexContent += '</div>';

  return { htmlIndexContent, htmlMainContent };
};

/**
 * GET /api/data - Get all file contents as JSON
 */
router.get('/api/data', async (req, res) => {
  try {
    const fileContents = await fileManager.getAllFileContents();
    
    if (fileContents.contents.length === 0) {
      return res.status(404).json({
        error: 'No content available',
        message: 'No markdown files found or all files failed to load'
      });
    }

    res.json(fileContents.contents);
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).json({ 
      error: 'Failed to load content data',
      message: error.message 
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
        message: 'No markdown files found in the content directory.',
        error: {},
        statusCode: 404
      });
    }

    const { htmlIndexContent, htmlMainContent } = processMarkdownContent(fileContents);
    
    res.render('index', {
      title: 'Phrasing - Phrase Collection',
      indexContent: htmlIndexContent,
      mainContent: htmlMainContent,
      totalFiles: fileContents.files.length
    });
  } catch (error) {
    console.error('Error rendering main page:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Failed to load content',
      error: error,
      statusCode: 500
    });
  }
});

module.exports = router;
