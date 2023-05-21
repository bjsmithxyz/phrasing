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

// CSS Styles
const styles = `
<style>
  body {
    font-family: Consolas, monospace;
    font-size: 12px;
    color: #d1d5db;
    background-color: #282a36;
    margin: 50px 100px;
  }
  .index {
    max-width: 500px;
    overflow-x: auto;
  }
  .index .file-index {
    font-size: 10px;
    margin-bottom: 1em;
  }
  .index .file-index a {
    margin: 0.1em;
  }
  .index .sub-index {
    display: flex;
    flex-wrap: wrap;
  }
  a:link {
    color: #BD93F9;
  }
  a:visited {
    color: #FF79C6;
  }
  #top-link {
    position: fixed;
    bottom: 20px;
    left: 20px;
  }
</style>
`;

// Middleware
app.get('/', async (req, res) => {
  let htmlIndexContent = `${styles}<div class="index">`;
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
