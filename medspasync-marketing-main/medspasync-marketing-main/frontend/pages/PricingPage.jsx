import React from 'react';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';
import { pricingPlans, pricingFeatures, formatPrice } from '../data/pricing';

const PricingPage = () => {
  const { showToast } = useToast();

  const handleSubscribeClick = (plan) => {
    showToast(`Starting ${plan} subscription...`, 'success');
    // In production, redirect to Stripe checkout
    // window.location.href = '/api/checkout/create-session';
  };

  const handleROIClick = () => {
    showToast('Opening ROI Calculator...', 'info');
    // Navigate to ROI calculator
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <Navigation variant="demo" />

      <main className="demo-container">
        {/* Hero Section */}
        <section className="demo-section text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Pricing That Pays for Itself — See Your ROI in 1–6 Months
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Every plan is designed to prevent <span className="text-red-600 dark:text-red-400 font-bold">$600–$2,000 monthly waste</span> and deliver <span className="text-emerald-600 dark:text-emerald-400 font-bold">200–1200% ROI</span> in your first year.<br />
            <span className="text-gradient font-semibold">Break even in as little as 1 month — see your savings instantly with our ROI calculator.</span>
          </p>
          
          <div className="status-badge warning pulse-slow mb-8 text-lg">
            💰 Calculate your personalized ROI and payback period
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              variant="primary"
              size="xl"
              onClick={handleROIClick}
              className="px-12 py-4"
              shimmer
            >
              🚀 Calculate Your ROI
            </Button>
            <Button
              variant="secondary"
              size="xl"
              onClick={() => handleSubscribeClick('Core')}
              className="px-12 py-4"
            >
              Start Free Trial
            </Button>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="demo-section">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, Transparent <span className="text-emerald-600 dark:text-emerald-400">Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose the plan that fits your spa's reconciliation needs and see immediate ROI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {Object.values(pricingPlans).map((plan) => (
              <div key={plan.id} className={`pricing-card ${plan.featured ? 'featured' : ''} ${plan.status === 'coming_soon' ? 'coming-soon' : ''}`}>
                <div className={`status-badge ${plan.badge.type} absolute -top-3 left-1/2 transform -translate-x-1/2`}>
                  {plan.badge.text}
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{plan.name}</h3>
                  <div className="metric-display">
                    <div className={`metric-number ${plan.id === 'professional' ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                      {formatPrice(plan)}
                    </div>
                    <div className="metric-label">per {plan.period}</div>
                  </div>
                  
                  {/* ROI Information */}
                  <div className="plan-roi mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                      Expected ROI & Payback
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div>• 15% cost reduction</div>
                      <div>• 40% admin efficiency</div>
                      <div>• $600–$2,000/month savings</div>
                      <div>• 1–6 month payback</div>
                    </div>
                  </div>
                </div>

                <ul className={`space-y-4 mb-10 text-left ${plan.status === 'coming_soon' ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-lg">
                      <svg className={`h-6 w-6 mr-4 ${plan.status === 'coming_soon' ? 'text-gray-400 dark:text-gray-500' : 'text-emerald-600 dark:text-emerald-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      {feature.text}
                    </li>
                  ))}
                </ul>

                {plan.cta.disabled ? (
                  <button 
                    disabled 
                    className="w-full bg-gray-400 dark:bg-gray-600 text-white py-4 px-8 rounded-xl text-xl font-bold cursor-not-allowed"
                  >
                    {plan.cta.text}
                  </button>
                ) : (
                  <Button 
                    variant="primary"
                    size="xl"
                    onClick={() => handleSubscribeClick(plan.cta.plan)}
                    className="w-full py-4"
                    shimmer
                  >
                    {plan.cta.text}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="alert-success inline-flex">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {Object.values(pricingFeatures).map(feature => feature.text).join(' • ')}
            </div>
          </div>
        </section>

        {/* ROI Calculator CTA */}
        <section className="demo-section text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            See Your Exact ROI Before You Start
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Enter your spa's specific metrics to calculate your personalized savings and payback period.
          </p>
          
          <Button
            variant="primary"
            size="xl"
            onClick={handleROIClick}
            className="px-12 py-4"
            shimmer
          >
            🚀 Calculate Your ROI
          </Button>
        </section>
      </main>
    </div>
  );
};

export default PricingPage;
