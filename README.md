# HudumaDesk Tanzania

A Swahili-first service-management dashboard with a companion Go workflow API. The frontend is based on the MIT-licensed [Next.js shadcn dashboard starter](https://github.com/Kiranism/next-shadcn-dashboard-starter); HudumaDesk product code, API, specification, and documentation live together in this monorepo.

## Demo safety and data model

- The UI uses fabricated sample records in browser `localStorage`; its edits stay in that browser.
- The Go API is a separate, unauthenticated reference service with a shared in-memory sample store. API writes do not update the UI's local records.
- API data resets when the Go process restarts. Anyone who can reach a public demo API can read, add, edit, or delete its sample records.
- Use only synthetic test data. This preview has no tenant isolation, authentication, production privacy controls, or real payment, SMS, email, or AI connections. Do not enter customer data, credentials, or payment details.
- Payment rows are derived from orders; the API does not process payments and its ledger is not a TRA fiscal receipt.

## Run both services locally

Terminal 1 — frontend:

```bash
npm install
NEXT_PUBLIC_HUDUMADESK_API_URL=http://localhost:8080/api/v1 npm run dev -- --hostname 0.0.0.0
```

Terminal 2 — workflow API:

```bash
cd api
go test ./...
go run .
```

Open the UI at `http://localhost:3000`. The **API & docs** page checks the configured API health endpoint and shows the live base URL. The API base is `http://localhost:8080/api/v1`; its OpenAPI contract is in [`api/openapi.yaml`](api/openapi.yaml), and hands-on examples are in [`docs/demo-testing.md`](docs/demo-testing.md).

## Build and test

```bash
npm run typecheck
npm run build
go -C api test ./...
```

The static Next.js build is written to `out/`. For the interactive developer preview, use `npm run dev` as above. See the [management guide](docs/management-guide.md), [demo testing guide](docs/demo-testing.md), and [provider notes](docs/integrations.md) for more context.
