# Phrasing

A static web app for browsing and searching phrase collections stored as markdown. Built-in corpora ship with the site; you can switch datasets in the browser or upload your own `.md` files.

**Live site:** [bjsmithxyz.github.io/phrasing](https://bjsmithxyz.github.io/phrasing/)

## Features

- **Data sources**: Switch built-in corpora or upload custom markdown via the **data** control (in-memory, no page reload).
- **Instant search**: Fuzzy search with Fuse.js, indexed from the content on the page.
- **Sidebar navigation**: Categories and A–Z section links.
- **Themes**: Dracula, Cursor, Orangde, Black & White, Light, Sepia, and Rose — via **theme** beside **top**.
- **Lightweight UI**: Static build, no backend required for hosting.

## Getting Started

1. Clone the repository.
2. Run `npm install`.
3. Run `npm run build` to generate the site in `dist/`.
4. Open `dist/index.html` in your browser, or run `npm start` and visit http://localhost:8080.

## Custom markdown format

Each built-in or uploaded file uses simple markdown:

```markdown
# Category name

## A

- First phrase
- Second phrase
```

A single file may contain multiple `#` sections. List items under `##` letter headings become searchable entries.

## Deployment (GitHub Pages)

The site deploys automatically on push to `master` via [GitHub Actions](.github/workflows/pages.yml).

Pull requests run [CI](.github/workflows/ci.yml) (`npm ci` + `npm run build`) before merge.

**One-time setup** in your repository:

1. **Settings → Pages → Build and deployment → Source**: select **GitHub Actions** (not “Deploy from a branch”). If the site shows this README instead of the app, the source is still set to the branch root.
2. Push to `master`; the workflow builds `dist/` and publishes it.

To deploy manually without Actions, run `npm run build` and publish the contents of `dist/`.

## Project layout

| Path | Purpose |
|------|---------|
| `data/builtin/*/` | Built-in markdown corpora (one folder per dataset) |
| `dist/data/manifest.json` | Generated at build — lists datasets; default is `phrasing` |
| `public/` | Client assets (`app.js`, `styles.css`) |
| `lib/content-core.js` | Shared markdown → HTML (build + browser) |
| `lib/render.js` | Static page shell and build |
| `dist/` | Generated site (not committed; created by `npm run build`) |

## Built-in datasets

| ID | Description |
|----|-------------|
| `phrasing` | Default — large phrase reference (~15k entries) |
| `insults` | Shakespeare insults |

Add a folder under `data/builtin/` and rebuild; the manifest picks it up automatically.
