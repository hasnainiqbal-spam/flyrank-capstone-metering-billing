require('dotenv').config();
const stripe = require('./config/stripe');
const http = require('http');

const TENANT_ID = '29db8fb6-9bea-40f2-a88a-f03a4d47d073';

const payload = {
  id: `evt_mock_fixed_test_id`,
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: `cs_test_mock_123`,
      object: 'checkout.session',
      client_reference_id: TENANT_ID,
      customer: `cus_mock_abc123`,
      subscription: `sub_mock_xyz789`,
      mode: 'subscription',
      status: 'complete'
    }
  }
};

const payloadString = JSON.stringify(payload);
const secret = process.env.STRIPE_WEBHOOK_SECRET;

const header = stripe.webhooks.generateTestHeaderString({
  payload: payloadString,
  secret: secret
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/webhooks/stripe',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': header,
    'Content-Length': Buffer.byteLength(payloadString)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.write(payloadString);
req.end();