# Mishe Admin

Private operator console for Mishe. This standalone Next.js application is deployed at `https://admin.mishe.online`.

## Local development

```bash
bun install
bun run dev
```

Production requires `MISHE_API_URL`, `MISHE_ADMIN_EMAIL`, `MISHE_ADMIN_API_TOKEN`, `MISHE_ADMIN_PASSWORD`, `MISHE_ADMIN_SESSION_SECRET`, and `ADMIN_APP_ORIGIN`. Keep credentials in the server environment; do not add them to the client bundle.

## Production container

`Dockerfile` builds this project independently and serves its Next.js standalone output on port 3000. Mishe Compose expects this directory to be a sibling of the main `Mishe` repository.
