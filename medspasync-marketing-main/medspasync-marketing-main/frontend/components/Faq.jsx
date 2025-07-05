// src/components/Faq.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FaqItem = ({ question, answer, id, category }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <button
        className="faq-question w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <div className="flex items-center mb-2">
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full mr-3">
                {category}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">{question}</h3>
          </div>
          <svg
            className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </button>
      <div 
        id={id} 
        className={`faq-answer transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">
          <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: answer }} />
        </div>
      </div>
    </div>
  );
};

const Faq = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const faqs = [
    // AI & Accuracy
    { 
      id: 'faq1', 
      category: 'AI & Accuracy',
      question: 'How accurate is the AI matching?', 
      answer: 'MedSpaSync Pro achieves <strong>95%+ matching accuracy</strong> using machine learning algorithms specifically trained on medical spa reconciliation data. Our testing reveals potential for <strong>97%+ match rates</strong> when processing Alle, Aspire, and POS transactions. The AI intelligently handles name variations, date format differences, and partial payments that typically break manual processes.' 
    },
    { 
      id: 'faq2', 
      category: 'AI & Accuracy',
      question: 'What if the AI makes mistakes?', 
      answer: 'All unmatched transactions are clearly flagged in your reports with detailed explanations. You maintain complete control—review flagged items and manually match if needed. Our testing shows that even with manual review of flagged items, total reconciliation time drops from <strong>8+ hours weekly to approximately 15 minutes</strong>.' 
    },
    { 
      id: 'faq3', 
      category: 'AI & Accuracy',
      question: 'Does it work with name variations and typos?', 
      answer: 'Yes. Our fuzzy matching algorithms handle common variations like "Dr. Smith" = "Smith, Dr." = "D. Smith", plus typos, different date formats, and partial payments. This is exactly why manual reconciliation takes <strong>8+ hours weekly</strong>—our AI eliminates this complexity.' 
    },

    // Implementation
    { 
      id: 'faq4', 
      category: 'Implementation',
      question: 'How long does implementation take?', 
      answer: 'Medical spas can start reconciling within <strong>24 hours</strong> of signup. No complex integrations, no API setup, no technical requirements. If your POS system can export CSV files, MedSpaSync Pro can reconcile them. Our team provides guided setup to ensure you\'re operational immediately.' 
    },
    { 
      id: 'faq5', 
      category: 'Implementation',
      question: 'Will this work with our current POS system?', 
      answer: 'If your POS can export CSV files, MedSpaSync Pro can reconcile them. We support all major medical spa POS systems including Vagaro, Mindbody, Nextech, and others. No API dependencies or complex integrations required—just CSV file uploads.' 
    },
    { 
      id: 'faq6', 
      category: 'Implementation',
      question: 'Do we need technical staff to operate this?', 
      answer: 'No technical expertise required. The process is: (1) Export CSV files from your POS and rewards platforms, (2) Upload to MedSpaSync Pro, (3) Download your reconciled PDF report. Most spa managers complete reconciliation in <strong>15 minutes</strong> after a brief onboarding.' 
    },

    // Business Impact
    { 
      id: 'faq7', 
      category: 'Business Impact',
      question: 'How much time will this actually save us?', 
      answer: 'Our analysis shows medical spas typically spend <strong>8+ hours weekly</strong> on manual reconciliation. With 95%+ AI accuracy, this transforms to approximately <strong>15 minutes of review time</strong>. That\'s over 400 hours annually returned to patient care and revenue-generating activities.' 
    },
    { 
      id: 'faq8', 
      category: 'Business Impact',
      question: 'What about the revenue recovery you mention?', 
      answer: 'Unmatched transactions mean unclaimed rewards and billing discrepancies that cost spas <strong>$2,500+ monthly</strong> in missed revenue. Our AI catches these mismatches automatically, helping you recover revenue that would otherwise be lost to manual oversight errors.' 
    },
    { 
      id: 'faq9', 
      category: 'Business Impact',
      question: 'Is this worth it for smaller spas?', 
      answer: 'Absolutely. Even single-location spas lose significant time to reconciliation. At <strong>$299/month</strong>, the ROI is immediate when you consider the labor cost of 8+ hours weekly manual work plus the <strong>$2,500+ monthly</strong> revenue recovery potential.' 
    },

    // Security & Compliance
    { 
      id: 'faq10', 
      category: 'Security',
      question: 'How secure is our data?', 
      answer: 'We follow HIPAA-conscious design principles with <strong>zero permanent storage</strong>. Files are encrypted during processing and automatically deleted upon completion. No email required for demo. No backup copies. Your data never sits on our servers—it\'s processed and purged.' 
    },
    { 
      id: 'faq11', 
      category: 'Security',
      question: 'Are you HIPAA compliant?', 
      answer: 'While MedSpaSync Pro is not a covered entity, we operate with HIPAA-conscious design: encrypted processing, automatic file deletion, and zero permanent storage. We handle reconciliation data with the same security standards you\'d expect for protected health information.' 
    },

    // Support & Pricing
    { 
      id: 'faq12', 
      category: 'Support',
      question: 'What kind of support do you provide?', 
      answer: 'Support from medical spa operations experts who understand reconciliation challenges—not outsourced chat bots. <strong>24-hour response guarantee</strong> via email, with guided implementation included. Our team knows spa workflows because we\'ve lived them.' 
    },
    { 
      id: 'faq13', 
      category: 'Pricing',
      question: 'Why is this better than our current all-in-one platform?', 
      answer: 'All-in-one platforms promise "adequate everything" but deliver perfect nothing. We focus exclusively on reconciliation intelligence, achieving <strong>95%+ accuracy</strong> where generalist platforms struggle. Our analysis shows why <a href="/insights/software-integration-failures" class="text-emerald-600 hover:text-emerald-700">all-in-one platforms fail at reconciliation</a>.' 
    },
    { 
      id: 'faq14', 
      category: 'Pricing',
      question: 'Can we try it before purchasing?', 
      answer: 'Yes. <a href="https://demo.medspasyncpro.com" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:text-emerald-700">Try our live demo</a> with real reconciliation scenarios. No email required. Plus, we offer a <strong>30-day money-back guarantee</strong>—if MedSpaSync Pro doesn\'t save you significant time and recover revenue, we\'ll refund completely.' 
    },
  ];

  const categories = ['all', 'AI & Accuracy', 'Implementation', 'Business Impact', 'Security', 'Support', 'Pricing'];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <section id="faq" className="bg-gradient-to-b from-gray-50 to-white py-16 px-6 rounded-2xl mb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Questions About Eliminating Manual Reconciliation?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Answers from medical spa operations experts who understand the 8+ hours weekly 
            and $2,500+ monthly cost of reconciliation problems.
          </p>
          
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === category
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200'
                }`}
              >
                {category === 'all' ? 'All Questions' : category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-12">
          {filteredFaqs.map(faq => (
            <FaqItem key={faq.id} {...faq} />
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <div className="bg-emerald-50 rounded-xl p-8 border border-emerald-200 text-center">
          <h3 className="text-xl font-semibold text-emerald-800 mb-4">
            Still Have Questions About Implementation?
          </h3>
          <p className="text-emerald-700 mb-6">
            Our operations experts respond within 24 hours with actionable solutions. 
            No sales pitch—just real support from people who understand spa workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@medspasyncpro.com"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <span className="mr-2">📧</span>
              Ask Operations Expert
            </a>
            <a
              href="https://demo.medspasyncpro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg border border-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <span className="mr-2">🎯</span>
              Try Live Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Faq;