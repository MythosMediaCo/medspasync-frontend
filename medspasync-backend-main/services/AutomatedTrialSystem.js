const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class AutomatedTrialSystem {
  constructor() {
    this.trialDefaults = {
      duration: 14, // days
      features: ['basic_reconciliation', 'ai_insights', 'client_management'],
      limits: {
        clients: 50,
        transactions: 1000,
        ai_requests: 100,
        storage: '1GB'
      },
      onboardingSteps: [
        'welcome',
        'profile_setup',
        'demo_data_import',
        'first_reconciliation',
        'ai_insights_exploration'
      ]
    };
    
    this.trialMetrics = new Map();
    this.conversionTriggers = new Map();
  }

  /**
   * Create instant trial account with demo data
   */
  async createTrialAccount(userData) {
    try {
      const trialId = uuidv4();
      const trialKey = crypto.randomBytes(32).toString('hex');
      
      // Generate trial account
      const trialAccount = {
        id: trialId,
        email: userData.email,
        name: userData.name,
        company: userData.company || 'Demo MedSpa',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (this.trialDefaults.duration * 24 * 60 * 60 * 1000)),
        status: 'active',
        tier: 'trial',
        features: this.trialDefaults.features,
        limits: this.trialDefaults.limits,
        onboardingProgress: {
          currentStep: 0,
          completedSteps: [],
          nextStep: this.trialDefaults.onboardingSteps[0]
        },
        usage: {
          clients: 0,
          transactions: 0,
          ai_requests: 0,
          storage_used: 0
        },
        demoData: await this.generateDemoData(userData.company),
        conversionScore: 0,
        lastActivity: new Date()
      };

      // Initialize trial metrics tracking
      this.trialMetrics.set(trialId, {
        sessions: 0,
        featuresUsed: new Set(),
        timeSpent: 0,
        valueActions: [],
        conversionSignals: []
      });

      // Set up conversion triggers
      this.setupConversionTriggers(trialId);

      console.log(`🎯 Trial account created: ${trialId} for ${userData.email}`);
      
      return {
        success: true,
        trialAccount,
        trialKey,
        nextSteps: this.getNextOnboardingSteps(trialAccount)
      };
    } catch (error) {
      console.error('❌ Trial creation failed:', error);
      throw new Error('Failed to create trial account');
    }
  }

  /**
   * Generate realistic demo data for trial accounts
   */
  async generateDemoData(companyName) {
    const demoData = {
      clients: this.generateDemoClients(companyName),
      transactions: this.generateDemoTransactions(),
      services: this.generateDemoServices(),
      insights: this.generateDemoInsights()
    };

    return demoData;
  }

  generateDemoClients(companyName) {
    const clientNames = [
      'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim',
      'Lisa Thompson', 'James Wilson', 'Maria Garcia', 'Robert Brown',
      'Jennifer Davis', 'Christopher Lee', 'Amanda White', 'Daniel Martinez'
    ];

    return clientNames.slice(0, 8).map((name, index) => ({
      id: `demo_client_${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      phone: `555-${String(index + 100).padStart(3, '0')}-${String(index + 1000).padStart(4, '0')}`,
      joinDate: new Date(Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000)),
      totalSpent: Math.floor(Math.random() * 5000) + 500,
      visits: Math.floor(Math.random() * 20) + 1,
      status: 'active',
      tags: ['demo', 'trial']
    }));
  }

  generateDemoTransactions() {
    const services = [
      'Facial Treatment', 'Botox Injection', 'Laser Hair Removal',
      'Chemical Peel', 'Dermal Fillers', 'Microdermabrasion',
      'IPL Treatment', 'Skin Consultation'
    ];

    const transactions = [];
    for (let i = 0; i < 25; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const amount = Math.floor(Math.random() * 500) + 100;
      const clientId = `demo_client_${Math.floor(Math.random() * 8) + 1}`;
      
      transactions.push({
        id: `demo_txn_${i + 1}`,
        clientId,
        service,
        amount,
        date: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        status: 'completed',
        paymentMethod: ['credit_card', 'cash', 'insurance'][Math.floor(Math.random() * 3)],
        tags: ['demo', 'trial']
      });
    }

    return transactions;
  }

  generateDemoServices() {
    return [
      { id: 'facial', name: 'Facial Treatment', price: 150, duration: 60 },
      { id: 'botox', name: 'Botox Injection', price: 400, duration: 30 },
      { id: 'laser', name: 'Laser Hair Removal', price: 300, duration: 45 },
      { id: 'peel', name: 'Chemical Peel', price: 200, duration: 90 },
      { id: 'fillers', name: 'Dermal Fillers', price: 600, duration: 60 },
      { id: 'micro', name: 'Microdermabrasion', price: 120, duration: 30 }
    ];
  }

  generateDemoInsights() {
    return {
      revenueGrowth: 15.2,
      clientRetention: 87.5,
      averageTransaction: 285.50,
      topServices: [
        { name: 'Facial Treatment', revenue: 2250, count: 15 },
        { name: 'Botox Injection', revenue: 2000, count: 5 },
        { name: 'Laser Hair Removal', revenue: 1800, count: 6 }
      ],
      clientSatisfaction: 4.8,
      efficiencyGains: 23.4
    };
  }

  /**
   * Track trial usage and update conversion score
   */
  async trackTrialUsage(trialId, action, data = {}) {
    try {
      const metrics = this.trialMetrics.get(trialId);
      if (!metrics) return;

      // Update basic metrics
      metrics.sessions++;
      metrics.featuresUsed.add(action.feature);
      metrics.timeSpent += action.duration || 0;
      metrics.lastActivity = new Date();

      // Track value-generating actions
      if (action.valueScore) {
        metrics.valueActions.push({
          action: action.type,
          score: action.valueScore,
          timestamp: new Date(),
          data
        });
      }

      // Update conversion score
      const conversionScore = this.calculateConversionScore(metrics);
      
      // Check for conversion triggers
      await this.checkConversionTriggers(trialId, conversionScore, action);

      console.log(`📊 Trial usage tracked: ${trialId} - ${action.type} (score: ${conversionScore})`);
      
      return { conversionScore, nextRecommendation: this.getNextRecommendation(metrics) };
    } catch (error) {
      console.error('❌ Trial usage tracking failed:', error);
    }
  }

  /**
   * Calculate conversion probability based on usage patterns
   */
  calculateConversionScore(metrics) {
    let score = 0;

    // Session engagement (0-25 points)
    score += Math.min(metrics.sessions * 2, 25);

    // Feature adoption (0-30 points)
    score += Math.min(metrics.featuresUsed.size * 5, 30);

    // Time spent (0-20 points)
    score += Math.min(metrics.timeSpent / 3600 * 2, 20); // 2 points per hour

    // Value actions (0-25 points)
    const valueScore = metrics.valueActions.reduce((sum, action) => sum + action.score, 0);
    score += Math.min(valueScore, 25);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Setup automated conversion triggers
   */
  setupConversionTriggers(trialId) {
    const triggers = {
      highEngagement: {
        condition: (score, metrics) => score >= 70 && metrics.sessions >= 5,
        action: 'offer_premium_trial_extension',
        message: 'You\'re getting great value! Extend your trial with premium features.'
      },
      valueRealization: {
        condition: (score, metrics) => metrics.valueActions.length >= 3,
        action: 'trigger_conversion_flow',
        message: 'Ready to unlock unlimited potential?'
      },
      featureExploration: {
        condition: (score, metrics) => metrics.featuresUsed.size >= 4,
        action: 'offer_demo_call',
        message: 'Let us show you advanced features!'
      },
      timePressure: {
        condition: (score, metrics, trialAccount) => {
          const daysLeft = (trialAccount.expiresAt - new Date()) / (24 * 60 * 60 * 1000);
          return daysLeft <= 3 && score >= 40;
        },
        action: 'urgent_conversion_offer',
        message: 'Don\'t lose your progress! Upgrade now with 20% off.'
      }
    };

    this.conversionTriggers.set(trialId, triggers);
  }

  /**
   * Check and trigger conversion actions
   */
  async checkConversionTriggers(trialId, score, action) {
    const triggers = this.conversionTriggers.get(trialId);
    if (!triggers) return;

    const metrics = this.trialMetrics.get(trialId);
    const trialAccount = await this.getTrialAccount(trialId);

    for (const [triggerName, trigger] of Object.entries(triggers)) {
      if (trigger.condition(score, metrics, trialAccount)) {
        await this.executeConversionAction(trialId, trigger, metrics);
        break; // Only trigger one action at a time
      }
    }
  }

  /**
   * Execute conversion action
   */
  async executeConversionAction(trialId, trigger, metrics) {
    try {
      const action = {
        type: trigger.action,
        message: trigger.message,
        timestamp: new Date(),
        metrics: {
          score: this.calculateConversionScore(metrics),
          sessions: metrics.sessions,
          featuresUsed: Array.from(metrics.featuresUsed),
          valueActions: metrics.valueActions.length
        }
      };

      // Store conversion action
      metrics.conversionSignals.push(action);

      // Trigger appropriate response
      switch (trigger.action) {
        case 'offer_premium_trial_extension':
          await this.offerPremiumExtension(trialId);
          break;
        case 'trigger_conversion_flow':
          await this.triggerConversionFlow(trialId);
          break;
        case 'offer_demo_call':
          await this.offerDemoCall(trialId);
          break;
        case 'urgent_conversion_offer':
          await this.urgentConversionOffer(trialId);
          break;
      }

      console.log(`🎯 Conversion trigger executed: ${trigger.action} for trial ${trialId}`);
    } catch (error) {
      console.error('❌ Conversion action failed:', error);
    }
  }

  /**
   * Get next onboarding steps for trial user
   */
  getNextOnboardingSteps(trialAccount) {
    const currentStep = trialAccount.onboardingProgress.currentStep;
    const remainingSteps = this.trialDefaults.onboardingSteps.slice(currentStep);
    
    return remainingSteps.map((step, index) => ({
      step: currentStep + index + 1,
      type: step,
      title: this.getStepTitle(step),
      description: this.getStepDescription(step),
      estimatedTime: this.getStepTime(step),
      value: this.getStepValue(step)
    }));
  }

  getStepTitle(step) {
    const titles = {
      welcome: 'Welcome to MedSpaSync Pro',
      profile_setup: 'Complete Your Profile',
      demo_data_import: 'Explore Your Demo Data',
      first_reconciliation: 'Run Your First Reconciliation',
      ai_insights_exploration: 'Discover AI Insights'
    };
    return titles[step] || step;
  }

  getStepDescription(step) {
    const descriptions = {
      welcome: 'Get started with your personalized trial experience',
      profile_setup: 'Tell us about your practice to customize your experience',
      demo_data_import: 'See how MedSpaSync Pro works with your data',
      first_reconciliation: 'Experience the power of AI-powered reconciliation',
      ai_insights_exploration: 'Unlock actionable insights for your business'
    };
    return descriptions[step] || '';
  }

  getStepTime(step) {
    const times = {
      welcome: 2,
      profile_setup: 5,
      demo_data_import: 3,
      first_reconciliation: 8,
      ai_insights_exploration: 5
    };
    return times[step] || 5;
  }

  getStepValue(step) {
    const values = {
      welcome: 'Personalized experience',
      profile_setup: 'Customized insights',
      demo_data_import: 'See immediate value',
      first_reconciliation: 'Time savings',
      ai_insights_exploration: 'Business growth'
    };
    return values[step] || '';
  }

  /**
   * Get personalized recommendations based on usage
   */
  getNextRecommendation(metrics) {
    const recommendations = [];

    if (metrics.sessions < 3) {
      recommendations.push({
        type: 'engagement',
        title: 'Explore More Features',
        description: 'Try our AI insights to see how we can help your practice',
        action: 'explore_ai_insights',
        priority: 'high'
      });
    }

    if (metrics.featuresUsed.size < 3) {
      recommendations.push({
        type: 'feature_adoption',
        title: 'Import Your Data',
        description: 'See how MedSpaSync Pro works with your actual data',
        action: 'import_data',
        priority: 'medium'
      });
    }

    if (metrics.valueActions.length < 2) {
      recommendations.push({
        type: 'value_demonstration',
        title: 'Run a Reconciliation',
        description: 'Experience the time-saving power of AI reconciliation',
        action: 'run_reconciliation',
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Convert trial to paid account
   */
  async convertTrialToPaid(trialId, planData) {
    try {
      const trialAccount = await this.getTrialAccount(trialId);
      const metrics = this.trialMetrics.get(trialId);

      const paidAccount = {
        ...trialAccount,
        status: 'active',
        tier: planData.tier,
        plan: planData.plan,
        convertedAt: new Date(),
        conversionMetrics: {
          trialDuration: (new Date() - trialAccount.createdAt) / (24 * 60 * 60 * 1000),
          sessions: metrics.sessions,
          featuresUsed: Array.from(metrics.featuresUsed),
          valueActions: metrics.valueActions.length,
          conversionScore: this.calculateConversionScore(metrics)
        }
      };

      // Clean up trial data
      this.trialMetrics.delete(trialId);
      this.conversionTriggers.delete(trialId);

      console.log(`🎉 Trial converted to paid: ${trialId} -> ${planData.tier}`);
      
      return {
        success: true,
        account: paidAccount,
        welcomeMessage: this.generateWelcomeMessage(paidAccount)
      };
    } catch (error) {
      console.error('❌ Trial conversion failed:', error);
      throw new Error('Failed to convert trial account');
    }
  }

  /**
   * Generate personalized welcome message for converted users
   */
  generateWelcomeMessage(account) {
    const { conversionMetrics } = account;
    
    let message = `Welcome to MedSpaSync Pro! 🎉\n\n`;
    
    if (conversionMetrics.trialDuration < 7) {
      message += `You discovered value quickly - that's exactly what we love to see!\n`;
    } else {
      message += `Thank you for taking the time to explore MedSpaSync Pro thoroughly.\n`;
    }

    if (conversionMetrics.featuresUsed.length >= 3) {
      message += `You've already explored ${conversionMetrics.featuresUsed.length} features - you're ready to maximize your ROI!\n`;
    }

    message += `\nYour account is now active with ${account.tier} features. Let's grow your practice together!`;

    return message;
  }

  // Placeholder methods for external integrations
  async getTrialAccount(trialId) {
    // In production, this would fetch from database
    return { id: trialId, expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) };
  }

  async offerPremiumExtension(trialId) {
    // Integration with notification system
    console.log(`📧 Sending premium extension offer to trial ${trialId}`);
  }

  async triggerConversionFlow(trialId) {
    // Integration with conversion optimization system
    console.log(`🔄 Triggering conversion flow for trial ${trialId}`);
  }

  async offerDemoCall(trialId) {
    // Integration with scheduling system
    console.log(`📞 Offering demo call to trial ${trialId}`);
  }

  async urgentConversionOffer(trialId) {
    // Integration with billing system
    console.log(`⚡ Sending urgent conversion offer to trial ${trialId}`);
  }
}

module.exports = AutomatedTrialSystem; 