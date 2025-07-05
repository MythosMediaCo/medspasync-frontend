// Function Health Visual Design System - Features Data

export const features = {
  inventoryOptimization: {
    title: 'Inventory Optimization',
    description: 'Prevent $600–$2,000 monthly waste through predictive analytics and automated stock management',
    benefits: [
      'Predictive demand forecasting',
      'Automated reorder points',
      'Waste prevention alerts',
      '15% inventory cost reduction'
    ],
    roi: {
      monthlySavings: 800,
      paybackMonths: 2,
      roiPercentage: 320
    },
    competitive: 'vs. Zenoti: Specialized medical spa analytics vs. general AI'
  },
  aiReconciliation: {
    title: 'AI Reconciliation',
    description: 'Achieve 95%+ accuracy with AI-powered matching that prevents revenue leakage',
    benefits: [
      '95%+ prediction accuracy',
      'Automated error detection',
      'Fraud prevention',
      '40% admin efficiency improvement'
    ],
    roi: {
      monthlySavings: 600,
      paybackMonths: 1,
      roiPercentage: 240
    },
    competitive: 'vs. Pabau: Profit prevention vs. communication focus'
  },
  predictiveGrowth: {
    title: 'Predictive Growth',
    description: 'Generate 200–1200% ROI in 1–6 months with data-driven insights',
    benefits: [
      'Revenue forecasting',
      'Customer lifetime value optimization',
      'Market trend analysis',
      '1–6 month payback period'
    ],
    roi: {
      monthlySavings: 1200,
      paybackMonths: 3,
      roiPercentage: 480
    },
    competitive: 'vs. PatientNow: Operations optimization vs. conversion focus'
  },
  independentAdvantage: {
    title: 'Independent Advantage',
    description: 'Compete with chains using enterprise-level analytics designed for independent spas',
    benefits: [
      'Specialized for medical spas',
      '76–90% market focus',
      'Chain-competitive insights',
      'Democratized enterprise analytics'
    ],
    roi: {
      monthlySavings: 1000,
      paybackMonths: 2,
      roiPercentage: 400
    },
    competitive: 'Unique positioning for independent medical spas'
  }
};

export const featureCategories = {
  financial: {
    title: 'Financial Optimization',
    description: 'Direct impact on your bottom line with measurable returns',
    features: ['inventoryOptimization', 'aiReconciliation']
  },
  operational: {
    title: 'Operational Excellence',
    description: 'Streamline processes and improve efficiency',
    features: ['aiReconciliation', 'predictiveGrowth']
  },
  competitive: {
    title: 'Competitive Advantage',
    description: 'Level the playing field against large chains',
    features: ['independentAdvantage', 'predictiveGrowth']
  }
};

export const competitiveComparison = {
  zenoti: {
    name: 'Zenoti',
    positioning: 'General AI platform',
    ourAdvantage: 'Specialized medical spa predictive analytics',
    keyDifferentiator: '$600–$2,000 monthly savings vs. general efficiency claims',
    roiComparison: 'Proven 15% cost reduction vs. generic AI benefits'
  },
  pabau: {
    name: 'Pabau',
    positioning: 'Communication and notes automation',
    ourAdvantage: 'Profit prevention through predictive inventory',
    keyDifferentiator: 'Prevents revenue loss vs. automates communication',
    roiComparison: '40% admin efficiency vs. note-taking automation'
  },
  patientNow: {
    name: 'PatientNow',
    positioning: 'Patient conversion and CRM',
    ourAdvantage: 'Lifetime value optimization through operations',
    keyDifferentiator: 'Operations focus vs. conversion focus',
    roiComparison: '1–6 month payback vs. conversion optimization'
  }
};

export const marketStats = {
  independentOwnership: '76–90%',
  facialTreatments: '55%',
  healthcareWaste: '$250B',
  marketGrowth: '$87.86B by 2034',
  aiAdoptionCAGR: '47%',
  monthlyWasteRange: '$600–$2,000',
  costReduction: '15%',
  adminEfficiency: '40%',
  paybackPeriod: '1–6 months',
  roiRange: '200–1200%'
};

// Business metrics for data visualization
export const businessMetrics = {
  timeWasted: {
    value: '8+',
    unit: 'hours weekly',
    description: 'lost to manual reconciliation',
    icon: '⏰'
  },
  revenueLoss: {
    value: '$2,500+',
    unit: 'monthly',
    description: 'in missed revenue',
    icon: '💰'
  },
  aiAccuracy: {
    value: '98%',
    unit: 'accuracy',
    description: 'AI matching rate',
    icon: '🧠'
  },
  implementation: {
    value: '24',
    unit: 'hours',
    description: 'setup time',
    icon: '⚡'
  }
};

// Core problem statements
export const problems = [
  {
    id: 'time_loss',
    title: 'Manual Reconciliation Hell',
    icon: '⏰',
    metric: businessMetrics.timeWasted,
    description: 'Spending hours every week manually matching POS transactions with Alle, Aspire, and other rewards programs.',
    badge: '8+ hours per week lost'
  },
  {
    id: 'revenue_loss',
    title: 'Missed Revenue Recovery',
    icon: '💰',
    metric: businessMetrics.revenueLoss,
    description: 'Unmatched transactions mean unclaimed revenue. When loyalty rewards don\'t match your POS, you lose money.',
    badge: '$2,500+ monthly losses'
  },
  {
    id: 'accuracy',
    title: 'Inaccurate Reporting',
    icon: '📊',
    description: 'Without proper reconciliation, your financial reports don\'t reflect reality, making business decisions harder.',
    badge: 'Decision paralysis'
  }
];

// Core solution features (legacy support)
export const coreFeatures = [
  {
    id: 'ai_matching',
    icon: '🧠',
    title: 'Advanced AI Matching',
    description: 'Our AI algorithm accurately matches POS transactions with loyalty rewards, even with naming variations and timing differences.',
    metrics: [businessMetrics.aiAccuracy],
    highlights: ['Pattern recognition', 'Name variation handling', 'Time-shift tolerance'],
    category: 'core'
  },
  {
    id: 'fast_setup',
    icon: '⚡',
    title: '24-Hour Setup',
    description: 'Most medical spas are reconciling within 24 hours. No complex integrations required - just upload your CSV files.',
    metrics: [businessMetrics.implementation],
    highlights: ['No API integration required', 'CSV file upload', 'Guided onboarding'],
    category: 'core'
  },
  {
    id: 'universal_support',
    icon: '📁',
    title: 'Universal CSV Support',
    description: 'Works with any POS system that exports CSV files. Alle, Aspire, and all major loyalty programs supported.',
    highlights: ['Any POS system', 'All loyalty programs', 'Standard CSV format'],
    category: 'core'
  },
  {
    id: 'security',
    icon: '🔐',
    title: 'HIPAA-Conscious Security',
    description: 'Your data is encrypted in transit and at rest. Files are automatically deleted after processing.',
    highlights: ['End-to-end encryption', 'Auto-deletion', 'Compliance ready'],
    category: 'core'
  },
  {
    id: 'reports',
    icon: '📊',
    title: 'Detailed Reports',
    description: 'Export comprehensive reconciliation reports for accounting and business analysis.',
    highlights: ['Excel export', 'Custom date ranges', 'Detailed breakdowns'],
    category: 'core'
  },
  {
    id: 'revenue_recovery',
    icon: '💰',
    title: 'Revenue Recovery',
    description: 'Prevent $2,500+ monthly losses with intelligent matching that finds every unmatched transaction.',
    metrics: [businessMetrics.revenueLoss],
    highlights: ['Automatic detection', 'Revenue tracking', 'Loss prevention'],
    category: 'core'
  }
];

// Professional tier features (coming Q3 2025)
export const professionalFeatures = [
  {
    id: 'automated_scheduling',
    icon: '📅',
    title: 'Automated Scheduling',
    description: 'Schedule reconciliation runs automatically based on your spa\'s workflow.',
    badge: 'Coming Q3 2025',
    category: 'professional'
  },
  {
    id: 'advanced_analytics',
    icon: '📈',
    title: 'Advanced Analytics Dashboard',
    description: 'Deep insights into reconciliation patterns, revenue trends, and optimization opportunities.',
    badge: 'Coming Q3 2025',
    category: 'professional'
  },
  {
    id: 'priority_support',
    icon: '📞',
    title: 'Priority Phone Support',
    description: 'Direct phone line with medical spa operations experts for immediate assistance.',
    badge: 'Coming Q3 2025',
    category: 'professional'
  },
  {
    id: 'custom_integrations',
    icon: '🔌',
    title: 'Custom Integrations',
    description: 'Direct API integrations with your existing POS and management systems.',
    badge: 'Coming Q3 2025',
    category: 'professional'
  }
];

// Solution process steps
export const solutionSteps = [
  {
    step: 1,
    title: 'Upload Your Files',
    description: 'Drag and drop your POS and loyalty program CSV files into our secure interface.',
    icon: '📁',
    timeEstimate: '2 minutes'
  },
  {
    step: 2,
    title: 'AI Processing',
    description: 'Our intelligent matching algorithm analyzes and matches transactions with 98%+ accuracy.',
    icon: '🧠',
    timeEstimate: '5-10 minutes'
  },
  {
    step: 3,
    title: 'Review Results',
    description: 'Review matched and unmatched transactions with detailed explanations and confidence scores.',
    icon: '📊',
    timeEstimate: '10 minutes'
  },
  {
    step: 4,
    title: 'Export Reports',
    description: 'Download comprehensive reconciliation reports for your accounting and analysis needs.',
    icon: '💼',
    timeEstimate: '1 minute'
  }
];

// Trust indicators
export const trustIndicators = [
  {
    label: 'Setup Time',
    value: '24 Hours',
    color: 'emerald'
  },
  {
    label: 'Accuracy Rate',
    value: '98%+',
    color: 'blue'
  },
  {
    label: 'Time Saved',
    value: '8+ Hours/Week',
    color: 'green'
  },
  {
    label: 'Revenue Protected',
    value: '$2,500+/Month',
    color: 'red'
  }
];

// Utility functions for legacy support
export const getFeaturesByCategory = (category) => {
  return features.filter(feature => feature.category === category);
};

export const getCoreFeatures = () => {
  return coreFeatures;
};

export const getProfessionalFeatures = () => {
  return professionalFeatures;
};

export const getMetricByKey = (key) => {
  return businessMetrics[key];
};

export const getProblemByMetric = (metricKey) => {
  return problems.find(problem => problem.metric === businessMetrics[metricKey]);
};