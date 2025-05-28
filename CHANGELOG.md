# Changelog

All notable changes to the Phrasing project will be documented in this file.

## [1.0.0] - 2025-05-28

### Major Simplification - Removed Scope Creep

#### Removed
- **Infrastructure**: Docker, CI/CD pipelines, production deployment configs
- **Testing Framework**: Jest, coverage tools, test directories
- **Admin Interface**: Admin dashboard, management features, complex UI
- **Complex Features**: Search functionality, analytics, service workers
- **Development Tools**: ESLint, Prettier, Husky, complex build processes
- **Dependencies**: Reduced from 20+ packages to 4 core dependencies

#### Simplified
- **Server**: Replaced complex 168-line server with simple 45-line Express server
- **File Management**: Simple file reader replacing 337-line complex utility
- **Frontend**: Basic theme toggle and navigation, removed search/analytics
- **CSS**: Reduced from 1282 lines to ~300 lines of essential styles
- **Templates**: Simple EJS templates without search interface

#### Kept
- **Core Functionality**: Markdown file browsing and rendering
- **Theme Support**: Dark/light theme toggle with browser preference
- **Responsive Design**: Mobile-friendly layout
- **Navigation**: Smooth scrolling and anchor links

### Dependencies
- `express` - Web server
- `ejs` - Template engine
- `markdown-it` - Markdown processing 
- `markdown-it-anchor` - Anchor link generation
- `nodemon` - Development auto-reload (dev only)

### Project Goal
Reverted from enterprise-level application back to simple, maintainable markdown phrase browser - the original vision before scope creep occurred.
