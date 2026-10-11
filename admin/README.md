# Simamia Admin

Private operator console for Simamia. This standalone Next.js application is deployed at `https://admin.simamia.online`.

## Local development

```bash
bun install
bun run dev
```

Production requires `SIMAMIA_API_URL`, `SIMAMIA_ADMIN_EMAIL`, `SIMAMIA_ADMIN_API_TOKEN`, `SIMAMIA_ADMIN_PASSWORD`, `SIMAMIA_ADMIN_SESSION_SECRET`, and `ADMIN_APP_ORIGIN`. Keep credentials in the server environment; do not add them to the client bundle.

## Production container

`Dockerfile` builds this project independently and serves its Next.js standalone output on port 3000. Simamia Compose expects this directory to be a sibling of the main `Simamia` repository.
