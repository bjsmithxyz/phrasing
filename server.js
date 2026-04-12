const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { renderPage } = require('./lib/render');

const app = express();
const port = process.env.PORT || 8080;
const mdPath = path.join(__dirname, 'md_files');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/data', async (req, res) => {
  try {
    const { searchData } = renderPage(mdPath);
    res.json(searchData);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.get('/', (req, res) => {
  try {
    const { fullHtml } = renderPage(mdPath, { assetPrefix: '/' });
    res.send(fullHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
