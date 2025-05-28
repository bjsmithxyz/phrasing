// Phrasing - Main Application JavaScript
class PhrasingApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupNavigationFeatures();
    this.setupScrollFeatures();
    this.addLoadingIndicators();
    console.log('Phrasing app initialized');
  }

  setupNavigationFeatures() {
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
        }
      }
    });

    // Handle top link
    const topLink = document.getElementById('top-link');
    if (topLink) {
      topLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  setupScrollFeatures() {
    let isScrolling = false;
    
    // Show/hide top link based on scroll position
    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          isScrolling = false;
        });
        isScrolling = true;
      }
    });
  }

  handleScroll() {
    const topLink = document.getElementById('top-link');
    if (!topLink) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Show top link after scrolling down 300px
    if (scrollTop > 300) {
      topLink.style.opacity = '1';
      topLink.style.pointerEvents = 'auto';
    } else {
      topLink.style.opacity = '0.3';
      topLink.style.pointerEvents = 'none';
    }
  }

  addLoadingIndicators() {
    // Add loading state to search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        searchInput.placeholder = 'Type to search... (Ctrl+K to focus)';
      });
      
      searchInput.addEventListener('blur', () => {
        if (searchInput.value === '') {
          searchInput.placeholder = 'Search...';
        }
      });
    }
  }

  // Utility method to show notifications (for future use)
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #44475a;
      color: #d1d5db;
      padding: 12px 16px;
      border-radius: 4px;
      border: 1px solid #6272a4;
      z-index: 1000;
      font-family: Consolas, monospace;
      font-size: 12px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PhrasingApp();
});
