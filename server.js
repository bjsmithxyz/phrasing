const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const { renderPage } = require('./lib/render');

const app = express();
const port = process.env.PORT || 8080;
const mdPath = path.join(__dirname, 'md_files');
const publicPath = path.join(__dirname, 'public');

let pageCache;

function ensurePublicAssets() {
  const fuseSrc = path.join(__dirname, 'node_modules/fuse.js/dist/fuse.min.js');
  const fuseDest = path.join(publicPath, 'fuse.min.js');
  if (!fs.existsSync(fuseDest) && fs.existsSync(fuseSrc)) {
    fs.copyFileSync(fuseSrc, fuseDest);
  }
}

function loadPage() {
  if (!pageCache) {
    ensurePublicAssets();
    pageCache = renderPage(mdPath, { assetPrefix: '/' });
    fs.writeFileSync(
      path.join(publicPath, 'data.json'),
      JSON.stringify(pageCache.searchData)
    );
  }
  return pageCache;
}

app.use(compression());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'"
  );
  next();
});

app.use(express.static(publicPath));

function sendSearchData(_req, res) {
  try {
    res.json(loadPage().searchData);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
}

app.get('/data.json', sendSearchData);
app.get('/data', sendSearchData);

app.get('/', (req, res) => {
  try {
    res.type('html').send(loadPage().fullHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

loadPage();

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${port} is already in use. Stop the other process (e.g. kill $(lsof -t -i:${port})) or run PORT=8081 npm start`
    );
    process.exit(1);
  }
  throw err;
});
