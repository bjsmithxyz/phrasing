# Phrasing - Markdown Phrase Collection Browser

A modern, beautiful web application for browsing and searching markdown phrase collections. Features a sophisticated Dracula-themed interface with real-time search capabilities.

## ✨ Features

- 📝 **Rich Markdown Processing**: Automatically renders markdown files with anchor navigation using markdown-it
- 🔍 **Real-time Search**: Instant phrase filtering with highlighting and keyboard shortcuts
- 🌙 **Dracula Theme**: Beautiful dark theme with optional light mode toggle
- 📱 **Responsive Design**: Fully mobile-friendly with smooth scrolling and touch support
- 🧭 **Smart Navigation**: Index sidebar with active section highlighting and "Go to Top" button
- ⚡ **Fast Performance**: Client-side search and minimal dependencies for speed
- 🎨 **Modern UI**: Clean typography, smooth animations, and intuitive interface

## Quick Start

### Prerequisites

- Node.js 16+
- npm

### Installation

1. **Clone and install**
   
   ```bash
   git clone <repository-url>
   cd phrasing
   npm install
   ```

2. **Add your content**
   
   Place markdown files in the `md_files/` directory:
   
   ```markdown
   # Your Content
   
   Your content here...
   ```

3. **Start the server**
   
   ```bash
   npm start
   ```

4. **Open your browser**
   
   Navigate to `http://localhost:8080`

## 🔧 Development

```bash
npm run dev  # Start with auto-reload (nodemon)
```

## 📂 Project Structure

```text
phrasing/
├── server.js              # Main Express server (45 lines)
├── package.json           # Dependencies and scripts
├── md_files/              # Your markdown phrase collections (16 files)
│   ├── phrasing.business.md
│   ├── phrasing.conversational.md
│   ├── phrasing.prepositional.*.md
│   └── ... (and more)
├── public/                # Static frontend assets
│   ├── css/styles.css     # Dracula theme styles (~533 lines)
│   └── js/app.js          # Client-side functionality (~276 lines)
└── src/                   # Server-side source code
    ├── routes/index.js    # Express routes and API endpoints
    ├── templates/         # EJS template files
    │   ├── index.ejs      # Main application template
    │   ├── error.ejs      # Error page template
    │   └── layout.ejs     # Base layout template
    └── utils/
        └── fileManager.js # Markdown file processing utilities
```

## 🎯 Current Phrase Collections

The application includes **16 curated phrase collections**:

- **Business & Professional**: `phrasing.business.md`
- **Conversational**: `phrasing.conversational.md`
- **Literary Expressions**: `phrasing.literaryexpressions.md`
- **Public Speaking**: `phrasing.publicspeaking.md`
- **Prepositional Phrases**: `by`, `in`, `into`, `of`, `to`, `with`
- **Specialized**: `felicitous`, `impressive`, `significant`, `useful`
- **Creative**: `strikingsimilies`, `miscellaneous`

## 🚀 API Endpoints

- **`GET /`** - Main application interface with search and navigation
- **`GET /api/data`** - JSON API returning all phrase collections

## 🛠️ Technical Stack

### Core Dependencies
- **express** (^4.18.2) - Web server framework
- **ejs** (^3.1.10) - Template engine for dynamic HTML
- **express-ejs-layouts** (^2.5.1) - Layout system for DRY template management
- **markdown-it** (^13.0.1) - Markdown processing and rendering
- **markdown-it-anchor** (^8.6.7) - Automatic anchor link generation

### Development Tools
- **nodemon** (^3.0.1) - Auto-reload during development

## License

ISC - See package.json for full license details.

---

*A modern markdown phrase collection browser built with Express.js, EJS, and a beautiful Dracula theme. Perfect for writers, speakers, and language enthusiasts.*
