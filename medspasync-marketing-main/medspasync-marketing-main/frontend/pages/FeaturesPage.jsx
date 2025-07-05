import React from 'react';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const FeaturesPage = () => {
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
      <Navigation variant="demo" />

      <main className="demo-container">
        {/* Hero Section */}
        <section className="demo-section text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Features That Deliver Measurable ROI for Independent Medical Spas
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Prevent <span className="text-red-600 dark:text-red-400 font-bold">$600–$2,000 monthly waste</span> and achieve a <span className="text-emerald-600 dark:text-emerald-400 font-bold">15% operational cost reduction</span> with MedSpaSync Pro.<br />
            <span className="text-gradient font-semibold">40% admin efficiency improvement, proven by healthcare analytics.</span>
          </p>
          
          <div className="status-badge warning pulse-slow mb-8 text-lg">
            💰 See your personalized ROI calculation
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

        {/* Core Features Section */}
        <section className="demo-section">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Four Pillars of <span className="text-emerald-600 dark:text-emerald-400">Financial Optimization</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Each feature directly impacts your bottom line with measurable financial returns
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Inventory Optimization */}
            <div className="feature-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Inventory Optimization</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Prevent <span className="font-bold text-red-600 dark:text-red-400">$600–$2,000 monthly waste</span> through predictive analytics and automated stock management.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Predictive demand forecasting</li>
                <li>• Automated reorder points</li>
                <li>• Waste prevention alerts</li>
                <li>• 15% inventory cost reduction</li>
              </ul>
            </div>

            {/* AI Reconciliation */}
            <div className="feature-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI Reconciliation</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Achieve <span className="font-bold text-emerald-600 dark:text-emerald-400">95%+ accuracy</span> with AI-powered matching that prevents revenue leakage.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• 95%+ prediction accuracy</li>
                <li>• Automated error detection</li>
                <li>• Fraud prevention</li>
                <li>• 40% admin efficiency improvement</li>
              </ul>
            </div>

            {/* Predictive Growth */}
            <div className="feature-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Predictive Growth</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Generate <span className="font-bold text-emerald-600 dark:text-emerald-400">200–1200% ROI</span> in 1–6 months with data-driven insights.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Revenue forecasting</li>
                <li>• Customer lifetime value optimization</li>
                <li>• Market trend analysis</li>
                <li>• 1–6 month payback period</li>
              </ul>
            </div>

            {/* Independent Advantage */}
            <div className="feature-card">
              <div className="text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Independent Advantage</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Compete with chains using <span className="font-bold text-emerald-600 dark:text-emerald-400">enterprise-level analytics</span> designed for independent spas.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Specialized for medical spas</li>
                <li>• 76–90% market focus</li>
                <li>• Chain-competitive insights</li>
                <li>• Democratized enterprise analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Competitive Comparison */}
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
            <div className="competitor-card">
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

            <div className="competitor-card">
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

            <div className="competitor-card">
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
            Ready to Stop Losing Money?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Calculate your personalized ROI and see how much you're losing to inventory waste.
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

export default FeaturesPage;