const fs = require('fs');
const path = require('path');
const { renderPage } = require('./lib/render');

const mdPath = path.join(__dirname, 'md_files');
const publicPath = path.join(__dirname, 'public');
const distPath = __dirname;
const fuseSrc = path.join(__dirname, 'node_modules/fuse.js/dist/fuse.min.js');

async function build() {
  console.log('Building static site...');

  const { fullHtml, searchData } = renderPage(mdPath);
  const dataJson = JSON.stringify(searchData);

  fs.writeFileSync(path.join(distPath, 'index.html'), fullHtml);
  fs.writeFileSync(path.join(distPath, 'data.json'), dataJson);
  fs.copyFileSync(path.join(publicPath, 'styles.css'), path.join(distPath, 'styles.css'));
  fs.copyFileSync(path.join(publicPath, 'app.js'), path.join(distPath, 'app.js'));
  fs.copyFileSync(fuseSrc, path.join(publicPath, 'fuse.min.js'));
  fs.copyFileSync(fuseSrc, path.join(distPath, 'fuse.min.js'));
  fs.writeFileSync(path.join(publicPath, 'data.json'), dataJson);

  console.log('Build complete! index.html, styles.css, app.js, fuse.min.js, and data.json are ready.');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
