// Simple Phrasing Server - Markdown Phrase Browser
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure view engine and layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/templates'));
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for could not be found.',
    error: {},
    statusCode: 404,
    showSearch: false,
    showGoToTop: false
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on the server.',
    error: err,
    statusCode: err.status || 500,
    showSearch: false,
    showGoToTop: false
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Phrasing server running at http://localhost:${PORT}`);
  console.log(`📁 Markdown files: ./md_files`);
});

module.exports = app;