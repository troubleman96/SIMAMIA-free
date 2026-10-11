# HudumaDesk demo testing

## Live test instance

The active session's UI and API addresses are supplied separately in the task handoff. The API is a standalone reference service, not a persistence backend for the dashboard. The UI's edits are browser-local; API requests mutate the Go service's in-memory demo store.

**Safety:** the API is unauthenticated and writable by anyone who can reach it. It contains only fabricated records, and its state resets when the API process restarts. Do not enter real customer information, credentials, or payment details. Payments are a read-only ledger derived from orders; there is no payment processing.

## Local startup

Start the API in one terminal:

```bash
cd api
go test ./...
go run .
```

Start the UI in another terminal:

```bash
NEXT_PUBLIC_HUDUMADESK_API_URL=http://localhost:8080/api/v1 npm run dev -- --hostname 0.0.0.0
```

Open `http://localhost:3000`, then choose **API & docs** to see whether the configured API is reachable. The dashboard's sample data remains local to the browser; use the API's REST endpoints to test backend workflows.

## Workflow examples

Set the base URL first (replace it with the live API host if needed):

```bash
export API_BASE=http://localhost:8080/api/v1
```

Check health and list seeded orders:

```bash
curl -sS "$API_BASE/health"
curl -sS "$API_BASE/orders?page=1&page_size=10"
```

Create a fabricated customer, then create an order:

```bash
curl -sS -X POST "$API_BASE/customers" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo Customer Created","phone":"+255 700 000 010","email":"demo.created@example.test","location":"Dar es Salaam (demo)"}'

curl -sS -X POST "$API_BASE/orders" \
  -H 'Content-Type: application/json' \
  -d '{"customer":"Demo Customer Created","service":"Laundry · Express","date":"2026-10-12T10:00:00+03:00","amount":48000,"status":"New","method":"M-Pesa","assignee":"Demo Staff 01"}'
```

Update or delete the returned order using its `data.id`; browse the [OpenAPI contract](../api/openapi.yaml) for all fields and response envelopes:

```bash
curl -sS -X PATCH "$API_BASE/orders/ORD-0248" \
  -H 'Content-Type: application/json' \
  -d '{"status":"Ready"}'

curl -sS "$API_BASE/payments"
```

Use `DELETE "$API_BASE/orders/<id>"` only with a demo record. Since the API store is shared and in-memory, destructive test requests affect other testers until restart.

## Supported endpoints

- `GET /health`
- `GET, POST /orders`, `GET, PATCH, DELETE /orders/{id}`
- `GET, POST /customers`, `GET, PATCH, DELETE /customers/{id}`
- `GET, POST /services`, `GET, PATCH, DELETE /services/{id}`
- `GET, POST /team`, `GET, PATCH, DELETE /team/{id}`
- `GET /payments` (derived and read-only)

Collections accept optional `q`, `status`, `page`, and `page_size` query parameters where applicable. All JSON responses include `data` and `meta`; errors include an `error` object and `meta`.
