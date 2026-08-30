const pool = require('../db');

async function getTenant(tenantId) {
  const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
  return result.rows[0];
}

async function getPlan(planName) {
  const result = await pool.query('SELECT * FROM plans WHERE name = $1', [planName]);
  return result.rows[0];
}

async function sumUsageThisMonth(tenantId, type) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(quantity), 0) AS total
     FROM usage_events
     WHERE tenant_id = $1 AND type = $2
     AND created_at >= date_trunc('month', now())`,
    [tenantId, type]
  );
  return parseInt(result.rows[0].total, 10);
}

async function checkQuota(tenantId, type, requestedQty) {
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    return { allowed: false, code: 404, message: 'Tenant not found' };
  }

  const plan = await getPlan(tenant.plan);
  const currentUsage = await sumUsageThisMonth(tenantId, type);
  const limit = type === 'api_call' ? plan.api_call_limit : plan.ai_token_limit;

  if (currentUsage + requestedQty > limit) {
    // Free plan at ceiling -> must upgrade (402). Paid plan at ceiling -> rate/quota exceeded (429).
    const code = tenant.plan === 'free' ? 402 : 429;
    return {
      allowed: false,
      code,
      message: `Quota exceeded: ${currentUsage}/${limit} ${type} used this month`
    };
  }

  return { allowed: true };
}

module.exports = { checkQuota, getTenant, getPlan, sumUsageThisMonth };