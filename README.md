# Phrasing - Simple Phrase Collection Browser

A simple web application for browsing markdown phrase collections.

## Features

- 📝 **Markdown Processing**: Automatically renders markdown files with navigation
- 🌙 **Dark/Light Theme**: Toggle between themes with browser preference support
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔗 **Smooth Navigation**: Anchor links with smooth scrolling

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
   
   Your phrases and content here...
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   
   Navigate to `http://localhost:8080`

## Development

```bash
npm run dev  # Start with auto-reload
```

## Project Structure

```
phrasing/
├── server.js              # Main server file
├── public/                # Static assets
│   ├── css/styles.css     # Application styles  
│   └── js/app.js          # Client-side JavaScript
├── src/
│   ├── routes/index.js    # Express routes
│   ├── templates/         # EJS templates
│   └── utils/fileManager.js # File handling utilities
└── md_files/              # Your markdown content
```

## License

ISC
