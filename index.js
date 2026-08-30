require('dotenv').config();
const express = require('express');
const generateRoute = require('./routes/generate');
const checkoutRoute = require('./routes/checkout');
const webhookRoute = require('./routes/webhooks');
const usageRoute = require('./routes/usage');

const app = express();

// IMPORTANT: webhook route must come BEFORE express.json(), because it needs
// the raw request body for Stripe signature verification.
app.use('/', webhookRoute);

app.use(express.json());
app.use('/', generateRoute);
app.use('/', checkoutRoute);
app.use('/', usageRoute);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));