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

  function extractPhrases(container) {
    const phrases = [];
    for (const ul of container.querySelectorAll('ul')) {
      for (const li of ul.children) {
        if (li.tagName !== 'LI') continue;
        const clone = li.cloneNode(true);
        clone.querySelectorAll('ul').forEach(n => n.remove());
        const text = clone.textContent.trim();
        if (text) phrases.push(text);
      }
    }
    return phrases;
  }

  function initFuse() {
    if (!initPromise) {
      initPromise = Promise.resolve().then(() => {
        const searchData = extractPhrases(phrasesContainer).map(text => ({ text }));
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
