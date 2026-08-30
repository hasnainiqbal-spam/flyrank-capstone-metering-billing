const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mocked Stripe Checkout — Stripe is unavailable in Pakistan (confirmed by
// FlyRank), so this simulates the session Stripe would normally create.
// Real checkout.sessions.create() has this exact response shape.
router.post('/checkout', async (req, res) => {
  const { tenant_id } = req.body;
  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  const mockSession = {
    id: `cs_test_mock_${uuidv4()}`,
    url: `https://checkout.stripe.com/mock-session/${uuidv4()}`,
    client_reference_id: tenant_id,
    customer: `cus_mock_${uuidv4()}`,
    subscription: `sub_mock_${uuidv4()}`,
    mode: 'subscription',
    status: 'open'
  };

  res.json({ session: mockSession, note: 'Mocked Stripe Checkout session (Stripe unavailable in Pakistan, per FlyRank guidance)' });
});

module.exports = router;