const http = require('http');

const payloadString = JSON.stringify({ id: 'evt_forged', type: 'checkout.session.completed', data: { object: {} } });

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/webhooks/stripe',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': 't=1234567890,v1=totallyfakeinvalidsignature',
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
