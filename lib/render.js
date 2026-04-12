const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();

const slugify = s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));

function buildSidebar(files, mdPath) {
  let html = '<div class="sidebar"><h2>Phrasing</h2>';

  for (const file of files) {
    const content = fs.readFileSync(path.join(mdPath, file), 'utf8');
    const categoryMatch = content.match(/^#\s+(.*)/m);
    const categoryName = categoryMatch ? categoryMatch[1] : file.replace('.md', '');
    const categoryId = slugify(categoryName);

    html += `<div class="sidebar-category">
      <a href="#${categoryId}" class="sidebar-category-name">${categoryName}</a>
      <div class="sidebar-alpha-links">`;

    const letterMatches = [...content.matchAll(/^##\s+([A-Z])/gm)];
    for (const match of letterMatches) {
      const letter = match[1];
      html += `<a href="#${categoryId}-${letter.toLowerCase()}">${letter}</a>`;
    }
    html += '</div></div>';
  }

  html += '</div>';
  return html;
}

function buildContent(files, mdPath) {
  let html = `<div class="main-content">
      <div class="search-container">
        <input id="search-input" type="text" placeholder="Search entries...">
      </div>
      <div id="search-results-container"></div>
      <div id="phrases-container">`;

  const searchData = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(mdPath, file), 'utf8');

    // Extract phrases for search data
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        searchData.push(trimmed.substring(2));
      }
    }

    const categoryMatch = content.match(/^#\s+(.*)/m);
    const categoryName = categoryMatch ? categoryMatch[1] : file.replace('.md', '');
    const categoryId = slugify(categoryName);

    let rendered = md.render(content);
    rendered = rendered.replace(/<h1>(.*?)<\/h1>/, `<h1 id="${categoryId}">$1</h1>`);
    rendered = rendered.replace(/<h2>([A-Z])<\/h2>/g, (_, letter) => {
      return `<h2 id="${categoryId}-${letter.toLowerCase()}">${letter}</h2>`;
    });

    html += rendered;
  }

  html += '</div></div>';
  return { html, searchData };
}

function renderPage(mdPath, { assetPrefix = '' } = {}) {
  const files = fs.readdirSync(mdPath).filter(f => f.endsWith('.md'));
  files.sort();

  const sidebarHtml = buildSidebar(files, mdPath);
  const { html: contentHtml, searchData } = buildContent(files, mdPath);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phrasing - 15,000+ Useful Phrases</title>
    <meta name="description" content="A comprehensive collection of phrases for business, legal, conversational, and public speaking contexts.">
</head>
<body>
    ${sidebarHtml}
    ${contentHtml}
    <a id="top-link" href="#">top</a>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.6/fuse.min.js"></script>
    <script src="${assetPrefix}app.js"></script>
    <link rel="stylesheet" href="${assetPrefix}styles.css">
</body>
</html>`;

  return { fullHtml, searchData };
}

module.exports = { renderPage, slugify };
