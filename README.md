# Usage Metering & Billing Engine

A backend service that meters usage, enforces plan quotas, calculates AI-token-aware
costs, and syncs subscription state with Stripe via signature-verified, idempotent
webhooks.

## What it does
- **Metering**: records billable actions (API calls, AI tokens) with exactly-once
  guarantees via idempotency keys.
- **Quota enforcement**: checks usage against plan limits before allowing an action;
  returns 402 (Free plan, must upgrade) or 429 (Pro plan, rate exceeded) with a clear
  message when over quota.
- **Cost calculation**: converts usage into cost, correctly handling AI token pricing
  rules (cached input is cheaper, reasoning tokens bill as output, categories are
  never simply summed at the same rate).
- **Stripe subscription sync**: Checkout session creation and webhook handling for
  `checkout.session.completed`, `customer.subscription.updated`, and
  `customer.subscription.deleted`.

## Architecture
Client → POST /generate (Idempotency-Key header)
→ Quota check (services/quota.js) → 402/429 if over limit
→ Meter service (services/meter.js) → INSERT ... ON CONFLICT DO NOTHING
→ duplicate key? return original event
→ else store new usage_event
→ Cost calculated (services/cost.js) → response

GET /usage → rollup usage_events for current month → { used, limit, cost_cents }

POST /checkout → creates a Checkout session (mocked, see note below)

Stripe → POST /webhooks/stripe
→ verify signature (invalid → 400)
→ dedup via processed_webhook_events (replay → no-op)
→ update tenant plan / subscription_status


## Stack
Node.js + Express, PostgreSQL (via Docker), Stripe SDK (used for real signature
verification; see note below).

## Important note on Stripe
**Stripe does not support account creation from Pakistan.** This was confirmed via
the FlyRank community, which approved continuing with this capstone using mocked
Stripe fixtures: *"you can continue with this capstone using the SDK with
mocked/test fixtures."*

As a result:
- Checkout session creation (`POST /checkout`) returns a mocked session object in the
  exact shape Stripe's real API would return.
- Webhook events are generated locally using Stripe's own
  `stripe.webhooks.generateTestHeaderString()` utility, which produces a real,
  validly-signed webhook exactly as Stripe's servers would.
- **Signature verification and event deduplication logic are fully real** — the
  `stripe.webhooks.constructEvent()` call in `routes/webhooks.js` is the same code
  that would run against a live Stripe account. Only the event *source* is simulated.

See `test-webhook.js` and `test-forged-webhook.js` for the scripts used to generate
and send test events, and `EVIDENCE.md` for proof this works end-to-end (signature
verification, dedup, and forged-signature rejection).

## Setup — run on a clean machine

**Prerequisites:** Node.js, Docker Desktop (with virtualization enabled).

1. Clone the repo and install dependencies:

npm install

2. Copy `.env.example` to `.env` and adjust values if needed:

cp .env.example .env

3. Start Postgres:

docker compose up -d

4. Run the schema migration:

docker exec -it flyrank-capstone-metering-billing-db-1 psql -U postgres -d billing -f /dev/stdin < migrations/001_init.sql

   (or open a `psql` session and paste the file contents manually)
5. Seed a test tenant:

docker exec -it flyrank-capstone-metering-billing-db-1 psql -U postgres -d billing -c "INSERT INTO tenants (name, plan) VALUES ('Test Tenant', 'free');"

6. Start the server:

npm start

7. Test the flow — see `EVIDENCE.md` for exact commands used to prove idempotency,
   quota enforcement, Stripe sync, and cost calculation.

## Limitations
- No real Stripe account (Pakistan is unsupported by Stripe) — Checkout and events
  are mocked as described above, but verification/dedup logic is production-real.
- No invoicing, proration, or overage billing — explicitly out of core scope
  per the capstone brief (Section 7).
- Pricing constants are illustrative, not tied to any specific real provider's
  current published rates.
- No automated test suite (Jest/Supertest were installed but manual curl/script-based
  testing was used instead, documented in EVIDENCE.md).