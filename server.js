const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');

const app = express();
const port = process.env.PORT || 8080;
const mdPath = path.join(__dirname, '/md_files');
const md = new MarkdownIt();

// Custom slugify function
const slugify = s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));

app.use(express.static(path.join(__dirname, 'public')));

// API to serve raw data for search
app.get('/data', async (req, res) => {
  try {
    const files = await fs.readdir(mdPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    const fileContentsPromises = mdFiles.map(file => fs.readFile(path.join(mdPath, file), 'utf8'));
    const fileContents = await Promise.all(fileContentsPromises);
    res.json(fileContents);
  } catch(err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.get('/', async (req, res) => {
  try {
    const files = (await fs.readdir(mdPath)).filter(f => f.endsWith('.md'));
    // Sort files alphabetically
    files.sort();

    let sidebarHtml = `<div class="sidebar"><h2>Phrasing</h2>`;
    let mainContentHtml = `<div class="main-content">
      <div class="search-container">
        <input id="search-input" type="text" placeholder="Search entries...">
      </div>
      <div id="search-results-container"></div>
      <div id="phrases-container">`;

    for (const file of files) {
      const content = await fs.readFile(path.join(mdPath, file), 'utf8');
      
      // We want to generate IDs like #category-a
      // But markdown-it-anchor does its own thing. 
      // Let's manually process the content or use a custom slugifier.
      
      const categoryMatch = content.match(/^#\s+(.*)/m);
      const categoryName = categoryMatch ? categoryMatch[1] : file.replace('.md', '');
      const categoryId = slugify(categoryName);

      // Add category to sidebar
      sidebarHtml += `<div class="sidebar-category">
        <a href="#${categoryId}" class="sidebar-category-name">${categoryName}</a>
        <div class="sidebar-alpha-links">`;

      // Find all ## [Letter] to add to sidebar and make them unique
      const letterMatches = [...content.matchAll(/^##\s+([A-Z])/gm)];
      letterMatches.forEach(match => {
        const letter = match[1];
        const letterId = `${categoryId}-${letter.toLowerCase()}`;
        sidebarHtml += `<a href="#${letterId}">${letter}</a>`;
      });
      sidebarHtml += `</div></div>`;

      // Render markdown with custom IDs
      // We can't easily tell markdown-it-anchor to use our letterId per heading without more complex state
      // So let's do a simple regex replacement on the content before rendering or after rendering.
      // After rendering is safer for markdown-it to do its job.
      
      let html = md.render(content);
      
      // Inject IDs into headers
      // h1 -> id="category"
      html = html.replace(/<h1>(.*?)<\/h1>/, `<h1 id="${categoryId}">$1</h1>`);
      // h2 (Letter) -> id="category-letter"
      html = html.replace(/<h2>([A-Z])<\/h2>/g, (match, letter) => {
        return `<h2 id="${categoryId}-${letter.toLowerCase()}">${letter}</h2>`;
      });

      mainContentHtml += html;
    }

    sidebarHtml += `</div>`;
    mainContentHtml += `</div></div>
    <a id="top-link" href="#">top</a>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.6/fuse.min.js"></script>
    <script src="/app.js"></script>
    <link rel="stylesheet" href="/styles.css">`;

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phrasing</title>
</head>
<body>
    ${sidebarHtml}
    ${mainContentHtml}
</body>
</html>`);

  } catch(err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
