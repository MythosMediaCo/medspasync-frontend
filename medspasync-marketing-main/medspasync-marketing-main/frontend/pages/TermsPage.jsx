// /src/pages/TermsPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | MedSpaSync Pro AI Reconciliation</title>
        <meta
          name="description"
          content="Transparent terms for MedSpaSync Pro reconciliation platform. 30-day money-back guarantee, HIPAA-conscious design, and clear subscription policies."
        />
      </Helmet>
      
      <main className="pt-24 pb-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="inline-flex items-center bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Transparent Terms. No Hidden Clauses.
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Terms of Service
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            We believe in clear, straightforward terms that protect both your medical spa operations 
            and our reconciliation platform. No legal jargon designed to confuse—just honest policies 
            from operations experts who understand your business.
          </p>
        </section>

        {/* Key Terms Summary */}
        <section className="max-w-6xl mx-auto px-6 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Terms At-a-Glance</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The essential points that matter to your medical spa operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
              <div className="text-3xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-3 text-green-700 dark:text-green-300">30-Day Guarantee</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Money-back guarantee if we don't save you measurable time on reconciliation within 30 days.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-3 text-blue-700 dark:text-blue-300">Zero Data Storage</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your reconciliation files are processed and automatically deleted—never permanently stored.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
              <div className="text-3xl mb-4">🚫</div>
              <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-300">Cancel Anytime</h3>
              <p className="text-gray-600 dark:text-gray-300">
                No long-term contracts or cancellation fees. Stop your subscription whenever you want.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Terms */}
        <section className="max-w-4xl mx-auto px-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Complete Terms of Service</h2>

            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                  Acceptance of Terms
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    By accessing or using MedSpaSync Pro's reconciliation platform, you agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, you may not use our AI-powered reconciliation services.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    These terms apply to all users of MedSpaSync Pro, whether accessing our demo functionality, 
                    Core tier, or Professional tier services.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                  Demo Access & Usage
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Our demo features are provided for evaluation purposes only, allowing you to test AI reconciliation 
                    with your actual CSV data from Alle, Aspire, and POS systems.
                  </p>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300 mb-4">
                    <li>• Demo data is processed in memory and automatically deleted after session completion</li>
                    <li>• No permanent storage of demo reconciliation files or results</li>
                    <li>• We reserve the right to limit demo usage per user or IP address to prevent system abuse</li>
                    <li>• Demo accuracy reflects our production AI matching capabilities (95%+ accuracy)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Subscription Plans & Billing
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    MedSpaSync Pro offers transparent subscription pricing designed for medical spa operations:
                  </p>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-4">
                    <div className="space-y-3">
                      <div><strong>Core Plan ($299/month):</strong> Essential AI reconciliation with 95%+ accuracy</div>
                      <div><strong>Professional Plan ($499/month):</strong> Advanced features including compliance automation and multi-location support</div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• All subscriptions are billed monthly in advance</li>
                    <li>• You may cancel your subscription at any time without penalty</li>
                    <li>• Upon cancellation, you retain access through the end of your current billing period</li>
                    <li>• No long-term contracts or hidden fees</li>
                    <li>• Professional tier includes priority phone support and one-on-one onboarding</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                  30-Day Money-Back Guarantee
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We stand behind our reconciliation platform with a comprehensive 30-day money-back guarantee 
                    for new subscribers to either Core or Professional plans.
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Refund Policy:</h4>
                    <ul className="space-y-1 text-green-700 dark:text-green-400">
                      <li>• Full refund available within 30 days of initial subscription</li>
                      <li>• No questions asked if our AI doesn't save you measurable reconciliation time</li>
                      <li>• Refund processing completed within 5 business days</li>
                      <li>• Contact our support team at support@medspasyncpro.com to initiate refund</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                  Data Security & HIPAA-Conscious Design
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We implement comprehensive security measures designed with medical spa compliance requirements in mind:
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-4">
                    <div className="space-y-2">
                      <div>• <strong>Zero Permanent Storage:</strong> All reconciliation files automatically deleted after processing</div>
                      <div>• <strong>256-bit Encryption:</strong> Industry-standard encryption for all data transfer and processing</div>
                      <div>• <strong>Memory-Only Processing:</strong> Files never written to permanent storage during reconciliation</div>
                      <div>• <strong>Access Controls:</strong> Restricted internal access with comprehensive audit logging</div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    For complete details on our security practices, please review our{' '}
                    <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                      Privacy Policy
                    </a>.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">6</span>
                  Service Availability & Performance
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We strive to maintain high service availability for your reconciliation needs:
                  </p>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• AI reconciliation processing available 24/7</li>
                    <li>• 95%+ matching accuracy based on extensive testing with real medical spa data</li>
                    <li>• Planned maintenance windows communicated 48 hours in advance</li>
                    <li>• Support response within 24 hours for all plans</li>
                    <li>• Priority phone support available for Professional tier subscribers</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">7</span>
                  Limitation of Liability
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    While we work diligently to provide accurate reconciliation results, users maintain responsibility 
                    for verifying financial data accuracy and compliance with their business requirements.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    MedSpaSync Pro's total liability to you for any damages arising from use of our reconciliation 
                    platform shall not exceed the amount paid by you for the service during the three (3) months 
                    immediately preceding the claim.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">8</span>
                  Changes to Terms
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We may update these terms periodically to reflect changes in our reconciliation services or legal requirements. 
                    We believe in transparent communication about any modifications that affect your usage.
                  </p>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Material changes will be communicated via email 30 days before implementation</li>
                    <li>• Minor clarifications may be updated without advance notice</li>
                    <li>• Continued use of MedSpaSync Pro constitutes acceptance of revised terms</li>
                    <li>• Previous version history available upon request</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">9</span>
                  Contact Information & Support
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Questions about these terms, your subscription, or our reconciliation platform? 
                    Our operations team is available to help:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                    <div className="space-y-2">
                      <div><strong>Email Support:</strong> support@medspasyncpro.com</div>
                      <div><strong>Response Time:</strong> 24 hours or less</div>
                      <div><strong>Phone Support:</strong> Available for Professional tier subscribers</div>
                      <div><strong>Refund Requests:</strong> support@medspasyncpro.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto px-6 mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <strong>Last updated:</strong> June 20, 2025<br />
            <strong>Terms version:</strong> 2.0<br />
            <strong>Contact:</strong>{' '}
            <a href="mailto:support@medspasyncpro.com" className="text-blue-600 hover:text-blue-700">
              support@medspasyncpro.com
            </a>
          </p>
          
          <div className="text-xs text-gray-400 dark:text-gray-500">
            These terms govern your use of MedSpaSync Pro's AI-powered reconciliation platform. 
            We're committed to transparent, honest policies that protect your medical spa operations.
          </div>
        </footer>
      </main>
    </>
  );
}