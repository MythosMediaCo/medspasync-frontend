import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function Support() {
  const supportOptions = [
    {
      type: 'Email Support',
      availability: 'All Plans',
      responseTime: '24 hours',
      description: 'Direct access to operations experts who understand reconciliation challenges',
      icon: '📧',
      contact: 'support@medspasyncpro.com',
    },
    {
      type: 'Implementation Support',
      availability: 'All Plans', 
      responseTime: '24 hours',
      description: 'Guided setup to start reconciling within 24 hours',
      icon: '🚀',
      action: 'Email for setup assistance',
    },
    {
      type: 'Priority Phone Support',
      availability: 'Professional Tier',
      responseTime: '4 hours',
      description: 'Direct phone access for urgent reconciliation issues',
      icon: '📞',
      note: 'Scheduled calls available',
    },
    {
      type: 'One-on-One Onboarding',
      availability: 'Professional Tier',
      responseTime: 'Scheduled',
      description: 'Personalized walkthrough of AI reconciliation features',
      icon: '👥',
      note: 'Included in Professional plan',
    },
  ];

  const comingSoonFeatures = [
    {
      feature: 'Live Chat',
      timeline: 'Q3 2025',
      description: 'Instant support during business hours',
    },
    {
      feature: 'Knowledge Base',
      timeline: 'Q3 2025', 
      description: 'Searchable documentation and tutorials',
    },
    {
      feature: 'Video Training Program',
      timeline: 'Q4 2025',
      description: 'Complete reconciliation mastery course',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Operations-Expert Support | MedSpaSync Pro</title>
        <meta 
          name="description" 
          content="Support from medical spa operations experts who understand reconciliation challenges. 24-hour response times, no outsourced chat bots." 
        />
        <meta 
          name="keywords" 
          content="medical spa support, reconciliation help, spa automation consultation, expert support"
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Support That Doesn't Suck
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              If you've ever waited 3 days for a "ticket reply" while losing $2,500+ monthly 
              to reconciliation problems—we built this support system for you.
            </p>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                MedSpaSync Pro is in early release. Every support request is handled directly 
                by our operations team—no bots, no outsourced agents, no corporate scripts.
              </p>
            </div>
          </div>

          {/* Support vs Traditional Comparison */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              MedSpaSync Pro Support vs. Traditional Software Support
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Traditional Support Problems */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 border border-red-200">
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-4">
                  Traditional Software Support
                </h3>
                <ul className="space-y-3 text-red-600 dark:text-red-400">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">❌</span>
                    3+ day response times while revenue bleeds
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">❌</span>
                    Outsourced agents reading generic scripts
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">❌</span>
                    No understanding of spa operations
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">❌</span>
                    "Have you tried turning it off and on again?"
                  </li>
                </ul>
              </div>

              {/* MedSpaSync Pro Support */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-8 border border-emerald-200">
                <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-4">
                  MedSpaSync Pro Support
                </h3>
                <ul className="space-y-3 text-emerald-600 dark:text-emerald-400">
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✅</span>
                    24-hour response guarantee
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✅</span>
                    Direct access to operations experts
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✅</span>
                    Team that understands spa workflows
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✅</span>
                    Solutions focused on eliminating 8+ hour manual work
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-emerald-600 mb-1">24hrs</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-indigo-600 mb-1">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Outsourced Agents</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-1">10+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Years Experience</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-orange-600 mb-1">Direct</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Team Access</div>
            </div>
          </div>

          {/* Support Options */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Support Options</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {supportOptions.map((option, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                  <div className="flex items-start mb-4">
                    <span className="text-3xl mr-4">{option.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{option.type}</h3>
                      <div className="flex gap-4 mb-3">
                        <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-sm">
                          {option.availability}
                        </span>
                        <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                          {option.responseTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{option.description}</p>
                  {option.contact && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                      <a href={`mailto:${option.contact}`} className="hover:underline">
                        {option.contact}
                      </a>
                    </div>
                  )}
                  {option.action && (
                    <div className="text-gray-500 text-sm">{option.action}</div>
                  )}
                  {option.note && (
                    <div className="text-gray-500 text-sm italic">{option.note}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Early Release Benefits */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Early Release Advantages</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold mb-2">Direct Team Access</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Support from the people who built the reconciliation algorithms
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">Priority Response</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  24-hour guaranteed response while we build our support infrastructure
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🗣️</div>
                <h3 className="font-semibold mb-2">Product Influence</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Your feedback directly shapes feature development and priorities
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Expanding Support (Coming Soon)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {comingSoonFeatures.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
                  <h3 className="text-lg font-semibold mb-2">{item.feature}</h3>
                  <div className="text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                    {item.timeline}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Support Philosophy */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Our Support Philosophy</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
              Support isn't a feature—it's your fallback system when reconciliation problems 
              threaten to cost you $2,500+ monthly. We treat it accordingly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@medspasyncpro.com"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Get Support Now
              </a>
              <a 
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Implementation Questions
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}