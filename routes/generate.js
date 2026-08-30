const express = require('express');
const router = express.Router();
const { checkQuota } = require('../services/quota');
const { recordUsage } = require('../services/meter');

router.post('/generate', async (req, res) => {
  const { tenant_id, type, quantity, metadata } = req.body;
  const idempotencyKey = req.headers['idempotency-key'];

  if (!tenant_id || !type || !quantity) {
    return res.status(400).json({ error: 'tenant_id, type, and quantity are required' });
  }
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header is required' });
  }
  if (!['api_call', 'ai_tokens'].includes(type)) {
    return res.status(400).json({ error: 'type must be api_call or ai_tokens' });
  }

  try {
    const quota = await checkQuota(tenant_id, type, quantity);
    if (!quota.allowed) {
      return res.status(quota.code).json({ error: quota.message });
    }

    const result = await recordUsage(tenant_id, type, quantity, idempotencyKey, metadata || {});
    return res.status(result.duplicate ? 200 : 201).json({
      event: result.event,
      duplicate: result.duplicate
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;