function createContentApi(md) {
  const slugify = s =>
    encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function splitIntoCategories(content) {
    const text = content.replace(/^\uFEFF/, '');
    const parts = text.split(/^#\s+/m).filter(Boolean);
    if (parts.length === 0) {
      const trimmed = text.trim();
      if (!trimmed) return [];
      return [{ name: 'Untitled', body: trimmed }];
    }
    return parts.map(part => {
      const newline = part.indexOf('\n');
      if (newline === -1) {
        return { name: part.trim(), body: '' };
      }
      return {
        name: part.slice(0, newline).trim(),
        body: part.slice(newline + 1)
      };
    });
  }

  function uniqueCategoryId(name, usedIds) {
    let base = slugify(name) || 'category';
    let id = base;
    let n = 2;
    while (usedIds.has(id)) {
      id = `${base}-${n++}`;
    }
    usedIds.add(id);
    return id;
  }

  function renderCategory(categoryName, body, usedIds) {
    const categoryId = uniqueCategoryId(categoryName, usedIds);
    const safeName = escapeHtml(categoryName);
    const markdown = `# ${categoryName}\n${body}`;
    let rendered = md.render(markdown);
    rendered = rendered.replace(/<h1>(.*?)<\/h1>/, `<h1 id="${categoryId}">$1</h1>`);
    rendered = rendered.replace(/<h2>([A-Z])<\/h2>/g, (_, letter) => {
      return `<h2 id="${categoryId}-${letter.toLowerCase()}">${letter}</h2>`;
    });

    let sidebarChunk = `<div class="sidebar-category">
      <a href="#${categoryId}" class="sidebar-category-name">${safeName}</a>
      <div class="sidebar-alpha-links">`;
    for (const match of body.matchAll(/^##\s+([A-Z])/gm)) {
      const letter = match[1];
      sidebarChunk += `<a href="#${categoryId}-${letter.toLowerCase()}">${letter}</a>`;
    }
    sidebarChunk += '</div></div>';

    return { sidebarChunk, contentChunk: rendered };
  }

  function buildFromMarkdownTexts(texts, { sidebarTitle = 'Phrasing' } = {}) {
    const usedIds = new Set();
    let sidebarInner = '';
    let contentHtml = '';
    for (const content of texts) {
      for (const { name, body } of splitIntoCategories(content)) {
        const { sidebarChunk, contentChunk } = renderCategory(name, body, usedIds);
        sidebarInner += sidebarChunk;
        contentHtml += contentChunk;
      }
    }
    const sidebarHtml = `<div class="sidebar"><h2>${escapeHtml(sidebarTitle)}</h2>${sidebarInner}</div>`;
    const mainHtml = `<div class="main-content">
      <div class="search-container">
        <input id="search-input" type="text" placeholder="Search entries...">
      </div>
      <div id="search-results-container"></div>
      <div id="phrases-container">${contentHtml}</div>
    </div>`;
    return { sidebarHtml, mainHtml };
  }

  return {
    slugify,
    escapeHtml,
    splitIntoCategories,
    buildFromMarkdownTexts
  };
}

if (typeof module !== 'undefined' && module.exports) {
  const MarkdownIt = require('markdown-it');
  const api = createContentApi(new MarkdownIt({ html: false }));
  module.exports = api;
  module.exports.createContentApi = createContentApi;
}
