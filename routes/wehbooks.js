const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const pool = require('../db');

router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  // Deduplicate — if we've already processed this event ID, no-op
  const dedup = await pool.query(
    `INSERT INTO processed_webhook_events (stripe_event_id) VALUES ($1)
     ON CONFLICT DO NOTHING RETURNING *`,
    [event.id]
  );
  if (dedup.rows.length === 0) {
    return res.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await pool.query(
          `UPDATE tenants SET plan = 'pro', stripe_customer_id = $1, stripe_subscription_id = $2, subscription_status = 'active'
           WHERE id = $3`,
          [session.customer, session.subscription, session.client_reference_id]
        );
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await pool.query(
          `UPDATE tenants SET subscription_status = $1 WHERE stripe_subscription_id = $2`,
          [sub.status, sub.id]
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await pool.query(
          `UPDATE tenants SET plan = 'free', subscription_status = 'canceled' WHERE stripe_subscription_id = $1`,
          [sub.id]
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;