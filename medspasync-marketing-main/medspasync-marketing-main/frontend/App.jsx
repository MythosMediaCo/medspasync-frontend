import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './context/ToastContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import SupportPage from './pages/SupportPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import InsightsPage from './pages/InsightsPage';
import NotFoundPage from './pages/NotFoundPage';
import HIPAACompliance from './pages/Articles/HIPAACompliance';
import SoftwareFailures from './pages/Articles/SoftwareFailures';

/**
 * MedSpaSync Pro App Component
 * 
 * Implements the complete application with:
 * - Design system integration
 * - Dark mode initialization
 * - Routing with all components
 * - Toast context for notifications
 * - Interactive demo and success stories
 * - ROI calculator, documentation agent, and live chat
 */
const App = () => {
  return (
    <HelmetProvider>
      <ToastProvider>
        <Router>
          <div className="App">
            <Navigation />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/hipaa-compliance" element={<HIPAACompliance />} />
                <Route path="/software-failures" element={<SoftwareFailures />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <ScrollToTop />
          </div>
        </Router>
      </ToastProvider>
    </HelmetProvider>
  );
};

export default App;