document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results-container');
  const phrasesContainer = document.getElementById('phrases-container');

  if (!input || !resultsContainer || !phrasesContainer) return;

  const fuseOptions = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.3,
    keys: ['text'],
    limit: 50
  };

  let fuse = null;
  let initPromise = null;

  async function loadSearchData() {
    let res = await fetch('data.json');
    if (!res.ok) res = await fetch('/data');
    if (!res.ok) throw new Error('Search data not found');
    return res.json();
  }

  function initFuse() {
    if (!initPromise) {
      initPromise = loadSearchData().then(data => {
        const searchData = data.map(text => ({ text }));
        fuse = new Fuse(searchData, fuseOptions);
      });
    }
    return initPromise;
  }

  function appendHighlighted(li, block, indices) {
    let lastIndex = 0;
    indices.forEach(([start, end]) => {
      if (start > lastIndex) {
        li.appendChild(document.createTextNode(block.substring(lastIndex, start)));
      }
      const mark = document.createElement('mark');
      mark.textContent = block.substring(start, end + 1);
      li.appendChild(mark);
      lastIndex = end + 1;
    });
    if (lastIndex < block.length) {
      li.appendChild(document.createTextNode(block.substring(lastIndex)));
    }
  }

  let timeoutId;

  input.addEventListener('input', function (e) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const searchValue = e.target.value;

      if (!searchValue) {
        resultsContainer.style.display = 'none';
        phrasesContainer.style.display = 'block';
        resultsContainer.replaceChildren();
        return;
      }

      initFuse()
        .then(() => {
          const results = fuse.search(searchValue);

          phrasesContainer.style.display = 'none';
          resultsContainer.style.display = 'block';
          resultsContainer.replaceChildren();

          if (results.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No results found.';
            resultsContainer.appendChild(p);
            return;
          }

          const ul = document.createElement('ul');
          results.forEach(result => {
            const li = document.createElement('li');
            const block = result.item.text;

            if (!result.matches || !result.matches.length) {
              li.textContent = block;
            } else {
              appendHighlighted(li, block, result.matches[0].indices);
            }
            ul.appendChild(li);
          });
          resultsContainer.appendChild(ul);
        })
        .catch(err => {
          console.error('Search failed:', err);
        });
    }, 150);
  });
});
