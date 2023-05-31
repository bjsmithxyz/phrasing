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
1. Search stuff
