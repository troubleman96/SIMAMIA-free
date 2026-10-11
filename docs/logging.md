# Application logging and error reporting

Simamia writes operational logs as structured JSON to container output. Docker and the hosting platform should collect stdout and stderr; the application does not write log files into the source tree or SQLite database.

## What each service records

| Service | Log events | Where to read them |
| --- | --- | --- |
| Go API | Startup/shutdown failures, each HTTP request, and successful record create/update/delete events. Request records include method, normalized route, status, duration, and request ID. | `docker compose logs -f api` |
| Next.js static app | API request start/completion in development; warnings and errors in production browser console. API failures with HTTP 5xx or network failures are also sent to Sentry when configured. Sign-in and token-refresh lifecycle events exclude user credentials. | Browser developer console; Sentry for captured errors |
| App Nginx | JSON access and warning/error logs. Query strings and record IDs are omitted from the normalized route. | `docker compose logs -f app` |
| Landing Nginx | JSON access and warning/error logs. The logged route omits the query string. | `docker compose logs -f landing` |

The app reads the API's `X-Request-ID` response header and includes it in browser API request events. It is CORS-exposed for the app origin. This lets support correlate a browser-side failure with the matching API log entry.

## Log levels

The API accepts `LOG_LEVEL=debug|info|warn|error`. The default is `info`. HTTP successes are `info`, client errors are `warn`, and server errors are `error`. Record mutations are logged after the SQLite write succeeds. Failed SQLite writes include a safe operation/resource context and the database driver error, but not the record payload.

Example API event:

```json
{"time":"2026-10-11T13:00:00Z","level":"INFO","msg":"http_request","method":"GET","route":"/api/v1/orders","status":200,"duration_ms":8,"request_id":"req_..."}
```

## Sentry configuration

Set `NEXT_PUBLIC_SENTRY_DSN` at build time to enable browser and Next.js error capture. Set `NEXT_PUBLIC_SENTRY_DISABLED=true` to disable Sentry. Sampling for performance transactions is 10%; error events are not sampled by this setting.

Simamia disables Sentry's default PII collection, removes user identity and request headers/body/query data from events, strips query strings from URLs, and drops network breadcrumbs. The frontend logger only emits an allowlist of operational fields; it never sends tokens, passwords, phone numbers, customer names, request bodies, or raw error messages.

## Inspecting logs

```bash
# Follow every service
docker compose logs -f

# Follow only API request and mutation logs
docker compose logs -f api

# Review the last hour
docker compose logs --since=1h api app landing
```

Configure retention and access controls in the Docker host or log collector. Logs are operational diagnostics, not an audit ledger; mutation events do not include before/after data and are not a substitute for a business audit trail.
