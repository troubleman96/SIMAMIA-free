# Simamia vertical market and onboarding plan

**Purpose:** decide which service businesses Simamia should support, how to validate the first market, and how a business chooses its workflow during setup.

**Scope:** product and implementation plan only. This document does not change the app or its API.

**Evidence note:** market ratings and pilot economics in the supplied workbook are explicitly hypotheses, not survey results. Competitor feature and price descriptions below come from vendors' own pages and are evidence that an offer exists, not independent proof of customer count, quality, or willingness to pay.

## 1. Recommendation

Build one service-operations product with a stable shared engine and versioned vertical templates. The shared engine should cover customers, jobs or appointments, services, staff, payment events, outstanding balances, expenses, reminders, and daily close-out. A template should change labels, job fields, workflow states, defaults, and enabled modules; it must not fork the codebase or create a different product identity for every industry.

Do not ask a person to pick an industry inside the authentication form. Authenticate first, create or join a business workspace, then ask the workspace owner to choose a primary business type in a short first-run setup. This makes the choice belong to the business rather than the person. Save it on the workspace/business profile, allow an owner to change it later, and allow several service categories under one workspace.

For market discovery, compare **salons/barbershops, laundry/shoe care, and repair workshops** with real operators before committing to a pilot. The workbook's weighted scores favor salons (4.50), garages (4.10), landlords (4.05), and phone repair (3.90). However, the workbook's “Top 4” sheet orders phone repair third and landlords fourth, while its weighted scores put landlords third and phone repair fourth. Treat this as a hypothesis-ranking mismatch to fix before using the sheet as a decision tool.

Salons are the strongest initial *market hypothesis* for repeat use and message volume, but not an uncontested one. Tanzanian vendors already advertise salon products, and workshop software also exists. Laundry/shoe care is the strongest initial *execution hypothesis* because Simamia has already studied Shoe Cleaners and its receive → work → ready → collect journey maps closely to an order service platform. Select one pilot only after discovery. If no segment can produce five committed pilot businesses at an economically testable price, continue discovery rather than adding vertical-specific software.

## 2. What the workbook says—and what it cannot establish

The workbook contains five tabs: segment scores, a manually selected top four, cross-vertical requirements, a ten-shop SMS model, and strategy notes. Its score weights total 100%: establishment density 20%, repeat frequency 20%, operating/cash-leakage pain 20%, willingness to pay 15%, low competition 10%, and sales/regulatory ease 15%. The formulas calculate the weighted scores correctly from the provided inputs.

The workbook is useful as a structured set of assumptions. It does not contain an owner survey, competitor audit, count of buyers willing to pay, customer acquisition cost, churn, gross margin, or verified SMS rate. In particular, “almost no local competition” for salons is contradicted by current vendor offers. A score of 5 for salon density or low competition is therefore not a fact; it needs a source or an interview-based revision.

The National Bureau of Statistics and Zanzibar's OCGS counted 219,371 fixed-premise establishments in the 2023/24 Statistical Business Register, including 179,196 on Mainland Tanzania and 40,175 in Zanzibar. The register reports 25,935 establishments in Dar es Salaam. This is a useful top-level prospecting frame, not Simamia's addressable market: it is fixed-premise enumeration and does not measure software fit, purchasing authority, connectivity at the shop, or willingness to pay. The report lists 5,555 establishments in “other personal service activities,” which is a broad category, not a salon count; 659 in repair of computers and personal/household goods; and 9,905 in wholesale/retail trade and repair of motor vehicles/motorcycles. These category definitions are not one-to-one with the workbook segments. Extract the NBS table classifications before using them for TAM claims. [NBS/OCGS 2023/24 SBR report](https://www.nbs.go.tz/uploads/statistics/documents/en-1720549641-The_2023_24_Tanzania_Statistical_Business_Register_Report.pdf)

The national register is broad enough to justify testing a service-business product, but it cannot tell us that any particular segment is profitable. It also shows why fixed-premise totals should not be applied to mobile fundis, boda operators, or informal single-person businesses without additional sampling.

### Current competitive read

- **Salon/barber/spa:** Stawi Biz publicly advertises bookings, customer history, staff assignment, commission, stock, debt/credit, messaging, and TSh 15,000/25,000/35,000 monthly plans with SMS bundles. Other visible local offers include Zuristar and Duka365. These are direct category competition, so “almost none local” should be removed as a working assumption. Vendor-reported adoption and feature claims are unverified. [Stawi Biz product and pricing](https://stawibiz.co.tz/en/features/salon-management) · [Zuristar](https://zuristar.co.tz/) · [Duka365 salon product](https://duka365.tz/en/business/salon)
- **Garages/workshops:** JOPEX Automob advertises job cards, bookings, vehicle/customer history, invoices, parts catalogues, and multiple workshops; other offers include Tawala, Mosso, GarageBox, and Mekavo. Job-card software is not an empty category. [JOPEX Automob](https://www.jopex.co.tz/products/automob.html) · [Tawala workshops](https://tawala.co.tz/solutions/workshops)
- **Laundry/shoe care:** Hudhud and INTEKI advertise laundry workflows. This is not necessarily a crowded category, but it is also not proven to be competitor-free. Verify what shops currently use, how well those tools fit, and why they stop using them. [Hudhud laundry management](https://www.hudhud.co.tz/products/laundry-management-system) · [INTEKI laundry system](https://intekidigital.co.tz/systems/laundry-system/)
- **Phone/electronics repair:** the core job-ticket fit is good, but IMEI/serial capture, intake condition, parts by model, warranty terms, and repair approval are vertical-specific needs. Validate demand before enabling a generic “repair” template that lacks those functions.
- **Landlords/property managers:** recurring rent schedules, allocations, leases, units, deposits, meter charges, and arrears are a different product model from service jobs. The small “real estate” establishment category in the register is not a count of landlords or rental units. Treat property as a later adjacent product line, not a quick service template.

Do not position Simamia as “no competition.” Test a sharper promise: a short Swahili-first workflow that works on a shared shop phone, clearly shows who took a job and who recorded money, gives the owner a daily close-out, and sends useful customer updates through the company's communication products.

## 3. Who Simamia should serve

### Ideal customer profile for the shared engine

A good first customer has a physical or field-service team, repeat customer interactions, at least two people touching jobs or money, several daily jobs/appointments, status changes that customers ask about, and an owner who wants a reliable daily balance. A business is a weak initial fit when its central need is regulated clinical records, complex accounting, fleet telematics, inventory procurement, or long-running contracts with extensive dispatch rules.

### Long-term market coverage

| Priority | Segment | Why it fits the engine | Additional product work before a credible sale |
| --- | --- | --- | --- |
| Pilot candidates | Laundry, dry cleaning, shoe care | Intake, tag/reference, cleaning stages, ready notification, pickup/delivery, deposits and balances; closest to the Shoe Cleaners reference | Item/bag tags, multiple items per order, stain/damage photos and disclaimers, pickup/delivery, ready/collected state, per-item charges |
| Pilot candidates | Salons, barbers, spas, nail studios | High repeat intent, appointment/customer history, service-and-staff relationship, reminders | Walk-in queue and appointment calendar, chair/resource capacity, variable service duration, stylist commission, no-show/deposit policy, tips, product sales and stock |
| Pilot candidates | Phone/electronics repair | Clear ticket lifecycle and update loop; repair status reduces “is it ready?” calls | IMEI/serial, device model, intake condition/photos, quote approval, parts used, warranty and repeat repair |
| Later template | Garages, car wash, tyre, auto electrical | Job assignment, approvals, customer/asset history, reminders and high-value work | Vehicle/registration/VIN, odometer, inspection checklist, estimate approval, labour/parts ledger, supplier and parts inventory, service due reminders |
| Later template | Tailors/fashion houses | Fittings and milestones with deposits | Measurement profile with access controls, garment/item details, fitting calendar, fabric/trim, alteration rounds and due dates |
| Later template | Cleaning, pest control, fumigation, technicians | Quotes, repeat visits, teams in the field | Work locations, recurring service plan, route/dispatch, checklists, proof of work, quote acceptance and SLA |
| Later template | Event suppliers | Availability and deposits | Asset catalogue, quantity, date-range availability, delivery/collection, damage/late-return and double-booking controls |
| Separate discovery | Landlords/property managers | Rent reminders and maintenance could reuse contacts, ledger and messaging | Properties/units, leases, recurring charges, allocation, deposit/refund, meter readings, tenant/landlord roles and maintenance requests |
| Separate discovery | Boda/bajaji/daladala owner-operators | Accountability, recurring remittance and vehicle expenses | Vehicle/driver roster, shift/day, expected remittance, fuel, maintenance, mobile/route handling, offline close-out |
| Separate discovery | Gyms, driving schools, tuition centres | Repeat billing and reminders | Membership/term, attendance, class/vehicle schedules, guardian contacts, expiry and fee allocation |
| Defer | Clinics, dental, laboratories | Appointments and billing fit the surface model | Sensitive health data, clinical safety, retention, access, integrations and regulatory review create a distinctly higher launch burden |

“Can Simamia handle this?” should mean more than “can a user create a customer and order?” Define a segment as supported only when its critical workflow, field validation, roles, reports, reminders, offline behavior, migration/import, and customer-facing documents have been tested with businesses in that segment.

## 4. How vertical choice should work during signup

### Recommended sequence

1. User creates/authenticates an account using a low-friction method supported operationally in Tanzania. Do not require a shop type before identity authentication.
2. User creates a business workspace or accepts an invitation to an existing workspace.
3. Workspace owner chooses a primary template: **Laundry & shoe care**, **Salon & barber**, **Repair workshop**, **Field service**, **Other service business**. During closed pilot, only show templates actually supported; mark the rest “join pilot / coming later” rather than implying full functionality.
4. Ask two or three setup questions relevant to the chosen template (e.g. one branch or many, team size, booking versus walk-in, pickup/delivery) and prefill useful settings.
5. Let the owner review generated workflow states, services, payment methods and message preferences before saving.
6. Offer a sample workspace or import checklist; land on a first task such as “add your first service” or “create your first job.”

### Important behavior

- Store `primary_vertical`, enabled module flags, and `template_version` on the **business/workspace**, never as a user-level preference. A person may join multiple businesses with different verticals.
- Support one primary vertical plus configurable service categories. Do not make a salon and a car wash require separate accounts if they are genuinely run by one owner and staff.
- Offer “Other service business” and “skip for now.” Let the owner change the template or switch to a custom workflow later, with a preview of changed labels/fields and no silent deletion of existing data.
- Avoid presenting a false 14-industry selector at launch. The selection list is a product promise; show only supported workflows and explain the pilot boundary.
- Separate business type from legal form, registration status, country, location, language, currency, and payment methods. Do not use the industry choice to imply that a business is legally registered, tax compliant, or approved for a payment product.
- Consider asking “How did you hear about us?” and permission for service updates separately. Product setup is not marketing consent.

## 5. Target product architecture

### Shared domain model

Use explicit relational entities and durable events rather than the current generic JSON map as the production domain model:

1. **Workspace/business** — ID, owner, display/legal names, primary vertical, template version, timezone, currency, preferences, retention and fiscal configuration.
2. **Membership and role** — user, workspace, branch, role, permission grants, invited/active/revoked state, last activity. Enforce authorization in every server/API operation.
3. **Location/branch** — address, hours, timezone, service capacity and branch-scoped numbering.
4. **Customer** — identity/contact and preferred channel, consent/opt-out evidence, service history, privacy lifecycle.
5. **Service/product** — service catalog, price, duration, tax/fiscal code where applicable, active dates; separate sellable products and stock from labour.
6. **Job/appointment** — customer, location, scheduled time, lifecycle, assignment, quote, line items, notes, version, created-by and timestamps.
7. **Job line items** — service/product, quantity, unit price snapshot, discounts, tax, fulfilment state. Snapshot commercial values so later catalog edits do not rewrite an old invoice.
8. **Workflow template and status events** — configured labels and allowed transitions, plus immutable actor/time/from/to/reason events. Block invalid transitions server-side.
9. **Payment event ledger** — immutable payment attempts/collections, order allocations, currency, amount, channel/provider, reference, event/settlement timestamps, recorded-by, status, idempotency key, reversal/refund links. Derive due from posted, non-reversed allocations. Never overwrite a single `paid` number as the only financial record.
10. **Expense** — payee, category, date incurred/paid, method, receipt attachment, amount/tax, branch, notes, created-by and audit history.
11. **Cash close** — cashier/shift, opening float, expected versus counted cash by method, variances, approval, linked payment events and close event.
12. **Message/consent log** — purpose, template version, sender ID, recipient, consent basis, provider request ID, queued/sent/delivered/failed/opted-out events, retries, cost and redacted content.
13. **Audit event** — actor, workspace, target, action, timestamp, request/correlation ID and safe before/after changes for financial, identity and permission events.

Keep core fields typed and validated. Put infrequent vertical additions behind versioned, schema-validated extension fields or narrow extension tables. Do not put critical money, permissions, or workflow behavior in arbitrary unvalidated JSON.

### Workflow packs

Model a template as configuration plus capabilities: default statuses and allowed transitions; required intake fields; default roles; reminder triggers; invoice layout and vocabulary; report definitions; enabled modules; and optional domain extensions. Version and migrate templates; a template update must not re-label or mutate past transaction evidence.

Initial workflow examples:

- Laundry/shoe care: received → inspected/tagged → cleaning → quality check → ready → collected/delivered; branch for re-clean/damage/decline; multiple tagged items in one order.
- Salon/barber: request → confirmed → checked in → in service → checkout → completed; support walk-ins, waitlist, chair/resource constraints, cancellation/no-show, staff service attribution and commission calculation.
- Repair workshop: received → inspected → estimate pending → approved → repair → parts/hold → quality check → ready → collected; require serial/device/vehicle identifier and customer approval before chargeable work.

## 6. Implementation sequence

### Phase 0 — Verify the customer and pick a pilot (2–3 weeks)

- Recruit 10 owners each in salons/barbers, laundry/shoe care, and phone/electronics repair. Add garage operators only if access is readily available. Interview operators, cashiers and frontline staff separately.
- Observe a real shift. Record paper/WhatsApp artifacts, booking intake, status questions, payment/deposit handling, end-of-day reconciliation, missed messages, workarounds and data connectivity. Do not rely on “would you use it?” answers alone.
- Ask each owner to demonstrate the current workaround and quantify recent examples: jobs/day, walk-in/booking mix, repeat interval, deposits, partial/full cash/mobile money, no-shows, follow-up volume, leakage/variance, staff count, device/connectivity, and software currently paid for.
- Map the buying unit: owner, manager, receptionist/cashier, worker, accountant. Find who chooses, who pays, who changes behavior and who could block rollout.
- Test 2–3 value propositions and pricing with a concrete offer and paid/deposit commitment. Compare a simple monthly SaaS price with included SMS bundles plus transparent overage. Treat the workbook's TZS 15,000 and TZS 20/SMS as test values, not recommended final prices.
- Reconcile worksheet ranking: with the stated weights, landlord/property management ranks third and phone repair fourth; do not simply carry forward the manual “Top 4” order.
- Choose one pilot only by a pre-registered score: observed urgent pain, current workflow fit, weekly transaction frequency, reachable owner channel, competitor gap, onboarding effort, willingness to pay, message volume/margin, personal-data/regulatory burden, and implementation cost.

**Discovery gate:** continue only if at least five businesses commit to a pilot date and a test price, at least three show the core workflow repeatedly without coaching after setup, and the team can articulate a differentiating outcome against current tools. These are proposed decision rules, to be agreed before interviews.

### Phase 1 — Authentication, workspaces, and safe data boundaries

- Activate and verify the chosen authentication provider end to end. Clerk exists in dependencies/starter components, but the active root layout currently does not mount the Clerk provider; the Simamia page is a client-side demo shell and no active middleware/proxy protection was found in `src/app`.
- Implement owner signup, workspace creation, invitation acceptance, sign-in/out, session expiry and recovery. Make workspace selection distinct from login.
- Add server-side membership, role checks and workspace scoping to every API read/write; add organization/branch isolation tests and audit records before storing real customer details.
- Replace global CORS `*`, public writable API behavior, generic mock IDs, and browser-local business-data persistence as production mechanisms. Add schema migrations, backups, restore checks, rate limits, secret management, monitoring and request limits.
- Complete a data-flow map and PDPC/legal review. Names, phone numbers, job history and payment details are personal data. The Act states that a person shall not collect/process personal data without registration as controller or processor; confirm the applicable registration/role for Simamia and participating businesses. Assess cross-border transfers for hosting, Ngamia prompts, email/SMS vendors, logs, telemetry and backups. [Personal Data Protection Act, section 14](https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf) · [PDPC registration](https://pdpc.go.tz/services/registration/) · [PDPC cross-border transfer permit](https://pdpc.go.tz/services/cross-border-data-transfer-permit/)

### Phase 2 — Core operations for the selected vertical

- Replace order-shaped generic storage with customers, services, jobs, line items, assignments, status events and workflow rules.
- Make the daily task path fast on a phone: customer lookup/create → service/job intake → amount/deposit → assign → status update → completion/collection.
- Add searchable customer history, item/asset identifiers where the selected pilot requires them, quick actions, CSV import/export and simple opening data import.
- Implement role-based screens: owner, supervisor/cashier, service staff. A worker should see only the job and customer details needed to do assigned work.
- Provide visual order status and customer-facing update preview in Kiswahili/English. Keep wording and steps configurable by template.
- Instrument workflow completion with event analytics that avoid unnecessary personal information.

### Phase 3 — Money, debts, expenses, and close-out

- Turn the current aggregate paid amount into a transaction ledger with multiple payments per job, partial deposits, allocations, reversals/refunds, provider reference, actual received time, and actor.
- Show four distinct concepts: quoted/order value, invoiced value, collected/settled value by payment date, and outstanding balance as-of a chosen time. Never label a recorded manual method as provider-confirmed settlement.
- Add cash close by staff/shift and reconciliation difference; measure collections against jobs and expected cash. Exports must reconcile to source records.
- Keep expenses separate from payments; capture incurred date, paid date, category, payee, branch, receipt evidence, and actor. Call “collections minus recorded expenses” a cash movement summary, not profit.
- Keep a business invoice distinct from an approved fiscal receipt. Confirm each pilot's current TRA obligations and the route/qualification for an EFD/VFD integration before promising fiscal output. [TRA EFD Receipt API](https://virtual.tra.go.tz/efdmsRctApi/)
- For payment collection and reconciliation, integrate a licensed operator/PSP and use signed webhooks, idempotency, transaction lookup, refunds, settlement reports and exception queues. Keep settlement directed to the merchant until BoT/legal review confirms what Simamia itself may do; BoT regulates payment system services/products. [Bank of Tanzania payment-system laws and regulations](https://bot.go.tz/PaymentSystem/regulations?lang=en)

### Phase 4 — Reminders and SendAfrica demand loop

- Start with event-triggered service messages chosen by the business: booking accepted, reminder, status change/ready, overdue balance, repeat-service due. Provide a preview, schedule, language, recipient and purpose before enabling automation.
- Record opt-in/source/time/purpose and opt-out state; suppress opted-out and invalid numbers; rate-limit campaign sends; offer per-workspace spend caps and owner approval.
- Build sender-ID request workflow, approval status, rejection/retry instructions, message templates, test send, delivery callbacks, failed/retried events, cost report and searchable logs. TCRA's 2023 tele-traffic amendment requires licensees to manage A2P originators/sender IDs and map sender IDs to official company names; confirm the precise approval steps with SendAfrica and the operator/TCRA. [TCRA Tele-Traffic Amendment Regulations 2023](https://www.tcra.go.tz/uploads/documents/sw-1688028305-The%20Electronic%20and%20Postal%20Communications%20%28Tele-Traffic%29%20%28Amendment%29%20Regulations%2C%202023.pdf)
- Treat provider acceptance, SMS delivery, customer receipt and customer response as different events. Add templates and logs for support, and cost usage per workspace.
- Measure message volume per active shop and messages per completed job, but include delivery rate, opt-out, gross margin, variable provider cost and effect on job completion. SMS volume alone is not product-market fit.

### Phase 5 — Offline-first field/shop use

- Pilot on real low-connectivity devices before claiming offline support. Tanzania has strong mobile-money and mobile connectivity adoption at the aggregate level, but national SIM/subscription figures do not prove reliable connectivity inside a particular shop. BoT reported 75.78 million active mobile-money subscriptions in 2025; subscriptions are not unique customers. [BoT National Payment Systems Annual Report 2025](https://www.bot.go.tz/Publications/Regular/Annual%20Report/en/2026060211494565.pdf)
- Build an installable PWA with an encrypted/local IndexedDB queue for explicitly supported operations, local client-generated IDs, retry/backoff, idempotency, visible sync state and server acknowledgements. Avoid silent last-write-wins for payment, status, price, consent or inventory conflicts.
- Define conflicts per entity: preserve append-only financial events; require user resolution for conflicting job edits; allow duplicate-safe customer creation via normalized contacts only with review; never announce a customer update until it has synced and provider accepted it.
- Provide a safe shared-device sign-out/lock experience, local-data expiry, and a clear warning about unsynced work when signing out or changing workspaces.

### Phase 6 — AI via Ngamia and expansion to more templates

- Start with an owner-only assistant that answers grounded questions from workspace-authorized metrics and records, cites the underlying time period/source data, and proposes but does not execute actions.
- Exclude health/clinical records and sensitive customer notes from prompts unless separately approved and legally assessed. Minimize identifiers and define retention/training behavior with the provider.
- Add tool permissions, audit trail, confirmation for customer messaging, spending/cash changes, refunds, schedule changes and bulk operations; refuse cross-workspace retrieval.
- Add one vertical template at a time only after the shared workflow and extension mechanism can represent its demonstrated needs. Consider garages after salons/laundry; treat landlords, transport remittance, education and clinics as separate discovery tracks.

## 7. Reports and operating measures

Reports should be derived from auditable source records and always show workspace/location, date range/timezone, definition, currency, comparison basis and last updated time. Include:

- Jobs created/completed/cancelled, average time in each state, rework/return rate, on-time completion, and repeat customers.
- Bookings, walk-in share, no-shows and utilization for appointment templates.
- Sales/invoice value by job and service, discounts/refunds, and customer balance ageing.
- Collections by *payment received/settled date* and method, matched versus unmatched payment references, reversals and close-out variance.
- Expenses by incurred/paid date, payee, category and branch.
- Message queued/sent/delivered/failed/opted out, cost, delivery latency and jobs completed after reminder.
- Staff jobs, collections attributed, commission due and approved payouts—without presenting this as payroll unless the product actually calculates payroll lawfully.

Pilot scorecard (agree target numbers before launch): time to first useful job; first-week activation; weekly active workspaces; share of real jobs captured; share of balances matched to payment events; daily cash variance; time saved/status calls avoided; SMS volume and unit margin; retention after free support ends; owners willing to renew at a tested price; support time per shop; offline sync failure/conflict rate.

## 8. Pricing experiment

The workbook models 10 shops × 15 jobs per day × 26 days × 2 SMS = 7,800 messages/month. At its placeholder TZS 20 per SMS, that is TZS 156,000 of gross message charges and TZS 150,000 at TZS 15,000/month software per shop, for TZS 306,000 gross monthly billings in total. This arithmetic is correct, but it is not gross profit or validated demand. It omits opt-outs, message failure, provider rate tiers, support, tax, onboarding, free bundles, unused allotments, marketing consent, gateway fees and the possibility that a shop does not send two messages per job.

Test transparent packaging with actual shops: a basic workspace fee with core records and exports; a higher tier with multi-user controls/automations; and messaging sold in visible bundles or metered usage with a clear cap. Compare perceived value and renewal, not only preferred price. Do not make message markup the sole business model; keep software value visible. Avoid a per-payment “collection fee” until licensing, PSP contract, reconciliation, settlement, refunds and merchant economics are validated.

## 9. Pilot design and decision gates

Run discovery with 10 owners in each of the three candidate segments (30 conversations) using the same interview script, then observe at least three full operating shifts in the leading segment. Test prototype workflows with the owner plus the person who handles the till/job intake. Recruit five or more design partners and set a price test before build scope expands.

Run a 4–6 week assisted pilot with weekly review. First baseline each shop's jobs, visits, cash/mobile money mix, no-show/return rate, message usage, time spent on records, current software spend, and close-out variance. Train with the owner's real workflow but synthetic or properly governed data. Track support burden separately from product use.

Suggested continue/change/stop rules (hypotheses to set with the team before pilot):

- **Continue** if at least 7/10 pilot businesses remain weekly active by week four, most jobs are being recorded, key users can complete intake/status/collection without founder help, money records reconcile, and a majority accept the paid offer.
- **Change the workflow or vertical** if users return but repeatedly work around a missing critical field/status, messages are useful but job capture is not, or onboarding takes more than one short assisted session.
- **Stop or re-scope** if owners do not invite staff, do not enter real jobs after onboarding, cannot identify a recurring pain worth paying to fix, or the economics require unsustainable free SMS/support.

Report denominators and cohort dates. Ten owners can reject a weak hypothesis or expose obvious workflow gaps, but cannot establish national market size or stable retention rates.

## 10. Current Simamia readiness

Current code already sketches the shared shell: orders/customers/services/team, status workflow, schedule, payment balances, invoice printing, debts calculated from balances, expenses, reports, draft messaging, local helper and provider links. The API currently stores JSON records for supported resource collections in SQLite and the UI connects directly to it when reachable.

The active page remains a single large client component in `src/app/simamia.tsx`; data types have one order with one service and an aggregate `paid` amount; the Go API is an unauthenticated generic record store; payment events are not immutable; there is no workspace/tenant isolation, real sender/payment/AI provider execution, robust offline sync, or production import/backup lifecycle. Clerk and template provider code exist elsewhere in the starter, but this app's active root layout does not install ClerkProvider and the current root route has no auth boundary. Therefore the present app can demonstrate a generic service-job concept, but should not claim it is ready to onboard real businesses across all listed segments.

Recommended order of work: validate the segment → activate auth/workspaces and safe API boundaries → formalize shared job/payment/expense domain → ship one pilot template → prove onboarding, retention and payment/message economics → extend templates based on measured overlap.

## 11. Sources and caveats

- NBS/OCGS, [2023/24 Tanzania Statistical Business Register Census report](https://www.nbs.go.tz/uploads/statistics/documents/en-1720549641-The_2023_24_Tanzania_Statistical_Business_Register_Report.pdf)
- Bank of Tanzania, [National Payment Systems Annual Report 2025](https://www.bot.go.tz/Publications/Regular/Annual%20Report/en/2026060211494565.pdf) and [payment-system regulations](https://bot.go.tz/PaymentSystem/regulations?lang=en)
- PDPC, [Personal Data Protection Act](https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf), [registration](https://pdpc.go.tz/services/registration/), and [cross-border transfer permits](https://pdpc.go.tz/services/cross-border-data-transfer-permit/)
- TCRA, [Electronic and Postal Communications (Tele-Traffic) (Amendment) Regulations, 2023](https://www.tcra.go.tz/uploads/documents/sw-1688028305-The%20Electronic%20and%20Postal%20Communications%20%28Tele-Traffic%29%20%28Amendment%29%20Regulations%2C%202023.pdf)
- TRA, [EFD Receipt API](https://virtual.tra.go.tz/efdmsRctApi/)
- Vendor product pages cited in Section 2. They document marketing claims/features and advertised prices only; verify all claims through product trials and owner interviews.

Legal and payment notes are product-planning flags, not legal advice. Confirm current requirements with PDPC, TRA, BoT/licensed PSPs, TCRA/operators and Tanzanian counsel before launch.
