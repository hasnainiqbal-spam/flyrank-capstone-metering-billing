# EVIDENCE.md

## Requirement: Idempotent metering (Probe 1)

Same request sent twice with `Idempotency-Key: test-key-001`.

**First call** — creates a new usage event:
(paste your first ConvertTo-Json output here, or the earlier one showing the created event with `duplicate: false`)

**Second call (identical request)** — returns the same event, no duplicate created:
{
  "event": {
    "id": "c64a7dda-3fd4-45e3-a6c4-3b...",
    "idempotency_key": "test-key-001",
    "metadata": {},
    "created_at": "2026-08-30T18:28:53.346Z"
  },
  "duplicate": true
}

This confirms the `UNIQUE (tenant_id, idempotency_key)` database constraint prevents
double-counting on retried requests.

## Requirement: Quota enforcement (Probe 2)

Sent a request exceeding the Free plan's AI token limit (100,000) in a single call.

Request: POST /generate, type=ai_tokens, quantity=200000, tenant on Free plan.

Response:
Status: 402
Body: {"error":"Quota exceeded: 0/100000 ai_tokens used this month"}

Rule implemented: Free-plan tenants at/over quota get 402 (Payment Required — must
upgrade). Paid-plan tenants at/over quota would get 429 (Too Many Requests — retry
later), per services/quota.js.

## Requirement: Stripe integration (Probes 3 & 4)

**Note:** Stripe does not support account creation from Pakistan (confirmed via
FlyRank community: "you can continue with this capstone using the SDK with
mocked/test fixtures"). All signature verification and deduplication logic below
is real and uses Stripe's actual SDK; only the event source (a live Stripe account)
is mocked/generated locally via `stripe.webhooks.generateTestHeaderString()`.

### Probe 3 — Checkout → webhook → plan upgrade
Sent a signed `checkout.session.completed` event via `test-webhook.js`.

Response: Status 200, `{"received":true}`

Verified in DB:
| id | plan | stripe_customer_id | stripe_subscription_id | subscription_status |
|---|---|---|---|---|
| 29db8fb6... | pro | cus_mock_abc123 | sub_mock_xyz789 | active |

Tenant correctly flipped from Free to Pro.

### Probe 4a — Duplicate event replay
Sent the identical event ID twice.

First call:

## Requirement: Cost calculation (Probe 5)

Sent an ai_tokens event: input=5000, cached_input=2000, output=2000, reasoning=1000.

Hand-calculated expected cost using pinned pricing constants
(config/pricing.js: input=$0.0005/1k, cached_input=$0.00025/1k, output=$0.0015/1k,
reasoning billed as output):
- input: 5000/1000 × $0.0005 = $0.0025
- cached_input: 2000/1000 × $0.00025 = $0.0005
- output+reasoning: 3000/1000 × $0.0015 = $0.0045
- Total: $0.0075 → rounds to 1 cent

GET /usage response:
{
  "used": {"api_call": 1, "ai_tokens": 10000},
  "cost_cents": 2
}

2 cents = 1 cent (earlier API call) + 1 cent (this AI token event), confirming the
pricing engine matches hand-calculated totals and correctly treats reasoning tokens
as output-rate tokens rather than a separate category.