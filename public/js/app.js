// Simple Phrasing Application JavaScript
class PhrasingApp {
  constructor() {
    this.searchInput = null;
    this.searchClear = null;
    this.goToTopBtn = null;
    this.searchResults = null;
    this.phrasesData = [];
    this.searchDebounceTimer = null;
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupTheme();
    this.loadPhrasesData();
    this.setupSearch();
    this.setupGoToTop();
    this.setupScrollEffects();
    console.log('Phrasing app initialized');
  }

  // Basic navigation features
  setupNavigation() {
    // Smooth scrolling for anchor links
    document.addEventListener('click', (e) => {
      if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Update active nav item
          this.updateActiveNavItem(targetId);
        }
      }
    });
  }

  // Update active navigation item
  updateActiveNavItem(activeId) {
    const navLinks = document.querySelectorAll('.index a');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${activeId}`) {
        link.classList.add('active');
      }
    });
  }

  // Theme toggle functionality
  setupTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // Load phrases data for search
  async loadPhrasesData() {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      this.phrasesData = this.processPhrasesData(data);
      console.log(`Loaded ${this.phrasesData.length} searchable phrases`);
    } catch (error) {
      console.error('Failed to load phrases data:', error);
      this.phrasesData = [];
    }
  }

  processPhrasesData(data) {
    const phrases = [];
    
    data.forEach(file => {
      const fileName = file.filename.replace('.md', '').replace('phrasing.', '');
      const sections = file.content.split(/#{1,6}\s+/).filter(section => section.trim());
      
      sections.forEach(section => {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;
        
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        // Extract individual phrases from lists
        const listItems = content.match(/^\s*[-*+]\s+(.+)$/gm);
        if (listItems) {
          listItems.forEach(item => {
            const phrase = item.replace(/^\s*[-*+]\s+/, '').trim();
            if (phrase) {
              phrases.push({
                text: phrase,
                source: fileName,
                section: title,
                id: `${fileName}-${title}-${phrase}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
              });
            }
          });
        } else if (content) {
          // Handle non-list content
          phrases.push({
            text: content,
            source: fileName,
            section: title,
            id: `${fileName}-${title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
          });
        }
      });
    });
    
    return phrases;
  }

  // Search functionality
  setupSearch() {
    this.searchInput = document.getElementById('search-input');
    this.searchClear = document.getElementById('search-clear');
    
    if (!this.searchInput) return;

    // Create search results overlay
    this.createSearchResultsOverlay();

    // Search input event
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      this.toggleClearButton(query);
      
      // Debounce search for better performance
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.performSearch(query);
      }, 150);
    });

    // Clear button
    if (this.searchClear) {
      this.searchClear.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Escape key to clear search
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearSearch();
      }
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-actions') && this.searchResults) {
        this.hideSearchResults();
      }
    });
  }

  createSearchResultsOverlay() {
    // Remove existing overlay if any
    const existing = document.querySelector('.search-results-overlay');
    if (existing) existing.remove();

    // Create new overlay
    const overlay = document.createElement('div');
    overlay.className = 'search-results-overlay';
    overlay.innerHTML = `
      <div class="search-results-header">
        <p class="search-results-count"></p>
      </div>
      <div class="search-results-content"></div>
    `;

    // Insert after the header
    const header = document.querySelector('.site-header');
    if (header) {
      header.parentNode.insertBefore(overlay, header.nextSibling);
      this.searchResults = overlay;
    }
  }

  performSearch(query) {
    if (!this.searchResults) return;

    if (!query) {
      this.hideSearchResults();
      return;
    }

    // Search through phrases data
    const results = this.searchPhrasesData(query);
    this.displaySearchResults(query, results);
  }

  searchPhrasesData(query) {
    const queryLower = query.toLowerCase();
    const results = [];

    this.phrasesData.forEach(phrase => {
      const textLower = phrase.text.toLowerCase();
      const sourceLower = phrase.source.toLowerCase();
      const sectionLower = phrase.section.toLowerCase();

      if (textLower.includes(queryLower) || 
          sourceLower.includes(queryLower) || 
          sectionLower.includes(queryLower)) {
        
        // Calculate relevance score
        let score = 0;
        if (textLower.includes(queryLower)) score += 10;
        if (sourceLower.includes(queryLower)) score += 5;
        if (sectionLower.includes(queryLower)) score += 3;
        
        // Boost exact matches
        if (textLower === queryLower) score += 20;
        
        results.push({ ...phrase, score });
      }
    });

    // Sort by relevance score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  displaySearchResults(query, results) {
    if (!this.searchResults) return;

    const header = this.searchResults.querySelector('.search-results-header .search-results-count');
    const content = this.searchResults.querySelector('.search-results-content');

    if (results.length === 0) {
      header.innerHTML = `No results for "<span class="search-results-query">${this.escapeHtml(query)}</span>"`;
      content.innerHTML = `
        <div class="search-no-results">
          <h3>No phrases found</h3>
          <p>Try a different search term or check your spelling.</p>
        </div>
      `;
    } else {
      header.innerHTML = `${results.length} result${results.length === 1 ? '' : 's'} for "<span class="search-results-query">${this.escapeHtml(query)}</span>"`;
      
      const resultsHtml = results.slice(0, 50).map(result => { // Limit to 50 results for performance
        const highlightedText = this.highlightSearchTerm(result.text, query);
        return `
          <div class="search-result-item" data-phrase-id="${result.id}">
            <div class="search-result-source">${this.formatSourceName(result.source)} → ${result.section}</div>
            <p class="search-result-text">${highlightedText}</p>
          </div>
        `;
      }).join('');
      
      content.innerHTML = resultsHtml;

      // Add click handlers for results
      content.addEventListener('click', (e) => {
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
          this.handleResultClick(resultItem.dataset.phraseId);
        }
      });
    }

    this.showSearchResults();
  }

  highlightSearchTerm(text, query) {
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  formatSourceName(source) {
    return source.replace(/[._-]/g, ' ')
                 .replace(/\b\w/g, l => l.toUpperCase())
                 .replace(/^Prepositional\s+/, 'Prep. ');
  }

  handleResultClick(phraseId) {
    // Copy phrase to clipboard if possible
    const result = this.phrasesData.find(p => p.id === phraseId);
    if (result && navigator.clipboard) {
      navigator.clipboard.writeText(result.text).then(() => {
        // Show brief feedback
        this.showCopyFeedback();
      }).catch(() => {
        console.log('Clipboard copy failed');
      });
    }
    
    // Hide search results
    this.hideSearchResults();
    this.clearSearch();
  }

  showCopyFeedback() {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.textContent = 'Copied to clipboard!';
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--accent-green);
      color: var(--bg-main);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 600;
      z-index: 1000;
      animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }

  showSearchResults() {
    if (this.searchResults) {
      this.searchResults.classList.add('active');
    }
  }

  hideSearchResults() {
    if (this.searchResults) {
      this.searchResults.classList.remove('active');
    }
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  toggleClearButton(query) {
    if (!this.searchClear) return;
    this.searchClear.style.display = query ? 'block' : 'none';
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchInput.focus();
    }
    this.hideSearchResults();
    this.toggleClearButton('');
  }

  // Go to top button
  setupGoToTop() {
    this.goToTopBtn = document.getElementById('go-to-top');
    if (!this.goToTopBtn) return;

    this.goToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Scroll effects for go to top button and nav highlighting
  setupScrollEffects() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Show/hide go to top button
    if (this.goToTopBtn) {
      if (scrollTop > 300) {
        this.goToTopBtn.classList.add('visible');
      } else {
        this.goToTopBtn.classList.remove('visible');
      }
    }

    // Highlight current section in navigation
    this.updateActiveNavOnScroll();
  }

  updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.index a');
    
    if (!sections.length || !navLinks.length) return;

    const scrollTop = window.pageYOffset + 150; // Offset for header
    let currentSection = '';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + window.pageYOffset;
      
      if (sectionTop <= scrollTop) {
        currentSection = section.id;
      }
    });

    // Update nav links
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PhrasingApp();
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, pause any animations or polling
    console.log('App paused');
  } else {
    // Page is visible again
    console.log('App resumed');
  }
});
