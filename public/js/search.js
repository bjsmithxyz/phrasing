// Phrasing - Search Functionality
class PhrasingSearch {
  constructor() {
    this.fuse = null;
    this.searchInput = null;
    this.contentDiv = null;
    this.timeoutId = null;
    this.isInitialized = false;
    
    this.init();
  }

  async init() {
    try {
      await this.loadData();
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      this.isInitialized = true;
      console.log('Phrasing search initialized successfully');
    } catch (error) {
      console.error('Failed to initialize search:', error);
      this.showError('Search functionality is currently unavailable.');
    }
  }

  async loadData() {
    const response = await fetch('/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Split the content of each file into blocks
    const blocks = data.flatMap(fileContent => 
      fileContent.split('\n').filter(line => line.trim() !== '')
    );

    const options = {
      includeScore: true,
      includeMatches: true,
      keys: ['0'], // search in the content of the blocks
      threshold: 0.3, // Adjust for fuzziness
      limit: 50 // Increase limit for better results
    };
    
    this.fuse = new Fuse(blocks, options);
  }

  setupEventListeners() {
    this.searchInput = document.getElementById('search-input');
    this.contentDiv = document.getElementById('content');
    
    if (!this.searchInput || !this.contentDiv) {
      throw new Error('Required DOM elements not found');
    }

    this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearch();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement === this.searchInput) {
        this.clearSearch();
      }
    });
  }

  handleSearch(e) {
    clearTimeout(this.timeoutId);
    
    this.timeoutId = setTimeout(() => {
      const searchValue = e.target.value.trim();
      
      if (searchValue === '') {
        this.clearResults();
        return;
      }
      
      this.performSearch(searchValue);
    }, 300); // Debounce search
  }

  handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Could add "search all" or "go to first result" functionality here
    }
  }

  performSearch(searchValue) {
    if (!this.fuse) {
      this.showError('Search not ready. Please try again.');
      return;
    }

    const results = this.fuse.search(searchValue);
    this.displayResults(results, searchValue);
  }

  displayResults(results, searchValue) {
    this.contentDiv.innerHTML = '';
    
    if (results.length === 0) {
      this.showNoResults(searchValue);
      return;
    }

    // Add results header
    const header = document.createElement('div');
    header.className = 'search-header';
    header.innerHTML = `<p>Found ${results.length} result${results.length === 1 ? '' : 's'} for "${searchValue}":</p>`;
    this.contentDiv.appendChild(header);

    results.forEach(result => {
      const resultElement = this.createResultElement(result);
      this.contentDiv.appendChild(resultElement);
    });
  }

  createResultElement(result) {
    const p = document.createElement('p');
    p.className = 'search-result';
    
    const block = result.item;
    const matches = result.matches && result.matches[0] ? result.matches[0].indices : [];
    
    const highlightedBlock = this.highlightMatches(block, matches);
    p.innerHTML = highlightedBlock;
    
    // Add score indicator for debugging (can be removed in production)
    if (result.score !== undefined) {
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'search-score';
      scoreSpan.textContent = ` (${(1 - result.score).toFixed(2)})`;
      scoreSpan.style.opacity = '0.5';
      scoreSpan.style.fontSize = '0.8em';
      p.appendChild(scoreSpan);
    }
    
    return p;
  }

  highlightMatches(text, matches) {
    if (!matches || matches.length === 0) {
      return this.escapeHtml(text);
    }

    let highlightedText = '';
    let lastIndex = 0;
    
    matches.forEach(match => {
      // Add text before match
      highlightedText += this.escapeHtml(text.substring(lastIndex, match[0]));
      // Add highlighted match
      highlightedText += '<mark>' + this.escapeHtml(text.substring(match[0], match[1] + 1)) + '</mark>';
      lastIndex = match[1] + 1;
    });
    
    // Add remaining text
    highlightedText += this.escapeHtml(text.substring(lastIndex));
    
    return highlightedText;
  }

  showNoResults(searchValue) {
    this.contentDiv.innerHTML = `
      <div class="no-results">
        <p>No results found for "${this.escapeHtml(searchValue)}"</p>
        <p>Try using different keywords or check your spelling.</p>
      </div>
    `;
  }

  showError(message) {
    this.contentDiv.innerHTML = `
      <div class="search-error">
        <p>⚠️ ${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  clearResults() {
    if (this.contentDiv) {
      this.contentDiv.innerHTML = '';
    }
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.clearResults();
    }
  }

  focusSearch() {
    if (this.searchInput) {
      this.searchInput.focus();
      this.searchInput.select();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if Fuse.js is loaded
  if (typeof Fuse === 'undefined') {
    console.error('Fuse.js not loaded');
    return;
  }
  
  new PhrasingSearch();
});
