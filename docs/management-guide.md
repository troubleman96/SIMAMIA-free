# Simamia Management Guide

**Audience:** service-business owners and supervisors in Tanzania
**Language:** simple Kiswahili by default; English is available in the language switcher
**Status:** early implementation; workflow templates and Camel Accounts integration are present, with production capabilities still in progress

## 1. What this MVP is for

Simamia is a service-operations workspace for small teams that take requests, schedule work, assign staff, collect payments and keep customers informed. It is intentionally service-agnostic: examples include laundry, cleaning, repairs, maintenance, salons and other appointment/job-based businesses.

The app currently includes **orders/jobs, customers, services, schedule, team, payments, debts, expenses, invoices, reports, message drafts, an assistant page, integrations, API reference and settings**. Camel Accounts handles phone/password sign-in; new users then create a business profile and choose one of eight workflow templates. The templates configure labels, statuses and intake fields. The authenticated Go API scopes records to the Camel subject, but does not yet implement shared business memberships or staff permissions. Provider screens remain unconnected.

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
- The Tanzania Revenue Authority (TRA) says sellers in scope are obliged to issue a receipt or invoice for each sale/service and describes Electronic Fiscal Devices. Applicability depends on the taxpayer and current rules. **An order record, payment entry or receipt flag in Simamia is not a TRA fiscal receipt and is not tax advice.** Confirm the business's obligations with TRA or a tax professional and use an approved EFD/VFD process where required.
- Customer names, phone numbers, email addresses and service history are personal data. Tanzania's Personal Data Protection Act 2022 and the Personal Data Protection Commission (PDPC) should inform a real deployment's notices, access control, retention, data-subject handling, processor contracts and any applicable registration duties. Use synthetic identities in local development. The current deployment is not yet ready for production personal data.
- Dar es Salaam/EAT (UTC+3) and TZS are the defaults. Multi-region, Zanzibar-specific, VAT/tax calculation, fiscal-device integration, mobile-money reconciliation, stock/parts and low-connectivity offline sync require local operational validation before production.

## 4. Role and control suggestions (production design)

| Role | Suggested access |
| --- | --- |
| Owner / administrator | Business profile, team and access setup, reports, integrations, exports |
| Supervisor | Orders, schedule, customer/service records, payment ledger, team assignment |
| Technician / service staff | Assigned jobs, status updates and minimum customer/job details needed for fulfilment |
| Cashier / finance | Payments, balances and approved receipt workflow; not unrestricted customer exports |
| Support / auditor | Narrowly scoped, time-bound, logged read access |

Camel Accounts authenticates users and the API scopes data to each authenticated subject. Business membership, staff roles, audit history and production-grade storage are still missing; avoid production data until those controls and the deployment have been reviewed.

## 5. Screen-by-screen controls

- **Overview:** illustrative KPI cards, revenue chart, today's sample queue and quick actions.
- **Orders:** search/filter by status, create order, advance status, record a collection, download CSV.
- **Customers:** search customer/contact/location, add a customer, begin a message draft, download CSV; follow data-minimisation practices.
- **Services:** add offerings and toggle availability.
- **Schedule:** weekly visual schedule; selecting a listed booking advances its workflow state.
- **Team:** add staff records, call a listed work phone, switch active/on-shift state.
- **Payments:** view paid/due balances and record a collection; no payment is collected by this screen.
- **Debts:** review outstanding order balances by customer and order; the amount is derived from order value minus aggregate recorded payments.
- **Expenses:** record operating expenses with category, date, payee, method and notes; review the register and export CSV.
- **Invoices:** print an order-based business invoice with recorded paid amount and balance. Invoice numbers derive from order IDs; line items, tax rules, fiscal numbering and per-payment dates are not implemented. It is not a TRA EFD/VFD receipt.
- **Reports:** choose an EAT date range to view order value, recorded payments, outstanding debt, expenses, paid less expenses, completion rate, status/service breakdown and daily volume; export the filtered order register. Payment aggregates have no individual payment dates, so this does not report cash received during that date range.
- **Messages:** prepare a draft; it is not sent. The exact provider docs are linked on-screen.
- **AI assistant:** deterministic, local summary helper over sample data; no Ngamia request is made by this preview.
- **Integrations:** SendAfrica, MailAfrica and Ngamia connection status and documentation links. All currently show *Not connected*.
- **API & docs:** Go REST API routes, response shape and quick-start command.
- **Settings:** business display name, English/Kiswahili toggle, TZS/EAT information, demo export/reset and TRA/PDPC pointers.

## 6. Preview data and reliability

The frontend requires Camel Accounts sign-in. The dashboard calls the Go API when available and falls back to browser-local demo data if the API cannot be reached. Browser-local data is not a shared or backed-up workspace.

The Go API in `api/` validates bearer tokens through Camel Accounts userinfo and scopes records by account subject. Run it using `cd api && go run .`; SQLite data persists across restarts. Configure `CAMEL_ACCOUNTS_URL` for the API and `NEXT_PUBLIC_SIMAMIA_API_URL` for the frontend. Expenses are separate records; order payment amounts remain aggregates, not an immutable payment event ledger. The API has no business membership model, staff roles, backups, rate limit, payment gateway or message delivery. Apply the Simamia OAuth client migration in Camel Accounts before account signup is enabled.

## 7. Production readiness checklist

Before using real records:

- Add business memberships, staff roles, audit events, abuse/rate controls and secure secrets management to the authenticated API.
- Replace the local SQLite demo store with a backed-up tenant-scoped relational store; define schema migrations, retention/deletion, exports, restore testing and incident response.
- Complete business/workspace authorization and enforce staff permissions server-side.
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
