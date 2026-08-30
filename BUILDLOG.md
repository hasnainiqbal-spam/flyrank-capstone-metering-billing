# Build Log

Honest log of where AI assistance helped, where it needed correction, and what I
changed — per the capstone's "AI-assisted building is encouraged — and owned" rule.

## Design phase
- Used AI (Claude) to help design the schema and idempotency strategy. The core
  insight — using a `UNIQUE (tenant_id, idempotency_key)` database constraint instead
  of application-level locking — was AI-suggested; I understood and can explain why
  this pushes the exactly-once guarantee to the database layer, which is more
  reliable than a check-then-insert race in application code.

## Environment setup
- Hit a real blocker: Docker Desktop failed with "Virtualization support not
  detected." Fixed by enabling Intel VT-x in BIOS on my Lenovo L380.
- Hit a second blocker: a pre-existing local PostgreSQL 18 Windows service was
  already bound to port 5432, so my Dockerized Postgres was silently being bypassed
  and Node was connecting to the wrong database, causing password authentication
  errors. Diagnosed by checking `Get-Service *postgres*` and fixed by remapping
  Docker's Postgres to port 5433 instead of removing my existing local install.

## Stripe integration
- Discovered Stripe does not support Pakistan-based accounts. Asked in the FlyRank
  community and got explicit approval to proceed using SDK-based mocked fixtures
  instead of switching capstones.
- AI helped write `test-webhook.js`, which uses Stripe's own
  `generateTestHeaderString()` utility to produce a validly-signed webhook payload
  offline. I verified this actually works by confirming my server's
  `stripe.webhooks.constructEvent()` call — the same verification code that runs
  against real Stripe webhooks — correctly accepted the signature and correctly
  rejected a forged one (see EVIDENCE.md).
- I made sure the webhook route is mounted with `express.raw()` before
  `express.json()` is applied globally — AI flagged this as a common bug (Stripe
  needs the raw body for signature verification), and I confirmed by testing that
  moving the route after `express.json()` would have broken verification.

## Cost calculation
- Worked through the AI token pricing rules manually (cached input cheaper,
  reasoning billed as output, not summed as its own category) and hand-verified the
  math against my `/usage` endpoint's output before trusting the code — documented
  in EVIDENCE.md.

## What I can explain if asked
- Why the unique constraint approach for idempotency is safer than a
  select-then-insert approach (avoids race conditions under concurrent retries).
- Why the webhook route must see the raw request body, not JSON-parsed.
- The difference between 402 and 429 in my quota logic and why I chose to key that
  decision off the tenant's current plan.