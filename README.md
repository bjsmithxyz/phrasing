# PHRASING

## Overview

Phrasing is a small app I created to present a dataset as HTML with an index, as long as it was in the following fairly specific format:

```markdown
# Heading 1

## Heading 2

- Data 1
- Data 2
- Data 3

```

Et cetera.

The name came from the initial dataset, see: [https://bjsmith.xyz/blog/phrasing/]

## How do

1. Download this project locally.
1. Place any number of .md files formatted as above into the 'md_files' directory.
1. Run the following to install Express.js:

    `npm install express`
1. Run the following to install Fuse.js:

    `npm install fuse.js`
1. Run the following to start the server locally, published at [http://localhost:8080] by default:

    `node server.js`
1. Publish to GitHub
1. Manually run the workflow in Actions
1. Wait for deploy
# PHRASING

## Overview

Phrasing is a small Node.js app that converts a set of simple Markdown files into an indexed HTML site with client-side search.

It expects each source file to use a lightweight structure like:

```markdown
# Heading 1

## Heading 2

- Item A
- Item B
- Item C
```

The original dataset that inspired this project lives at: https://bjsmith.xyz/blog/phrasing/

## Quickstart

Prerequisites: Node.js (14+ recommended) and npm.

1. Clone the repo and change into it:

    git clone <repo> && cd phrasing

2. Install dependencies (this will install Express, Fuse.js, markdown-it, etc.):

    npm install

3. Add or edit Markdown files in the `md_files/` directory. Each file should follow the small format shown above.

4. Start the server locally (default: http://localhost:8080):

    npm start

5. Open your browser and go to http://localhost:8080

## Notes

- The app's entry point is `server.js` and the `start` script in `package.json` runs it.
- Client-side search is provided by Fuse.js; markdown rendering uses markdown-it.
- If you want to add new dependencies, update `package.json` and run `npm install`.

## UI / Search layout

The top-left index links remain in place. The search input was moved to a right-side search area next to the links and the results appear below the input.

If you'd like to tweak the layout or sizing, edit `server.js` and change the following CSS selectors embedded near the top of the file:

- `.topbar { gap: 30px; }` — controls the horizontal gap between the left links and the search area (set between 25px and 50px as desired).
- `#search-input { font-size: 20px; }` — controls the visual scale of the input (increase/decrease for larger/smaller input).
- `#search-input { width: calc(100% - 20px); }` — leaves a small gap on the far right of the input; adjust the 20px value to change that gap.

After editing, restart the server to see your changes locally:

```bash
node server.js
```

Open `http://localhost:8080` in a browser to verify the layout.

## Deploy

If you use GitHub, push your branch and run any configured GitHub Actions workflows to publish the site (if a deployment workflow is present). This project contains a `web.config` and may be wired to a deployment pipeline — adapt deployments to your hosting provider.

## Contributing

Feel free to open issues or PRs. Small improvements that help parsing, rendering, or the UI are welcome.

## License

See the repository license (if any) or add one before publishing.
