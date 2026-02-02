const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();
const mdPath = path.join(__dirname, 'md_files');
const publicPath = path.join(__dirname, 'public');
const distPath = __dirname; // We'll keep index.html in the root for easy GH Pages

const slugify = s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));

async function build() {
    console.log('Building static site...');

    const files = fs.readdirSync(mdPath).filter(f => f.endsWith('.md'));
    files.sort();

    let sidebarHtml = `<div class="sidebar"><h2>Phrasing</h2>`;
    let mainContentHtml = `<div class="main-content">
      <div class="search-container">
        <input id="search-input" type="text" placeholder="Search entries...">
      </div>
      <div id="search-results-container"></div>
      <div id="phrases-container">`;

    const searchData = [];

    for (const file of files) {
        const content = fs.readFileSync(path.join(mdPath, file), 'utf8');

        // Extract phrases for search data
        const lines = content.split('\n');
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
                searchData.push(trimmed.substring(2));
            }
        });

        const categoryMatch = content.match(/^#\s+(.*)/m);
        const categoryName = categoryMatch ? categoryMatch[1] : file.replace('.md', '');
        const categoryId = slugify(categoryName);

        sidebarHtml += `<div class="sidebar-category">
      <a href="#${categoryId}" class="sidebar-category-name">${categoryName}</a>
      <div class="sidebar-alpha-links">`;

        const letterMatches = [...content.matchAll(/^##\s+([A-Z])/gm)];
        letterMatches.forEach(match => {
            const letter = match[1];
            const letterId = `${categoryId}-${letter.toLowerCase()}`;
            sidebarHtml += `<a href="#${letterId}">${letter}</a>`;
        });
        sidebarHtml += `</div></div>`;

        let html = md.render(content);
        html = html.replace(/<h1>(.*?)<\/h1>/, `<h1 id="${categoryId}">$1</h1>`);
        html = html.replace(/<h2>([A-Z])<\/h2>/g, (match, letter) => {
            return `<h2 id="${categoryId}-${letter.toLowerCase()}">${letter}</h2>`;
        });

        mainContentHtml += html;
    }

    sidebarHtml += `</div>`;
    mainContentHtml += `</div></div>
  <a id="top-link" href="#">top</a>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.6/fuse.min.js"></script>
  <script src="app.js"></script>
  <link rel="stylesheet" href="styles.css">`;

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
    ${mainContentHtml}
</body>
</html>`;

    // Write index.html to root
    fs.writeFileSync(path.join(distPath, 'index.html'), fullHtml);

    // Write search data to root
    fs.writeFileSync(path.join(distPath, 'data.json'), JSON.stringify(searchData));

    // Copy assets from public to root for direct GH Pages serving
    fs.copyFileSync(path.join(publicPath, 'styles.css'), path.join(distPath, 'styles.css'));
    fs.copyFileSync(path.join(publicPath, 'app.js'), path.join(distPath, 'app.js'));

    console.log('Build complete! index.html, styles.css, app.js, and data.json are ready.');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
