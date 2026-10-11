# HudumaDesk workflow API

Standalone Go reference API for the HudumaDesk demo. It seeds fabricated records into an in-memory store at startup; mutations are shared for the life of the process and reset on restart. The service has no authentication and is not suitable for real customer information or production use.

```bash
go test ./...
go run .
```

By default the service listens on `0.0.0.0:8080`; set `PORT` to use another port. Base path: `/api/v1`. Health check: `/api/v1/health`. Full contract: [`openapi.yaml`](openapi.yaml). For request examples, see [`../docs/demo-testing.md`](../docs/demo-testing.md).
