document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results-container');
  const phrasesContainer = document.getElementById('phrases-container');

  if (!input || !resultsContainer || !phrasesContainer) return;

  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      // Data is already an array of strings (phrases) from build.js
      const searchData = data.map(text => ({ text }));

      const options = {
        includeScore: true,
        includeMatches: true,
        threshold: 0.3,
        keys: ['text'],
        limit: 50
      };

      const fuse = new Fuse(searchData, options);

      let timeoutId;

      input.addEventListener('input', function (e) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const searchValue = e.target.value;

          if (!searchValue) {
            resultsContainer.style.display = 'none';
            phrasesContainer.style.display = 'block';
            resultsContainer.innerHTML = '';
            return;
          }

          const results = fuse.search(searchValue);

          // Update the display based on the results
          phrasesContainer.style.display = 'none';
          resultsContainer.style.display = 'block';
          resultsContainer.innerHTML = '';

          if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            return;
          }

          const ul = document.createElement('ul');
          results.forEach(result => {
            const li = document.createElement('li');
            const block = result.item.text;

            // Safely handle matches
            if (!result.matches || !result.matches.length) {
              li.textContent = block;
            } else {
              const matches = result.matches[0].indices;
              let highlightedBlock = '';
              let lastIndex = 0;

              matches.forEach(match => {
                highlightedBlock += block.substring(lastIndex, match[0]);
                highlightedBlock += '<mark>' + block.substring(match[0], match[1] + 1) + '</mark>';
                lastIndex = match[1] + 1;
              });
              highlightedBlock += block.substring(lastIndex);
              li.innerHTML = highlightedBlock;
            }
            ul.appendChild(li);
          });
          resultsContainer.appendChild(ul);
        }, 150);
      });
    })
    .catch(err => {
      console.error('Failed to fetch data for search:', err);
    });
});
