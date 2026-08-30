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