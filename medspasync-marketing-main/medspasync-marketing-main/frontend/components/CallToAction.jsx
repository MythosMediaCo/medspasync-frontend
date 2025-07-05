// src/components/CallToAction.jsx
import { Link } from 'react-router-dom';

const CallToAction = () => {
  return (
    <section className="demo-section cta-section">
      <div className="container">
        <div className="card-cta text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Stop Losing Revenue?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join medical spas saving 8+ hours weekly while achieving 97% match rate accuracy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-primary bg-white text-orange-600 hover:bg-gray-100">
              Start Reconciling in 24 Hours
            </Link>
            <Link to="/demo" className="btn-secondary border-white text-white hover:bg-white hover:text-orange-600">
              See Live Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;