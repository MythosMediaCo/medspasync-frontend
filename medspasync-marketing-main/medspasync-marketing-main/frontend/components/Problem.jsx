import React from 'react';

/**
 * MedSpaSync Problem Component
 * 
 * Implements the problem section with:
 * - "8+ hours weekly" and "$2,500+ monthly" metrics
 * - Real user transformation example
 * - Expert industry voice
 * 
 * Design System:
 * - Uses metric-highlight styling
 * - Card component with proper spacing
 * - High contrast accessibility
 */
const Problem = () => {
  return (
    <section className="section">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-h1 mb-6">
              The Hidden Cost of Manual Reconciliation
            </h2>
            <p className="text-body-large text-grey-500 max-w-3xl mx-auto">
              Manual reconciliation wastes 8+ hours weekly and costs spas $2,500+ monthly in missed revenue. 
              Without AI matching, financial reports become inaccurate, leading to decision paralysis.
            </p>
          </div>

          {/* Problem Metrics */}
          <div className="grid-2 mb-12">
            <div className="card">
              <div className="problem-metric text-center mb-4">
                8+ Hours
              </div>
              <h3 className="text-h3 mb-4 text-center">Weekly Time Waste</h3>
              <p className="text-body text-grey-500 text-center">
                Operations managers spend entire days trying to match POS transactions with loyalty point redemptions, 
                gift card usage, and package deals—only to discover discrepancies that take another day to resolve.
              </p>
            </div>

            <div className="card">
              <div className="problem-metric text-center mb-4">
                $2,500+
              </div>
              <h3 className="text-h3 mb-4 text-center">Monthly Revenue Loss</h3>
              <p className="text-body text-grey-500 text-center">
                Unmatched transactions and reconciliation errors cost medical spas thousands in missed revenue 
                and create inaccurate financial data that leads to poor business decisions.
              </p>
            </div>
          </div>

          {/* Real Transformation Example */}
          <div className="card-testimonial mb-8">
            <h3 className="text-h3 mb-4">Real Transformation Example</h3>
            <p className="testimonial-quote">
              "We reduced reconciliation from 6 hours weekly to just 15 minutes with 97% match rate accuracy. 
              Our operations manager can now focus on patient experience instead of spreadsheets."
            </p>
            <cite className="testimonial-author">
              — Multi-location Med Spa, Atlanta
            </cite>
          </div>

          {/* Problem Details */}
          <div className="metric-highlight">
            <h3 className="text-h3 mb-4">The Hidden Costs After 10 Years in the Industry</h3>
            <p className="text-body mb-4">
              After 10 years in the medical spa industry, I've watched teams burn through labor costs that 
              dwarf the technology solutions that could solve their problems:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-red-600 mr-3 font-bold">•</span>
                <span className="text-body"><strong>Time Waste:</strong> 8+ hours weekly on manual cross-checking</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-3 font-bold">•</span>
                <span className="text-body"><strong>Revenue Loss:</strong> $2,500+ monthly in unmatched transactions</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-3 font-bold">•</span>
                <span className="text-body"><strong>Accuracy Issues:</strong> Human error rates of 15-20% in complex reconciliation</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-3 font-bold">•</span>
                <span className="text-body"><strong>Decision Delays:</strong> Inaccurate financial data leading to poor business decisions</span>
              </li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <p className="text-body-large text-grey-500 mb-6">
              Ready to stop losing revenue to manual reconciliation?
            </p>
            <div className="solution-benefit">
              Join spas saving 8+ hours weekly while achieving 95%+ matching accuracy
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
