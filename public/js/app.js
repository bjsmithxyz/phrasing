// Simple Phrasing Application JavaScript
class PhrasingApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupTheme();
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

    // Show/hide top link based on scroll position
    window.addEventListener('scroll', () => {
      if (topLink) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 300) {
          topLink.style.opacity = '1';
        } else {
          topLink.style.opacity = '0.3';
        }
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
