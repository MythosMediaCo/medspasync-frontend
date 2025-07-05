const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const VALID_PRICE_IDS = [
  'price_1RXX7SFT2t8OlDeTE7ktphka',
  'price_1RXXM9FT2t8OlDeT3ntv0wp0'
];

async function createCheckoutSession({ priceId, customerEmail, metadata = {} }) {
  if (!priceId || !VALID_PRICE_IDS.includes(priceId)) {
    throw new Error('Invalid price ID');
  }

  const planType = priceId === 'price_1RXX7SFT2t8OlDeTE7ktphka' ? 'core' : 'professional';
  const sessionParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    metadata: { plan_type: planType, source: 'demo', ...metadata }
  };

  if (customerEmail) sessionParams.customer_email = customerEmail;

  if (process.env.ENABLE_TRIAL === 'true') {
    sessionParams.subscription_data = {
      trial_period_days: parseInt(process.env.TRIAL_DAYS || '14'),
      metadata: { plan_type: planType }
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { url: session.url, sessionId: session.id };
}

async function getCheckoutStatus(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session.subscription) {
    throw new Error('Subscription not found');
  }
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  return {
    status: subscription.status,
    planType: subscription.metadata.plan_type,
    currentPeriodEnd: subscription.current_period_end,
    trialEnd: subscription.trial_end
  };
}

function verifyWebhookSignature(payload, signature) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
}

async function handleWebhook(event) {
  try {
    const { handleStripeWebhook } = require('../controllers/subscriptionController');
    await handleStripeWebhook(event);
  } catch (err) {
    console.warn('Webhook handler not executed:', err.message);
  }
}

module.exports = {
  createCheckoutSession,
  getCheckoutStatus,
  verifyWebhookSignature,
  handleWebhook
};
