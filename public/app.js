const THEME_STORAGE_KEY = 'phrasing-theme';
const DATA_SOURCE_KEY = 'phrasing-data-source';
const DATA_CUSTOM_MD_KEY = 'phrasing-custom-md';
const DATA_CUSTOM_NAME_KEY = 'phrasing-custom-name';
const CUSTOM_MD_MAX_BYTES = 2 * 1024 * 1024;

const THEMES = [
  { id: 'dracula', label: 'Dracula' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'orangde', label: 'Orangde' },
  { id: 'mono', label: 'Black & White' },
  { id: 'light', label: 'Light' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'rose', label: 'Rose' }
];

let fuse = null;
let initPromise = null;
let manifestCache = null;
let builtinSnapshot = null;
let currentSourceId = 'phrasing';
let closeThemePanel = () => {};
let closeDataPanel = () => {};

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

  function resetSearch() {
    fuse = null;
    initPromise = null;
    input.value = '';
    resultsContainer.style.display = 'none';
    resultsContainer.replaceChildren();
    phrasesContainer.style.display = 'block';
  }

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

  function cacheBuiltinSnapshot() {
    if (builtinSnapshot) return;
    builtinSnapshot = {
      sidebarHtml: document.querySelector('.sidebar').outerHTML,
      phrasesHtml: phrasesContainer.innerHTML
    };
  }

  function applySourceHtml({ sidebarHtml, mainHtml }) {
    const sidebarWrap = document.createElement('div');
    sidebarWrap.innerHTML = sidebarHtml.trim();
    document.querySelector('.sidebar').replaceWith(sidebarWrap.firstElementChild);

    const mainWrap = document.createElement('div');
    mainWrap.innerHTML = mainHtml.trim();
    const newPhrases = mainWrap.querySelector('#phrases-container');
    phrasesContainer.innerHTML = newPhrases ? newPhrases.innerHTML : '';
    resetSearch();
  }

  function applyBuiltinSnapshot() {
    if (!builtinSnapshot) return;
    const sidebarWrap = document.createElement('div');
    sidebarWrap.innerHTML = builtinSnapshot.sidebarHtml;
    document.querySelector('.sidebar').replaceWith(sidebarWrap.firstElementChild);
    phrasesContainer.innerHTML = builtinSnapshot.phrasesHtml;
    resetSearch();
  }

  async function loadManifest() {
    if (manifestCache) return manifestCache;
    const res = await fetch('data/manifest.json');
    if (!res.ok) throw new Error('Could not load data manifest');
    manifestCache = await res.json();
    return manifestCache;
  }

  async function fetchBuiltinSource(sourceId) {
    const manifest = await loadManifest();
    const source = manifest.sources.find(s => s.id === sourceId);
    if (!source) throw new Error(`Unknown source: ${sourceId}`);
    const texts = await Promise.all(
      source.files.map(async file => {
        const res = await fetch(`data/${source.path}/${file}`);
        if (!res.ok) throw new Error(`Could not load ${file}`);
        return res.text();
      })
    );
    return window.PhrasingContent.buildFromMarkdownTexts(texts, { sidebarTitle: source.label });
  }

  function persistSource(id, { customText, customName } = {}) {
    try {
      localStorage.setItem(DATA_SOURCE_KEY, id);
      if (id === 'custom') {
        localStorage.setItem(DATA_CUSTOM_MD_KEY, customText);
        localStorage.setItem(DATA_CUSTOM_NAME_KEY, customName || 'Custom');
      }
    } catch (err) {
      console.warn('Could not save data source preference', err);
    }
  }

  function getStoredSourceId() {
    try {
      const id = localStorage.getItem(DATA_SOURCE_KEY);
      if (id === 'custom') return 'custom';
      if (manifestCache && manifestCache.sources.some(s => s.id === id)) return id;
      return manifestCache ? manifestCache.default : 'phrasing';
    } catch {
      return 'phrasing';
    }
  }

  async function activateSource(id, { customText, customName, persist = true } = {}) {
    if (!window.PhrasingContent) {
      throw new Error('Content renderer not loaded');
    }

    if (id === 'phrasing' || id === (manifestCache && manifestCache.default)) {
      applyBuiltinSnapshot();
      currentSourceId = 'phrasing';
      if (persist) persistSource('phrasing');
      return;
    }

    if (id === 'custom') {
      if (!customText || !customText.trim()) throw new Error('No custom content');
      const title = customName || 'Custom';
      const built = window.PhrasingContent.buildFromMarkdownTexts([customText], {
        sidebarTitle: title
      });
      applySourceHtml(built);
      currentSourceId = 'custom';
      if (persist) persistSource('custom', { customText, customName: title });
      return;
    }

    const built = await fetchBuiltinSource(id);
    applySourceHtml(built);
    currentSourceId = id;
    if (persist) persistSource(id);
  }

  function updateDataPanelActive() {
    const panel = document.getElementById('data-panel');
    if (!panel) return;
    panel.querySelectorAll('.data-option').forEach(el => {
      const match =
        (el.dataset.source === 'phrasing' && currentSourceId === 'phrasing') ||
        el.dataset.source === currentSourceId;
      el.classList.toggle('is-active', match);
    });
  }

  function showDataStatus(message, isError) {
    const el = document.getElementById('data-status');
    if (!el) return;
    el.hidden = false;
    el.textContent = message;
    el.classList.toggle('is-error', Boolean(isError));
  }

  function hideDataStatus() {
    const el = document.getElementById('data-status');
    if (el) el.hidden = true;
  }

  async function initDataSources() {
    const btn = document.getElementById('data-source-btn');
    const panel = document.getElementById('data-panel');
    const builtinRoot = panel && panel.querySelector('.data-builtin-options');
    const fileInput = document.getElementById('data-file-input');
    if (!btn || !panel || !builtinRoot) return;

    cacheBuiltinSnapshot();

    let manifest;
    try {
      manifest = await loadManifest();
    } catch (err) {
      console.error(err);
      return;
    }

    manifest.sources.forEach(source => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'data-option';
      opt.dataset.source = source.id;
      opt.textContent = source.label;
      opt.setAttribute('role', 'listitem');
      opt.addEventListener('click', async () => {
        hideDataStatus();
        try {
          await activateSource(source.id);
          updateDataPanelActive();
          closeDataPanel();
        } catch (err) {
          showDataStatus(err.message, true);
        }
      });
      builtinRoot.appendChild(opt);
    });

    function openPanel() {
      closeThemePanel();
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      updateDataPanelActive();
    }

    function closePanelFn() {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    closeDataPanel = closePanelFn;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (panel.hidden) openPanel();
      else closePanelFn();
    });

    panel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => closePanelFn());

    if (fileInput) {
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        if (!file) return;
        hideDataStatus();

        if (file.size > CUSTOM_MD_MAX_BYTES) {
          showDataStatus('File is too large (max 2 MB).', true);
          return;
        }

        try {
          const text = await file.text();
          if (!/^#\s+/m.test(text)) {
            showDataStatus('File needs at least one # heading section.', true);
            return;
          }
          const name = file.name.replace(/\.md$/i, '') || 'Custom';
          await activateSource('custom', { customText: text, customName: name });
          updateDataPanelActive();
          closePanelFn();
          showDataStatus(`Loaded ${file.name}`, false);
        } catch (err) {
          showDataStatus(err.message || 'Could not load file', true);
        }
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden) closePanelFn();
    });

    const stored = getStoredSourceId();
    if (stored === 'custom') {
      try {
        const text = localStorage.getItem(DATA_CUSTOM_MD_KEY);
        const name = localStorage.getItem(DATA_CUSTOM_NAME_KEY) || 'Custom';
        if (text) await activateSource('custom', { customText: text, customName: name, persist: false });
      } catch (err) {
        console.error(err);
        await activateSource(manifest.default, { persist: false });
      }
    } else if (stored !== manifest.default) {
      try {
        await activateSource(stored, { persist: false });
      } catch (err) {
        console.error(err);
      }
    }
    updateDataPanelActive();
  }

  closeThemePanel = initThemes();
  initDataSources();
});

function initThemes() {
  const btn = document.getElementById('theme-settings-btn');
  const panel = document.getElementById('theme-panel');
  const optionsRoot = panel && panel.querySelector('.theme-options');
  if (!btn || !panel || !optionsRoot) return () => {};

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
      closeThemePanel();
    });
    optionsRoot.appendChild(opt);
  });

  applyTheme(getStoredTheme());

  function openPanel() {
    closeDataPanel();
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  function closePanelFn() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (panel.hidden) openPanel();
    else closePanelFn();
  });

  document.addEventListener('click', () => closePanelFn());
  panel.addEventListener('click', e => e.stopPropagation());

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) closePanelFn();
  });

  return closePanelFn;
}
