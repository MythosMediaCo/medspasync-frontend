const Stripe = require('stripe');
const User = require('../models/User');
const Practice = require('../models/Practice');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Handle Stripe webhook events for subscription management
 * @param {Object} event - Stripe webhook event
 */
async function handleStripeWebhook(event) {
  console.log('🔄 Processing webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log('📝 Unhandled webhook event type:', event.type);
    }
    
    console.log('✅ Webhook event processed successfully:', event.type);
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    throw error;
  }
}

/**
 * Handle checkout session completion
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('💰 Processing checkout completion for session:', session.id);
  
  const email = session.customer_email;
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  
  if (!email || !subscriptionId) {
    console.warn('⚠️ Missing email or subscription in checkout session');
    return;
  }

  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;
    
    // Determine plan type
    const planType = priceId === 'price_1RXX7SFT2t8OlDeTE7ktphka' ? 'core' : 'professional';
    
    // Update or create user
    const userUpdate = {
      email,
      subscriptionStatus: 'active',
      subscriptionTier: planType,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStartDate: new Date(subscription.current_period_start * 1000),
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    };

    const user = await User.findOneAndUpdate(
      { email },
      userUpdate,
      { upsert: true, new: true }
    );

    console.log('✅ User subscription updated:', {
      email: user.email,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus
    });

  } catch (error) {
    console.error('❌ Failed to process checkout completion:', error);
    throw error;
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription) {
  console.log('📦 Processing subscription creation:', subscription.id);
  
  try {
    const customerId = subscription.customer;
    const priceId = subscription.items.data[0].price.id;
    const planType = priceId === 'price_1RXX7SFT2t8OlDeTE7ktphka' ? 'core' : 'professional';
    
    // Update user if exists
    await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      {
        subscriptionStatus: subscription.status,
        subscriptionTier: planType,
        stripeSubscriptionId: subscription.id,
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      }
    );
    
    console.log('✅ Subscription created for customer:', customerId);
  } catch (error) {
    console.error('❌ Failed to process subscription creation:', error);
    throw error;
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Processing subscription update:', subscription.id);
  
  try {
    const customerId = subscription.customer;
    const priceId = subscription.items.data[0].price.id;
    const planType = priceId === 'price_1RXX7SFT2t8OlDeTE7ktphka' ? 'core' : 'professional';
    
    await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      {
        subscriptionStatus: subscription.status,
        subscriptionTier: planType,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      }
    );
    
    console.log('✅ Subscription updated for customer:', customerId);
  } catch (error) {
    console.error('❌ Failed to process subscription update:', error);
    throw error;
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Processing subscription deletion:', subscription.id);
  
  try {
    const customerId = subscription.customer;
    
    await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      {
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date(subscription.canceled_at * 1000)
      }
    );
    
    console.log('✅ Subscription canceled for customer:', customerId);
  } catch (error) {
    console.error('❌ Failed to process subscription deletion:', error);
    throw error;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice) {
  console.log('💳 Processing successful payment for invoice:', invoice.id);
  
  try {
    const customerId = invoice.customer;
    
    await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      {
        subscriptionStatus: 'active',
        lastPaymentDate: new Date(invoice.created * 1000)
      }
    );
    
    console.log('✅ Payment processed for customer:', customerId);
  } catch (error) {
    console.error('❌ Failed to process payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
  console.log('❌ Processing failed payment for invoice:', invoice.id);
  
  try {
    const customerId = invoice.customer;
    
    await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      {
        subscriptionStatus: 'past_due',
        lastPaymentAttempt: new Date(invoice.created * 1000)
      }
    );
    
    console.log('⚠️ Payment failed for customer:', customerId);
  } catch (error) {
    console.error('❌ Failed to process payment failure:', error);
    throw error;
  }
}

/**
 * Get subscription status for a user
 */
async function getUserSubscriptionStatus(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { status: 'not_found' };
    }
    
    if (!user.stripeSubscriptionId) {
      return { status: 'no_subscription' };
    }
    
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    return {
      status: subscription.status,
      tier: user.subscriptionTier,
      currentPeriodEnd: subscription.current_period_end,
      trialEnd: subscription.trial_end
    };
  } catch (error) {
    console.error('❌ Failed to get subscription status:', error);
    return { status: 'error', error: error.message };
  }
}

module.exports = {
  handleStripeWebhook,
  getUserSubscriptionStatus
}; 