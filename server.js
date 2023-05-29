const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');

// Constants and settings
const app = express();
const port = process.env.PORT || 8080;
const mdPath = path.join(__dirname, '/md_files');
const md = new MarkdownIt();

// Custom slugify function for markdown-it-anchor
const slugify = s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));
const uniqueSlug = (slug, slugs) => {
  let uniq = slug;
  let i = 2;
  while (slugs[uniq]) {
    uniq = `${slug}-${i++}`;
  }
  slugs[uniq] = true;
  return uniq;
};
let slugs = {};
md.use(anchor, { slugify: s => uniqueSlug(slugify(s), slugs) });

// CSS Styles
const styles = `
<style>
  body {
    font-family: Consolas, monospace;
    font-size: 12px;
    color: #d1d5db;
    background-color: #282a36;
    margin: 50px 100px;
  }
  .index {
    max-width: 500px;
    overflow-x: auto;
  }
  .index .file-index {
    font-size: 10px;
    margin-bottom: 1em;
  }
  .index .file-index a {
    margin: 0.1em;
  }
  .index .sub-index {
    display: flex;
    flex-wrap: wrap;
  }
  a:link {
    color: #BD93F9;
  }
  a:visited {
    color: #FF79C6;
  }
  #top-link {
    position: fixed;
    bottom: 20px;
    left: 20px;
  }
  #search-input {
    width: calc(100% - 200px);
    margin: 20px 100px;
    background-color: #282a36;
    color: #d1d5db;
    border: 1px solid #d1d5db;
    font-family: Consolas, monospace;
  }
  mark {
    background-color: #50fa7b;
    color: black;
  }
  ::selection {
    background: #50fa7b;
    color: black;
  }
</style>
`;

// Middleware to serve file contents
app.get('/data', async (req, res) => {
  try {
    const files = await fs.readdir(mdPath);
    const fileContentsPromises = files.map(file => fs.readFile(path.join(mdPath, file), 'utf8'));
    const fileContents = await Promise.all(fileContentsPromises);
    res.json(fileContents);
  } catch(err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

// Middleware to serve index page
app.get('/', async (req, res) => {
  let htmlIndexContent = `${styles}<div class="index">`;
  let htmlMainContent = "";

  try {
    const files = await fs.readdir(mdPath);
    const fileContentsPromises = files.map(file => fs.readFile(path.join(mdPath, file), 'utf8'));
    const fileContents = await Promise.all(fileContentsPromises);

    fileContents.forEach((contents, index) => {
      const html = md.render(contents);
      htmlMainContent += html;

      // Generate index
      let isFileIndexOpen = false;
      const regex = /<h([123]) id="(.*?)">(.*?)<\/h[123]>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
          let hLevel = match[1];
          if (hLevel === "1") {
            if (isFileIndexOpen) htmlIndexContent += `</div></div>`;
            htmlIndexContent += `<div class="file-index"><a href="#${match[2]}">${match[3]}</a><div class="sub-index">`;
            isFileIndexOpen = true;
          } else {
            htmlIndexContent += `<a href="#${match[2]}">${match[3]}</a> `;
          }
      }
      if (isFileIndexOpen) htmlIndexContent += `</div></div>`;
    });

    htmlIndexContent += `</div>`;
    htmlMainContent += `<a id="top-link" href="#">top</a>`;

    // Add search bar
    htmlIndexContent += `
    <input id="search-input" type="text" placeholder="Search..." style="width: calc(100% - 200px); margin: 20px 100px;">
    <div id="content"></div>
    `;

    // Add Fuse.js library
    htmlMainContent += `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.6/fuse.min.js"></script>
    `;

    // Add search script
    htmlMainContent += `
    <script>
      fetch('/data')
        .then(response => response.json())
        .then(data => {
          // Split the content of each file into blocks
          const blocks = data.flatMap(fileContent => fileContent.split('\\n'));

          const options = {
            includeScore: true,
            includeMatches: true,
            keys: ['0'], // search in the content of the blocks
            limit: 10 // limit the number of results
          };
          const fuse = new Fuse(blocks, options);

          let timeoutId;
          document.getElementById('search-input').addEventListener('input', function(e) {
            clearTimeout(timeoutId); // clear the previous timeout
            timeoutId = setTimeout(() => { // set a new timeout
              const searchValue = e.target.value;
              const results = fuse.search(searchValue);

              // Update the display based on the results
              const contentDiv = document.getElementById('content');
              contentDiv.innerHTML = '';
              results.forEach(result => {
                const p = document.createElement('p');
                // Highlight the search term in the block
                const block = result.item;
                const matches = result.matches[0].indices;
                let highlightedBlock = '';
                let lastIndex = 0;
                matches.forEach(match => {
                  highlightedBlock += block.substring(lastIndex, match[0]);
                  highlightedBlock += '<mark>' + block.substring(match[0], match[1] + 1) + '</mark>';
                  lastIndex = match[1] + 1;
                });
                highlightedBlock += block.substring(lastIndex);
                p.innerHTML = highlightedBlock;
                contentDiv.appendChild(p);
              });
            }, 300); // wait 300ms after the user has stopped typing
          });
        });
    </script>
    `;

    res.send(`${htmlIndexContent}${htmlMainContent}`);

  } catch(err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
