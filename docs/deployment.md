# Simamia monorepo deployment

This repository contains the public site, product app, and API:

| Service | Source | Public address | Runtime |
| --- | --- | --- | --- |
| Landing page | `landing/` (`@simamia/landing` Bun workspace) | `https://simamia.online` and `https://www.simamia.online` | Static HTML/CSS/JS served by Nginx |
| Product app | repository root (`simamia` Bun workspace) | `https://app.simamia.online` | Next.js static export served by Nginx |
| API | `api/` Go module | `https://api.simamia.online` | Go + SQLite |
| TLS and routing | `deploy/Caddyfile`, `compose.yaml` | ports 80/443 | Caddy reverse proxy with automatic HTTPS |

The Next.js app exports to `out/`; `NEXT_PUBLIC_SIMAMIA_API_URL` is baked into that build. The API persists its database in the named `simamia_data` Docker volume. Caddy is the only container publishing host ports.

## Server setup

Point DNS records for `simamia.online`, `app.simamia.online`, and `api.simamia.online` to the server's public IPv4 address. Allow inbound TCP 80 and 443 through the host firewall. Install Docker Engine and the Compose plugin, then from the repository root:

```bash
cp .env.server.example .env
docker compose up -d --build
```

Check container status and public API health:

```bash
docker compose ps
curl https://api.simamia.online/api/v1/health
```

Set `NEXT_PUBLIC_*` values in `.env` before building. They are public client configuration, not secrets. `CORS_ALLOWED_ORIGINS` is the exact browser origin allowlist for the Go API; the provided value permits only `https://app.simamia.online`. The API binds to the internal Compose network, and Caddy routes the API hostname to port 8080.

### Existing Nginx VPS

When another site already owns ports 80 and 443, keep its host Nginx and use the VPS override. It binds only to loopback ports 4173 (landing), 4174 (app), and 4175 (API):

```bash
cp -n .env.server.example .env
docker compose -f compose.yaml -f deploy/compose.vps.yaml up -d --build
sudo install -m 0644 deploy/nginx-simamia.conf /etc/nginx/sites-available/simamia
sudo ln -s /etc/nginx/sites-available/simamia /etc/nginx/sites-enabled/simamia
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email \
  -d simamia.online -d api.simamia.online --redirect
```

Run Certbot for `app.simamia.online` after its DNS record resolves to this VPS. The shipped Nginx file provides its HTTP reverse proxy; Certbot adds HTTPS when the hostname can pass validation. Do not run the standalone Caddy service on a host where Nginx already owns ports 80 and 443.

To update after pulling or copying a new release:

```bash
docker compose up -d --build
```

Back up SQLite before updates that could affect data, and keep a copy outside the server. The API image includes the SQLite CLI, so a consistent live backup can be made with:

```bash
mkdir -p backups
docker compose exec -T api sqlite3 /data/simamia.db '.backup /tmp/simamia.db'
docker compose cp api:/tmp/simamia.db "backups/simamia-$(date -u +%Y%m%dT%H%M%SZ).db"
```

This is a single-server deployment; do not run multiple API replicas against the same SQLite file.

## Local development

Frontend app:

```bash
NEXT_PUBLIC_CAMEL_ACCOUNTS_URL=https://accounts.camelcreatives.com NEXT_PUBLIC_CAMEL_ACCOUNTS_CLIENT_ID=simamia-35sj96 NEXT_PUBLIC_SIMAMIA_API_URL=http://localhost:8080/api/v1 bun run dev
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

The production public Camel Accounts client is `simamia-35sj96`, with `openid`, `profile`, and `phone` scopes, homepage `https://app.simamia.online`, and redirect URI `https://accounts.camelcreatives.com/widget-callback`. Set this ID through `NEXT_PUBLIC_CAMEL_ACCOUNTS_CLIENT_ID` before rebuilding the static app.

SQLite currently provides single-server persistence. Production readiness also requires managed backups and restore checks, access roles for shared businesses, monitoring, privacy controls, and live payment/SMS/email provider connections. Payment ledger rows are derived from work records and are not fiscal receipts. See the [management guide](management-guide.md), [provider integration guide](integrations.md), [provider reference notes](provider-research.md), and [OpenAPI spec](../api/openapi.yaml).

## Static preview

`wrangler.jsonc` remains available for an isolated static frontend preview of `out/`. That frontend-only preview does not host the Go API or replace the server Compose setup above.
