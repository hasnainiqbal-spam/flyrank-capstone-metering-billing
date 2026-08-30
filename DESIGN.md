# Design Doc — Usage Metering & Billing Engine

## Problem
Every SaaS needs to answer three questions: how much has a customer used, what should
they be charged, and have they hit their plan's limits? This service meters usage,
enforces quotas, calculates cost (including AI token pricing rules), and syncs
subscription state with Stripe via signature-verified, idempotent webhooks.

## Data model
- **tenants** — one row per customer org; tracks current plan and Stripe subscription state.
- **plans** — static table of plan limits (Free / Pro), API call and AI token quotas.
- **usage_events** — one row per billable action; the `UNIQUE (tenant_id, idempotency_key)`
  constraint is what guarantees exactly-once metering.
- **processed_webhook_events** — tracks Stripe event IDs already handled, preventing
  duplicate processing on webhook replay.

## API surface
| Method | Path | Purpose |
|---|---|---|
| POST | /generate | Dummy billable action — records usage, checks quota, returns cost |
| GET | /usage | Rollup: used, limit, cost for the current month |
| POST | /checkout | Create a Stripe Checkout session for Pro upgrade |
| POST | /webhooks/stripe | Stripe webhook receiver |

## Idempotency strategy
Clients send an `Idempotency-Key` header on `POST /generate`. The server attempts an
`INSERT ... ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`. If no row is returned,
the request is a duplicate — the original event is fetched and returned instead of
recording a new one. This pushes the exactly-once guarantee down to the database
constraint itself, rather than relying on application-level locking.

## Non-goal
Proration, invoicing, and overage billing are explicitly out of scope for the core
build — these are optional stretch goals only after all core requirements are complete.

## Note on Stripe
Stripe does not support account creation from Pakistan. Per confirmed FlyRank guidance,
this capstone uses the `stripe` SDK's offline signature-generation utilities and mocked
checkout/webhook fixtures instead of a live test account. Signature verification and
event-deduplication logic are fully real; only the event source is simulated.