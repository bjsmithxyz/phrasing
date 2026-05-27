# Phrasing

A comprehensive collection of 15,000+ useful phrases for business, professional, and conversational use.

**Live site:** [bjsmithxyz.github.io/phrasing](https://bjsmithxyz.github.io/phrasing/)

## Features

- **Themes**: Dracula, Cursor, Orangde, Black & White, Light, Sepia, and Rose — via **theme** beside **top**.
- **Data sources**: Built-in **Phrasing** and **Insults** (Shakespeare) corpora, or upload your own `.md` — via **data** beside **theme**.
- **Instant Search**: Powered by Fuse.js for fuzzy filtering across thousands of entries.
- **Sidebar Navigation**: Quick access to categories and alphabetical indices.
- **Performance Optimized**: Static build with search indexed from page content (no duplicate data file).

## Getting Started

1. Clone the repository.
2. Run `npm install`.
3. Run `npm run build` to generate the site in `dist/`.
4. Open `dist/index.html` in your browser, or run `npm start` and visit http://localhost:8080.

## Deployment (GitHub Pages)

The site deploys automatically on push to `master` via [GitHub Actions](.github/workflows/pages.yml). The live URL is [https://bjsmithxyz.github.io/phrasing/](https://bjsmithxyz.github.io/phrasing/).

Pull requests run [CI](.github/workflows/ci.yml) (`npm ci` + `npm run build`) before merge.

**One-time setup** in your repository:

1. **Settings → Pages → Build and deployment → Source**: select **GitHub Actions** (not “Deploy from a branch”). If the site shows this README instead of the phrase app, the source is still set to the branch root.
2. Push to `master`; the workflow builds `dist/` and publishes it.

To deploy manually without Actions, run `npm run build` and publish the contents of `dist/`.

## Project layout

| Path | Purpose |
|------|---------|
| `data/builtin/phrasing/` | Default phrase corpus (markdown) |
| `data/builtin/insults/` | Shakespeare insults corpus (~500+ lines) |
| `public/` | Client assets (`app.js`, `styles.css`) |
| `lib/content-core.js` | Shared markdown → HTML (build + browser) |
| `lib/render.js` | Static page shell and build |
| `dist/` | Generated site (not committed; created by `npm run build`) |

---