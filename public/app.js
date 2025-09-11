// Client-side search moved from inline script to this file.
// Depends on Fuse.js being loaded first (CDN included by server).

document.addEventListener('DOMContentLoaded', () => {
  fetch('/data')
    .then(response => response.json())
    .then(data => {
      // Split the content of each file into blocks (by line)
      const blocks = data.flatMap(fileContent => fileContent.split('\n'));

      const options = {
        includeScore: true,
        includeMatches: true,
        keys: ['0'], // search in the content of the blocks
        limit: 10 // limit the number of results
      };

      const fuse = new Fuse(blocks, options);

      let timeoutId;
      const input = document.getElementById('search-input');
      const contentDiv = document.getElementById('content');
      if (!input || !contentDiv) return;

      input.addEventListener('input', function(e) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const searchValue = e.target.value;
          if (!searchValue) {
            contentDiv.innerHTML = '';
            return;
          }

          const results = fuse.search(searchValue);

          // Update the display based on the results
          contentDiv.innerHTML = '';
          results.forEach(result => {
            const p = document.createElement('p');
            const block = result.item;

            // Safely handle matches
            if (!result.matches || !result.matches.length) {
              p.textContent = block;
              contentDiv.appendChild(p);
              return;
            }

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
        }, 300);
      });
    })
    .catch(err => {
      console.error('Failed to fetch data for search:', err);
    });
});
