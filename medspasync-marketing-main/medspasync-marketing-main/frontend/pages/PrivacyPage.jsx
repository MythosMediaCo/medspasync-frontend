// /src/pages/PrivacyPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>HIPAA-Conscious Privacy Policy | MedSpaSync Pro</title>
        <meta
          name="description"
          content="Security-first reconciliation with HIPAA-conscious design. Zero permanent storage, encrypted processing, and automatic file deletion protect your medical spa data."
        />
      </Helmet>
      
      <main className="pt-24 pb-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="inline-flex items-center bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            HIPAA-Conscious by Design
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Security-First Reconciliation<br />
            with Zero Permanent Storage
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            We built MedSpaSync Pro with <strong>HIPAA-conscious design principles</strong> from day one. 
            Your reconciliation data is encrypted during processing and automatically deleted—
            never permanently stored or accessible.
          </p>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">0 Sec</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Permanent Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">256-bit</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Encryption Standard</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">Auto</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">File Deletion</div>
            </div>
          </div>
        </section>

        {/* Privacy Principles */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Privacy Principles</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Built by medical spa operations experts who understand the critical importance of data security.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-3 text-green-700 dark:text-green-300">Minimal Collection</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We collect only what's essential for reconciliation processing. No patient data, 
                no unnecessary personal information.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3 text-blue-700 dark:text-blue-300">Temporary Processing</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Files are processed in memory and automatically deleted after reconciliation. 
                Zero permanent storage of your data.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-8">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-300">Encrypted Everything</h3>
              <p className="text-gray-600 dark:text-gray-300">
                256-bit encryption during transfer and processing. Industry-standard security 
                protocols throughout the entire workflow.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Policy */}
        <section className="max-w-4xl mx-auto px-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Detailed Privacy Policy</h2>

            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                  Data We Collect
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We practice minimal data collection, gathering only what's essential for reconciliation processing:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">✓</span>
                      <div>
                        <strong>Email address:</strong> Optional for demo usage, required only for subscription management
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">✓</span>
                      <div>
                        <strong>Contact information:</strong> Name and spa details (voluntary, for support purposes only)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">✓</span>
                      <div>
                        <strong>CSV file contents:</strong> Temporarily processed for reconciliation, never permanently stored
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">✗</span>
                      <div>
                        <strong>We do NOT collect:</strong> Patient names, medical information, or sensitive personal data
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                  HIPAA-Conscious File Processing
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    While MedSpaSync Pro is not a HIPAA-covered entity, we implement HIPAA-conscious design principles:
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="text-blue-500 mr-3">🔐</span>
                        <strong>Encrypted Transfer:</strong> 256-bit SSL/TLS encryption for all file uploads
                      </div>
                      <div className="flex items-center">
                        <span className="text-blue-500 mr-3">⚡</span>
                        <strong>Memory Processing:</strong> Files processed in encrypted memory, never written to disk
                      </div>
                      <div className="flex items-center">
                        <span className="text-blue-500 mr-3">🗑️</span>
                        <strong>Automatic Deletion:</strong> All files automatically deleted after processing completion
                      </div>
                      <div className="flex items-center">
                        <span className="text-blue-500 mr-3">👥</span>
                        <strong>Access Controls:</strong> Restricted internal access with audit logging
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Zero Permanent Storage Policy
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Our architecture is designed around the principle of zero permanent data storage:
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <ul className="space-y-2">
                      <li>• Uploaded reconciliation files are processed in memory only</li>
                      <li>• Results are generated and immediately available for download</li>
                      <li>• All processing data is purged within minutes of completion</li>
                      <li>• No backup copies or cached data retention</li>
                      <li>• You maintain complete control over your reconciliation data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                  Analytics & Usage Tracking
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We collect minimal, anonymous usage data to improve our reconciliation algorithms:
                  </p>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Demo usage counts (no personal identification)</li>
                    <li>• Feature utilization patterns (aggregated, anonymized)</li>
                    <li>• Performance metrics for AI optimization</li>
                    <li>• Error rates for algorithmic improvements</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-300 mt-4">
                    <strong>We do NOT track:</strong> Individual user behavior, personal identifiers, or file contents.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                  Your Rights & Data Control
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You maintain complete control over your information and reconciliation data:
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Data Access</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Request a copy of any personal information we maintain about you.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Data Deletion</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Complete account and data deletion within 72 hours of request.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Data Portability</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Export your account data in standard formats if needed.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Processing Opt-Out</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Discontinue any optional data processing activities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">6</span>
                  Policy Updates & Communication
                </h3>
                <div className="ml-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We believe in transparent communication about any changes to our privacy practices:
                  </p>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Material changes will be communicated via email (if subscribed)</li>
                    <li>• This page always reflects the current privacy policy</li>
                    <li>• Version history available upon request</li>
                    <li>• 30-day notice for any significant policy modifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="max-w-4xl mx-auto px-6 mt-20 text-center">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Questions About Privacy or Security?</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Our team understands the importance of data security in medical spa operations. 
              We're here to address any concerns about our HIPAA-conscious design principles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@medspasyncpro.com"
                className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Contact Privacy Team
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              <a
                href="/contact"
                className="inline-flex items-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                General Questions
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto px-6 mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <strong>Last updated:</strong> June 20, 2025<br />
            <strong>Policy version:</strong> 2.0<br />
            <strong>Contact:</strong>{' '}
            <a href="mailto:support@medspasyncpro.com" className="text-emerald-600 hover:text-emerald-700">
              support@medspasyncpro.com
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}