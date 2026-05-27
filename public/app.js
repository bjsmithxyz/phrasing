document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results-container');
  const phrasesContainer = document.getElementById('phrases-container');

  if (!input || !resultsContainer || !phrasesContainer) return;

  initThemes();

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

const THEME_STORAGE_KEY = 'phrasing-theme';

const THEMES = [
  { id: 'dracula', label: 'Dracula' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'orangde', label: 'Orangde' },
  { id: 'mono', label: 'Black & White' },
  { id: 'light', label: 'Light' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'rose', label: 'Rose' }
];

function initThemes() {
  const btn = document.getElementById('theme-settings-btn');
  const panel = document.getElementById('theme-panel');
  const optionsRoot = panel && panel.querySelector('.theme-options');
  if (!btn || !panel || !optionsRoot) return;

  function getStoredTheme() {
    try {
      const t = localStorage.getItem(THEME_STORAGE_KEY);
      return THEMES.some(x => x.id === t) ? t : 'dracula';
    } catch {
      return 'dracula';
    }
  }

  function applyTheme(id) {
    if (id === 'dracula') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', id);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch (_) {}
    optionsRoot.querySelectorAll('.theme-option').forEach(el => {
      el.classList.toggle('is-active', el.dataset.theme === id);
    });
  }

  THEMES.forEach(t => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'theme-option';
    opt.dataset.theme = t.id;
    opt.textContent = t.label;
    opt.setAttribute('role', 'listitem');
    opt.addEventListener('click', () => {
      applyTheme(t.id);
      closePanel();
    });
    optionsRoot.appendChild(opt);
  });

  applyTheme(getStoredTheme());

  function openPanel() {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (panel.hidden) openPanel();
    else closePanel();
  });

  document.addEventListener('click', () => closePanel());

  panel.addEventListener('click', e => e.stopPropagation());

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });
}
