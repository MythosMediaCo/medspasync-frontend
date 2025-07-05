// frontend/src/pages/InsightsPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function InsightsPage() {
  const { showToast } = useToast();

  const handlePreviewClick = (label) => {
    showToast(`Opening insight: ${label}`, 'info');
  };

  const insights = [
    {
      slug: 'hidden-costs-of-integration',
      title: 'The $2,500+ Monthly Cost of Manual Reconciliation',
      description: 'Manual reconciliation wastes 8+ hours weekly and creates $2,500+ monthly in missed revenue. We analyzed the hidden operational costs destroying spa profitability.',
      image: '/images/reconciliation-costs.png',
      category: 'Financial Operations',
      readTime: '8 min read',
      featured: true
    },
    {
      slug: 'software-integration-failures',
      title: 'Why All-in-One Platforms Fail at Financial Reconciliation',
      description: 'Adequate everything vs. perfect reconciliation. Our analysis of why spa software integration promises rarely deliver on financial accuracy.',
      image: '/images/software-integration.png',
      category: 'Technology Analysis',
      readTime: '12 min read'
    },
    {
      slug: 'hipaa-compliance',
      title: 'HIPAA-Conscious Automation for Medical Spas',
      description: 'Security-first reconciliation without compliance risk. How intelligent automation maintains HIPAA standards while eliminating manual processes.',
      image: '/images/hipaa-checklist.png',
      category: 'Compliance',
      readTime: '6 min read'
    },
    {
      slug: 'ai-accuracy-medical-spas',
      title: 'How 95%+ AI Accuracy Eliminates Reconciliation Nightmares',
      description: 'Machine learning achieves 95%+ matching accuracy by handling format variations that trip up manual processes. Real spa results and methodology.',
      image: '/images/ai-accuracy.png',
      category: 'AI Technology',
      readTime: '10 min read'
    },
    {
      slug: 'alle-aspire-reconciliation-guide',
      title: 'Complete Guide to Alle and Aspire Reconciliation',
      description: 'Step-by-step analysis of why loyalty program reconciliation fails and how AI matching solves format inconsistencies automatically.',
      image: '/images/loyalty-reconciliation.png',
      category: 'Operational Guide',
      readTime: '15 min read'
    },
    {
      slug: 'spa-financial-reporting-accuracy',
      title: 'From Decision Paralysis to Data-Driven Growth',
      description: 'Inaccurate financial reports undermine strategic decisions. How precise reconciliation enables confident business growth.',
      image: '/images/financial-accuracy.png',
      category: 'Business Strategy',
      readTime: '7 min read'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Medical Spa Reconciliation Insights | MedSpaSync Pro</title>
        <meta 
          name="description" 
          content="Research-backed insights on medical spa reconciliation challenges. Stop losing 8+ hours weekly and $2,500+ monthly to manual processes." 
        />
        <meta name="keywords" content="medical spa reconciliation, alle aspire reconciliation, spa financial reporting, AI automation, HIPAA compliance" />
      </Helmet>

      <section className="pt-24 pb-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full px-4 py-2 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
              Operational Intelligence from the Field
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight gradient-text">
              Stop Losing Revenue to<br />
              Reconciliation Problems
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Research-backed insights on the operational challenges costing medical spas 
              <strong> 8+ hours weekly</strong> and <strong>$2,500+ monthly</strong> in missed revenue.
            </p>

            {/* Impact Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">8+ hrs</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Weekly Time Waste</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">$2,500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue Loss</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 mb-1">95%+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">AI Solution Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Insight */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full px-3 py-1 text-sm font-medium mb-4">
                  Featured Analysis
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  The Hidden $2,500+ Monthly Cost of Manual Reconciliation
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Our comprehensive analysis reveals how manual reconciliation creates cascading 
                  operational costs beyond the obvious time waste. Real spa data shows the 
                  true financial impact of reconciliation errors.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm text-gray-500">12 min read</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">Financial Operations</span>
                </div>
                <Link
                  to="/insights/hidden-costs-of-integration"
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  onClick={() => handlePreviewClick('Hidden Costs Analysis')}
                >
                  Read Full Analysis
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div>
                <img 
                  src="/images/reconciliation-costs.png" 
                  alt="Cost Analysis" 
                  className="w-full h-64 object-cover rounded-xl shadow-lg" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Insights Grid */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">All Operational Insights</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Data-driven analysis of medical spa reconciliation challenges and solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {insights.map((insight) => (
              <Link
                key={insight.slug}
                to={`/insights/${insight.slug}`}
                className="block bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                onClick={() => handlePreviewClick(insight.title)}
              >
                <div className="relative">
                  <img 
                    src={insight.image} 
                    alt={insight.title} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                      {insight.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {insight.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{insight.readTime}</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Context Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Why These Insights Matter</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Every article addresses real operational challenges we've identified through 
            extensive spa reconciliation research. These aren't theoretical problems — 
            they're costing spas measurable time and revenue every month.
          </p>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-8">
            <blockquote className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-4">
              "Our research shows spas spend 8+ hours weekly on manual reconciliation, 
              missing $2,500+ monthly in revenue from unmatched transactions."
            </blockquote>
            <cite className="text-sm text-gray-600 dark:text-gray-400">
              MedSpaSync Pro Operational Research Team
            </cite>
          </div>
        </div>
      </section>
    </>
  );
}