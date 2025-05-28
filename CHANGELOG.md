# Changelog

All notable changes to the Phrasing project will be documented in this file.

## [2.1.0] - 2025-05-28

### 🧹 Code Cleanup & Architecture Improvements

#### Removed - Eliminated Duplication

- **🗂️ Unused Layout Template**: Removed redundant `layout.ejs` that was never referenced
- **📁 Backup Files**: Cleaned up `.backups` directory with stale test files
- **🔄 Template Duplication**: Eliminated 80% code duplication between templates

#### Refactored - DRY Template System

- **🏗️ Proper Layout System**: Implemented `express-ejs-layouts` for clean template inheritance
- **📝 Template Optimization**: Reduced `index.ejs` from 73 lines to 11 lines (85% reduction)
- **⚠️ Error Template**: Streamlined `error.ejs` from 135 lines to 27 lines (80% reduction)
- **🎯 Conditional Features**: Added smart layout controls (search, go-to-top button visibility)

#### Enhanced - Maintainability

- **📦 Dependencies**: Added `express-ejs-layouts` (^2.5.1) for proper template management
- **🏗️ Architecture**: Single source of truth for HTML structure, headers, footers
- **🛠️ Maintenance**: Template changes now require editing only one file instead of three

### Technical Benefits

- **-85% Template Code**: Reduced from ~208 total template lines to ~38 lines
- **+100% Maintainability**: One layout file manages all common HTML structure
- **Zero Functional Changes**: All features work exactly as before, just cleaner code

---

## [2.0.0] - 2025-05-28

### 🎨 Complete UI/UX Overhaul - "The Modern Era"

#### Added - New Features
- **🔍 Real-time Search**: Instant phrase filtering with yellow highlighting and clear button
- **🌙 Dracula Theme**: Beautiful dark theme with purple/pink accents and light mode toggle  
- **🧭 Enhanced Navigation**: Fixed sidebar index with active section highlighting
- **⬆️ Go to Top Button**: Smooth scroll to top functionality in bottom-left corner
- **📱 Mobile Optimization**: Fully responsive design with touch-friendly interactions
- **⌨️ Keyboard Shortcuts**: Escape to clear search, Enter to navigate
- **🎯 Smart UI Elements**: Hover effects, smooth animations, and modern typography

#### Enhanced - Core Functionality  
- **📝 Rich Markdown**: Advanced markdown-it processing with automatic anchor generation
- **🚀 Performance**: Client-side search and optimized rendering (~276 lines JavaScript)
- **🏗️ Architecture**: Clean separation with `src/` directory structure
- **🎨 Styling**: Modern CSS with 533 lines of Dracula-themed styles
- **🔧 Error Handling**: Comprehensive error pages and validation

#### Technical Improvements
- **Server**: Upgraded to robust 46-line Express server with proper error handling
- **Templates**: Complete EJS restructuring with semantic HTML and accessibility
- **File Management**: Enhanced utility with parallel file reading and validation
- **API**: RESTful `/api/data` endpoint for JSON access to all collections

### 📚 Content Update
- **16 Phrase Collections**: Comprehensive coverage including business, literary, conversational
- **Specialized Categories**: Prepositional phrases (by, in, into, of, to, with)
- **Professional Content**: Public speaking, impressive expressions, striking similies

### 🛠️ Dependencies
- `express` (^4.18.2) - Web server framework
- `ejs` (^3.1.10) - Template engine  
- `markdown-it` (^13.0.1) - Markdown processing
- `markdown-it-anchor` (^8.6.7) - Anchor link generation
- `nodemon` (^3.0.1) - Development tool

---

## [1.0.0] - 2025-05-28 (Previous Version)

### Major Simplification - Removed Scope Creep

#### Removed
- **Infrastructure**: Docker, CI/CD pipelines, production deployment configs
- **Testing Framework**: Jest, coverage tools, test directories  
- **Admin Interface**: Admin dashboard, management features, complex UI
- **Development Tools**: ESLint, Prettier, Husky, complex build processes
- **Dependencies**: Reduced from 20+ packages to 4 core dependencies

#### Simplified
- **Server**: Basic Express server for markdown file serving
- **Frontend**: Simple theme toggle and basic navigation
- **CSS**: Essential styles without advanced features

### Project Philosophy
Simple, maintainable markdown phrase browser - focusing on core functionality without enterprise complexity.
