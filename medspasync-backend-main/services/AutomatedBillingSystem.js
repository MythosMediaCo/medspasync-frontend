const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class AutomatedBillingSystem {
  constructor() {
    this.subscriptions = new Map();
    this.paymentMethods = new Map();
    this.invoices = new Map();
    this.billingEvents = new Map();
    
    this.plans = {
      starter: {
        id: 'starter',
        name: 'Starter',
        price: 99,
        billingCycle: 'monthly',
        features: ['basic_reconciliation', 'client_management', 'ai_insights'],
        limits: {
          clients: 100,
          transactions: 2000,
          ai_requests: 500,
          storage: '5GB'
        },
        trialDays: 14
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        price: 199,
        billingCycle: 'monthly',
        features: ['advanced_reconciliation', 'client_management', 'ai_insights', 'advanced_analytics', 'api_access'],
        limits: {
          clients: 500,
          transactions: 10000,
          ai_requests: 2000,
          storage: '25GB'
        },
        trialDays: 14
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 399,
        billingCycle: 'monthly',
        features: ['unlimited_reconciliation', 'client_management', 'ai_insights', 'advanced_analytics', 'api_access', 'white_label', 'priority_support'],
        limits: {
          clients: 'unlimited',
          transactions: 'unlimited',
          ai_requests: 'unlimited',
          storage: '100GB'
        },
        trialDays: 30
      }
    };

    this.billingConfig = {
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      gracePeriodDays: 3,
      dunningEnabled: true,
      autoRetryEnabled: true,
      maxRetryAttempts: 3
    };

    this.initializeStripe();
  }

  /**
   * Initialize Stripe integration
   */
  initializeStripe() {
    if (this.billingConfig.stripeSecretKey) {
      this.stripe = require('stripe')(this.billingConfig.stripeSecretKey);
      console.log('💳 Stripe integration initialized');
    } else {
      console.log('⚠️ Stripe not configured - using mock payments');
    }
  }

  /**
   * Create subscription for trial conversion
   */
  async createSubscription(userId, planId, paymentMethodId, trialData = null) {
    try {
      const plan = this.plans[planId];
      if (!plan) {
        throw new Error(`Invalid plan: ${planId}`);
      }

      const subscriptionId = uuidv4();
      const subscription = {
        id: subscriptionId,
        userId,
        planId,
        plan: plan,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.calculatePeriodEnd(plan.billingCycle),
        cancelAtPeriodEnd: false,
        paymentMethodId,
        trialData,
        metadata: {
          createdFrom: trialData ? 'trial_conversion' : 'direct_signup',
          conversionDate: new Date().toISOString()
        }
      };

      // Store subscription
      this.subscriptions.set(subscriptionId, subscription);

      // Create initial invoice
      const invoice = await this.createInvoice(subscriptionId, 'initial');

      // Process payment
      const paymentResult = await this.processPayment(subscriptionId, invoice.id);

      if (paymentResult.success) {
        subscription.status = 'active';
        subscription.lastPaymentDate = new Date();
        
        // Emit subscription created event
        this.emitBillingEvent('subscription_created', {
          subscriptionId,
          userId,
          planId,
          amount: plan.price,
          trialData
        });

        console.log(`💳 Subscription created: ${subscriptionId} for user ${userId}`);
        
        return {
          success: true,
          subscription,
          invoice,
          nextBillingDate: subscription.currentPeriodEnd
        };
      } else {
        subscription.status = 'payment_failed';
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }

    } catch (error) {
      console.error('❌ Subscription creation failed:', error);
      throw error;
    }
  }

  /**
   * Process payment for subscription
   */
  async processPayment(subscriptionId, invoiceId) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      const invoice = this.invoices.get(invoiceId);
      
      if (!subscription || !invoice) {
        throw new Error('Subscription or invoice not found');
      }

      if (this.stripe) {
        // Process with Stripe
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: invoice.amount * 100, // Convert to cents
          currency: 'usd',
          customer: subscription.userId,
          payment_method: subscription.paymentMethodId,
          confirm: true,
          return_url: `${process.env.FRONTEND_URL}/billing/success`
        });

        if (paymentIntent.status === 'succeeded') {
          invoice.status = 'paid';
          invoice.paymentIntentId = paymentIntent.id;
          return { success: true, paymentIntent };
        } else {
          invoice.status = 'payment_failed';
          return { success: false, error: paymentIntent.last_payment_error?.message };
        }
      } else {
        // Mock payment processing
        const success = Math.random() > 0.1; // 90% success rate for demo
        
        if (success) {
          invoice.status = 'paid';
          invoice.paymentIntentId = `mock_${uuidv4()}`;
          return { success: true, paymentIntent: { id: invoice.paymentIntentId } };
        } else {
          invoice.status = 'payment_failed';
          return { success: false, error: 'Mock payment failed' };
        }
      }

    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create invoice for subscription
   */
  async createInvoice(subscriptionId, type = 'recurring') {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const invoiceId = uuidv4();
      const invoice = {
        id: invoiceId,
        subscriptionId,
        userId: subscription.userId,
        type,
        amount: subscription.plan.price,
        currency: 'usd',
        status: 'pending',
        dueDate: new Date(),
        createdAt: new Date(),
        items: [
          {
            description: `${subscription.plan.name} Plan`,
            amount: subscription.plan.price,
            quantity: 1
          }
        ],
        metadata: {
          planId: subscription.planId,
          billingCycle: subscription.plan.billingCycle
        }
      };

      this.invoices.set(invoiceId, invoice);
      return invoice;

    } catch (error) {
      console.error('❌ Invoice creation failed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription upgrades
   */
  async upgradeSubscription(subscriptionId, newPlanId, effectiveDate = 'immediate') {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newPlan = this.plans[newPlanId];
      if (!newPlan) {
        throw new Error(`Invalid plan: ${newPlanId}`);
      }

      const oldPlan = subscription.plan;
      const prorationAmount = this.calculateProration(subscription, newPlan, effectiveDate);

      // Create upgrade invoice
      const upgradeInvoice = {
        id: uuidv4(),
        subscriptionId,
        userId: subscription.userId,
        type: 'upgrade',
        amount: prorationAmount,
        currency: 'usd',
        status: 'pending',
        dueDate: new Date(),
        createdAt: new Date(),
        items: [
          {
            description: `Upgrade to ${newPlan.name} Plan`,
            amount: prorationAmount,
            quantity: 1
          }
        ],
        metadata: {
          fromPlan: oldPlan.id,
          toPlan: newPlan.id,
          effectiveDate
        }
      };

      this.invoices.set(upgradeInvoice.id, upgradeInvoice);

      // Update subscription
      subscription.planId = newPlanId;
      subscription.plan = newPlan;
      subscription.upgradedAt = new Date();
      subscription.upgradeInvoiceId = upgradeInvoice.id;

      if (effectiveDate === 'immediate') {
        // Process immediate upgrade
        const paymentResult = await this.processPayment(subscriptionId, upgradeInvoice.id);
        
        if (paymentResult.success) {
          upgradeInvoice.status = 'paid';
          
          // Emit upgrade event
          this.emitBillingEvent('subscription_upgraded', {
            subscriptionId,
            userId: subscription.userId,
            fromPlan: oldPlan.id,
            toPlan: newPlan.id,
            prorationAmount
          });

          console.log(`⬆️ Subscription upgraded: ${subscriptionId} to ${newPlanId}`);
          
          return {
            success: true,
            subscription,
            invoice: upgradeInvoice,
            prorationAmount
          };
        } else {
          throw new Error(`Upgrade payment failed: ${paymentResult.error}`);
        }
      } else {
        // Schedule upgrade for next billing cycle
        subscription.scheduledUpgrade = {
          planId: newPlanId,
          effectiveDate: subscription.currentPeriodEnd
        };

        console.log(`📅 Upgrade scheduled: ${subscriptionId} to ${newPlanId} at ${subscription.currentPeriodEnd}`);
        
        return {
          success: true,
          subscription,
          scheduledUpgrade: subscription.scheduledUpgrade
        };
      }

    } catch (error) {
      console.error('❌ Subscription upgrade failed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription downgrades
   */
  async downgradeSubscription(subscriptionId, newPlanId, effectiveDate = 'next_period') {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newPlan = this.plans[newPlanId];
      if (!newPlan) {
        throw new Error(`Invalid plan: ${newPlanId}`);
      }

      // Schedule downgrade for next billing cycle
      subscription.scheduledDowngrade = {
        planId: newPlanId,
        effectiveDate: subscription.currentPeriodEnd
      };

      // Emit downgrade event
      this.emitBillingEvent('subscription_downgraded', {
        subscriptionId,
        userId: subscription.userId,
        fromPlan: subscription.plan.id,
        toPlan: newPlan.id,
        effectiveDate: subscription.currentPeriodEnd
      });

      console.log(`⬇️ Downgrade scheduled: ${subscriptionId} to ${newPlanId} at ${subscription.currentPeriodEnd}`);
      
      return {
        success: true,
        subscription,
        scheduledDowngrade: subscription.scheduledDowngrade
      };

    } catch (error) {
      console.error('❌ Subscription downgrade failed:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, reason = 'user_requested') {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      subscription.cancelAtPeriodEnd = true;
      subscription.cancellationReason = reason;
      subscription.cancelledAt = new Date();

      // Emit cancellation event
      this.emitBillingEvent('subscription_cancelled', {
        subscriptionId,
        userId: subscription.userId,
        planId: subscription.planId,
        reason,
        effectiveDate: subscription.currentPeriodEnd
      });

      console.log(`❌ Subscription cancelled: ${subscriptionId}`);
      
      return {
        success: true,
        subscription,
        effectiveDate: subscription.currentPeriodEnd
      };

    } catch (error) {
      console.error('❌ Subscription cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (!subscription.cancelAtPeriodEnd) {
        throw new Error('Subscription is not cancelled');
      }

      subscription.cancelAtPeriodEnd = false;
      subscription.cancellationReason = null;
      subscription.reactivatedAt = new Date();

      // Emit reactivation event
      this.emitBillingEvent('subscription_reactivated', {
        subscriptionId,
        userId: subscription.userId,
        planId: subscription.planId
      });

      console.log(`✅ Subscription reactivated: ${subscriptionId}`);
      
      return {
        success: true,
        subscription
      };

    } catch (error) {
      console.error('❌ Subscription reactivation failed:', error);
      throw error;
    }
  }

  /**
   * Handle payment failures and retries
   */
  async handlePaymentFailure(subscriptionId, invoiceId, failureReason) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      const invoice = this.invoices.get(invoiceId);
      
      if (!subscription || !invoice) {
        throw new Error('Subscription or invoice not found');
      }

      // Update invoice status
      invoice.status = 'payment_failed';
      invoice.failureReason = failureReason;
      invoice.failedAt = new Date();

      // Track retry attempts
      if (!invoice.retryAttempts) {
        invoice.retryAttempts = 0;
      }
      invoice.retryAttempts++;

      // Check if we should retry
      if (this.billingConfig.autoRetryEnabled && 
          invoice.retryAttempts < this.billingConfig.maxRetryAttempts) {
        
        // Schedule retry
        const retryDelay = this.calculateRetryDelay(invoice.retryAttempts);
        setTimeout(() => {
          this.retryPayment(subscriptionId, invoiceId);
        }, retryDelay);

        console.log(`🔄 Payment retry scheduled: ${invoiceId} (attempt ${invoice.retryAttempts})`);
        
        return {
          success: false,
          retryScheduled: true,
          retryAttempt: invoice.retryAttempts,
          nextRetry: new Date(Date.now() + retryDelay)
        };
      } else {
        // Max retries reached, handle accordingly
        subscription.status = 'payment_failed';
        
        if (this.billingConfig.dunningEnabled) {
          await this.startDunningProcess(subscriptionId);
        }

        // Emit payment failure event
        this.emitBillingEvent('payment_failed', {
          subscriptionId,
          userId: subscription.userId,
          invoiceId,
          failureReason,
          retryAttempts: invoice.retryAttempts
        });

        console.log(`💥 Payment failed permanently: ${invoiceId}`);
        
        return {
          success: false,
          retryScheduled: false,
          maxRetriesReached: true
        };
      }

    } catch (error) {
      console.error('❌ Payment failure handling failed:', error);
      throw error;
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(subscriptionId, invoiceId) {
    try {
      const paymentResult = await this.processPayment(subscriptionId, invoiceId);
      
      if (!paymentResult.success) {
        await this.handlePaymentFailure(subscriptionId, invoiceId, paymentResult.error);
      } else {
        console.log(`✅ Payment retry successful: ${invoiceId}`);
      }

      return paymentResult;

    } catch (error) {
      console.error('❌ Payment retry failed:', error);
      await this.handlePaymentFailure(subscriptionId, invoiceId, error.message);
    }
  }

  /**
   * Start dunning process for failed payments
   */
  async startDunningProcess(subscriptionId) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const dunningProcess = {
        id: uuidv4(),
        subscriptionId,
        userId: subscription.userId,
        status: 'active',
        startedAt: new Date(),
        steps: [
          { type: 'email_reminder', scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          { type: 'email_reminder', scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
          { type: 'final_notice', scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        ],
        currentStep: 0
      };

      // Store dunning process
      this.billingEvents.set(dunningProcess.id, dunningProcess);

      console.log(`📧 Dunning process started: ${subscriptionId}`);
      
      return dunningProcess;

    } catch (error) {
      console.error('❌ Dunning process start failed:', error);
      throw error;
    }
  }

  /**
   * Calculate proration amount for plan changes
   */
  calculateProration(subscription, newPlan, effectiveDate) {
    const currentPlan = subscription.plan;
    const currentPrice = currentPlan.price;
    const newPrice = newPlan.price;
    
    if (effectiveDate === 'immediate') {
      // Calculate remaining days in current period
      const now = new Date();
      const periodEnd = subscription.currentPeriodEnd;
      const remainingDays = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
      const totalDays = Math.ceil((periodEnd - subscription.currentPeriodStart) / (1000 * 60 * 60 * 24));
      
      const prorationRatio = remainingDays / totalDays;
      const prorationAmount = Math.max(0, newPrice - (currentPrice * prorationRatio));
      
      return Math.round(prorationAmount * 100) / 100; // Round to 2 decimal places
    }
    
    return 0; // No proration for next period changes
  }

  /**
   * Calculate retry delay based on attempt number
   */
  calculateRetryDelay(attemptNumber) {
    const baseDelay = 24 * 60 * 60 * 1000; // 24 hours
    return baseDelay * Math.pow(2, attemptNumber - 1); // Exponential backoff
  }

  /**
   * Calculate period end date
   */
  calculatePeriodEnd(billingCycle) {
    const now = new Date();
    switch (billingCycle) {
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    }
  }

  /**
   * Get subscription details
   */
  getSubscription(subscriptionId) {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get user subscriptions
   */
  getUserSubscriptions(userId) {
    const userSubscriptions = [];
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.userId === userId) {
        userSubscriptions.push(subscription);
      }
    }
    return userSubscriptions;
  }

  /**
   * Get subscription invoices
   */
  getSubscriptionInvoices(subscriptionId) {
    const subscriptionInvoices = [];
    for (const [id, invoice] of this.invoices) {
      if (invoice.subscriptionId === subscriptionId) {
        subscriptionInvoices.push(invoice);
      }
    }
    return subscriptionInvoices.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get available plans
   */
  getPlans() {
    return Object.values(this.plans);
  }

  /**
   * Emit billing event
   */
  emitBillingEvent(eventType, data) {
    const event = {
      id: uuidv4(),
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    this.billingEvents.set(event.id, event);
    
    // In production, this would emit to an event bus or webhook
    console.log(`📡 Billing event: ${eventType}`, data);
  }

  /**
   * Get billing events for subscription
   */
  getBillingEvents(subscriptionId) {
    const events = [];
    for (const [id, event] of this.billingEvents) {
      if (event.data.subscriptionId === subscriptionId) {
        events.push(event);
      }
    }
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const health = {
        status: 'healthy',
        services: {
          stripe: this.stripe ? 'connected' : 'mock',
          subscriptions: this.subscriptions.size,
          invoices: this.invoices.size,
          events: this.billingEvents.size
        },
        timestamp: new Date().toISOString()
      };

      if (this.stripe) {
        try {
          await this.stripe.paymentMethods.list({ limit: 1 });
          health.services.stripe = 'connected';
        } catch (error) {
          health.services.stripe = 'error';
          health.status = 'degraded';
        }
      }

      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = AutomatedBillingSystem; 