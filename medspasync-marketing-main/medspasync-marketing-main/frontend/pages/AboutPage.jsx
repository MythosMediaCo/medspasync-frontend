import React from 'react';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';
import { Helmet } from 'react-helmet-async';

const AboutPage = () => {
  const { showToast } = useToast();

  const handleDemoClick = () => {
    showToast('Launching demo in new tab...', 'info');
    window.open('https://demo.medspasyncpro.com', '_blank');
  };

  const handleROIClick = () => {
    showToast('Opening ROI Calculator...', 'info');
    // Navigate to ROI calculator
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <Helmet>
        <title>The AI Intelligence Layer for Medical Spas | About MedSpaSync Pro</title>
        <meta 
          name="description" 
          content="Built by medical spa operations experts who understand the 8+ hours weekly and $2,500+ monthly cost of manual reconciliation. Science-driven solutions for real operational challenges." 
        />
      </Helmet>

      <Navigation variant="demo" />

      <main className="demo-container">
        {/* Hero Section */}
        <section className="demo-section text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Founded by Medical Spa Industry Veterans — On a Mission to End Profit Loss
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            MedSpaSync Pro was created to <span className="text-emerald-600 dark:text-emerald-400 font-bold">democratize enterprise-level analytics</span> for independent medical spas.<br />
            Our mission: Stop the hidden profit killer destroying your bottom line. <span className="text-gradient font-semibold">We serve the 76–90% of the market that's independent ownership.</span>
          </p>
          
          <div className="status-badge warning pulse-slow mb-8 text-lg">
            💰 $87.86B market opportunity by 2034 — independent spas deserve enterprise tools
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
              onClick={handleDemoClick}
              className="px-12 py-4"
            >
              Try Live Demo
            </Button>
          </div>
        </section>

        {/* Mission Section */}
        <section className="demo-section">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Our <span className="text-emerald-600 dark:text-emerald-400">Mission</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              To level the playing field for independent medical spas against large chains
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="mission-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Independent Focus</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We serve the 76–90% of medical spas that are independently owned, providing enterprise-level analytics that were previously only available to large chains.
              </p>
            </div>

            <div className="mission-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Proven ROI</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Our solutions deliver measurable results: $600–$2,000 monthly savings, 15% cost reduction, and 40% admin efficiency improvement.
              </p>
            </div>

            <div className="mission-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Market Growth</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We're positioned to capture the $87.86B medical spa market growth by 2034, with AI adoption accelerating at 47% CAGR in beauty.
              </p>
            </div>
          </div>
        </section>

        {/* Competitive Differentiation */}
        <section className="demo-section">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why We're <span className="text-emerald-600 dark:text-emerald-400">Different</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              MedSpaSync Pro specializes in medical spa predictive analytics vs. general spa management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="differentiation-card">
              <h3 className="text-xl font-bold mb-4">vs. Zenoti</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                While Zenoti offers general AI, we specialize in medical spa predictive analytics with proven ROI.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Specialized vs. general</li>
                <li>• $600–$2,000 monthly savings</li>
                <li>• Medical spa expertise</li>
              </ul>
            </div>

            <div className="differentiation-card">
              <h3 className="text-xl font-bold mb-4">vs. Pabau</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Beyond automated notes — we prevent profit loss through predictive inventory management.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Profit prevention vs. notes</li>
                <li>• 15% cost reduction</li>
                <li>• Predictive analytics</li>
              </ul>
            </div>

            <div className="differentiation-card">
              <h3 className="text-xl font-bold mb-4">vs. PatientNow</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Patient conversion is just the start — we optimize lifetime value through operations.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Operations vs. conversion</li>
                <li>• 40% admin efficiency</li>
                <li>• Lifetime value focus</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="demo-section text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Join the Independent Spa Revolution
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            See how much you're losing to inventory waste and start your journey to enterprise-level analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
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
              onClick={handleDemoClick}
              className="px-12 py-4"
            >
              Try Live Demo
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;