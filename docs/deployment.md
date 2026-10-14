# Mishe monorepo deployment

This repository contains the public site, product app, admin console, API docs, and Go API:

| Service | Source | Public address | Runtime |
| --- | --- | --- | --- |
| Landing page | `landing/` (`@mishe/landing` Bun workspace) | `https://mishe.online` and `https://www.mishe.online` | Static HTML/CSS/JS served by Nginx |
| Product app | repository root (`mishe` Bun workspace) | `https://app.mishe.online` | Next.js static export served by Nginx |
| Admin console | `admin/` | `https://admin.mishe.online` | Next.js standalone server, private operator session |
| API docs | `docs-site/` | `https://docs.mishe.online` | Next.js standalone server, public reference |
| API | `api/` Go module | `https://api.mishe.online` | Go + SQLite |
| TLS and routing | `deploy/Caddyfile`, `compose.yaml` | ports 80/443 | Caddy reverse proxy with automatic HTTPS |

The customer Next.js app exports to `out/`; `NEXT_PUBLIC_MISHE_API_URL` is baked into that build. The admin app is a separate server rendered Next.js service. The API persists its database in the named `mishe_data` Docker volume. Caddy is the only container publishing host ports.

## Server setup

Point DNS records for `mishe.online`, `app.mishe.online`, `admin.mishe.online`, `docs.mishe.online`, and `api.mishe.online` to the server's public IPv4 address. Allow inbound TCP 80 and 443 through the host firewall. Install Docker Engine and the Compose plugin, then from the Mishe repository root:

```bash
cp .env.server.example .env
docker compose up -d --build
```

Check container status and public API health:

```bash
docker compose ps
curl https://api.mishe.online/api/v1/health
```

Set `NEXT_PUBLIC_*` values in `.env` before building. They are public client configuration, not secrets. `CORS_ALLOWED_ORIGINS` is the exact browser origin allowlist for the Go API; the provided value permits only `https://app.mishe.online`. The API binds to the internal Compose network, and Caddy routes the API hostname to port 8080.

The admin app also requires the server-only values `MISHE_ADMIN_PASSWORD`, `MISHE_ADMIN_API_TOKEN`, and `MISHE_ADMIN_SESSION_SECRET`; see [`admin-console.md`](admin-console.md) for security requirements and the full admin setup. Add `admin.mishe.online` to DNS and TLS routing before sharing access.

### Existing Nginx VPS

When another site already owns ports 80 and 443, keep its host Nginx and use the VPS override. It binds only to loopback ports 4173 (landing), 4174 (app), 4175 (API), 4176 (admin), and 4177 (docs):

```bash
cp -n .env.server.example .env
docker compose -f compose.yaml -f deploy/compose.vps.yaml up -d --build
sudo install -m 0644 deploy/nginx-mishe.conf /etc/nginx/sites-available/mishe
sudo ln -s /etc/nginx/sites-available/mishe /etc/nginx/sites-enabled/mishe
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email \
  -d mishe.online -d www.mishe.online -d app.mishe.online \
  -d admin.mishe.online -d docs.mishe.online -d api.mishe.online --redirect
```

The shipped Nginx file provides the HTTP reverse proxy for all product hostnames; Certbot adds HTTPS when each hostname resolves to this VPS. Do not run the standalone Caddy service on a host where Nginx already owns ports 80 and 443.

To update after pulling or copying a new release:

```bash
docker compose up -d --build
```

Back up SQLite before updates that could affect data, and keep a copy outside the server. The API image includes the SQLite CLI, so a consistent live backup can be made with:

```bash
mkdir -p backups
docker compose exec -T api sqlite3 /data/mishe.db '.backup /tmp/mishe.db'
docker compose cp api:/tmp/mishe.db "backups/mishe-$(date -u +%Y%m%dT%H%M%SZ).db"
```

This is a single-server deployment; do not run multiple API replicas against the same SQLite file.

## Local development

Frontend app:

```bash
NEXT_PUBLIC_CAMEL_ACCOUNTS_URL=https://accounts.camelcreatives.com NEXT_PUBLIC_CAMEL_ACCOUNTS_CLIENT_ID=mishe-35sj96 NEXT_PUBLIC_MISHE_API_URL=http://localhost:8080/api/v1 bun run dev
```

Landing page:

```bash
cd landing
bun run dev
```

API:

```bash
cd api
go run .
```

The admin and API docs are standalone apps in this repository. Start either from its project directory:

```bash
cd admin && bun install && bun run dev
cd docs-site && bun install && bun run dev
```

The production public Camel Accounts client is `mishe-35sj96`, with `openid`, `profile`, and `phone` scopes, homepage `https://app.mishe.online`, and redirect URI `https://accounts.camelcreatives.com/widget-callback`. Set this ID through `NEXT_PUBLIC_CAMEL_ACCOUNTS_CLIENT_ID` before rebuilding the static app.

SQLite currently provides single-server persistence. Production readiness also requires managed backups and restore checks, access roles for shared businesses, monitoring, privacy controls, and live payment/SMS/email provider connections. Payment ledger rows are derived from work records and are not fiscal receipts. See the [management guide](management-guide.md), [provider integration guide](integrations.md), [provider reference notes](provider-research.md), and [OpenAPI spec](../api/openapi.yaml).

## Static preview

`wrangler.jsonc` remains available for an isolated static frontend preview of `out/`. That frontend-only preview does not host the Go API or replace the server Compose setup above.
