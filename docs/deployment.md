# Build and Deployment Notes

## Static preview

The Next.js frontend exports a static site into `out/`:

```bash
npm install
npm run typecheck
npm run build
```

`wrangler.jsonc` points static assets at `out/`. For a temporary public preview in an appropriately isolated environment, use:

```bash
npx --yes wrangler@4.102.0 deploy --temporary
```

The temporary preview is unauthenticated: anyone with its public URL can open it. It is for demonstration only, must not contain real customer information, and is not a production hosting, identity or persistence setup. Check the temporary-preview expiry and claim instructions at deployment time.

## Go reference API

```bash
cd api
go test ./...
go run .
```

The service listens on `:8080` (or `$PORT`) and exposes `/api/v1/health`, orders, customers, services, team and a derived read-only payments ledger. Its in-memory sample records reset on restart. The static preview is not connected to this API; deploying the `out/` directory does not deploy the Go service.

For a real launch, separately host the Go service behind HTTPS, replace in-memory data with durable tenant-scoped storage, add authentication/authorization, rate controls, request logging, migrations, backups, secrets management, monitoring, privacy controls and fiscal/payment integrations. Restrict CORS to the actual application origin. See the [management guide](management-guide.md), [provider integration guide](integrations.md), [provider reference notes](provider-research.md) and [OpenAPI spec](../api/openapi.yaml).
