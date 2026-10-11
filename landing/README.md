# Simamia public website

This directory contains the public marketing site for `https://simamia.online`. It is plain HTML, CSS, and JavaScript with no runtime framework dependency. The root [`README.md`](../README.md) covers the full monorepo; [`../docs/deployment.md`](../docs/deployment.md) covers production hosting.

## Local preview

From this directory, run:

```bash
bun run dev
```

The static server listens on `http://localhost:4173`. You can also open `index.html` directly for a basic preview.

## Build

```bash
bun run build
```

`build.mjs` copies the site into `dist/`, which is ignored by Git. The landing Docker image runs this build and serves the generated files with Nginx. The root Compose stack routes `simamia.online` to this service; the app and API are separate Compose services.

## Files

- `index.html` — page content and metadata
- `styles.css` — responsive visual design
- `script.js` — navigation and interactive page behavior
- `favicon.svg`, `robots.txt`, `sitemap.xml` — public site assets and crawler files
- `build.mjs` — static production build
- `Dockerfile`, `nginx.conf` — landing container and web-server configuration
