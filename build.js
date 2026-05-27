const fs = require('fs');
const path = require('path');
const { renderPage } = require('./lib/render');

const mdPath = path.join(__dirname, 'md_files');
const publicPath = path.join(__dirname, 'public');
const distPath = path.join(__dirname, 'dist');
const fuseSrc = path.join(__dirname, 'node_modules/fuse.js/dist/fuse.min.js');

async function build() {
  console.log('Building static site...');

  fs.mkdirSync(distPath, { recursive: true });

  const { fullHtml } = renderPage(mdPath);

  fs.writeFileSync(path.join(distPath, 'index.html'), fullHtml);
  fs.writeFileSync(path.join(distPath, '.nojekyll'), '');
  fs.copyFileSync(path.join(publicPath, 'styles.css'), path.join(distPath, 'styles.css'));
  fs.copyFileSync(path.join(publicPath, 'app.js'), path.join(distPath, 'app.js'));
  fs.copyFileSync(fuseSrc, path.join(distPath, 'fuse.min.js'));
  fs.rmSync(path.join(distPath, 'data.json'), { force: true });

  console.log('Build complete! Output in dist/');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
