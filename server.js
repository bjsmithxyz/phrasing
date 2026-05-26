const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;
const distPath = path.join(__dirname, 'dist');

if (!fs.existsSync(path.join(distPath, 'index.html'))) {
  console.error('No build found. Run: npm run build');
  process.exit(1);
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

app.use(express.static(distPath));

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
