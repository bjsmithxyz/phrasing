# Phrasing

A comprehensive collection of 15,000+ useful phrases for business, professional, and conversational use.

## Features

- **Dracula Theme**: A vibrant, high-contrast dark mode design.
- **Instant Search**: Powered by Fuse.js for fuzzy filtering across thousands of entries.
- **Sidebar Navigation**: Quick access to categories and alphabetical indices.
- **Performance Optimized**: Static build for fast loading and low overhead.

## Getting Started

1. Clone the repository.
2. Run `npm install`.
3. Run `npm run build` to generate the site in `dist/`.
4. Open `dist/index.html` in your browser, or run `npm start` and visit http://localhost:8080.

## Deployment (GitHub Pages)

The site deploys automatically on push to `master` via [GitHub Actions](.github/workflows/pages.yml).

**One-time setup** in your repository:

1. **Settings → Pages → Build and deployment → Source**: select **GitHub Actions**.
2. Push to `master`; the workflow builds `dist/` and publishes it.

To deploy manually without Actions, run `npm run build` and publish the contents of `dist/`.

## Project layout

| Path | Purpose |
|------|---------|
| `md_files/` | Source phrase content (markdown) |
| `public/` | Client assets (`app.js`, `styles.css`) |
| `lib/render.js` | Markdown → HTML build logic |
| `dist/` | Generated site (not committed; created by `npm run build`) |

---
*Inspired by the original Phrasing utility.*
