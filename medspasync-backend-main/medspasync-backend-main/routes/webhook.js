const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const User = require('../models/User'); // replace with your actual user model

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe requires raw body parsing for signature verification
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout session completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const email = session.customer_email;
    const priceId = session?.display_items?.[0]?.price?.id || session?.line_items?.[0]?.price?.id;

    const tier = (priceId === process.env.STRIPE_PRODUCT_PRO) ? 'professional' : 'core';

    try {
      const user = await User.findOneAndUpdate(
        { email },
        {
          email,
          subscriptionStatus: 'active',
          tier,
          stripeCustomerId: session.customer
        },
        { upsert: true, new: true }
      );

      console.log('✅ User subscription updated:', user.email, tier);
    } catch (err) {
      console.error('❌ Failed to update user:', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;
