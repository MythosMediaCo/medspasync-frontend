import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

/**
 * MedSpaSync Pricing Component
 * 
 * Implements the pricing section with:
 * - $299/month honest pricing
 * - ROI reality check with proven metrics
 * - 30-day money-back guarantee
 * - Real user transformation proof
 * 
 * Design System:
 * - Uses pricing-card styling
 * - ROI highlight component
 * - High contrast accessibility
 */
const Pricing = () => {
  return (
    <section className="section">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-h1 mb-6">
              Honest Pricing, Immediate ROI
            </h2>
            <p className="text-body-large text-grey-500 max-w-3xl mx-auto">
              At $299/month, you save more in labor costs than you spend on the platform
            </p>
          </div>

          {/* Pricing Card */}
          <div className="pricing-card">
            <div className="mb-8">
              <h3 className="text-h2 mb-2">
                Core Plan
              </h3>
              <div className="pricing-amount">
                $299<span className="pricing-period">/month</span>
              </div>
            </div>
            
            <div className="pricing-features">
              <div className="pricing-feature">
                ✓ Save 8+ hours weekly on reconciliation
              </div>
              <div className="pricing-feature">
                ✓ Prevent $2,500+ monthly missed revenue
              </div>
              <div className="pricing-feature">
                ✓ 95%+ AI matching accuracy
              </div>
              <div className="pricing-feature">
                ✓ 24-hour implementation
              </div>
              <div className="pricing-feature">
                ✓ QuickBooks integration
              </div>
              <div className="pricing-feature">
                ✓ HIPAA-conscious security
              </div>
            </div>
            
            <div className="roi-highlight">
              <strong>ROI Reality:</strong> Real users report 6 hours weekly to 15 minutes—that's $1,200+ monthly in time savings alone, plus $2,500+ in recovered revenue.
            </div>
            
            <Link to="/demo" className="w-full block">
              <Button 
                variant="primary" 
                size="large"
                className="btn-primary text-lg px-8 py-4 w-full"
              >
                Start Reconciling in 24 Hours
              </Button>
            </Link>
            
            <p className="text-body-small text-grey-500 mt-4 text-center">
              30-day money-back guarantee
            </p>
          </div>

          {/* ROI Breakdown */}
          <div className="grid-3 mt-12">
            <div className="card text-center">
              <div className="text-h2 text-emerald-600 font-bold mb-2">$1,200+</div>
              <h3 className="text-h3 mb-2">Monthly Time Savings</h3>
              <p className="text-body text-grey-500">
                8+ hours weekly at $15/hour = significant labor cost reduction
              </p>
            </div>

            <div className="card text-center">
              <div className="text-h2 text-emerald-600 font-bold mb-2">$2,500+</div>
              <h3 className="text-h3 mb-2">Revenue Recovery</h3>
              <p className="text-body text-grey-500">
                Previously missed transactions now properly matched and accounted for
              </p>
            </div>

            <div className="card text-center">
              <div className="text-h2 text-emerald-600 font-bold mb-2">95%+</div>
              <h3 className="text-h3 mb-2">Match Rate Accuracy</h3>
              <p className="text-body text-grey-500">
                AI accuracy vs. 80-85% manual accuracy means fewer errors and disputes
              </p>
            </div>
          </div>

          {/* Real User Testimonial */}
          <div className="card-testimonial mt-12">
            <h3 className="text-h3 mb-4">Real Transformation Example</h3>
            <p className="testimonial-quote">
              "We reduced reconciliation from 6 hours weekly to just 15 minutes with 97% match rate accuracy. 
              Our operations manager can now focus on patient experience instead of spreadsheets."
            </p>
            <cite className="testimonial-author">
              — Multi-location Med Spa, Atlanta
            </cite>
          </div>

          {/* Implementation Timeline */}
          <div className="implementation-timeline mt-12">
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

          {/* Final CTA */}
          <div className="text-center mt-12">
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
            <p className="text-body-small text-grey-500 mt-4">
              Built by 10-year medical spa industry veteran Jacob Hagood
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;