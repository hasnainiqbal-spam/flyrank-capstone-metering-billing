const Stripe = require('stripe');
require('dotenv').config();

// No real Stripe account needed — this key is never used to make live API
// calls in this setup. It's required by the SDK constructor but stays unused
// for actual network requests since we're mocking checkout and generating
// webhook events locally.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_offline_use');

module.exports = stripe;