const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: false });

const slugify = s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage(mdPath, { assetPrefix = '' } = {}) {
  const files = fs.readdirSync(mdPath).filter(f => f.endsWith('.md')).sort();

  let sidebarHtml = '<div class="sidebar"><h2>Phrasing</h2>';
  let contentHtml = `<div class="main-content">
      <div class="search-container">
        <input id="search-input" type="text" placeholder="Search entries...">
      </div>
      <div id="search-results-container"></div>
      <div id="phrases-container">`;

  for (const file of files) {
    const content = fs.readFileSync(path.join(mdPath, file), 'utf8');
    const categoryMatch = content.match(/^#\s+(.*)/m);
    const categoryName = categoryMatch ? categoryMatch[1] : file.replace('.md', '');
    const categoryId = slugify(categoryName);
    const safeName = escapeHtml(categoryName);

    sidebarHtml += `<div class="sidebar-category">
      <a href="#${categoryId}" class="sidebar-category-name">${safeName}</a>
      <div class="sidebar-alpha-links">`;

    for (const match of content.matchAll(/^##\s+([A-Z])/gm)) {
      const letter = match[1];
      sidebarHtml += `<a href="#${categoryId}-${letter.toLowerCase()}">${letter}</a>`;
    }
    sidebarHtml += '</div></div>';

    let rendered = md.render(content);
    rendered = rendered.replace(/<h1>(.*?)<\/h1>/, `<h1 id="${categoryId}">$1</h1>`);
    rendered = rendered.replace(/<h2>([A-Z])<\/h2>/g, (_, letter) => {
      return `<h2 id="${categoryId}-${letter.toLowerCase()}">${letter}</h2>`;
    });

    contentHtml += rendered;
  }

  sidebarHtml += '</div>';
  contentHtml += '</div></div>';

  const prefix = assetPrefix;
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phrasing - 15,000+ Useful Phrases</title>
    <meta name="description" content="A comprehensive collection of phrases for business, legal, conversational, and public speaking contexts.">
    <link rel="stylesheet" href="${prefix}styles.css">
    <script>(function(){try{var t=localStorage.getItem('phrasing-theme');if(t&&t!=='dracula')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
</head>
<body>
    ${sidebarHtml}
    ${contentHtml}
    <div class="page-controls">
      <a id="top-link" href="#">top</a>
      <button type="button" id="theme-settings-btn" class="theme-settings-btn" aria-expanded="false" aria-controls="theme-panel" aria-label="Theme settings" title="Settings">settings</button>
    </div>
    <div id="theme-panel" class="theme-panel" role="dialog" aria-label="Choose theme" hidden>
      <div class="theme-panel-title">Theme</div>
      <div class="theme-options" role="list"></div>
    </div>
    <script src="${prefix}fuse.min.js" defer></script>
    <script src="${prefix}app.js" defer></script>
</body>
</html>`;

  return { fullHtml };
}

module.exports = { renderPage, slugify, escapeHtml };
