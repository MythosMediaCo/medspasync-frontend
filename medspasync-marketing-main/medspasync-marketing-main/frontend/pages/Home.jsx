// React automatically imported in JSX
import { useToast } from '../context/ToastContext';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import DesignShowcase from '../components/DesignShowcase';
import { pricingPlans, pricingFeatures, businessMetrics, formatPrice } from '../data/pricing';

const HomePage = () => {
  const { showToast } = useToast();

  const handleDemoClick = () => {
    showToast('Launching demo in new tab...', 'info');
    window.open('https://demo.medspasyncpro.com', '_blank');
  };

  const handleSubscribeClick = (plan) => {
    showToast(`Starting ${plan} subscription...`, 'success');
    // In production, redirect to Stripe checkout
    // window.location.href = '/api/checkout/create-session';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      {/* Skip Link for Accessibility */}
      <a href="#main" className="skip-link">Skip to main content</a>
      
      {/* Unified Navigation */}
      <Navigation variant="demo" />

      <main id="main" className="demo-container">
        {/* Hero Section */}
        <section className="demo-section text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Stop the Hidden Profit Killer Destroying Your Medical Spa's Bottom Line
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Independent medical spas lose <span className="text-red-600 dark:text-red-400 font-bold">$600–$2,000 monthly</span> to inventory waste and reconciliation errors.<br />
            Capture your share of the <span className="text-emerald-600 dark:text-emerald-400 font-bold">$87.86B market growth</span> by 2034.<br />
            <span className="text-gradient font-semibold">AI adoption in beauty is accelerating at <span className="font-bold">47% CAGR</span>—don't get left behind.</span>
          </p>
          <div className="status-badge warning pulse-slow mb-8 text-lg">
            💰 Prevent $600–$2,000 in monthly waste. See your ROI in 1–6 months.
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              variant="primary"
              size="xl"
              onClick={handleDemoClick}
              className="px-12 py-4"
              shimmer
            >
              🚀 Try ROI Calculator
            </Button>
            <Button
              variant="secondary"
              size="xl"
              onClick={() => handleSubscribeClick('Core')}
              className="px-12 py-4"
            >
              See Competitive Comparison
            </Button>
          </div>
          <div className="alert-info">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            76–90% of the market is independent ownership • 55% facial treatments • $250B healthcare waste
          </div>
        </section>

        {/* Problem Section */}
        <section id="problems" className="demo-section problem-section">
          <div className="text-center mb-12">
            <div className="status-badge warning mb-4">
              💸 Revenue Leak Alert
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              The Hidden <span className="text-red-600 dark:text-red-400">Revenue Leak</span> in Your Spa
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We understand reconciliation challenges because we've lived them
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="problem-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h4m6 4h4"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Real Experience</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Our team includes medical spa operations experts who spent years manually reconciling Alle, Aspire, and POS data. We built the solution we wished existed.
              </p>
            </div>

            <div className="problem-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Proven Methodology</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Our AI algorithms are trained on real medical spa reconciliation patterns, achieving 95%+ accuracy through deep understanding of spa workflows.
              </p>
            </div>

            <div className="problem-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Operations Support</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get support from people who understand your reconciliation challenges. We respond within 24 hours with practical, actionable solutions.
              </p>
            </div>
          </div>
        </section>

        {/* Modern Design Showcase */}
        <DesignShowcase />

        {/* Pricing Section */}
        <section id="pricing" className="demo-section">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your spa's reconciliation needs
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

        {/* Demo CTA Section */}
        <section className="demo-section gradient-hero text-white rounded-2xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Try It Now - No Email Required
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-3xl mx-auto">
            Experience 95%+ AI accuracy in action. See how reconciliation transforms from hours to minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              variant="cta"
              size="xl"
              onClick={handleDemoClick}
              className="px-12 py-4"
              shimmer
            >
              🎯 Launch Live Demo
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

          <div className="text-sm opacity-75">
            No credit card required • 14-day free trial • Cancel anytime
          </div>
        </section>

        {/* Business Metrics */}
        <section className="demo-section">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Proven <span className="text-gradient">Results</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Real metrics from medical spas using AI reconciliation
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {Object.values(businessMetrics).map((metric) => (
              <div key={metric.id} className="text-center">
                <div className={`metric-number ${metric.color}`}>
                  {metric.value}
                </div>
                <div className="metric-label">{metric.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="demo-section text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Stop Losing Revenue?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join medical spas already saving 8+ hours weekly with AI-powered reconciliation
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleDemoClick}
              shimmer
            >
              🚀 Try Demo Now
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleSubscribeClick('Core')}
            >
              Start Free Trial
            </Button>
          </div>
        </section>
      </main>

      {/* Demo-Inspired Footer */}
      <footer className="demo-nav border-t-0">
        <div className="demo-container">
          <div className="flex flex-col md:flex-row justify-between items-center py-8 space-y-4 md:space-y-0">
            <div className="text-gray-600">
              &copy; 2025 MedSpaSync Pro. All rights reserved.
            </div>
            <div className="flex space-x-8">
              <a href="/privacy" className="text-gray-600 hover:text-emerald-600 transition-colors">Privacy</a>
              <a href="/terms" className="text-gray-600 hover:text-emerald-600 transition-colors">Terms</a>
              <a href="/support" className="text-gray-600 hover:text-emerald-600 transition-colors">Support</a>
              <a href="/contact" className="text-gray-600 hover:text-emerald-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;