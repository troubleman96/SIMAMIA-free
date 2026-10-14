# Mishe

Mishe is a Swahili-first business operations platform for small service and retail businesses. It combines a public website, a browser app, and a Go API in one repository. Owners sign in with Camel Accounts, create a Mishe business profile, and choose a workflow template.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/` | Next.js 16 app: dashboard, Camel Accounts sign-in, business onboarding, and product UI |
| `src/features/onboarding/business-templates.ts` | Eight workflow templates and their labels, statuses, intake fields, and sample services |
| `landing/` | Public `mishe.online` website (plain HTML, CSS, and JavaScript) |
| `api/` | Go HTTP API, SQLite persistence, and OpenAPI contract |
| `admin/` | Private Next.js operator console for tenant data, usage, and audit history (`admin.mishe.online`) |
| `docs-site/` | Next.js API documentation site (`docs.mishe.online`) |
| `deploy/` | Caddy and host-Nginx configuration for production routing |
| `compose.yaml` | Local/standalone deployment for landing, app, API, and Caddy |
| `docs/` | Product notes, API examples, integration research, and deployment procedures |

## Business workflows

The onboarding flow has two steps: choose a business type, then enter the business name and phone number. The Tanzania phone field fixes the `+255` prefix. Available templates are:

1. General service business
2. Salon and barber
3. Garage and auto service
4. Phone and electronics repair
5. Laundry and shoe care
6. Butcher and meat shop
7. Mobile money agent
8. Tailor and fashion house

Templates currently tailor labels, statuses, intake fields, and example services. They are starter workflows, not complete vertical products; specialized inventory, booking, float reconciliation, and compliance behavior may still need implementation.

## Current product boundaries

- Sign-in is handled by Camel Accounts. Mishe stores its own business profile after authentication.
- The Go API validates Camel Accounts access tokens and scopes stored records to the token subject.
- The API persists businesses, orders, customers, services, team records, and expenses in SQLite. Its default local database is `api/data/mishe.db`.
- Some dashboard data can fall back to fabricated browser-local demo records when the API is unavailable. Do not treat demo values as real business data.
- Payment records are operational ledger entries derived from work records. Mishe does not process a mobile-money transaction or issue a TRA fiscal receipt.
- SMS, email, AI, and payment-provider connections are not fully implemented. Read [`docs/integrations.md`](docs/integrations.md) for current status and provider notes.
- SQLite is intended for a single API instance. Production still needs tested backups, shared-business roles, and operational monitoring before scaling out.
- The private `admin.mishe.online` console administers Mishe records and tenants inferred from record ownership. It does not administer Camel Accounts credentials or identities; see [`docs/admin-console.md`](docs/admin-console.md).

## Requirements

- Bun 1.x (recommended) or a compatible Node.js/npm installation for the Next.js app and landing page
- Go 1.26 or the version declared by `api/go.mod` for local API development
- Docker Engine and the Compose plugin for the production-like stack

## Local development

The admin console and API docs are standalone Next.js apps in this monorepo. Run their development servers from their own directories:

```bash
# In one terminal:
cd admin && bun install && bun run dev

# In a second terminal:
cd docs-site && bun install && bun run dev
```

Docker Compose builds the admin console and docs site from their directories in this repository.

Install the root dependencies (the landing page is a Bun workspace):

```bash
bun install
```

Run each service in its own terminal.

**1. API** — listens on `http://localhost:8080` by default:

```bash
cd api
go run .
```

**2. App** — configure the public Camel Accounts client and local API URL at build/dev time:

```bash
NEXT_PUBLIC_CAMEL_ACCOUNTS_URL=https://accounts.camelcreatives.com \
NEXT_PUBLIC_CAMEL_ACCOUNTS_CLIENT_ID=mishe-35sj96 \
NEXT_PUBLIC_MISHE_API_URL=http://localhost:8080/api/v1 \
bun run dev
```

Open `http://localhost:3000`. For sign-in to complete, the Camel Accounts client must allow the app's callback URL for the local origin. See [`docs/deployment.md`](docs/deployment.md) for the production client settings.

**3. Public landing page** — runs at `http://localhost:4173`:

```bash
cd landing
bun run dev
```

**4. Admin console** — configure a local operator password and matching API key for the API and admin server, then open `http://localhost:3001` from the admin workspace:

```bash
MISHE_API_URL=http://localhost:8080/api/v1 \
MISHE_ADMIN_EMAIL=admin@example.com \
MISHE_ADMIN_API_TOKEN=local-development-token-at-least-32-chars \
MISHE_ADMIN_PASSWORD='local-private-password' \
MISHE_ADMIN_SESSION_SECRET='another-local-secret-at-least-32-chars' \
ADMIN_APP_ORIGIN=http://localhost:3001 \
bun --cwd admin run dev
```

Start the API with `MISHE_ADMIN_TOKEN` set to the same value as `MISHE_ADMIN_API_TOKEN`. Keep local values separate from production secrets.

Or run the services together in containers:

```bash
cp .env.server.example .env
docker compose up --build
```

The standalone Compose configuration expects DNS to point to this machine and binds ports 80/443 for Caddy. For development with no public DNS/TLS, run the individual services above.

## Environment configuration

- `.env.server.example` lists public app build settings and API runtime settings for Compose. Copy it to `.env` for a server deployment and review every value before building.
- `env.example.txt` is the original dashboard starter's broader environment reference. Clerk variables there are legacy template settings; Mishe sign-in uses Camel Accounts.
- Never commit `.env`, `.env.local`, access tokens, client secrets, or production database files.

## Build and quality commands

```bash
bun run typecheck
bun run build
cd api && go test ./...
cd landing && bun run build
```

The Next.js app is configured for static export and writes the deployable site to `out/`. The landing build writes to `landing/dist/`. Both generated directories are ignored by Git.

## API and deployment references

- API contract: [`api/openapi.yaml`](api/openapi.yaml)
- Interactive Swagger reference and detailed API guides: [`docs-site/`](docs-site) source, including the OpenAPI contract mirror
- API setup and configuration: [`api/README.md`](api/README.md)
- Local API examples: [`docs/demo-testing.md`](docs/demo-testing.md)
- Production deployment, DNS, TLS, and backups: [`docs/deployment.md`](docs/deployment.md)
- Logging and error reporting: [`docs/logging.md`](docs/logging.md)
- Product/operations guide: [`docs/management-guide.md`](docs/management-guide.md)
- Integration status: [`docs/integrations.md`](docs/integrations.md)
- Vertical market and onboarding plan: [`docs/vertical-market-and-onboarding-plan.md`](docs/vertical-market-and-onboarding-plan.md)
- Broader service-platform upgrade plan: [`docs/service-platform-upgrade-plan.md`](docs/service-platform-upgrade-plan.md)
