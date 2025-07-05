// middleware/verifySubscription.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Practice = require('../models/Practice');

module.exports = async function verifySubscription(req, res, next) {
  try {
    const { practiceId } = req.user;

    if (!practiceId) {
      return res.status(403).json({ success: false, message: 'No practiceId found on user.' });
    }

    const practice = await Practice.findOne({ practiceId });

    if (!practice || !practice.billing || !practice.billing.customerId) {
      return res.status(403).json({ success: false, message: 'Practice subscription not found.' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: practice.billing.customerId,
      status: 'active',
      expand: ['data.plan.product'],
    });

    if (!subscriptions.data.length) {
      return res.status(403).json({ success: false, message: 'No active subscription found.' });
    }

    const activeSubscription = subscriptions.data[0];
    const stripeProductId = activeSubscription.items.data[0].price.product;

    // Attach tier to request for later feature gating
    if (stripeProductId === process.env.STRIPE_PRODUCT_CORE) {
      req.subscriptionTier = 'core';
      req.user.planType = 'core';
    } else if (stripeProductId === process.env.STRIPE_PRODUCT_PRO) {
      req.subscriptionTier = 'pro';
      req.user.planType = 'professional';
    } else {
      return res.status(403).json({ success: false, message: 'Unknown subscription tier.' });
    }

    next();
  } catch (err) {
    console.error('❌ Subscription verification error:', err.message);
    return res.status(500).json({ success: false, message: 'Subscription check failed.' });
  }
};
