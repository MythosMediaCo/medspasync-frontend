import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SupportPage() {
  const supportOptions = [
    {
      type: 'Email Support',
      availability: 'All Plans',
      responseTime: '24 hours',
      description: 'Direct access to our operations team for reconciliation questions, implementation guidance, and technical troubleshooting.',
      contact: 'support@medspasyncpro.com',
      icon: '📧'
    },
    {
      type: 'Implementation Support',
      availability: 'All Plans',
      responseTime: '24 hours',
      description: 'Step-by-step guidance for CSV uploads, workflow optimization, and getting your first reconciliation completed.',
      contact: 'Get started via email',
      icon: '🚀'
    },
    {
      type: 'Priority Phone Support',
      availability: 'Professional Tier',
      responseTime: '4 hours',
      description: 'Direct phone access to our team for urgent reconciliation issues, complex multi-location setups, and operational consulting.',
      contact: 'Included with Professional',
      icon: '📞'
    },
    {
      type: 'One-on-One Onboarding',
      availability: 'Professional Tier',
      responseTime: 'Scheduled',
      description: 'Personalized setup session with workflow analysis, custom reconciliation strategies, and team training.',
      contact: 'Scheduled after signup',
      icon: '🎯'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Operations-Expert Support | MedSpaSync Pro</title>
        <meta
          name="description"
          content="Support from medical spa operations experts who understand reconciliation challenges. 24-hour response times, no outsourced chat bots."
        />
      </Helmet>

      <main className="pt-24 pb-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="inline-flex items-center bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
            Real Support from Operations Experts
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Support That Actually<br />
            Understands Your Business
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            If you've ever waited 3 days for a "ticket reply" while losing <strong>$2,500+ monthly</strong> 
            to reconciliation problems—we built this support system for you. Our team understands 
            spa operations, not just software features.
          </p>

          {/* Support Metrics */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-1">24hrs</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Outsourced Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">10+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Years Experience</div>
            </div>
          </div>
        </section>

        {/* Why Our Support Is Different */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Our Support Is Different</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              We understand reconciliation nightmares because we've lived them. Every support interaction 
              comes from professionals who know spa operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Traditional Support Problems */}
            <div>
              <h3 className="text-2xl font-bold text-red-600 mb-6">Traditional Software Support</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="text-red-500 mr-3 mt-1">❌</div>
                  <div>
                    <div className="font-semibold">Generic Script Responses</div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">"Have you tried turning it off and on again?"</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-red-500 mr-3 mt-1">❌</div>
                  <div>
                    <div className="font-semibold">Outsourced Chat Bots</div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">Agents who don't understand medical spa workflows</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-red-500 mr-3 mt-1">❌</div>
                  <div>
                    <div className="font-semibold">3+ Day Response Times</div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">While your reconciliation problems cost money daily</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-red-500 mr-3 mt-1">❌</div>
                  <div>
                    <div className="font-semibold">Feature-Focused Help</div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">"Here's how to use the button" vs. "Here's how to solve your problem"</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Support Approach */}
            <div>
              <h3 className="text-2xl font-bold text-emerald-600 mb-6">MedSpaSync Pro Support</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="text-emerald-500 mr-3 mt-1">✅</div>
                  <div>
                    <div className="font-semibold">Operations-Focused Responses</div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">Solutions based on understanding spa workflows</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-emerald-500 mr-3 mt-1">✅</div>
                  <div>
                    <div className="font-semibold">Direct Team Access</div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">Support from the people who built the reconciliation algorithms</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-emerald-500 mr-3 mt-1">✅</div>
                  <div>
                    <div className="font-semibold">24-Hour Response Guarantee</div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">Because reconciliation problems can't wait for "business days"</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-emerald-500 mr-3 mt-1">✅</div>
                  <div>
                    <div className="font-semibold">Business-Outcome Focused</div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">"How do we save you time and recover revenue?"</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Options */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Support Options</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Every support tier includes access to operations experts who understand reconciliation challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {supportOptions.map((option, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 border-2 ${
                  option.availability === 'Professional Tier'
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-4">{option.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold">{option.type}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        option.availability === 'Professional Tier'
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {option.availability}
                      </span>
                      <span className="text-gray-500">Response: {option.responseTime}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{option.description}</p>
                <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {option.contact}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Current Status */}
        <section className="max-w-4xl mx-auto px-6 mb-20">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-4">Early Release Support Benefits</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                MedSpaSync Pro is in early release, which means exceptional support access during this phase.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">👥</div>
                <h4 className="font-semibold mb-2">Direct Team Access</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Every support request handled by the product development team
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-semibold mb-2">Priority Response</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Faster response times during early release phase
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🔧</div>
                <h4 className="font-semibold mb-2">Product Influence</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your feedback directly shapes product development
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Enhanced Support Coming Soon</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              We're expanding our support capabilities based on early user feedback.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">💬</div>
              <h4 className="font-semibold mb-2">Live Chat</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Real-time support for urgent reconciliation issues
              </p>
              <div className="text-xs text-gray-500">Q3 2025</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">📚</div>
              <h4 className="font-semibold mb-2">Knowledge Base</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Self-service guides for common reconciliation scenarios
              </p>
              <div className="text-xs text-gray-500">Q3 2025</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">🎓</div>
              <h4 className="font-semibold mb-2">Training Program</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Comprehensive reconciliation workflow optimization training
              </p>
              <div className="text-xs text-gray-500">Q4 2025</div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Need Help Right Now?</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Our operations team is standing by to help with reconciliation challenges, 
              implementation questions, or workflow optimization.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@medspasyncpro.com"
                className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
              >
                Email Support Team
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              <a
                href="/contact"
                className="inline-flex items-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Detailed Questions
              </a>
            </div>

            <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
              <strong>Response guarantee:</strong> 24 hours or less, from operations experts who understand your reconciliation challenges.
            </div>
          </div>
        </section>

        {/* Support Philosophy */}
        <section className="max-w-4xl mx-auto px-6 mt-20 text-center">
          <blockquote className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-6">
            "Support isn't a feature—it's your fallback system when reconciliation problems threaten 
            to cost you $2,500+ monthly. We treat it accordingly."
          </blockquote>
          <cite className="text-sm text-gray-600 dark:text-gray-400">
            MedSpaSync Pro Support Philosophy
          </cite>
        </section>
      </main>
    </>
  );
}