import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

/**
 * MedSpaSync Solutions Component
 * 
 * Implements the solution section with:
 * - "AI Intelligence Layer" positioning
 * - 95%+ accuracy messaging
 * - 24-hour implementation timeline
 * - Real user transformation proof
 * 
 * Design System:
 * - Uses card-feature styling
 * - Implementation timeline grid
 * - High contrast accessibility
 */
const Solutions = () => {
  return (
    <section className="section">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-h1 mb-6">
              The AI Intelligence Layer for Medical Spas
            </h2>
            <p className="text-body-large text-grey-500 max-w-3xl mx-auto">
              MedSpaSync Pro's AI matching achieves 95%+ accuracy by automatically pairing POS and loyalty data, 
              handling the variations that trip up manual processes.
            </p>
          </div>

          {/* Solution Features */}
          <div className="grid-3 mb-12">
            <div className="card-feature">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-h3 mb-4">Intelligent Transaction Matching</h3>
              <ul className="text-body text-grey-500 space-y-2">
                <li>• Cross-references timestamps, amounts, and customer IDs</li>
                <li>• Handles partial payments, package deals, and loyalty redemptions</li>
                <li>• Learns from spa-specific transaction patterns</li>
              </ul>
            </div>

            <div className="card-feature">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-h3 mb-4">Real-Time Accuracy Monitoring</h3>
              <ul className="text-body text-grey-500 space-y-2">
                <li>• Provides confidence scores for each match</li>
                <li>• Flags unusual transactions for manual review</li>
                <li>• Maintains audit trails for compliance</li>
              </ul>
            </div>

            <div className="card-feature">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-h3 mb-4">24-Hour Implementation Reality</h3>
              <ul className="text-body text-grey-500 space-y-2">
                <li>• Spas can start AI reconciliation within 24 hours</li>
                <li>• No complex integrations needed</li>
                <li>• Connects to existing POS and loyalty platforms</li>
              </ul>
            </div>
          </div>

          {/* Implementation Timeline */}
          <div className="mb-12">
            <h3 className="text-h2 mb-8 text-center">Implementation Without Disruption</h3>
            <div className="implementation-timeline">
              <div className="timeline-step">
                <h4>Day 1: Setup</h4>
                <p>Connect existing systems through secure APIs. No downtime required.</p>
              </div>
              <div className="timeline-step">
                <h4>Week 1: Learning</h4>
                <p>AI learns your transaction patterns while running parallel to manual process.</p>
              </div>
              <div className="timeline-step">
                <h4>Week 2: Confidence</h4>
                <p>Achieve 95%+ accuracy as system optimizes for your spa's specific needs.</p>
              </div>
            </div>
          </div>

          {/* ROI Reality Check */}
          <div className="card mb-8">
            <h3 className="text-h2 mb-6 text-center">ROI Reality Check</h3>
            <p className="text-body-large text-grey-500 mb-6 text-center">
              At $299/month, you save more in labor costs than you spend on the platform:
            </p>
            <div className="grid-2">
              <div className="text-center">
                <div className="text-h1 text-emerald-600 font-bold mb-2">$1,200+</div>
                <p className="text-body text-grey-500">Monthly time savings (8+ hours weekly at $15/hour)</p>
              </div>
              <div className="text-center">
                <div className="text-h1 text-emerald-600 font-bold mb-2">$2,500+</div>
                <p className="text-body text-grey-500">Monthly revenue recovery from previously missed transactions</p>
              </div>
            </div>
            <div className="roi-highlight text-center mt-6">
              <strong>Real users report 6 hours weekly to 15 minutes—that's $1,200+ monthly in time savings alone, 
              plus $2,500+ in recovered revenue.</strong>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h3 className="text-h2 mb-4">Ready to Stop Losing Revenue to Manual Reconciliation?</h3>
            <p className="text-body-large text-grey-500 mb-8">
              Join spas saving 8+ hours weekly while achieving 95%+ matching accuracy.
            </p>
            <Link to="/demo">
              <Button 
                variant="primary" 
                size="large"
                className="btn-primary text-lg px-8 py-4"
              >
                Start Reconciling in 24 Hours
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solutions;