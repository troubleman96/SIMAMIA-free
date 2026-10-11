# Simamia API

The API is a Go HTTP service for Simamia's operational data. Its versioned base path is `/api/v1`; the full request and response contract is in [`openapi.yaml`](openapi.yaml).

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
- Authentication identifies an account, but business membership, staff roles, and shared-business permissions are not implemented yet.

## Main data areas

The API currently stores business profiles, customers, services, orders/jobs, team records, and expenses. Payment rows are ledger records associated with operational work; the API does not move money, reconcile provider transactions, or create statutory/fiscal receipts. See the OpenAPI document for available endpoints and schemas.

## Run with Docker Compose

From the repository root, Compose builds and runs the landing page, static app, API, and reverse proxy together:

```bash
cp .env.server.example .env
docker compose up -d --build
```

For the VPS where host Nginx already owns ports 80 and 443, use the loopback-only override and follow [`../docs/deployment.md`](../docs/deployment.md). API storage is mounted at `/data/simamia.db` in the container using the `simamia_data` volume.

## API examples

See [`../docs/demo-testing.md`](../docs/demo-testing.md) for curl requests, authentication examples, and expected responses. That document describes the current implementation; fabricated browser demo records are not persisted by this API.
