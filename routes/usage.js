const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getTenant, getPlan, sumUsageThisMonth } = require('../services/quota');
const { calculateEventCost } = require('../services/cost');

router.get('/usage', async (req, res) => {
  const { tenant_id } = req.query;
  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id query param is required' });
  }

  const tenant = await getTenant(tenant_id);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const plan = await getPlan(tenant.plan);

  const eventsResult = await pool.query(
    `SELECT * FROM usage_events WHERE tenant_id = $1 AND created_at >= date_trunc('month', now())`,
    [tenant_id]
  );

  const apiCallsUsed = await sumUsageThisMonth(tenant_id, 'api_call');
  const aiTokensUsed = await sumUsageThisMonth(tenant_id, 'ai_tokens');

  const totalCostCents = eventsResult.rows.reduce(
    (sum, event) => sum + calculateEventCost(event), 0
  );

  res.json({
    tenant_id,
    plan: tenant.plan,
    used: { api_call: apiCallsUsed, ai_tokens: aiTokensUsed },
    limit: { api_call: plan.api_call_limit, ai_tokens: plan.ai_token_limit },
    cost_cents: totalCostCents
  });
});

module.exports = router;