import { useEffect } from 'react';
import Navigation from '../components/Navigation';
import Button from '../components/Button';

const NotFoundPage = () => {
  useEffect(() => {
    // Update page title for 404
    document.title = 'Page Not Found | MedSpaSync Pro';
  }, []);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleTryDemo = () => {
    window.open('https://demo.medspasyncpro.com', '_blank');
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      {/* Skip Link for Accessibility */}
      <a href="#main" className="skip-link">Skip to main content</a>
      
      {/* Navigation */}
      <Navigation variant="header" />

      <main id="main" className="demo-container">
        <section className="demo-section text-center py-20">
          {/* 404 Icon */}
          <div className="mb-8">
            <div className="text-8xl mb-4">🔍</div>
            <h1 className="text-6xl md:text-8xl font-bold text-gradient mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Page Not Found
            </h2>
          </div>

          {/* Error Message */}
          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-xl text-gray-600 mb-6">
              The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>
            
            <div className="alert-info mb-8">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              Don't worry! You can still access our demo or return to the homepage to learn more about MedSpaSync Pro.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button
              variant="primary"
              size="xl"
              onClick={handleGoHome}
              className="px-12 py-4"
            >
              🏠 Go to Homepage
            </Button>
            
            <Button
              variant="secondary"
              size="xl"
              onClick={handleTryDemo}
              className="px-12 py-4"
            >
              🚀 Try Live Demo
            </Button>
          </div>

          {/* Help Section */}
          <div className="border-t border-gray-200 pt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Looking for something specific?
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="demo-card p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Features</h4>
                <p className="text-gray-600 mb-4">
                  Learn about our AI-powered reconciliation features
                </p>
                <Button
                  variant="ghost"
                  href="/#features"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  View Features →
                </Button>
              </div>

              <div className="demo-card p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h4>
                <p className="text-gray-600 mb-4">
                  See our simple, transparent pricing plans
                </p>
                <Button
                  variant="ghost"
                  href="/#pricing"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  View Pricing →
                </Button>
              </div>

              <div className="demo-card p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Support</h4>
                <p className="text-gray-600 mb-4">
                  Get help from our medical spa experts
                </p>
                <Button
                  variant="ghost"
                  href="/support"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  Get Support →
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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

export default NotFoundPage;