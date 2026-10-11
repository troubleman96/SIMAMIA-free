# Provider Integration Guide

**MVP status:** no provider connector or credential is configured. Nothing on the public preview sends SMS/email or makes an AI request. The integration page shows documentation links and a disconnected status only.

## At a glance

| Capability | Service | Public API | Authentication | Primary action |
| --- | --- | --- | --- | --- |
| SMS | [SendAfrica docs](https://docs.sendafrica.online) | `https://api.sendafrica.online/v1` | `X-API-Key` | `POST /sms/` |
| Transactional email | [MailAfrica docs](https://docs.mailafrica.online) | `https://api.mailafrica.online` | `X-API-Key` | `POST /api/outbound/emails` |
| AI assistant | [Ngamia docs](https://docs.ngamia.cc) | `https://api.ngamia.cc/v1` | `Authorization: Bearer …` | `POST /chat/completions` |

Provider contracts, prices and limits can change. Check the linked live docs and account configuration before implementation or enabling paid calls.

## SendAfrica — SMS

The current SendAfrica quickstart uses a server-side API key stored as `SENDAFRICA_API_KEY` and the account-scoped REST API:

```sh
curl -X POST https://api.sendafrica.online/v1/sms/ \
  -H "X-API-Key: $SENDAFRICA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"0712345678","message":"Your service booking is confirmed."}'
```

A successful response means the upstream route accepted the SMS, **not** that a handset received it. Consume and verify signed delivery webhooks to track final delivery. The docs state Tanzania local numbers are normalized automatically; still validate and store customer numbers consistently in the application. Do not message a customer solely because a phone number exists: store purpose/consent, honor opt-outs, use reviewed templates and keep an auditable message status.

References: [Getting started](https://docs.sendafrica.online/getting-started), [API overview](https://docs.sendafrica.online/api), [webhooks](https://docs.sendafrica.online/api/webhooks).

## MailAfrica — transactional email

Create and verify an account, then create an account-scoped API key; the quickstart says the plaintext key is displayed once. Store it as `MAILAFRICA_API_KEY` in a server-side secret store. Send using `X-API-Key`:

```sh
curl -X POST https://api.mailafrica.online/api/outbound/emails \
  -H "X-API-Key: $MAILAFRICA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":["customer@example.com"],"subject":"Booking confirmed","text_body":"We have confirmed your service booking."}'
```

Verify a sending domain and its SPF/DKIM/DMARC setup before using a custom sender. The current outbound guide describes wallet billing at 5 TZS per recipient, a limit of two emails per second, suppression handling and delivery-failure refunds. Treat these as provider-published figures that must be rechecked before launch; implement balance checks, bounce/complaint handling and suppression-list compliance. Do not represent a normal email or application ledger as a TRA fiscal receipt.

References: [Quickstart](https://docs.mailafrica.online/quickstart), [outbound email](https://docs.mailafrica.online/outbound), [webhooks](https://docs.mailafrica.online/webhooks), [compliance](https://docs.mailafrica.online/compliance).

## Ngamia — AI

Use a production API key beginning `ngm_…` on the server only. The endpoint is OpenAI-compatible. Discover the current models using `GET https://api.ngamia.cc/v1/models` rather than hard-coding a model or its price. Send chat requests to `POST https://api.ngamia.cc/v1/chat/completions`:

```sh
curl https://api.ngamia.cc/v1/chat/completions \
  -H "Authorization: Bearer $NGAMIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"<enabled-model-from-catalog>","messages":[{"role":"user","content":"Write a short booking reminder in simple Kiswahili."}]}'
```

Chat-completion responses/errors follow the OpenAI shape; several account, billing and activity routes use Ngamia’s own `{status, code, data, request_id}` envelope. Use the documented contract for each endpoint. Cost is based on usage and credits; add timeouts, token/output limits, user consent where appropriate, budget caps and retries with backoff. An assistant must not make payments, determine tax treatment, issue a fiscal receipt, or send customer messages without a human action.

References: [Introduction](https://docs.ngamia.cc/introduction), [Quickstart](https://docs.ngamia.cc/quickstart), [models](https://docs.ngamia.cc/models), [chat completions](https://docs.ngamia.cc/chat-completions), [security/data handling](https://docs.ngamia.cc/security).

## Production implementation checklist

1. Add each API key to the deployment secret store, not source control, browser bundles, `localStorage`, HTML, URLs or logs. Rotate and revoke keys on exposure.
2. Call provider APIs from the Go service (or another protected backend) after tenant, role, opt-in/opt-out and rate checks. Never trust client-supplied customer ownership or price values.
3. Validate and normalize addresses/phone numbers; escape or template outbound content; avoid unnecessary customer identifiers in AI prompts.
4. Record minimal provider reference, recipient, purpose, status, timestamps, consent and cost; redact request/response secrets and sensitive content.
5. Verify webhook signatures using provider guidance before trusting delivery/bounce events; make callbacks idempotent and tolerate duplicates/out-of-order delivery.
6. Test sandbox mode, insufficient balance, invalid destinations, suppression, timeout, duplicate callback, provider outage, retries and key rotation.
7. Review Tanzania privacy obligations and any cross-border processing with the business’s privacy/legal adviser before sending production personal data to a provider.

**Current state remains `Not connected` for all services.** These examples document a possible integration path; none has been executed from this preview.
