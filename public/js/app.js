// Simple Phrasing Application JavaScript
class PhrasingApp {
  constructor() {
    this.searchInput = null;
    this.searchClear = null;
    this.goToTopBtn = null;
    this.originalContent = null;
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupTheme();
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

  // Search functionality
  setupSearch() {
    this.searchInput = document.getElementById('search-input');
    this.searchClear = document.getElementById('search-clear');
    
    if (!this.searchInput) return;

    // Store original content
    const contentEl = document.querySelector('.content');
    if (contentEl) {
      this.originalContent = contentEl.innerHTML;
    }

    // Search input event
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      this.performSearch(query);
      this.toggleClearButton(query);
    });

    // Clear button event
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
  }

  performSearch(query) {
    const contentEl = document.querySelector('.content');
    if (!contentEl || !this.originalContent) return;

    if (!query) {
      // Restore original content
      contentEl.innerHTML = this.originalContent;
      return;
    }

    // Create case-insensitive regex
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    
    // Filter and highlight content
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.originalContent, 'text/html');
    const sections = doc.querySelectorAll('.content-section');
    
    let hasResults = false;
    const filteredSections = [];

    sections.forEach(section => {
      const textContent = section.textContent.toLowerCase();
      if (textContent.includes(query.toLowerCase())) {
        hasResults = true;
        
        // Highlight matches in HTML
        const highlighted = this.highlightMatches(section.innerHTML, regex);
        const newSection = section.cloneNode(false);
        newSection.innerHTML = highlighted;
        filteredSections.push(newSection.outerHTML);
      }
    });

    if (hasResults) {
      contentEl.innerHTML = filteredSections.join('');
    } else {
      contentEl.innerHTML = `
        <div class="search-no-results">
          <h3>No results found</h3>
          <p>No phrases found matching "<strong>${this.escapeHtml(query)}</strong>"</p>
          <p>Try a different search term or <button onclick="app.clearSearch()" style="background:none;border:none;color:var(--accent-cyan);cursor:pointer;text-decoration:underline;">clear search</button></p>
        </div>
      `;
    }
  }

  highlightMatches(html, regex) {
    // Only highlight text content, not HTML tags
    return html.replace(regex, '<span class="search-highlight">$1</span>');
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
    this.performSearch('');
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
    this.searchClear = document.getElementById('search-clear');
    
    if (!this.searchInput) return;

    // Store original content
    const contentEl = document.querySelector('.content');
    if (contentEl) {
      this.originalContent = contentEl.innerHTML;
    }

    // Search input event
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      this.performSearch(query);
      this.toggleClearButton(query);
    });

    // Clear button event
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
  }

  performSearch(query) {
    const contentEl = document.querySelector('.content');
    if (!contentEl || !this.originalContent) return;

    if (!query) {
      // Restore original content
      contentEl.innerHTML = this.originalContent;
      return;
    }

    // Create case-insensitive regex
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    
    // Filter and highlight content
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.originalContent, 'text/html');
    const sections = doc.querySelectorAll('.content-section');
    
    let hasResults = false;
    const filteredSections = [];

    sections.forEach(section => {
      const textContent = section.textContent.toLowerCase();
      if (textContent.includes(query.toLowerCase())) {
        hasResults = true;
        
        // Highlight matches in HTML
        const highlighted = this.highlightMatches(section.innerHTML, regex);
        const newSection = section.cloneNode(false);
        newSection.innerHTML = highlighted;
        filteredSections.push(newSection.outerHTML);
      }
    });

    if (hasResults) {
      contentEl.innerHTML = filteredSections.join('');
    } else {
      contentEl.innerHTML = `
        <div class="search-no-results">
          <h3>No results found</h3>
          <p>No phrases found matching "<strong>${this.escapeHtml(query)}</strong>"</p>
          <p>Try a different search term or <button onclick="app.clearSearch()" style="background:none;border:none;color:var(--accent-cyan);cursor:pointer;text-decoration:underline;">clear search</button></p>
        </div>
      `;
    }
  }

  highlightMatches(html, regex) {
    // Only highlight text content, not HTML tags
    return html.replace(regex, '<span class="search-highlight">$1</span>');
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
    this.performSearch('');
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
      }
    });
  }

  // Basic theme management
  setupTheme() {
    const theme = localStorage.getItem('phrasing-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('phrasing-theme', newTheme);
      });
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PhrasingApp();
});
