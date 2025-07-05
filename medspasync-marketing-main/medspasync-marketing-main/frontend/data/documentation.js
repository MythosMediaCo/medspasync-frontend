// MedSpaSync Pro Documentation System
// Comprehensive help content, tutorials, and guides

export const documentationCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    description: 'Quick start guides and onboarding',
    color: 'emerald'
  },
  {
    id: 'features',
    title: 'Features & Capabilities',
    icon: '⚡',
    description: 'Learn about AI reconciliation features',
    color: 'blue'
  },
  {
    id: 'technical',
    title: 'Technical Guides',
    icon: '🔧',
    description: 'Technical setup and configuration',
    color: 'purple'
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: '📚',
    description: 'Optimization and efficiency tips',
    color: 'orange'
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🛠️',
    description: 'Common issues and solutions',
    color: 'red'
  },
  {
    id: 'api',
    title: 'API & Integrations',
    icon: '🔌',
    description: 'Developer documentation and APIs',
    color: 'indigo'
  }
];

export const quickStartGuide = {
  title: 'Quick Start Guide',
  description: 'Get up and running with MedSpaSync Pro in under 30 minutes',
  steps: [
    {
      step: 1,
      title: 'Create Your Account',
      description: 'Sign up with your medical spa email address',
      duration: '2 minutes',
      details: [
        'Visit medspasyncpro.com and click "Start Free Trial"',
        'Enter your medical spa email address',
        'Create a secure password',
        'Verify your email address'
      ],
      tips: [
        'Use your business email for better account management',
        'Enable two-factor authentication for enhanced security'
      ]
    },
    {
      step: 2,
      title: 'Prepare Your Data',
      description: 'Export CSV files from your POS and loyalty programs',
      duration: '5 minutes',
      details: [
        'Export transaction data from your POS system',
        'Export loyalty program data',
        'Ensure files include dates, amounts, and customer names',
        'Save files in CSV format'
      ],
      tips: [
        'Use consistent date formats (MM/DD/YYYY recommended)',
        'Include all transaction types you want to reconcile',
        'Export data for the same time period from both systems'
      ]
    },
    {
      step: 3,
      title: 'Upload Files',
      description: 'Upload your CSV files to MedSpaSync Pro',
      duration: '3 minutes',
      details: [
        'Navigate to the Upload section',
        'Drag and drop your CSV files',
        'Select file types (POS vs Loyalty)',
        'Confirm upload and processing'
      ],
      tips: [
        'Files under 50MB upload faster',
        'You can upload multiple files at once',
        'Processing typically takes 5-10 minutes'
      ]
    },
    {
      step: 4,
      title: 'Review AI Matches',
      description: 'Check automated matching results and confidence scores',
      duration: '10 minutes',
      details: [
        'Review matched transactions with confidence scores',
        'Check unmatched transactions for manual review',
        'Understand match explanations',
        'Verify accuracy of matches'
      ],
      tips: [
        'Focus on low-confidence matches first',
        'Use match explanations to understand AI decisions',
        'Flag any incorrect matches for system learning'
      ]
    },
    {
      step: 5,
      title: 'Export Reports',
      description: 'Download reconciliation reports for your accounting team',
      duration: '1 minute',
      details: [
        'Generate summary reports',
        'Export detailed match reports',
        'Download accounting-ready formats',
        'Schedule automatic report delivery'
      ],
      tips: [
        'Save reports with descriptive names',
        'Set up automatic weekly report delivery',
        'Share reports with your accounting team'
      ]
    }
  ],
  estimatedTime: '30 minutes',
  prerequisites: [
    'Access to your POS system export functionality',
    'Access to your loyalty program export functionality',
    'Basic understanding of CSV file formats'
  ]
};

export const featureGuides = {
  aiMatching: {
    title: 'AI-Powered Transaction Matching',
    description: 'Understanding how our AI algorithm matches transactions',
    content: {
      overview: 'Our AI uses advanced machine learning to match POS transactions with loyalty program entries, even when naming conventions differ.',
      process: [
        {
          phase: 'Data Preprocessing',
          description: 'Clean and standardize transaction data',
          details: [
            'Remove special characters and formatting',
            'Standardize date formats',
            'Normalize service names',
            'Extract key identifiers'
          ]
        },
        {
          phase: 'Pattern Recognition',
          description: 'Identify common naming patterns and variations',
          details: [
            'Learn from your historical data',
            'Recognize abbreviations and synonyms',
            'Handle different naming conventions',
            'Adapt to your specific terminology'
          ]
        },
        {
          phase: 'Fuzzy Matching',
          description: 'Match transactions with similar but not identical names',
          details: [
            'Handle typos and spelling variations',
            'Match abbreviated service names',
            'Account for different word orders',
            'Use phonetic matching for names'
          ]
        },
        {
          phase: 'Confidence Scoring',
          description: 'Assign confidence scores to each match',
          details: [
            '95%+ = High confidence (automatic match)',
            '70-94% = Medium confidence (review recommended)',
            '<70% = Low confidence (manual review required)',
            'Factors include name similarity, timing, and amounts'
          ]
        }
      ],
      accuracy: {
        overall: '98%',
        factors: [
          'Consistent naming conventions in source data',
          'Complete transaction information',
          'Regular reconciliation frequency',
          'Quality of historical training data'
        ],
        improvement: [
          'System learns from your corrections',
          'Accuracy improves over time',
          'Custom patterns for your specific needs',
          'Regular algorithm updates'
        ]
      }
    }
  },
  reporting: {
    title: 'Reports & Analytics',
    description: 'Comprehensive reporting and analytics capabilities',
    content: {
      reportTypes: [
        {
          name: 'Reconciliation Summary',
          description: 'High-level overview of reconciliation results',
          includes: [
            'Total transactions processed',
            'Match rate percentage',
            'Revenue recovered amount',
            'Processing time metrics',
            'Accuracy trends over time'
          ],
          useCase: 'Executive reporting and performance tracking'
        },
        {
          name: 'Detailed Match Report',
          description: 'Line-by-line matching results with explanations',
          includes: [
            'Individual transaction details',
            'Confidence scores for each match',
            'Match explanations and reasoning',
            'Manual review flags',
            'Source system information'
          ],
          useCase: 'Detailed analysis and manual review'
        },
        {
          name: 'Revenue Recovery Report',
          description: 'Financial impact analysis of reconciliation process',
          includes: [
            'Recovered revenue amounts',
            'Lost revenue analysis',
            'ROI calculations',
            'Cost savings metrics',
            'Trend analysis over time'
          ],
          useCase: 'Financial reporting and business case development'
        },
        {
          name: 'Accounting Export',
          description: 'Formatted reports for accounting systems',
          includes: [
            'QuickBooks compatible format',
            'Excel spreadsheet export',
            'Custom date ranges',
            'Department breakdowns',
            'Audit trail information'
          ],
          useCase: 'Integration with accounting workflows'
        }
      ],
      scheduling: {
        options: [
          'On-demand report generation',
          'Scheduled weekly reports',
          'Monthly summary reports',
          'Custom frequency settings'
        ],
        delivery: [
          'Email delivery',
          'Dashboard download',
          'API access for integrations',
          'Cloud storage export'
        ]
      }
    }
  }
};

export const troubleshootingGuide = {
  title: 'Troubleshooting Guide',
  description: 'Common issues and their solutions',
  issues: [
    {
      problem: 'Low match rate',
      symptoms: [
        'Match rate below 80%',
        'Many unmatched transactions',
        'Inconsistent results'
      ],
      causes: [
        'Inconsistent naming between POS and loyalty programs',
        'Missing or incomplete transaction data',
        'Different date formats or time zones',
        'New services not yet learned by AI'
      ],
      solutions: [
        'Review and standardize naming conventions',
        'Ensure all required fields are included in exports',
        'Verify date formats are consistent',
        'Manually match some transactions to train the AI',
        'Contact support for custom pattern training'
      ],
      prevention: [
        'Establish naming conventions early',
        'Regular reconciliation to build AI knowledge',
        'Consistent data export processes',
        'Regular review of unmatched transactions'
      ]
    },
    {
      problem: 'File upload errors',
      symptoms: [
        'Upload fails or times out',
        'File format errors',
        'Processing errors'
      ],
      causes: [
        'File size exceeds 50MB limit',
        'Unsupported file format',
        'Corrupted CSV files',
        'Network connectivity issues'
      ],
      solutions: [
        'Split large files into smaller chunks',
        'Ensure files are in CSV format',
        'Re-export files from source systems',
        'Check internet connection and try again',
        'Contact support for file format assistance'
      ],
      prevention: [
        'Regular file size monitoring',
        'Use standard CSV export formats',
        'Verify file integrity before upload',
        'Stable internet connection'
      ]
    },
    {
      problem: 'Slow processing times',
      symptoms: [
        'Processing takes longer than expected',
        'System appears unresponsive',
        'Timeout errors'
      ],
      causes: [
        'Large number of transactions',
        'Complex matching requirements',
        'System resource limitations',
        'Network latency'
      ],
      solutions: [
        'Process files in smaller batches',
        'Schedule processing during off-peak hours',
        'Optimize file formats and data quality',
        'Contact support for performance optimization'
      ],
      prevention: [
        'Regular data cleanup and optimization',
        'Efficient file preparation',
        'Scheduled processing during low-usage periods'
      ]
    },
    {
      problem: 'Incorrect matches',
      symptoms: [
        'Wrong transactions matched together',
        'High confidence but incorrect matches',
        'Manual corrections needed frequently'
      ],
      causes: [
        'Similar transaction names',
        'Insufficient distinguishing data',
        'AI learning from incorrect manual matches',
        'Data quality issues'
      ],
      solutions: [
        'Review and correct incorrect matches',
        'Add more distinguishing data to exports',
        'Use manual review for low-confidence matches',
        'Contact support for pattern refinement'
      ],
      prevention: [
        'Include unique identifiers in exports',
        'Regular review of high-confidence matches',
        'Consistent data quality standards',
        'Proper training of AI system'
      ]
    }
  ],
  contactSupport: {
    when: [
      'Issues persist after trying solutions',
      'System errors or crashes',
      'Performance problems',
      'Feature requests or enhancements'
    ],
    how: [
      'Email: support@medspasyncpro.com',
      'Phone: 1-800-MEDSPA-SYNC',
      'Live chat: Available during business hours',
      'Help center: Comprehensive documentation'
    ],
    information: [
      'Detailed error messages',
      'Steps to reproduce the issue',
      'Screenshots or screen recordings',
      'System information and browser details'
    ]
  }
};

export const bestPractices = {
  title: 'Best Practices',
  description: 'Optimize your reconciliation process for maximum efficiency',
  categories: [
    {
      title: 'Data Preparation',
      practices: [
        {
          practice: 'Standardize naming conventions',
          description: 'Use consistent service names across all systems',
          benefits: ['Higher match rates', 'Reduced manual review', 'Faster processing'],
          implementation: [
            'Create a service name master list',
            'Train staff on naming conventions',
            'Regular audits of naming consistency',
            'Update conventions as services change'
          ]
        },
        {
          practice: 'Include complete transaction data',
          description: 'Export all relevant fields for better matching',
          benefits: ['More accurate matches', 'Better confidence scoring', 'Reduced unmatched transactions'],
          implementation: [
            'Include customer names, dates, amounts',
            'Add unique transaction identifiers',
            'Include payment method information',
            'Export all transaction types'
          ]
        },
        {
          practice: 'Regular data exports',
          description: 'Establish consistent export schedules',
          benefits: ['Timely reconciliation', 'Better trend analysis', 'Reduced backlog'],
          implementation: [
            'Set up weekly export schedules',
            'Automate export processes where possible',
            'Verify export completeness',
            'Maintain export logs'
          ]
        }
      ]
    },
    {
      title: 'Process Optimization',
      practices: [
        {
          practice: 'Regular reconciliation frequency',
          description: 'Reconcile transactions weekly or bi-weekly',
          benefits: ['Faster issue identification', 'Better cash flow management', 'Reduced complexity'],
          implementation: [
            'Schedule regular reconciliation sessions',
            'Set up automated reminders',
            'Allocate dedicated time for review',
            'Track reconciliation metrics'
          ]
        },
        {
          practice: 'Review and correct matches',
          description: 'Regularly review and correct AI matches',
          benefits: ['Improved AI accuracy', 'Better training data', 'Reduced future errors'],
          implementation: [
            'Review low-confidence matches first',
            'Correct incorrect matches promptly',
            'Provide feedback on match quality',
            'Monitor accuracy trends'
          ]
        },
        {
          practice: 'Document reconciliation processes',
          description: 'Maintain clear documentation of procedures',
          benefits: ['Consistent processes', 'Easier training', 'Better compliance'],
          implementation: [
            'Create step-by-step procedures',
            'Document naming conventions',
            'Maintain troubleshooting guides',
            'Regular process reviews and updates'
          ]
        }
      ]
    },
    {
      title: 'Team Training',
      practices: [
        {
          practice: 'Train staff on reconciliation process',
          description: 'Ensure all team members understand the process',
          benefits: ['Consistent execution', 'Better error identification', 'Improved efficiency'],
          implementation: [
            'Create training materials',
            'Conduct regular training sessions',
            'Provide hands-on practice',
            'Assess competency regularly'
          ]
        },
        {
          practice: 'Establish review procedures',
          description: 'Set up systematic review of reconciliation results',
          benefits: ['Quality assurance', 'Error prevention', 'Process improvement'],
          implementation: [
            'Define review responsibilities',
            'Set up review checklists',
            'Establish escalation procedures',
            'Document review findings'
          ]
        }
      ]
    }
  ]
};

export const apiDocumentation = {
  title: 'API Documentation',
  description: 'Developer resources for integrating with MedSpaSync Pro',
  overview: 'MedSpaSync Pro provides a comprehensive REST API for integrating reconciliation capabilities into your existing systems.',
  authentication: {
    method: 'Bearer Token',
    description: 'All API requests require a valid Bearer token in the Authorization header',
    example: 'Authorization: Bearer your-api-token-here'
  },
  endpoints: [
    {
      endpoint: 'POST /api/v1/reconcile',
      description: 'Submit files for reconciliation',
      parameters: {
        files: 'Array of file objects (CSV format)',
        options: 'Reconciliation options object'
      },
      response: {
        jobId: 'Unique job identifier',
        status: 'Processing status',
        estimatedTime: 'Estimated completion time'
      }
    },
    {
      endpoint: 'GET /api/v1/reconcile/{jobId}',
      description: 'Get reconciliation job status and results',
      parameters: {
        jobId: 'Job identifier from reconciliation request'
      },
      response: {
        status: 'Job status (processing, completed, failed)',
        results: 'Reconciliation results object',
        metrics: 'Performance metrics'
      }
    },
    {
      endpoint: 'GET /api/v1/reports',
      description: 'Generate and retrieve reports',
      parameters: {
        type: 'Report type (summary, detailed, revenue)',
        dateRange: 'Date range for report',
        format: 'Output format (json, csv, pdf)'
      },
      response: {
        reportUrl: 'URL to download report',
        reportId: 'Unique report identifier',
        metadata: 'Report metadata'
      }
    }
  ],
  rateLimits: {
    requests: '1000 requests per hour',
    fileSize: '50MB per file',
    concurrentJobs: '5 concurrent reconciliation jobs'
  },
  webhooks: {
    description: 'Receive real-time notifications about reconciliation events',
    events: [
      'reconciliation.completed',
      'reconciliation.failed',
      'report.generated',
      'accuracy.threshold.exceeded'
    ],
    format: 'JSON payload with event details'
  }
};

// Export all documentation data
export const documentationData = {
  categories: documentationCategories,
  quickStart: quickStartGuide,
  features: featureGuides,
  troubleshooting: troubleshootingGuide,
  bestPractices: bestPractices,
  api: apiDocumentation
}; 