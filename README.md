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
1. Run `npm install express` to install Express.js.
1. Run `node server.js` to run the server locally at http://localhost:8080
