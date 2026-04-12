const fs = require('fs');
const path = require('path');
const { renderPage } = require('./lib/render');

const mdPath = path.join(__dirname, 'md_files');
const publicPath = path.join(__dirname, 'public');
const distPath = __dirname;

async function build() {
    console.log('Building static site...');

    const { fullHtml, searchData } = renderPage(mdPath);

    fs.writeFileSync(path.join(distPath, 'index.html'), fullHtml);
    fs.writeFileSync(path.join(distPath, 'data.json'), JSON.stringify(searchData));
    fs.copyFileSync(path.join(publicPath, 'styles.css'), path.join(distPath, 'styles.css'));
    fs.copyFileSync(path.join(publicPath, 'app.js'), path.join(distPath, 'app.js'));

    console.log('Build complete! index.html, styles.css, app.js, and data.json are ready.');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
