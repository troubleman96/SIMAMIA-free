# HudumaDesk Management Guide

**Audience:** service-business owners and supervisors in Tanzania
**Language:** simple Kiswahili by default; English is available in the language switcher
**Status:** MVP preview, version 0.1

## 1. What this MVP is for

HudumaDesk is a service-operations workspace for small teams that take requests, schedule work, assign staff, collect payments and keep customers informed. It is intentionally service-agnostic: examples include laundry, cleaning, repairs, maintenance, salons and other appointment/job-based businesses.

The preview includes a working navigation shell and editable sample records for **orders, customers, services, schedule, team, payment balances, reports, message drafts, a local assistant, integrations, API reference and settings**. Create/edit/advance actions update the preview data. Data is saved in the current browser's local storage; it is not a shared team workspace or a production database.

## 2. Everyday workflow

1. **Set up services:** open *Huduma / Services*, add a service, set category, expected duration and TZS price, then switch availability on or off.
2. **Register a customer:** open *Wateja / Customers*. Capture only contact and service-delivery details the business actually needs. Use a country code for phone numbers, for example `+255`.
3. **Create a job:** open *Maagizo / Orders* or use **Agizo jipya**. Choose the customer and service, set date/time, amount, payment method and assignee. New work starts in `New` status.
4. **Run the work:** move jobs along `New → In progress → Ready → Completed`. The row action advances one step; clicking a booking in the schedule also advances it. Record the actual customer/job changes in the order record.
5. **Record a collection:** use *Malipo / Payments* to record the amount and method against an order. This is a bookkeeping entry only; the preview does not initiate or verify a mobile-money transaction.
6. **Follow up:** check open balances and reports, then prepare an SMS or email draft. Sending is disabled until a provider is deliberately connected on a secure server.
7. **Review:** export CSVs from orders, customers, payments or reports. Use settings to export/reset sample data or change the business display name/language.

## 3. Tanzania operating context

- The Bank of Tanzania's **National Payment Systems Annual Report 2025** describes mobile money as dominating retail payments. It reports 75.78 million active mobile-money subscriptions and 1.98 million agents in 2025. Subscriptions are not the same measure as unique individuals. The product therefore records common wallet methods such as M-Pesa, Mixx by Yas, Airtel Money and HaloPesa, alongside cash and bank transfer, without assuming that a wallet payment has been verified.
- The Tanzania Revenue Authority (TRA) says sellers in scope are obliged to issue a receipt or invoice for each sale/service and describes Electronic Fiscal Devices. Applicability depends on the taxpayer and current rules. **An order record, payment entry or receipt flag in HudumaDesk is not a TRA fiscal receipt and is not tax advice.** Confirm the business's obligations with TRA or a tax professional and use an approved EFD/VFD process where required.
- Customer names, phone numbers, email addresses and service history are personal data. Tanzania's Personal Data Protection Act 2022 and the Personal Data Protection Commission (PDPC) should inform a real deployment's notices, access control, retention, data-subject handling, processor contracts and any applicable registration duties. This preview contains synthetic sample identities; do not replace them with real customer data.
- Dar es Salaam/EAT (UTC+3) and TZS are the defaults. Multi-region, Zanzibar-specific, VAT/tax calculation, fiscal-device integration, mobile-money reconciliation, stock/parts and low-connectivity offline sync require local operational validation before production.

## 4. Role and control suggestions (production design)

| Role | Suggested access |
| --- | --- |
| Owner / administrator | Business profile, team and access setup, reports, integrations, exports |
| Supervisor | Orders, schedule, customer/service records, payment ledger, team assignment |
| Technician / service staff | Assigned jobs, status updates and minimum customer/job details needed for fulfilment |
| Cashier / finance | Payments, balances and approved receipt workflow; not unrestricted customer exports |
| Support / auditor | Narrowly scoped, time-bound, logged read access |

The demo has no authentication or role enforcement. Do not enter real or sensitive business data until a protected production environment exists.

## 5. Screen-by-screen controls

- **Overview:** illustrative KPI cards, revenue chart, today's sample queue and quick actions.
- **Orders:** search/filter by status, create order, advance status, record a collection, download CSV.
- **Customers:** search customer/contact/location, add a customer, begin a message draft, download CSV; follow data-minimisation practices.
- **Services:** add offerings and toggle availability.
- **Schedule:** weekly visual schedule; selecting a listed booking advances its workflow state.
- **Team:** add staff records, call a listed work phone, switch active/on-shift state.
- **Payments:** view paid/due balances and record a collection; no payment is collected by this screen.
- **Reports:** sample trend cards and service/status breakdown; export underlying sample order records.
- **Messages:** prepare a draft; it is not sent. The exact provider docs are linked on-screen.
- **AI assistant:** deterministic, local summary helper over sample data; no Ngamia request is made by this preview.
- **Integrations:** SendAfrica, MailAfrica and Ngamia connection status and documentation links. All currently show *Not connected*.
- **API & docs:** Go REST API routes, response shape and quick-start command.
- **Settings:** business display name, English/Kiswahili toggle, TZS/EAT information, demo export/reset and TRA/PDPC pointers.

## 6. Preview data and reliability

The landing URL serves a **static, unauthenticated preview**. Its interactions run in the visitor's browser and persist only in that browser's local storage. Sample dashboards may show illustrative aggregates that are not recalculated accounting statements. Refreshing does not share changes with anyone else. Clearing site storage or choosing **Reset demo** restores the seed records.

The Go API in `api/` is a separate local MVP reference service with in-memory seed records. Run it using `cd api && go run .`; test it using `go test ./...`. It resets when the process restarts. The static preview is not wired to a hosted Go API and there is no database, login, backups, rate limit, access log, authentication, payment gateway or message delivery.

## 7. Production readiness checklist

Before using real records:

- Deploy the Go API as an authenticated service behind HTTPS; use tenant isolation, RBAC, audit events, request validation, abuse/rate controls and secure secrets management.
- Replace in-memory storage with a backed-up relational store; define migrations, retention/deletion, exports, restore testing and incident response.
- Add a real authentication and business/workspace boundary. Enforce permissions server-side, not just by hiding navigation.
- Review the PDPA 2022 and PDPC guidance with local counsel/privacy staff. Document purposes, lawful bases, customer notices, data-subject requests, processors, cross-border flows, retention/deletion and breach response.
- Confirm each business's current TRA obligations. Integrate only an approved fiscal device/provider where applicable; never represent a non-fiscal app receipt as an EFD/VFD receipt.
- Confirm each payment via an authoritative provider callback/reconciliation reference. Do not store wallet PINs, OTPs or card credentials. Record currency, amount, provider, transaction ID, status, timestamps and reversal/refund events.
- Add idempotency keys and webhook signature checks for all third-party callbacks. Store only server-side credentials and redact secrets from logs.
- Connect and test SMS, email and AI providers in a staging account; implement consent/opt-out, delivery status, retries, cost controls, template review and provider failure handling.
- Verify Swahili copy with Tanzanian service-business users. Confirm local dates, phone normalization, cash/mobile-money workflows, applicable taxes, device support and low-bandwidth behaviour.

## 8. Evidence and references

- Bank of Tanzania, *National Payment Systems Annual Report 2025* (2026): [annual report PDF](https://www.bot.go.tz/Publications/Regular/Annual%20Report/en/2026060211494565.pdf)
- Tanzania Revenue Authority, [E-Fiscal Devices (EFD)](https://www.tra.go.tz/page/know-about-e-fiscal-devices-efd)
- Personal Data Protection Commission, [The Personal Data Protection Act, 2022](https://pdpc.go.tz/the-personal-data-protection-act-2022/)
- Original UI reference, MIT-licensed [Next.js shadcn dashboard starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
- Provider documentation: [SendAfrica](https://docs.sendafrica.online) · [MailAfrica](https://docs.mailafrica.online) · [Ngamia](https://docs.ngamia.cc)
