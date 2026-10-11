# Simamia API

The API is a Go HTTP service for Simamia's operational data. Its versioned base path is `/api/v1`; the full request and response contract is in [`openapi.yaml`](openapi.yaml). The docs-site source includes an interactive Swagger reference at `/api/swagger` and narrative endpoint guides; the docs site's downloadable contract at `public/openapi.yaml` should be kept in sync with this file.

## Local development

Requirements: Go version declared by `go.mod` and a C compiler for the SQLite driver.

```bash
go run .
```

The API listens on `0.0.0.0:8080` by default. Set `PORT` to change the port. Health check:

```bash
curl http://localhost:8080/api/v1/health
```

The default SQLite file is `data/simamia.db` relative to the API process working directory. Override it with `SIMAMIA_DB_PATH=/path/to/simamia.db`. Keep the database outside version control and back it up before upgrades.

## Authentication and browser access

- Health is public. Business data routes require a Camel Accounts bearer access token.
- The API validates tokens against `CAMEL_ACCOUNTS_URL` (default `https://accounts.camelcreatives.com`) and scopes records to the token subject.
- `CORS_ALLOWED_ORIGINS` is a comma-separated exact-origin allowlist. For local development, an unset value permits browser requests from any origin. Production should set it explicitly; the Compose default is `https://app.simamia.online`.
- The API exposes `X-Request-ID` to browser clients so they can correlate frontend and API logs.
- Authentication identifies an account, but business membership, staff roles, and shared-business permissions are not implemented yet.

## Logging

The API emits JSON logs to stdout using Go's structured logger. Each request records method, normalized route, status, duration, and a generated request ID; mutation logs record the collection and generated record ID without including record contents. Set `LOG_LEVEL=debug|info|warn|error` (default `info`). In Compose, inspect these with `docker compose logs -f api`. Caller-provided request IDs are not included in API logs; generated IDs are safe for cross-service correlation.

## Main data areas

The API currently stores business profiles, customers, services, orders/jobs, team records, and expenses. Payment rows are ledger records associated with operational work; the API does not move money, reconcile provider transactions, or create statutory/fiscal receipts. See the OpenAPI document for available endpoints and schemas.

## Private platform administration

The admin console is a separate Next.js server at `https://admin.simamia.online`. It authenticates operators with `SIMAMIA_ADMIN_PASSWORD`, keeps a signed HttpOnly session cookie, and proxies requests to the Go API. The browser never receives the service-to-service admin key. The Go API accepts admin calls only with `X-Simamia-Admin-Key` matching `SIMAMIA_ADMIN_TOKEN` (at least 32 characters); set the same random value for `SIMAMIA_ADMIN_API_TOKEN` in Compose. Leave it unset to keep admin API routes disabled.

Admin routes are under `/api/v1/admin`: `GET overview`, `GET health`, `GET accounts`, `GET accounts/{owner_sub}`, tenant-scoped `GET/POST accounts/{owner_sub}/{resource}`, tenant-scoped `GET/PATCH/DELETE accounts/{owner_sub}/{resource}/{record_id}`, `GET usage`, and `GET audit`. Supported resources are businesses, customers, services, orders, team, and expenses. Payments are derived from orders and remain read-only. All mutations use the same resource validation as the business API, assign/protect record IDs and ownership server-side, and append an audit row containing operator, action, target, timestamp, and changed field names (never field values).

The account list is inferred from `owner_sub` values on Simamia business records. It is not a Camel Accounts directory: profile credentials, Google connections, and account lifecycle remain managed by Camel Accounts. The current data model has no first-class membership or account table. See [`../docs/admin-console.md`](../docs/admin-console.md) for operations, environment setup, and endpoint examples.

## Run with Docker Compose

From the repository root, Compose builds and runs the landing page, static app, API, and reverse proxy together:

```bash
cp .env.server.example .env
docker compose up -d --build
```

For the VPS where host Nginx already owns ports 80 and 443, use the loopback-only override and follow [`../docs/deployment.md`](../docs/deployment.md). API storage is mounted at `/data/simamia.db` in the container using the `simamia_data` volume.

## API examples

See [`../docs/demo-testing.md`](../docs/demo-testing.md) for curl requests, authentication examples, and expected responses. That document describes the current implementation; fabricated browser demo records are not persisted by this API.
