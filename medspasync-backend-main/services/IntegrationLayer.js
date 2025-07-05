const EventEmitter = require('events');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class IntegrationLayer extends EventEmitter {
  constructor() {
    super();
    
    this.services = {
      trial: null,
      demo: null,
      onboarding: null,
      support: null,
      billing: null,
      analytics: null,
      ai: null,
      success: null
    };
    
    this.userJourneys = new Map();
    this.integrationConfig = {
      aiApiUrl: process.env.AI_API_URL || 'http://localhost:5002',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      webhookUrl: process.env.WEBHOOK_URL || null
    };
    
    this.eventHandlers = new Map();
    this.workflowEngine = new Map();
    
    this.initializeServices();
    this.setupEventHandlers();
    this.setupWorkflows();
    
    console.log('🔗 Integration Layer initialized');
  }

  /**
   * Initialize all service connections
   */
  async initializeServices() {
    try {
      // Initialize service connections
      const AutomatedTrialSystem = require('./AutomatedTrialSystem.js');
      const DemoDataManager = require('../medspasync-frontend-master/src/services/DemoDataManager.js');
      const GuidedOnboardingWizard = require('../medspasync-frontend-master/src/components/onboarding/GuidedOnboardingWizard.jsx');
      const AICustomerSupportBot = require('./AICustomerSupportBot.py');
      const AutomatedBillingSystem = require('../medspasync-frontend-master/src/services/AutomatedBillingSystem.js');
      const UserBehaviorTracking = require('../medspasync-frontend-master/src/services/UserBehaviorTracking.js');
      const CustomerSuccessAutomation = require('./CustomerSuccessAutomation.js');

      this.services.trial = new AutomatedTrialSystem();
      this.services.demo = new DemoDataManager();
      this.services.onboarding = new GuidedOnboardingWizard();
      this.services.billing = new AutomatedBillingSystem();
      this.services.analytics = new UserBehaviorTracking();
      this.services.success = new CustomerSuccessAutomation();

      console.log('✅ All services initialized');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
    }
  }

  /**
   * Setup event handlers for cross-service communication
   */
  setupEventHandlers() {
    // Trial events
    this.on('trial:created', this.handleTrialCreated.bind(this));
    this.on('trial:converted', this.handleTrialConverted.bind(this));
    this.on('trial:expired', this.handleTrialExpired.bind(this));

    // Onboarding events
    this.on('onboarding:started', this.handleOnboardingStarted.bind(this));
    this.on('onboarding:completed', this.handleOnboardingCompleted.bind(this));
    this.on('onboarding:abandoned', this.handleOnboardingAbandoned.bind(this));

    // Support events
    this.on('support:requested', this.handleSupportRequested.bind(this));
    this.on('support:resolved', this.handleSupportResolved.bind(this));

    // Billing events
    this.on('billing:subscription_created', this.handleSubscriptionCreated.bind(this));
    this.on('billing:payment_failed', this.handlePaymentFailed.bind(this));
    this.on('billing:plan_changed', this.handlePlanChanged.bind(this));

    // Success events
    this.on('success:milestone_reached', this.handleMilestoneReached.bind(this));
    this.on('success:intervention_triggered', this.handleInterventionTriggered.bind(this));
    this.on('success:churn_risk_detected', this.handleChurnRiskDetected.bind(this));

    console.log('🎯 Event handlers configured');
  }

  /**
   * Setup automated workflows
   */
  setupWorkflows() {
    // Discovery to Trial Workflow
    this.workflowEngine.set('discovery_to_trial', {
      steps: [
        'landing_page_visit',
        'demo_interaction',
        'trial_signup',
        'demo_data_setup',
        'first_value_experience'
      ],
      triggers: ['page_view', 'demo_start', 'signup_click'],
      conditions: {
        'demo_interaction': { minTime: 300, features: ['roi_calculator', 'interactive_demo'] },
        'trial_signup': { required: ['email', 'name'], optional: ['company'] },
        'first_value_experience': { target: 'reconciliation_completed' }
      }
    });

    // Trial to Paid Workflow
    this.workflowEngine.set('trial_to_paid', {
      steps: [
        'trial_activation',
        'onboarding_completion',
        'value_demonstration',
        'conversion_trigger',
        'subscription_activation'
      ],
      triggers: ['trial_created', 'onboarding_completed', 'value_milestone'],
      conditions: {
        'onboarding_completion': { requiredSteps: 5, minTime: 1800 },
        'value_demonstration': { target: 'roi_positive', minActions: 3 },
        'conversion_trigger': { score: 70, urgency: 'high' }
      }
    });

    // Success to Expansion Workflow
    this.workflowEngine.set('success_to_expansion', {
      steps: [
        'success_milestone',
        'usage_analysis',
        'expansion_opportunity',
        'upsell_trigger',
        'plan_upgrade'
      ],
      triggers: ['milestone_reached', 'usage_increase', 'feature_request'],
      conditions: {
        'success_milestone': { target: 'value_positive', duration: '30d' },
        'expansion_opportunity': { usage: '80%', satisfaction: 'high' },
        'upsell_trigger': { score: 85, readiness: 'high' }
      }
    });

    console.log('⚙️ Workflow engine configured');
  }

  /**
   * Handle complete user journey orchestration
   */
  async orchestrateUserJourney(userId, journeyType, data = {}) {
    try {
      const journeyId = uuidv4();
      const journey = {
        id: journeyId,
        userId,
        type: journeyType,
        status: 'active',
        currentStep: 0,
        steps: [],
        data,
        startedAt: new Date(),
        lastActivity: new Date()
      };

      this.userJourneys.set(journeyId, journey);

      // Get workflow configuration
      const workflow = this.workflowEngine.get(journeyType);
      if (!workflow) {
        throw new Error(`Unknown journey type: ${journeyType}`);
      }

      journey.steps = workflow.steps.map((step, index) => ({
        id: step,
        order: index,
        status: 'pending',
        completedAt: null,
        data: {}
      }));

      // Start the journey
      await this.executeJourneyStep(journeyId, 0);

      console.log(`🚀 User journey started: ${journeyType} for user ${userId}`);
      return { journeyId, status: 'started' };

    } catch (error) {
      console.error('❌ Journey orchestration failed:', error);
      throw error;
    }
  }

  /**
   * Execute a specific step in the user journey
   */
  async executeJourneyStep(journeyId, stepIndex) {
    try {
      const journey = this.userJourneys.get(journeyId);
      if (!journey || stepIndex >= journey.steps.length) {
        return;
      }

      const step = journey.steps[stepIndex];
      const workflow = this.workflowEngine.get(journey.type);

      // Execute step-specific logic
      switch (step.id) {
        case 'landing_page_visit':
          await this.handleLandingPageVisit(journey, step);
          break;
        case 'demo_interaction':
          await this.handleDemoInteraction(journey, step);
          break;
        case 'trial_signup':
          await this.handleTrialSignup(journey, step);
          break;
        case 'demo_data_setup':
          await this.handleDemoDataSetup(journey, step);
          break;
        case 'first_value_experience':
          await this.handleFirstValueExperience(journey, step);
          break;
        case 'trial_activation':
          await this.handleTrialActivation(journey, step);
          break;
        case 'onboarding_completion':
          await this.handleOnboardingCompletion(journey, step);
          break;
        case 'value_demonstration':
          await this.handleValueDemonstration(journey, step);
          break;
        case 'conversion_trigger':
          await this.handleConversionTrigger(journey, step);
          break;
        case 'subscription_activation':
          await this.handleSubscriptionActivation(journey, step);
          break;
        default:
          console.log(`⚠️ Unknown step: ${step.id}`);
      }

      // Mark step as completed
      step.status = 'completed';
      step.completedAt = new Date();
      journey.currentStep = stepIndex + 1;
      journey.lastActivity = new Date();

      // Check if journey is complete
      if (stepIndex === journey.steps.length - 1) {
        journey.status = 'completed';
        this.emit('journey:completed', { journeyId, journey });
      } else {
        // Trigger next step
        setTimeout(() => {
          this.executeJourneyStep(journeyId, stepIndex + 1);
        }, 1000);
      }

    } catch (error) {
      console.error(`❌ Step execution failed: ${error.message}`);
      const journey = this.userJourneys.get(journeyId);
      if (journey) {
        journey.steps[stepIndex].status = 'failed';
        journey.steps[stepIndex].error = error.message;
      }
    }
  }

  /**
   * Handle landing page visit
   */
  async handleLandingPageVisit(journey, step) {
    try {
      // Track page visit
      await this.services.analytics.trackEvent(journey.userId, 'page_view', {
        page: 'landing',
        source: journey.data.source || 'direct',
        timestamp: new Date()
      });

      // Initialize demo data
      const demoData = await this.services.demo.initializeDemoData();
      step.data.demoData = demoData;

      // Trigger welcome sequence
      this.emit('onboarding:started', {
        userId: journey.userId,
        journeyId: journey.id,
        demoData
      });

      console.log(`📄 Landing page visit handled for user ${journey.userId}`);
    } catch (error) {
      console.error('❌ Landing page visit failed:', error);
      throw error;
    }
  }

  /**
   * Handle demo interaction
   */
  async handleDemoInteraction(journey, step) {
    try {
      // Track demo engagement
      await this.services.analytics.trackEvent(journey.userId, 'demo_interaction', {
        features: ['roi_calculator', 'interactive_demo'],
        duration: 300,
        engagement: 'high'
      });

      // Generate personalized demo experience
      const personalizedDemo = await this.services.demo.generatePersonalizedDemo(
        journey.userId,
        journey.data
      );

      step.data.personalizedDemo = personalizedDemo;

      console.log(`🎮 Demo interaction handled for user ${journey.userId}`);
    } catch (error) {
      console.error('❌ Demo interaction failed:', error);
      throw error;
    }
  }

  /**
   * Handle trial signup
   */
  async handleTrialSignup(journey, step) {
    try {
      // Create trial account
      const trialResult = await this.services.trial.createTrialAccount({
        email: journey.data.email,
        name: journey.data.name,
        company: journey.data.company
      });

      step.data.trialAccount = trialResult.trialAccount;

      // Emit trial created event
      this.emit('trial:created', {
        userId: journey.userId,
        trialId: trialResult.trialAccount.id,
        trialData: trialResult
      });

      console.log(`🎯 Trial signup handled for user ${journey.userId}`);
    } catch (error) {
      console.error('❌ Trial signup failed:', error);
      throw error;
    }
  }

  /**
   * Handle demo data setup
   */
  async handleDemoDataSetup(journey, step) {
    try {
      const trialAccount = step.data.trialAccount;
      
      // Setup demo data for trial account
      const demoData = await this.services.demo.setupTrialData(
        trialAccount.id,
        trialAccount.company
      );

      step.data.demoData = demoData;

      // Track demo data setup
      await this.services.analytics.trackEvent(journey.userId, 'demo_data_setup', {
        trialId: trialAccount.id,
        dataPoints: demoData.clients.length + demoData.transactions.length
      });

      console.log(`📊 Demo data setup handled for trial ${trialAccount.id}`);
    } catch (error) {
      console.error('❌ Demo data setup failed:', error);
      throw error;
    }
  }

  /**
   * Handle first value experience
   */
  async handleFirstValueExperience(journey, step) {
    try {
      // Guide user to first reconciliation
      const valueExperience = await this.services.demo.guideToFirstValue(
        journey.userId,
        step.data.demoData
      );

      step.data.valueExperience = valueExperience;

      // Track value realization
      await this.services.analytics.trackEvent(journey.userId, 'first_value_experience', {
        type: 'reconciliation_completed',
        timeSaved: valueExperience.timeSaved,
        accuracy: valueExperience.accuracy
      });

      console.log(`💎 First value experience handled for user ${journey.userId}`);
    } catch (error) {
      console.error('❌ First value experience failed:', error);
      throw error;
    }
  }

  /**
   * Handle trial activation
   */
  async handleTrialActivation(journey, step) {
    try {
      const trialAccount = step.data.trialAccount;
      
      // Activate trial features
      await this.services.trial.activateTrialFeatures(trialAccount.id);

      // Start onboarding sequence
      const onboardingPlan = await this.services.onboarding.createOnboardingPlan(
        trialAccount.id,
        trialAccount.onboardingProgress
      );

      step.data.onboardingPlan = onboardingPlan;

      console.log(`🚀 Trial activation handled for trial ${trialAccount.id}`);
    } catch (error) {
      console.error('❌ Trial activation failed:', error);
      throw error;
    }
  }

  /**
   * Handle onboarding completion
   */
  async handleOnboardingCompletion(journey, step) {
    try {
      // Track onboarding completion
      await this.services.analytics.trackEvent(journey.userId, 'onboarding_completed', {
        duration: journey.data.onboardingDuration,
        stepsCompleted: journey.data.onboardingStepsCompleted
      });

      // Emit onboarding completed event
      this.emit('onboarding:completed', {
        userId: journey.userId,
        journeyId: journey.id,
        onboardingData: journey.data
      });

      console.log(`✅ Onboarding completion handled for user ${journey.userId}`);
    } catch (error) {
      console.error('❌ Onboarding completion failed:', error);
      throw error;
    }
  }

  /**
   * Handle value demonstration
   */
  async handleValueDemonstration(journey, step) {
    try {
      // Calculate and demonstrate value
      const valueMetrics = await this.services.success.calculateValueMetrics(
        journey.userId
      );

      step.data.valueMetrics = valueMetrics;

      // Track value demonstration
      await this.services.analytics.trackEvent(journey.userId, 'value_demonstrated', {
        roi: valueMetrics.roi,
        timeSaved: valueMetrics.timeSaved,
        efficiencyGain: valueMetrics.efficiencyGain
      });

      console.log(`📈 Value demonstration handled for user ${journey.userId}`);
    } catch (error) {
      console.error('❌ Value demonstration failed:', error);
      throw error;
    }
  }

  /**
   * Handle conversion trigger
   */
  async handleConversionTrigger(journey, step) {
    try {
      // Check conversion readiness
      const conversionReadiness = await this.services.success.assessConversionReadiness(
        journey.userId
      );

      step.data.conversionReadiness = conversionReadiness;

      if (conversionReadiness.score >= 70) {
        // Trigger conversion flow
        await this.services.billing.triggerConversionFlow(
          journey.userId,
          conversionReadiness.recommendedPlan
        );
      }

      console.log(`🎯 Conversion trigger handled for user ${journey.userId}`);
    } catch (error) {
      console.error('❌ Conversion trigger failed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription activation
   */
  async handleSubscriptionActivation(journey, step) {
    try {
      // Activate paid subscription
      const subscription = await this.services.billing.activateSubscription(
        journey.userId,
        journey.data.selectedPlan
      );

      step.data.subscription = subscription;

      // Convert trial to paid
      await this.services.trial.convertTrialToPaid(
        journey.data.trialAccount.id,
        journey.data.selectedPlan
      );

      // Emit subscription created event
      this.emit('billing:subscription_created', {
        userId: journey.userId,
        subscriptionId: subscription.id,
        plan: subscription.plan
      });

      console.log(`💳 Subscription activation handled for user ${journey.userId}`);
    } catch (error) {
      console.error('❌ Subscription activation failed:', error);
      throw error;
    }
  }

  /**
   * Event handlers
   */
  async handleTrialCreated(data) {
    try {
      // Start onboarding journey
      await this.orchestrateUserJourney(
        data.userId,
        'trial_to_paid',
        { trialId: data.trialId, trialData: data.trialData }
      );
    } catch (error) {
      console.error('❌ Trial created handler failed:', error);
    }
  }

  async handleTrialConverted(data) {
    try {
      // Start success journey
      await this.orchestrateUserJourney(
        data.userId,
        'success_to_expansion',
        { subscriptionId: data.subscriptionId, plan: data.plan }
      );
    } catch (error) {
      console.error('❌ Trial converted handler failed:', error);
    }
  }

  async handleOnboardingCompleted(data) {
    try {
      // Trigger value demonstration
      await this.services.success.triggerValueDemonstration(data.userId);
    } catch (error) {
      console.error('❌ Onboarding completed handler failed:', error);
    }
  }

  async handleSupportRequested(data) {
    try {
      // Route to AI support bot
      const supportResponse = await this.routeToAISupport(data);
      
      // Track support interaction
      await this.services.analytics.trackEvent(data.userId, 'support_requested', {
        category: data.category,
        priority: data.priority,
        resolved: supportResponse.resolved
      });
    } catch (error) {
      console.error('❌ Support requested handler failed:', error);
    }
  }

  async handleMilestoneReached(data) {
    try {
      // Trigger expansion opportunities
      await this.services.success.triggerExpansionOpportunities(data.userId);
    } catch (error) {
      console.error('❌ Milestone reached handler failed:', error);
    }
  }

  /**
   * Route support requests to AI bot
   */
  async routeToAISupport(data) {
    try {
      const response = await axios.post(`${this.integrationConfig.aiApiUrl}/api/support/chat`, {
        user_id: data.userId,
        message: data.message,
        session_id: data.sessionId,
        context: data.context
      });

      return response.data;
    } catch (error) {
      console.error('❌ AI support routing failed:', error);
      return { resolved: false, error: error.message };
    }
  }

  /**
   * Get user journey status
   */
  getUserJourney(userId, journeyType) {
    for (const [journeyId, journey] of this.userJourneys) {
      if (journey.userId === userId && journey.type === journeyType) {
        return journey;
      }
    }
    return null;
  }

  /**
   * Get all active journeys for a user
   */
  getUserJourneys(userId) {
    const userJourneys = [];
    for (const [journeyId, journey] of this.userJourneys) {
      if (journey.userId === userId) {
        userJourneys.push(journey);
      }
    }
    return userJourneys;
  }

  /**
   * Update journey data
   */
  updateJourneyData(journeyId, data) {
    const journey = this.userJourneys.get(journeyId);
    if (journey) {
      journey.data = { ...journey.data, ...data };
      journey.lastActivity = new Date();
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Check each service
      for (const [serviceName, service] of Object.entries(this.services)) {
        if (service && typeof service.healthCheck === 'function') {
          health.services[serviceName] = await service.healthCheck();
        } else {
          health.services[serviceName] = { status: 'unknown' };
        }
      }

      // Check external services
      try {
        const aiResponse = await axios.get(`${this.integrationConfig.aiApiUrl}/api/support/health`);
        health.services.ai_api = aiResponse.data;
      } catch (error) {
        health.services.ai_api = { status: 'unhealthy', error: error.message };
      }

      // Overall status
      const unhealthyServices = Object.values(health.services).filter(
        service => service.status === 'unhealthy'
      );
      
      if (unhealthyServices.length > 0) {
        health.status = 'degraded';
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }
}

module.exports = IntegrationLayer; 