# Simamia API Docs

An independent documentation website for the Simamia Go API, built with Next.js App Router and Nextra 4. Documentation pages are Markdown/MDX and use the Nextra docs theme for navigation, search, code blocks, and Mermaid diagrams.

## Requirements

- Bun 1.x (recommended) or npm
- Node.js 20.9+ for Next.js tooling

## Run locally

```bash
bun install
bun run dev
```

Open `http://localhost:3000`. This docs site only renders documentation; it does not call the Simamia API or require an API token.

## Build for production

```bash
bun run build
bun run start
```

The site is a standard Next.js server build, not a static export. Host it on a Node-compatible Next.js platform or run it in a Node container.

## Content map

All content is organized as `.mdx` pages under `app/` so Nextra can generate routes and sidebar navigation:

- `app/page.mdx` — overview and service diagram
- `app/getting-started/page.mdx` — local setup and first authenticated records
- `app/architecture/page.mdx` — production topology, auth sequence, request flow
- `app/concepts/` — authentication, data model, response envelopes/errors
- `app/api/` — shared endpoint rules and every resource endpoint, including read-only payments
- `app/workflows/` — multi-endpoint operational recipes
- `app/operations/` — environment, deployment, and MVP limitations

Use fenced `mermaid` blocks for diagrams. Nextra 4 renders Mermaid blocks through its MDX pipeline.

## Keep API docs accurate

The source of truth for route behavior is the Go API in the Simamia repo, especially `api/main.go` and `api/openapi.yaml`. When changing an endpoint, update the matching page in this repo and compare:

1. Supported method/path and auth requirement.
2. Required properties, defaults, and validation.
3. Owner scoping and response/error envelopes.
4. Example requests and the result of derived behavior.

Current deployment notes: `https://github.com/troubleman96/SIMAMIA/blob/main/docs/deployment.md`.
