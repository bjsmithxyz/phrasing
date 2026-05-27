const fs = require('fs');
const path = require('path');
const { renderPage } = require('./lib/render');

const dataRoot = path.join(__dirname, 'data');
const builtinRoot = path.join(dataRoot, 'builtin');
const publicPath = path.join(__dirname, 'public');
const distPath = path.join(__dirname, 'dist');
const fuseSrc = path.join(__dirname, 'node_modules/fuse.js/dist/fuse.min.js');
const mdItSrc = path.join(__dirname, 'node_modules/markdown-it/dist/markdown-it.min.js');

function buildManifest() {
  const sources = fs
    .readdirSync(builtinRoot)
    .filter(name => fs.statSync(path.join(builtinRoot, name)).isDirectory())
    .sort()
    .map(id => {
      const dir = path.join(builtinRoot, id);
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
      const label = id === 'phrasing' ? 'Phrasing' : id.charAt(0).toUpperCase() + id.slice(1);
      return { id, label, path: `builtin/${id}`, files };
    });

  return { default: 'phrasing', sources };
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function writeBrowserContentBundle() {
  let src = fs.readFileSync(path.join(__dirname, 'lib/content-core.js'), 'utf8');
  const exportIdx = src.indexOf('if (typeof module');
  if (exportIdx !== -1) src = src.slice(0, exportIdx);
  fs.writeFileSync(
    path.join(publicPath, 'phrasing-content.js'),
    `${src.trim()}\nwindow.PhrasingContent = createContentApi(window.markdownit({ html: false }));\n`
  );
}

async function build() {
  console.log('Building static site...');

  fs.mkdirSync(distPath, { recursive: true });

  const manifest = buildManifest();
  const defaultSource = manifest.sources.find(s => s.id === manifest.default);
  const mdPath = path.join(builtinRoot, defaultSource.id);

  const { fullHtml } = renderPage(mdPath, { sidebarTitle: defaultSource.label });

  fs.writeFileSync(path.join(distPath, 'index.html'), fullHtml);
  fs.writeFileSync(path.join(distPath, '.nojekyll'), '');
  fs.mkdirSync(path.join(distPath, 'data'), { recursive: true });
  copyDir(builtinRoot, path.join(distPath, 'data/builtin'));
  fs.writeFileSync(path.join(distPath, 'data/manifest.json'), JSON.stringify(manifest, null, 2));

  writeBrowserContentBundle();
  fs.copyFileSync(path.join(publicPath, 'styles.css'), path.join(distPath, 'styles.css'));
  fs.copyFileSync(path.join(publicPath, 'app.js'), path.join(distPath, 'app.js'));
  fs.copyFileSync(path.join(publicPath, 'phrasing-content.js'), path.join(distPath, 'phrasing-content.js'));
  fs.copyFileSync(fuseSrc, path.join(distPath, 'fuse.min.js'));
  fs.copyFileSync(mdItSrc, path.join(distPath, 'markdown-it.min.js'));
  fs.rmSync(path.join(distPath, 'data.json'), { force: true });

  console.log('Build complete! Output in dist/');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
