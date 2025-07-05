// ✅ About.jsx

import { Link } from 'react-router-dom';

/**
 * MedSpaSync About Component
 * 
 * Implements the about section with:
 * - 10-year industry veteran positioning
 * - "Lived the nightmare" credibility
 * - Built the AI solution story
 * - Authentic industry expertise
 * 
 * Design System:
 * - Uses card and card-testimonial styling
 * - Grid layout for credibility elements
 * - High contrast accessibility
 */
const About = () => {
  return (
    <section id="about" className="demo-section about-section">
      <div className="container">
        <div className="text-center mb-12">
          <div className="status-badge success mb-4">
            🏆 Industry Veteran
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Built by Someone Who&apos;s Been There
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Jacob Hagood spent 10 years running medical spas and living through the reconciliation nightmare
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="card-feature">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    The Reconciliation Nightmare
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    &quot;I spent 8+ hours every week manually matching transactions between Alle, Aspire, and our POS system. It was a nightmare that cost us thousands in missed revenue.&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="card-feature">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    The AI Solution
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    &quot;I built the AI solution that eliminates this problem. Now it takes 15 minutes instead of 8 hours, and we catch every single transaction.&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="card-feature">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Real Results
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    &quot;Our AI achieves 97% match rate accuracy. That&apos;s not a marketing claim - that&apos;s real data from real medical spas using our system.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="card-testimonial">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  JH
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Jacob Hagood</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Founder, 10-year Medical Spa Veteran</p>
                </div>
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 italic">
                &quot;I built this because I lived through the reconciliation nightmare. Every medical spa owner knows the pain of spending hours manually matching transactions. Our AI eliminates that pain completely.&quot;
              </blockquote>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/contact" className="btn-primary">
            Talk to the Founder
          </Link>
        </div>
      </div>
    </section>
  );
};

export default About;
