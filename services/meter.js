const pool = require('../db');

async function recordUsage(tenantId, type, quantity, idempotencyKey, metadata = {}) {
  const insert = await pool.query(
    `INSERT INTO usage_events (tenant_id, type, quantity, idempotency_key, metadata)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
     RETURNING *`,
    [tenantId, type, quantity, idempotencyKey, metadata]
  );

  if (insert.rows.length > 0) {
    return { event: insert.rows[0], duplicate: false };
  }

  const existing = await pool.query(
    `SELECT * FROM usage_events WHERE tenant_id = $1 AND idempotency_key = $2`,
    [tenantId, idempotencyKey]
  );
  return { event: existing.rows[0], duplicate: true };
}

module.exports = { recordUsage };