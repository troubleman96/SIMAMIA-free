# Simamia Service Platform Upgrade Plan

**Purpose:** turn the current Simamia preview into a reliable, shared service-operations product, using Shoe Cleaners as the first detailed vertical workflow and borrowing proven patterns from SendAfrica and ZiadaPOS.

**Research date:** 11 October 2026. Provider contracts, pricing, model catalogs, account rules, and local compliance requirements must be rechecked before implementation and launch.

## 1. Product direction

Simamia should become a multi-business service-management platform. Each business can configure its services and operating rules, while using a consistent core for customers, work orders, scheduling, staff, payments, expenses, communications, reports, and AI assistance.

Shoe Cleaners is a reference workflow and likely first production business. Preserve the useful domain behavior—multiple items per order, condition capture, tags, price snapshots, deposits, item history, payment attribution, and pickup—without making every service business shoe-specific. Use configurable work-item fields, resource/tag tracking, and workflow stages so a laundry, repair shop, salon, or cleaning team can use its own job details.

Success means a team can use Simamia as its shared source of truth throughout an ordinary workday: record a request once, know who owns the next action, know what is due, account for money without confusing sales with cash, communicate reliably, and inspect the evidence behind every report.

## 2. What exists today

### Simamia / Simamia

- The public app is a Next.js page with a large client-side implementation in `src/app/simamia.tsx`.
- The preview includes overview, orders, customers, services, schedule, team, payments, reports, messages, assistant, integrations, API information, and settings.
- Editable records are synthetic and stored in that browser's `localStorage`.
- `api/` is a separate Go reference API with generic in-memory tables. It seeds sample records and resets on process restart.
- The browser checks the Go API health endpoint but does not load or mutate shop records through it.
- There is no login, business boundary, shared durable datastore, backup path, or enforced user permission model in this preview.

Relevant sources: `src/app/simamia.tsx`, `api/main.go`, `README.md`, `docs/management-guide.md`, and `docs/design-reference.md`.

### Shoe Cleaners TZ

The separate Shoe Cleaners project is a more mature, single-shop operations reference. Its Next.js UI calls a Django REST API. Its models cover customers, services/categories, orders, individual shoes, saved service prices, tag inventory, order payments, expenses, staff permissions, audit events, SMS logs/templates, and private assistant threads. Order creation reserves tags and writes shoe service-price snapshots transactionally. The workflow includes order stages from intake through pickup, split payments, reporting, staff invitations, and operational notifications.

Relevant sources in `Shoe cleaners project`: `PRODUCT.md`, `CONTEXT.md`, `docs/implementation-handoff.md`, `docs/design/shop-management-wireframes.md`, `api/apps/orders/models.py`, `api/apps/orders/serializers.py`, `api/apps/payments/models.py`, and `UI/src/lib/api.ts`.

Its limits are instructive too: it is scoped to one shop, its UI stores JWTs in browser `localStorage`, and recorded mobile-money method is bookkeeping rather than provider settlement confirmation. Keep the shop workflows and server-side invariants; do not assume its whole architecture is already a multi-tenant SaaS design.

### ZiadaPOS

ZiadaPOS is a retail/pharmacy product, not a service platform. Its useful patterns are server-authoritative transactions, organization/store scoping from authenticated claims, atomic checkout and stock movements, distinct refund/void handling, supplier procurement, exportable/scheduled reports, and Ngamia-backed chat/agent flows. Its SMS UI is not a ready integration; its own API docs identify that UI route as unwired. Its report backend is more developed than its current report presentation.

Relevant references in `ZiadaPos project`: `api/README.md`, `api/docs/business-workflows.md`, `api/internal/middleware/auth.go`, `api/apps/transactions/service.go`, `api/apps/ai/service.go`, `api/internal/integrations/ai/ngamia.go`, `web-app/src/features/reports/components/reports-dashboard.tsx`, and `docs/pages/architecture.mdx`.

## 3. Architecture recommendation

### Keep one Simamia product backend

Evolve the existing Go API and make it the source of truth for Simamia. Do not have the Next.js app write separate local records, and do not merge a second Django backend into Simamia. Port business rules and selected UX patterns from Shoe Cleaners and ZiadaPOS into the Go service.

Adopt:

- A relational database, migrations, foreign keys, constraints, transactions, indexes, and tested backup/restore procedures.
- A domain API organized around businesses, locations, memberships, customers, catalog, jobs, scheduling, payments, expenses, communication, reporting, and integrations.
- A Next.js feature structure with typed API clients, query/mutation caching, URL-backed list filters, server/client boundaries, and explicit loading, empty, error, and success states.
- A background job mechanism for messages, scheduled reports, webhook retries, and other slow external work. Saving a job or payment must not depend on an SMS/email provider being online.
- Provider adapters so SendAfrica, MailAfrica, and Ngamia credentials/contracts do not leak into customer-facing workflow code.

The current generic Go `Record` maps and in-memory `Store` are useful for endpoint prototyping only. Replace them with typed domain models and persistence before migrating users or connecting real providers.

### Business and branch boundary

Define this before production data exists:

- `Business` owns the tenant boundary and billing/integration configuration.
- `Location` represents a branch or service area with its own staff, hours, schedule, and optional numbering sequence.
- Every business-owned record is scoped server-side by verified membership and active location. The client never chooses its own authorized business scope.
- Staff permissions are action-based and enforced in the API. At minimum: view/create/edit/archive orders; assign/reassign work; record/adjust payments; manage expenses; send messages; view/export reports; manage catalog, locations, members, settings, and integrations.
- Keep an append-only audit trail for important changes, permission changes, exports, provider sends, payment corrections, status changes, and integration credential actions.

Use ZiadaPOS as a reference for organization/store scoping and transactional writes, and Shoe Cleaners for area/action permissions. Simamia should have its own coherent authorization model rather than copying either project's role strings wholesale.

## 4. Domain and workflow to build

### Core records

1. **Business, location, membership, role/permission.** Time zone, currency, locale, business identity, operating hours, business workflow configuration.
2. **Customer.** Name, normalized phone/email, service address/location, consent and opt-out state, notes, archive state, activity history.
3. **Service catalog.** Service/category, description, duration, current price, active state, optional location availability, optional resource requirements.
4. **Job/order.** Human-readable reference, customer, location, created/received time, requested/due/appointment times, status, assigned staff, notes, source, and immutable service/item price snapshots.
5. **Job items/work units.** One or more things or service lines receiving work. Configurable details allow Shoe Cleaners' shoe/category/brand/color/condition/photo/tag needs while other businesses use different fields. Store item-level services and snapshots.
6. **Schedule/assignment.** Appointment or work slot, staff/resource, capacity, duration, status, conflict rules, rescheduling history, no-show/cancellation details.
7. **Work events.** Timestamped status transitions, actor, previous/new value, notes, attachments/checklist results, customer-visible event, and audit correlation ID.
8. **Payments and adjustments.** Immutable collection records with method, amount, time, actor, reference, and state; separate refund/reversal/void records. Derive paid and balance from ledger entries. No client-supplied total is authoritative.
9. **Expenses and optional supplies.** Expense entries with category/date/method/actor. Later, stock movements, purchase orders, suppliers, and job material usage for businesses that need them.
10. **Communications.** Template, purpose, recipient, customer/job reference, consent snapshot, actor, selected sender, provider ID, segment/cost, status timestamps, failure/retry history, and webhook/audit correlation.
11. **Integrations and assistant records.** Encrypted server-side credentials, connection health, webhook config, last sync, provider/model usage, per-user assistant threads, and source references for answers.

### Primary operating flow

1. Owner creates a business and location, adds staff, configures services, prices, hours, templates, and optional tags/resources.
2. Staff finds or creates a customer, records the request, service items, condition/notes/photos, promised completion or appointment, and optional deposit.
3. Server validates service availability, price snapshots, tag/resource availability, permission, duplicate submission/idempotency key, and transactionally creates the job and ledger entry.
4. Work appears in the schedule/queue. A supervisor assigns it. Staff records progress against job or individual item steps; the system records each change and who made it.
5. Staff records additional payment or adjustment. The remaining balance is server-derived. Provider settlement remains a separate status if an actual payment rail is connected.
6. Completion triggers a previewable customer update. Pickup/hand-off is explicit and timestamped; optional proof/recipient/checklist can be captured by business policy.
7. Job history, customer history, payments, communication outcomes, and reports all read the same saved records.

## 5. Page and navigation plan

Build core work surfaces first and expose only pages permitted for the signed-in staff member.

### Work

- **Overview** `/dashboard/overview`: current workload, due/overdue, ready for handoff, today's schedule, payment/balance summary, recent activity, fast actions.
- **Work board** `/dashboard/jobs`: searchable/filterable list plus optional status board. Keep mobile row/card layout practical.
- **Create job** `/dashboard/jobs/new`: progressive intake form, customer search/create, dynamic job items, price preview, appointment/due date, optional deposit, review/confirm. Prevent duplicate submit and retain values on API error.
- **Job detail** `/dashboard/jobs/[jobId]`: customer, service/item cards, quote and saved prices, schedule/assignee, status timeline, notes/attachments/checklists, payment ledger/balance, message history, audit trail, permitted actions.
- **Calendar/schedule** `/dashboard/schedule`: day/week, location/staff/resource filters, drag or dialog reschedule with conflict detection, capacity visibility, overdue and unscheduled queues.
- **Customers** `/dashboard/customers`, `/dashboard/customers/[customerId]`: search/dedupe, consent, history, repeat visits, jobs, balances, payments, message history, contact shortcuts, archive.
- **Services** `/dashboard/services`, `/dashboard/services/[serviceId]`: categories, description, duration, locations, current price, active status, usage/report links; past job prices remain stable.
- **Job items/resources** `/dashboard/items` or business-configured inventory pages: shoe records/tags for Shoe Cleaners; relevant assets/equipment/parts only when the business uses them.

### Money and insights

- **Payments** `/dashboard/payments`: ledger list, date/method/staff filters, order link, correction/refund workflow, exports.
- **Balances** `/dashboard/balances`: open and overdue balances, age buckets, largest balances, reminder preview, payment action.
- **Expenses** `/dashboard/expenses`: create/edit/archive with category, amount, spent date, method, note, recorder and report link.
- **Reports** `/dashboard/reports` plus dedicated detail routes described in Section 6.
- **Exports** `/dashboard/exports`: permission-gated export history, criteria, row count, requester, completion/failure, download expiry.

### Customer communication and setup

- **Message center** `/dashboard/messages`: transactional message history and a separate campaign workflow; filters, detail, failure recovery, template selection, cost estimate, consent/opt-out visibility.
- **Templates** `/dashboard/messages/templates`: localized SMS/email templates, variable schema, preview with realistic synthetic example, validation, version history.
- **Sender IDs** `/dashboard/settings/integrations/sms/sender-ids`: requirements, eligibility, request, status, default usable sender, reviewer feedback and documents.
- **Integration setup** `/dashboard/settings/integrations`: provider state, credential setup/test, balance/health, sender/domain configuration, webhook status, last error, key rotation/removal.
- **Team & access** `/dashboard/settings/team`: invitation, expiring one-use password setup, role/permission review, deactivation, session revoke, last login.
- **Business setup** `/dashboard/settings/business`, `/dashboard/settings/locations`, `/dashboard/settings/workflows`, `/dashboard/settings/notifications`.
- **Audit log** `/dashboard/settings/audit`: who changed what, when, scoped filters, export permission.
- **AI assistant** `/dashboard/assistant`: persistent private threads, source/date context, suggested operational questions, answer citations, safe action drafts.
- **Account/security** `/dashboard/profile`, `/dashboard/security`: sessions, password/MFA policy, language, local time zone, notifications.

Existing components/pages should be reorganized into feature modules during implementation. Avoid an ever-growing single `simamia.tsx` page implementation.

## 6. Detailed reporting specification

Reports must be computed on the server from persisted source records, scoped to authorized businesses/locations, filterable by local business dates, and traceable to underlying jobs or ledger entries. Every report shows **measure name, date range, location, comparison range, units/currency, last updated time, and calculation definition**. Downloaded CSVs use the same filters and totals as the screen.

### Global report controls

- Period presets: today, yesterday, 7 days, 30 days, month to date, previous month, quarter to date, custom.
- Comparison: preceding equal-length period; same period last year when enough history exists. State when a comparison is unavailable.
- Filters: business/location, service/category, job status, assigned staff, customer cohort, payment method, message status, and source/channel where applicable.
- Display local dates in the business time zone; keep timestamps in UTC. Include explicit start/end boundaries in the report response.
- Drill down from every KPI/chart segment to a filtered detail table; carry filters in the URL so links can be shared subject to authorization.
- Define reporting conventions in versioned documentation. Fix ambiguous/missing data labels instead of silently imputing values.

### Overview and finance

- **Jobs received / sales value:** count and total of jobs accepted in range. Show gross order value separately from cash received.
- **Payments received:** sum of payment ledger entries recorded in range, grouped by payment timestamp, method, and location.
- **Outstanding balance:** remaining amount on open/partially paid jobs; show count, amount, due/overdue breakdown and age buckets (0–7, 8–30, 31–60, 60+ days).
- **Expenses:** amount and count in range, by category and payment method.
- **Cash after expenses:** payments received in range minus expenses recorded in the same range. Label clearly that this is not profit and excludes unrecorded costs and unpaid work.
- **Refunds/voids:** show separate totals and net collections, never erase original payment history.
- **Comparisons:** absolute change, percent change where denominator permits, and both comparison-period values.
- **Reconciliation detail:** line-level payments/expenses with timestamp, source job, method, actor, references and adjustment state.

### Operations

- Job count/value by current stage and transition counts over time.
- Items/units accepted, in progress, completed, and handed off.
- Due today, due next 7 days, overdue, ready for pickup/delivery, unassigned, and unscheduled queues.
- Turnaround distribution: received-to-complete median, average, and percentile buckets; identify excluded open/cancelled jobs and data gaps.
- On-time completion rate with explicit promised-time basis and cancellation treatment.
- Schedule utilization by staff/resource and location; report booked capacity separately from actual completed work.
- Status age and bottleneck report: time in each stage, oldest cases, reassignment frequency, reopen/redo count.
- Drill to jobs/items and status history.

### Service, staff, and customer performance

- Service mix: jobs/items, quantity, price snapshot value, payments associated, average delivery time, rework/cancellation rate.
- Staff workload and throughput: assigned/completed jobs, units handled, overdue workload, average turnaround, reassignment, and payment/message actions where authorized. Avoid simplistic rankings without showing workload and role context.
- Customer activity: new/repeat/returning customers, visits/jobs, period payments, lifetime payments, unpaid balance, last activity, retention cohorts.
- Top customers default to payments received in period, with clearly named alternatives for job count, sales value, and lifetime payments.
- Service/customer drilldowns show the jobs/ledger rows behind numbers and respect sensitive-data permissions.

### Communications and integrations

- SMS/email requested, accepted, sent, delivered where provider supports delivery status, failed, unknown, retried, and suppressed counts.
- Separate provider acceptance from handset/email delivery. MailAfrica's current public docs describe outbound email states as sent/failed and do not document delivery/bounce tracking; do not promise delivered-email analytics without a documented provider event source.
- Show SMS parts/credits and email recipient charges, estimated vs recorded provider usage, and cost by template/purpose/location.
- Sender ID request volumes by pending/approved/rejected/suspended state and time waiting, but do not expose provider administrative data the integration account cannot access.

### Scheduled reports and exports

- Saved report presets with owner, recipients, cadence, filters and last/next run.
- Daily/weekly/monthly email report drafts with preview, delivery result and explicit opt-in enablement.
- Background exports for large reports; audit requester/filters/expiry and apply export permission separately from view permission.
- Reports are summaries, not statutory accounting statements or fiscal receipts unless the platform later integrates an approved system and satisfies its requirements.

## 7. SendAfrica SMS plan and UX

Use the SendAfrica webapp as the interaction reference for compose, request-sender-ID, sender list/detail, message logs, filters, pagination, export, and per-message detail. Rebuild these patterns inside Simamia's own design system and tenant context; do not embed SendAfrica dashboard credentials or treat its UI/API user as a Simamia business identity.

### Messaging surfaces

1. **Compose/transactional send:** select a customer or recipient list, select a template or write permitted text, choose only a usable sender ID, preview on a phone, display character encoding/segment count and estimated credits/cost, show consent/opt-out status, require confirmation for bulk sends, and show per-recipient result.
2. **Business templates:** order received, appointment reminder, progress update, ready for pickup, payment confirmation, balance reminder, cancellation/reschedule. Support Swahili and English and preview variable substitution before send.
3. **Campaigns:** a later, separate opt-in-only capability with audience filters, exclusion/suppression, test send, scheduling, per-recipient result, spend limit and cancellation before dispatch. Do not mix campaign blasts with job-triggered messages.
4. **Sender IDs:** display live provider requirements and allowed character/purpose/document rules; guide the user through name, use case, sample message, required evidence uploads and validation; show submitted/pending/approved/rejected/suspended states, reviewer notes, retry/edit actions, and selected default. Requirements vary by country/provider and must come from the provider API rather than a stale hard-coded form.
5. **Message log/list and detail:** all, pending, sent, delivered, failed, delivery unknown, suppressed; search by recipient/job/provider ID; date/status/sender/purpose filters; pagination, CSV, and a detail timeline with sender, recipient, template/purpose, job, actor, message ID, segment/cost, created/sent/delivered times, error, retries and redacted provider metadata.
6. **SMS integration settings:** connection test, current balance/credit warning, account ownership mode, sender IDs, webhook health, last sync, key last-rotated date, diagnostics and disconnect/rotate flow.

### Integration contract and reliability

- SendAfrica's current public REST docs use `https://api.sendafrica.online/v1`, an `X-API-Key`, `POST /v1/sms/` and `POST /v1/sms/bulk`; public docs describe up to 1,000 recipients per bulk request and per-recipient partial outcomes. The SendAfrica app/API repos have additional product-account workflows; confirm which API credential and sender-ID ownership path Simamia can use before designing final onboarding.
- Treat successful submission as **accepted by provider**, not delivered. Persist the returned message ID and reconcile signed delivery events. Verify the raw-body HMAC signature, deduplicate callbacks, accept out-of-order/repeated events, and acknowledge only after durable processing.
- Use idempotency for sends and webhooks. Retry transient provider/network/rate-limit errors with bounded backoff; do not retry terminal failures blindly. Record `delivery_unknown` when provider state cannot be established.
- Credentials and webhook secrets are stored only server-side in a managed secret store/encrypted integration store. Never expose them in client bundles, browser storage, logs, or assistant context.
- Persist Simamia's own communication event linked to business, location, customer, job, actor and template. Provider logs alone are not the shop's communication history.
- Require consent/purpose and honor opt-outs; preview the audience and cost before bulk send. Keep ordinary order-state writes independent from provider success.

### Credential/commercial decision gate

Before integration, choose and document one model:

- **Business connects its own SendAfrica account/key:** clean account/sender ownership and billing, but requires secure key management, connection recovery and clear instructions.
- **Simamia operates a platform SendAfrica account:** smoother onboarding, but requires provider approval and commercial agreement for tenant segmentation, sender ownership, wallet funding, credit sub-ledgers, usage allocation, abuse control and customer support.

Do not begin paid production dispatch until this choice, the allowed sender-ID application process, consent policy and message-spend cap are approved.

## 8. MailAfrica email plan

Keep MailAfrica calls in the Go backend. Use the current API reference and OpenAPI spec as the source of truth for endpoint, request fields, error envelope, rate limits and statuses.

- Business integration page: connection test, wallet balance warning, default sender, verified sending-domain state, templates and last error.
- Email templates mirror SMS events: booking/order confirmation, estimate, status update, receipt/ledger confirmation, ready-for-handoff and scheduled report.
- Preview rendered HTML and text, validate required variables, escape customer-provided values, and send sandbox test messages.
- Store template version, recipient, provider message ID, submitted/sent-or-failed state, charge, actor, timestamps and error. Current provider docs describe outbound status as `sent` or `failed`; `sent` is upstream acceptance, and delivery/bounce analytics should only be added if the provider documents a source for them.
- Respect the documented 2 messages/sec per-user rate limit, chunk batch sends per current API limits, handle insufficient balance/rate-limit/suppression errors, and alert before wallet depletion. Public docs currently state 5 TZS per message/recipient and a minimum 2,000 TZS top-up; recheck price/limits before launch.
- Verify custom sending domains and SPF/DKIM/DMARC before using them. Keep top-up workflows in provider-owned checkout; do not collect wallet/card credentials in Simamia.
- MailAfrica also documents inbound addresses, signed webhooks, templates, sandbox, compliance profile and audit export. Treat shared customer inbox/inbound processing as a later scope after outbound service notifications are stable.

## 9. Ngamia assistant and AI intelligence

Make `/dashboard/assistant` a real, useful, safe work surface rather than a demo page.

### Initial capabilities

- Answer questions such as: “What is due today?”, “Which completed jobs are still unpaid?”, “How did payment collections change this week?”, “Which services have the longest turnaround?”, and “Draft a Kiswahili ready-for-pickup message for this customer.”
- Use typed, permission-checked reporting/query tools in the Go API. The model never receives database credentials and cannot issue arbitrary SQL or cross-business queries.
- Show answer period, location, metric definitions, source links/record IDs, missing-data caveats, and model identity. Let users inspect the underlying report or jobs.
- Stream answers where provider support allows it, persist private threads/messages, create new thread, rename/delete, restore, retry, copy, and provide feedback.
- Allow the assistant to **draft** a job update, SMS/email, report or assignment proposal. A human reviews and confirms every write or external send. Initial agent tools are read-only.
- Offer contextual entry points from a job/customer/report with only the minimum permitted context.

### Provider controls

- Use server-side `NGAMIA_API_KEY`; current docs use `https://api.ngamia.cc/v1`, production API keys beginning `ngm_`, `GET /v1/models`, and OpenAI-compatible `POST /v1/chat/completions`.
- Discover catalog, modality, supported parameters and current credit pricing dynamically; never hard-code a model list or price. Add model select for admins with allowed-model policy and a safe default.
- Set request timeout, token/output limit, per-user/business daily budget, usage/cost logging, rate control, bounded retries, cancellation, and provider outage UX. Show estimated/actual usage where available.
- Minimize customer data in prompts, apply retention controls, and disclose external AI processing. AI cannot determine tax, claim provider settlement, send messages, alter payments or finalize destructive actions.
- Follow the read-only and permission-filtered assistant boundary already documented in Shoe Cleaners ADR 0002 and ZiadaPOS's tool-mediated AI patterns.

## 10. Delivery phases

### Phase 0 — Product/domain and architecture lock

- Confirm target business types, first live workflows, single-business vs multi-business onboarding, branch expectations, and whether Shoe Cleaners is the first migrated tenant.
- Define Go as the Simamia API, database target, tenant/location model, roles/permissions, reporting definitions, provider-account ownership model, deployment/support ownership, and migration scope.
- Convert this plan into reviewed domain contracts and page acceptance criteria. Keep provider credentials unconfigured until security and commercial decisions are settled.

**Exit:** approved entity relationship/domain map, endpoint boundary, permissions matrix, migration approach, and MVP acceptance checklist.

### Phase 1 — Durable platform foundation

- Implement database migrations, typed models, validation, business/location scoping, authentication/session lifecycle, server-enforced authorization, audit events, error/request IDs, and seed/demo separation.
- Add secure integration credential handling, webhook endpoints, background jobs, backup/restore, logs/metrics, health/readiness checks and production configuration validation.
- Replace API generic in-memory resources. Remove browser localStorage as business-record storage and avoid long-lived credentials in browser storage.

**Exit:** records survive restarts, two businesses cannot read each other's data, permissions are tested at API boundaries, restore is demonstrated, and UI can authenticate and load shared records.

### Phase 2 — End-to-end service operations

- Build customer/catalog, job intake with one or more work items, service-price snapshots, assignments/schedule, status timeline, evidence/notes, payments/refunds/adjustments, expenses and audit links.
- Port Shoe Cleaners tag reservations and item-level intake as optional capabilities; port ZiadaPOS atomic-write/idempotency principles.
- Build list/detail/new pages and mobile-first keyboard/scan-friendly daily work interactions.

**Exit:** a staff member can record a real synthetic job, hand it across roles/stages, record split payments, complete/hand off the work, inspect its full history and see the same result on another authorized device.

### Phase 3 — Customer messaging and integrations

- Implement communication records, template versioning, consent, SMS compose and sender-ID workflow; then add signed DLR webhook reconciliation, message search/detail/export and failure handling.
- Add MailAfrica transactional email, template previews, domain/account health and charge/error records.
- Add integration admin/diagnostics and provider spend limits. Use provider sandbox before enabling production sends.

**Exit:** send is explicit and auditable; retry is idempotent; callbacks update a durable timeline; accepted and delivered/unknown/failed states are distinct; provider outage never loses a job/payment.

### Phase 4 — Detailed reports

- Implement common filters/date semantics and server-side aggregate queries; add finance, operations, services, staff, customers, communications, and audit/export views.
- Add drilldowns, CSV, background export, saved report filters, scheduled-report previews, and metric-definition tooltips.
- Reconcile every summary against source rows and prove role/location filtering on all charts and exports.

**Exit:** all headline figures can be reconstructed from a downloadable authorized detail table, and documented definitions match tests and UI copy.

### Phase 5 — Ngamia assistant

- Build private persisted threads, read-only typed tools, source-cited answers, date/location context, model catalog discovery and spend controls.
- Add safe draft actions with human approval after basic analytics answers are reliable.
- Evaluate answer quality on a curated set of synthetic operational questions and permission-boundary attempts.

**Exit:** answers match source reports, provide citations/period context, respect access boundaries, and cannot execute a mutation or send a provider message without an explicit user-approved action.

### Phase 6 — Pilot and production readiness

- Pilot with Shoe Cleaners data in a tenant-scoped environment using a documented import and reconciliation procedure. Validate dates, balances, customer dedupe, item/service price history, tags, payment history, and exports before cutover.
- Train owner/supervisors/staff. Observe daily intake, assignment, completion, collection, reconciliation and close-of-day report workflows.
- Complete security/privacy review, key rotation, abuse limits, uptime/error alerts, backups, recovery drill, support runbook, incident plan and rollback plan.
- Enable paid providers gradually, with explicit business opt-in, quotas and account alerts.

**Exit:** pilot owner signs off on workflow correctness, data reconciliation, report agreement, access control, recovery, support, provider delivery, and cost behavior.

## 11. Cross-cutting product quality requirements

- Mobile-first for shop staff; fast search by customer phone, job reference, tag/item, and service.
- Every mutation has validation, progress, success/error recovery, idempotency for duplicate submissions, and preserves form inputs on failure.
- No fake KPI numbers in production; empty states tell the operator how to create the necessary records.
- Every date is timezone-aware; every money value has currency and explicit measure label.
- Archive catalog/customer data used by history rather than destructive deletes; use correction/refund records for financial changes.
- Every list page has useful filters, stable sorting, pagination, clear empty/error states, and export permissions.
- Notifications and AI drafts never silently send; external costs and recipient scope are previewed first.
- Accessible contrast, keyboard use, screen-reader names, reduced-motion support, and responsive dialogs/sheets.
- Localized English and Kiswahili text must be reviewed by local shop users, not merely translated mechanically.
- Keep business actions independent from provider outages; show degraded provider state without blocking unrelated shop work.

## 12. Decisions and unresolved requirements

These are plan gates, not reasons to block foundational work:

1. Is Simamia first a single shop platform or a self-service product for many businesses from day one?
2. Which business is the pilot, and should Shoe Cleaners records be imported? Who verifies historical balances and service details?
3. What kinds of services need appointments and staff capacity versus queue/due-date scheduling?
4. Who owns SendAfrica/MailAfrica credentials and wallet spending: each business or Simamia? What is the approval/billing model for sender IDs and provider credits?
5. Which staff roles/actions are needed for first pilot? Who may issue refunds, export personal data, or send bulk messages?
6. What production database, hosting, backups, email domain, support and incident response are available?
7. What retention, consent, customer deletion/export and cross-border AI/provider rules are approved for the business?
8. Which reports are operational guidance versus accounting/tax records? Confirm fiscal-device requirements with the business's adviser before adding any receipt language.

## 13. Source references

### Simamia

- `README.md`, `src/app/simamia.tsx`, `api/main.go`, `docs/management-guide.md`, `docs/integrations.md`, `docs/provider-research.md`.

### Shoe Cleaners TZ

- `Shoe cleaners project/PRODUCT.md`
- `Shoe cleaners project/CONTEXT.md`
- `Shoe cleaners project/docs/implementation-handoff.md`
- `Shoe cleaners project/docs/design/shop-management-wireframes.md`
- `Shoe cleaners project/api/apps/orders/models.py`
- `Shoe cleaners project/api/apps/orders/serializers.py`
- `Shoe cleaners project/api/apps/payments/models.py`
- `Shoe cleaners project/api/apps/core/permissions.py`
- `Shoe cleaners project/UI/src/lib/api.ts`

### SendAfrica

- `SendAfrica project/API/apps/sms/README.md`, `SendAfrica project/API/apps/senderid/README.md`, `SendAfrica project/webapp/src/features/sendafrica/sendafrica-workspace.tsx`, `SendAfrica project/webapp/src/features/sendafrica/message-logs-page.tsx`, `SendAfrica project/webapp/src/features/sendafrica/request-sender-id-dialog.tsx`.
- Official docs: [SMS API](https://docs.sendafrica.online/api/sms), [webhooks](https://docs.sendafrica.online/api/webhooks), [TypeScript SDK](https://docs.sendafrica.online/sdks/typescript), [Go SDK](https://docs.sendafrica.online/sdks/go), [security guidance](https://docs.sendafrica.online/guides/security).

### MailAfrica

- Simamia's existing reference notes: `docs/provider-research.md` and `docs/integrations.md`.
- Official docs/OpenAPI: [Introduction](https://docs.mailafrica.online/), [sender IDs](https://docs.mailafrica.online/sender-ids), [outbound email](https://docs.mailafrica.online/outbound), [templates](https://docs.mailafrica.online/templates), [webhooks](https://docs.mailafrica.online/webhooks), [balance and top-up](https://docs.mailafrica.online/balance), [pricing and limits](https://docs.mailafrica.online/pricing), [sandbox](https://docs.mailafrica.online/sandbox), [compliance](https://docs.mailafrica.online/compliance), [OpenAPI schema](https://docs.mailafrica.online/openapi.json).

### Ngamia

- Simamia's existing reference notes: `docs/provider-research.md` and `docs/integrations.md`.
- Official docs: [Introduction](https://docs.ngamia.cc/introduction), [Quickstart](https://docs.ngamia.cc/quickstart), [Models](https://docs.ngamia.cc/models), [Chat Completions](https://docs.ngamia.cc/chat-completions), [Security and data handling](https://docs.ngamia.cc/security), [Rate limits](https://docs.ngamia.cc/rate-limits), [Billing and credits](https://docs.ngamia.cc/billing).

### ZiadaPOS

- `ZiadaPos project/api/README.md`
- `ZiadaPos project/api/docs/business-workflows.md`
- `ZiadaPos project/api/internal/middleware/auth.go`
- `ZiadaPos project/api/apps/transactions/service.go`
- `ZiadaPos project/api/apps/ai/service.go`
- `ZiadaPos project/api/internal/integrations/ai/ngamia.go`
- `ZiadaPos project/web-app/src/features/reports/components/reports-dashboard.tsx`
- `ZiadaPos project/docs/pages/architecture.mdx`
