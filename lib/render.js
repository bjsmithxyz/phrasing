const fs = require('fs');
const path = require('path');
const content = require('./content-core');

function renderPage(mdPath, { assetPrefix = '', sidebarTitle = 'Phrasing' } = {}) {
  const files = fs.readdirSync(mdPath).filter(f => f.endsWith('.md')).sort();
  const texts = files.map(f => fs.readFileSync(path.join(mdPath, f), 'utf8'));
  const { sidebarHtml, mainHtml } = content.buildFromMarkdownTexts(texts, { sidebarTitle });

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
    ${mainHtml}
    <div class="page-controls">
      <a id="top-link" href="#">top</a>
      <button type="button" id="theme-settings-btn" class="page-control-btn theme-settings-btn" aria-expanded="false" aria-controls="theme-panel" aria-label="Choose theme" title="Theme">theme</button>
      <button type="button" id="data-source-btn" class="page-control-btn data-source-btn" aria-expanded="false" aria-controls="data-panel" aria-label="Data source" title="Data">data</button>
      <button type="button" id="egg-btn" class="page-control-btn egg-btn" aria-label="Surprise" title="Surprise">&#9786;</button>
    </div>
    <div id="egg-burst" class="egg-burst" aria-hidden="true" hidden></div>
    <div id="theme-panel" class="theme-panel" role="dialog" aria-label="Choose theme" hidden>
      <div class="theme-panel-title">Theme</div>
      <div class="theme-options" role="list"></div>
    </div>
    <div id="data-panel" class="data-panel" role="dialog" aria-label="Choose data source" hidden>
      <div class="data-panel-title">Data source</div>
      <div class="data-builtin-options" role="list"></div>
      <div class="data-panel-divider">Custom</div>
      <label class="data-upload-label">
        <span class="data-upload-btn">Upload .md</span>
        <input type="file" id="data-file-input" accept=".md,text/markdown" hidden>
      </label>
      <p id="data-status" class="data-status" hidden></p>
    </div>
    <script src="${prefix}markdown-it.min.js" defer></script>
    <script src="${prefix}phrasing-content.js" defer></script>
    <script src="${prefix}fuse.min.js" defer></script>
    <script src="${prefix}app.js" defer></script>
</body>
</html>`;

  return { fullHtml };
}

module.exports = { renderPage };
