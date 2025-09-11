const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');

// Constants and settings
const app = express();
const port = process.env.PORT || 8080;
const mdPath = path.join(__dirname, '/md_files');
const md = new MarkdownIt();

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

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));
// Small HTML snippet that links the external stylesheet
const stylesLink = `<link rel="stylesheet" href="/styles.css">`;

// Middleware to serve file contents
app.get('/data', async (req, res) => {
  try {
    const files = await fs.readdir(mdPath);
    const fileContentsPromises = files.map(file => fs.readFile(path.join(mdPath, file), 'utf8'));
    const fileContents = await Promise.all(fileContentsPromises);
    res.json(fileContents);
  } catch(err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

// Middleware to serve index page
app.get('/', async (req, res) => {
  let htmlIndexContent = `<div class="index">`;
  let htmlMainContent = "";

  try {
    const files = await fs.readdir(mdPath);
    const fileContentsPromises = files.map(file => fs.readFile(path.join(mdPath, file), 'utf8'));
    const fileContents = await Promise.all(fileContentsPromises);

    fileContents.forEach((contents, index) => {
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
    // Wrap the index and search input in a topbar so the search sits to the right of the links
    // and the results are rendered below the input. Styles are now served from /public/styles.css
    htmlIndexContent = `${stylesLink}<div class="topbar">` + htmlIndexContent.replace(/^[\s\S]*$/, htmlIndexContent) + `
    <div class="search-container">
      <input id="search-input" type="text" placeholder="Search...">
      <div id="content"></div>
    </div>
    </div>`;

  // Include Fuse.js CDN and external app script
  htmlMainContent += `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.6/fuse.min.js"></script>
  <script src="/app.js"></script>
  `;

    res.send(`${htmlIndexContent}${htmlMainContent}`);

  } catch(err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
