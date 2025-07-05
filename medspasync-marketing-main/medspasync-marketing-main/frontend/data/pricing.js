// Shared pricing data for consistent pricing across components
export const pricingPlans = {
  core: {
    id: 'core',
    name: 'Core Plan',
    price: 299,
    period: 'month',
    featured: false,
    status: 'available',
    badge: {
      type: 'success',
      text: 'Most Popular'
    },
    features: [
      { text: 'Inventory Optimization - Prevent $600–$2,000 monthly waste' },
      { text: 'AI Reconciliation - 95%+ accuracy, 15% cost reduction' },
      { text: 'Basic Analytics - 40% admin efficiency improvement' },
      { text: 'Email Support - 24-hour response time' },
      { text: 'ROI Calculator - Personalized savings projection' }
    ],
    cta: {
      text: 'Start Free Trial',
      plan: 'Core',
      disabled: false
    },
    roi: {
      monthlySavings: 600,
      paybackMonths: 1,
      roiPercentage: 240,
      features: ['15% cost reduction', '40% admin efficiency', '$600–$2,000 monthly savings']
    }
  },
  
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    price: 499,
    period: 'month',
    featured: true,
    status: 'available',
    badge: {
      type: 'warning',
      text: 'Best Value'
    },
    features: [
      { text: 'Everything in Core' },
      { text: 'Predictive Growth - 200–1200% ROI in 1–6 months' },
      { text: 'Advanced Analytics - Enterprise-level insights' },
      { text: 'Priority Support - 4-hour response time' },
      { text: 'Competitive Analysis - vs. Zenoti, Pabau, PatientNow' },
      { text: 'Custom Integrations - EMR, POS systems' }
    ],
    cta: {
      text: 'Start Free Trial',
      plan: 'Professional',
      disabled: false
    },
    roi: {
      monthlySavings: 1500,
      paybackMonths: 3,
      roiPercentage: 600,
      features: ['15% cost reduction', '40% admin efficiency', '$1,500+ monthly savings', 'Enterprise analytics']
    }
  }
};

export const pricingFeatures = {
  security: {
    text: 'HIPAA-compliant security'
  },
  support: {
    text: '24/7 customer support'
  },
  updates: {
    text: 'Regular feature updates'
  },
  integration: {
    text: 'Easy third-party integrations'
  },
  roi: {
    text: 'Proven ROI in 1–6 months'
  },
  competitive: {
    text: 'Competitive advantage vs. chains'
  }
};

export const businessMetrics = {
  accuracy: '95%+',
  timeSaved: '8+ hours weekly',
  revenueRecovery: '$2,500+ monthly',
  implementation: '24 hours'
};

// Helper functions
export const formatPrice = (plan) => {
  if (plan.status === 'coming_soon') {
    return 'Coming Soon';
  }
  
  const price = plan.price;
  const period = plan.period;
  
  return `$${price}/${period}`;
};

export const getPlanFeatures = (planId) => {
  return pricingPlans[planId]?.features || [];
};

export const getAvailablePlans = () => {
  return Object.values(pricingPlans).filter(plan => plan.status === 'available');
};

export const getFeaturedPlan = () => {
  return Object.values(pricingPlans).find(plan => plan.featured);
};

// ROI Calculator Data
export const roiCalculatorData = {
  defaultValues: {
    botoxInventory: 5000,
    fillerInventory: 3000,
    monthlyTransactions: 150,
    currentManagement: 'manual',
    spaSize: 'small'
  },
  calculations: {
    wastePercentage: 0.15,
    adminSavingsPerTransaction: 0.5,
    monthlyCost: 299
  },
  competitiveAdvantages: [
    'Specialized medical spa analytics vs. general AI (Zenoti)',
    'Profit prevention vs. communication focus (Pabau)',
    'Operations optimization vs. conversion focus (PatientNow)'
  ]
};