import React, { useState, useEffect } from 'react';
import Button from './Button';

/**
 * Documentation Agent Component - AI-Powered Help System
 * 
 * Features:
 * - Interactive help system with contextual guidance
 * - Step-by-step tutorials
 * - FAQ integration
 * - Real-time assistance
 */
const DocumentationAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTopics, setFilteredTopics] = useState([]);

  const helpTopics = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      category: 'Setup',
      description: 'Quick start guide for new users',
      content: {
        steps: [
          {
            title: 'Create Your Account',
            description: 'Sign up with your medical spa email address',
            duration: '2 minutes'
          },
          {
            title: 'Upload Your First Files',
            description: 'Export CSV files from your POS and loyalty programs',
            duration: '5 minutes'
          },
          {
            title: 'Review AI Matches',
            description: 'Check the automated matching results and confidence scores',
            duration: '10 minutes'
          },
          {
            title: 'Export Reports',
            description: 'Download reconciliation reports for your accounting team',
            duration: '1 minute'
          }
        ],
        tips: [
          'Ensure your CSV files include transaction dates and amounts',
          'Use consistent naming conventions for better matching',
          'Review unmatched transactions for potential manual matches'
        ]
      }
    },
    {
      id: 'file-formats',
      title: 'Supported File Formats',
      icon: '📁',
      category: 'Technical',
      description: 'Learn about supported POS and loyalty program exports',
      content: {
        formats: [
          {
            system: 'Alle',
            format: 'CSV Export',
            fields: ['Date', 'Patient Name', 'Service', 'Amount', 'Payment Method'],
            notes: 'Standard export from Alle dashboard'
          },
          {
            system: 'Aspire',
            format: 'CSV Export',
            fields: ['Date', 'Client Name', 'Treatment', 'Cost', 'Payment Type'],
            notes: 'Available in Aspire reporting section'
          },
          {
            system: 'Square',
            format: 'CSV Export',
            fields: ['Date', 'Customer', 'Item Name', 'Gross Sales', 'Payment Method'],
            notes: 'Export from Square dashboard'
          },
          {
            system: 'Generic CSV',
            format: 'Custom Format',
            fields: ['Date', 'Customer', 'Service', 'Amount', 'Payment'],
            notes: 'Any CSV with similar structure'
          }
        ],
        requirements: [
          'Files must be in CSV format',
          'Include transaction date and amount',
          'Maximum file size: 50MB',
          'Support for multiple file uploads'
        ]
      }
    },
    {
      id: 'ai-matching',
      title: 'Understanding AI Matching',
      icon: '🧠',
      category: 'Features',
      description: 'How our AI algorithm matches transactions',
      content: {
        process: [
          {
            step: 'Pattern Recognition',
            description: 'AI identifies common naming patterns and variations',
            examples: ['"Facial Treatment" matches "Facial"', '"Botox Injection" matches "Botox"']
          },
          {
            step: 'Fuzzy Matching',
            description: 'Handles typos, abbreviations, and slight variations',
            examples: ['"Microdermabrasion" matches "Microderm"', '"Chemical Peel" matches "Chem Peel"']
          },
          {
            step: 'Time Correlation',
            description: 'Matches transactions within a reasonable time window',
            examples: ['Same day transactions', 'Within 24-48 hour window']
          },
          {
            step: 'Confidence Scoring',
            description: 'Each match receives a confidence score from 0-100%',
            examples: ['95%+ = High confidence', '70-94% = Medium confidence', '<70% = Low confidence']
          }
        ],
        accuracy: {
          overall: '98%',
          factors: [
            'Consistent naming conventions',
            'Complete transaction data',
            'Regular reconciliation frequency',
            'Quality of source data'
          ]
        }
      }
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: '📊',
      category: 'Features',
      description: 'Understanding your reconciliation reports',
      content: {
        reportTypes: [
          {
            name: 'Reconciliation Summary',
            description: 'Overview of matched and unmatched transactions',
            includes: ['Total transactions', 'Match rate', 'Revenue recovered', 'Processing time']
          },
          {
            name: 'Detailed Match Report',
            description: 'Line-by-line matching results with confidence scores',
            includes: ['Individual transactions', 'Confidence scores', 'Match explanations', 'Manual review flags']
          },
          {
            name: 'Revenue Recovery Report',
            description: 'Financial impact of reconciliation process',
            includes: ['Recovered amounts', 'Lost revenue analysis', 'ROI calculations', 'Trend analysis']
          },
          {
            name: 'Export for Accounting',
            description: 'Formatted reports for your accounting team',
            includes: ['Excel format', 'QuickBooks compatibility', 'Custom date ranges', 'Department breakdowns']
          }
        ],
        scheduling: 'Reports can be generated on-demand or scheduled for automatic delivery'
      }
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: '🔧',
      category: 'Support',
      description: 'Common issues and solutions',
      content: {
        issues: [
          {
            problem: 'Low match rate',
            cause: 'Inconsistent naming between POS and loyalty programs',
            solution: 'Review unmatched transactions and standardize naming conventions'
          },
          {
            problem: 'File upload errors',
            cause: 'Large file size or unsupported format',
            solution: 'Ensure files are under 50MB and in CSV format'
          },
          {
            problem: 'Missing transactions',
            cause: 'Incomplete data export from source systems',
            solution: 'Verify all transactions are included in CSV exports'
          },
          {
            problem: 'Slow processing',
            cause: 'Large number of transactions or complex matching',
            solution: 'Process files in smaller batches or during off-peak hours'
          }
        ],
        contact: 'For additional support, contact our team at support@medspasyncpro.com'
      }
    }
  ];

  useEffect(() => {
    if (searchQuery) {
      const filtered = helpTopics.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTopics(filtered);
    } else {
      setFilteredTopics(helpTopics);
    }
  }, [searchQuery]);

  const openTopic = (topic) => {
    setCurrentTopic(topic);
  };

  const closeTopic = () => {
    setCurrentTopic(null);
  };

  const renderTopicContent = (topic) => {
    switch (topic.id) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-title-medium text-brand-primary mb-4">Step-by-Step Guide</h4>
              <div className="space-y-4">
                {topic.content.steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-neutral-700 mb-1">{step.title}</h5>
                      <p className="text-body-small text-neutral-600 mb-2">{step.description}</p>
                      <span className="text-body-small text-emerald-600 font-medium">Duration: {step.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-title-medium text-brand-primary mb-4">Pro Tips</h4>
              <ul className="space-y-2">
                {topic.content.tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-emerald-500 mt-1">💡</span>
                    <span className="text-body text-neutral-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'file-formats':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-title-medium text-brand-primary mb-4">Supported Systems</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topic.content.formats.map((format, index) => (
                  <div key={index} className="info-card">
                    <h5 className="font-medium text-neutral-700 mb-2">{format.system}</h5>
                    <p className="text-body-small text-neutral-600 mb-3">{format.notes}</p>
                    <div className="text-body-small text-neutral-500">
                      <strong>Fields:</strong> {format.fields.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-title-medium text-brand-primary mb-4">Requirements</h4>
              <ul className="space-y-2">
                {topic.content.requirements.map((req, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span className="text-body text-neutral-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'ai-matching':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-title-medium text-brand-primary mb-4">AI Matching Process</h4>
              <div className="space-y-4">
                {topic.content.process.map((step, index) => (
                  <div key={index} className="info-card">
                    <h5 className="font-medium text-neutral-700 mb-2">{step.step}</h5>
                    <p className="text-body-small text-neutral-600 mb-3">{step.description}</p>
                    <div className="text-body-small text-neutral-500">
                      <strong>Examples:</strong> {step.examples.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="info-card text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">{topic.content.accuracy.overall}</div>
                <div className="text-body-small text-neutral-600">Overall Accuracy</div>
              </div>
              <div className="info-card">
                <h5 className="font-medium text-neutral-700 mb-3">Accuracy Factors</h5>
                <ul className="space-y-2">
                  {topic.content.accuracy.factors.map((factor, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span className="text-body-small text-neutral-700">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-title-medium text-brand-primary mb-4">Available Reports</h4>
              <div className="space-y-4">
                {topic.content.reportTypes.map((report, index) => (
                  <div key={index} className="info-card">
                    <h5 className="font-medium text-neutral-700 mb-2">{report.name}</h5>
                    <p className="text-body-small text-neutral-600 mb-3">{report.description}</p>
                    <div className="text-body-small text-neutral-500">
                      <strong>Includes:</strong> {report.includes.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="info-card">
              <h5 className="font-medium text-neutral-700 mb-2">Report Scheduling</h5>
              <p className="text-body text-neutral-600">{topic.content.scheduling}</p>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-title-medium text-brand-primary mb-4">Common Issues</h4>
              <div className="space-y-4">
                {topic.content.issues.map((issue, index) => (
                  <div key={index} className="info-card">
                    <h5 className="font-medium text-red-600 mb-2">{issue.problem}</h5>
                    <div className="mb-3">
                      <strong className="text-neutral-700">Cause:</strong>
                      <p className="text-body-small text-neutral-600 mt-1">{issue.cause}</p>
                    </div>
                    <div>
                      <strong className="text-neutral-700">Solution:</strong>
                      <p className="text-body-small text-neutral-600 mt-1">{issue.solution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="info-card bg-blue-50 border-blue-200">
              <h5 className="font-medium text-blue-700 mb-2">Need More Help?</h5>
              <p className="text-body text-blue-600">{topic.content.contact}</p>
            </div>
          </div>
        );

      default:
        return <div>Content not available</div>;
    }
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-xl z-50"
        aria-label="Open help documentation"
      >
        ?
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📚</div>
                <div>
                  <h3 className="text-title-medium text-brand-primary">Documentation & Help</h3>
                  <p className="text-body-small text-neutral-600">Find answers and learn how to use MedSpaSync Pro</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCurrentTopic(null);
                  setSearchQuery('');
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex h-[calc(90vh-120px)]">
              {/* Sidebar */}
              <div className="w-80 border-r border-neutral-200 p-6 overflow-y-auto">
                {/* Search */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search help topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Topics */}
                <div className="space-y-2">
                  {filteredTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => openTopic(topic)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        currentTopic?.id === topic.id
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : 'hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{topic.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{topic.title}</div>
                          <div className="text-body-small text-neutral-500">{topic.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {currentTopic ? (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="text-2xl">{currentTopic.icon}</span>
                      <div>
                        <h2 className="text-title-large text-brand-primary">{currentTopic.title}</h2>
                        <p className="text-body text-neutral-600">{currentTopic.description}</p>
                      </div>
                    </div>
                    {renderTopicContent(currentTopic)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-title-medium text-neutral-700 mb-2">Welcome to Help Center</h3>
                    <p className="text-body text-neutral-600 mb-6">
                      Select a topic from the sidebar to get started, or search for specific help content.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      {helpTopics.slice(0, 4).map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => openTopic(topic)}
                          className="p-4 border border-neutral-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{topic.icon}</span>
                            <div>
                              <div className="font-medium text-neutral-700">{topic.title}</div>
                              <div className="text-body-small text-neutral-500">{topic.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentationAgent; 