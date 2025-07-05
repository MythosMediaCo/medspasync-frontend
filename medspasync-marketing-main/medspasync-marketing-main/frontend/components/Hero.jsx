import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

/**
 * MedSpaSync Hero Component - "This Actually Matters" Aesthetic
 * 
 * Implements the proven hero pattern with:
 * - "8+ hours weekly" messaging
 * - Trust indicators (97% accuracy, HIPAA, 24hr)
 * - Strong CTA with benefit + timeframe
 * 
 * Design System:
 * - Navy blue and coral color scheme
 * - More confident, human typography
 * - Warmer, more approachable styling
 * - Mobile-first responsive
 */
const Hero = () => {
  // MedSpaSync Pro Trust Indicators (exact from super prompt)
  const trustIndicators = [
    "97% Match Rate Accuracy",
    "HIPAA-Conscious Security", 
    "QuickBooks Integration",
    "24-Hour Implementation"
  ];

  // "This Actually Matters" style data visualization cards
  const dataCards = [
    {
      id: 1,
      value: '98',
      unit: '%',
      label: 'Accuracy Rate',
      description: 'AI-powered reconciliation accuracy across all medical spa transactions',
      background: 'linear-gradient(135deg, #ff6b35 0%, #ff8a65 100%)', // Coral gradient
      chart: (
        <svg width="100%" height="60" viewBox="0 0 200 60" className="chart-container">
          <path
            d="M0 50 L40 30 L80 35 L120 20 L160 25 L200 15"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />
        </svg>
      ),
      timeline: ['Jan', 'Mar', 'Jun', 'Sep', 'Dec']
    },
    {
      id: 2,
      value: '1.2',
      unit: 'hrs',
      label: 'Average Processing',
      description: 'Reduced reconciliation time from 8 hours to under 2 hours',
      background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)', // Navy gradient
      chart: (
        <svg width="100%" height="60" viewBox="0 0 200 60" className="chart-container">
          <path
            d="M0 45 L50 20 L100 15 L150 10 L200 5"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />
        </svg>
      ),
      timeline: ['Before', 'Week 1', 'Month 1', 'Month 3', 'Now']
    },
    {
      id: 3,
      value: '43',
      unit: '%',
      label: 'Cost Reduction',
      description: 'Average cost savings on reconciliation and administrative overhead',
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', // Keep success green
      chart: (
        <svg width="100%" height="60" viewBox="0 0 200 60" className="chart-container">
          <path
            d="M0 40 L40 35 L80 25 L120 20 L160 15 L200 10"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />
        </svg>
      ),
      timeline: ['Q1', 'Q2', 'Q3', 'Q4', 'Annual']
    }
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100/50 overflow-hidden">
      {/* Subtle Background Pattern - Warmer */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a365d' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Floating Elements - "This Actually Matters" Style */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-ff6b35/10 to-ff8a65/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-1a365d/8 to-2d3748/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-br from-2d3748/6 to-1a365d/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-32">
        <div className="text-center">
          {/* Badge - More Confident */}
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-ff6b35/10 border border-ff6b35/20 text-1a365d text-base font-semibold mb-8 animate-fadeIn">
            <span className="w-2 h-2 bg-ff6b35 rounded-full mr-3 animate-pulse"></span>
            Built by 10-year medical spa industry veterans
          </div>

          {/* Main Headline - More Confident Typography */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-1a365d mb-8 leading-tight tracking-tight">
            Stop Losing{' '}
            <span className="bg-gradient-to-r from-ff6b35 to-ff8a65 bg-clip-text text-transparent">
              8+ Hours Weekly
            </span>
            {' '}to Manual Reconciliation
          </h1>
          
          {/* Subtext - More Human */}
          <p className="text-xl md:text-2xl text-neutral-700 mb-12 max-w-4xl mx-auto leading-relaxed">
            AI matching achieves <span className="font-semibold text-ff6b35">95%+ accuracy</span>, 
            saving spa teams from hours of cross-checking while preventing{' '}
            <span className="font-semibold text-red-600">$2,500+ monthly</span> in missed revenue.
          </p>

          {/* Trust Indicators - "This Actually Matters" Style */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {trustIndicators.map((indicator, index) => (
              <div 
                key={index} 
                className="inline-flex items-center px-5 py-3 bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-full text-base font-medium text-neutral-700 shadow-sm hover:shadow-md transition-all duration-200 animate-fadeIn hover:border-ff6b35/30"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="w-2 h-2 bg-ff6b35 rounded-full mr-3"></span>
                {indicator}
              </div>
            ))}
          </div>

          {/* CTA Buttons - More Confident */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link to="/demo">
              <Button 
                variant="primary" 
                size="xl"
                className="bg-gradient-to-r from-ff6b35 to-ff8a65 hover:from-ff8a65 hover:to-ff6b35 text-white px-10 py-5 text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Start Reconciling in 24 Hours
              </Button>
            </Link>
            
            <Link to="/features">
              <Button 
                variant="secondary" 
                size="xl"
                className="bg-white text-1a365d border-2 border-1a365d hover:bg-1a365d hover:text-white px-10 py-5 text-lg font-bold shadow-sm hover:shadow-md transition-all duration-200"
              >
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Social Proof - More Human */}
          <div className="text-center">
            <p className="text-base text-neutral-600 mb-4 font-medium">
              Trusted by medical spas nationwide
            </p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="w-24 h-8 bg-neutral-200 rounded animate-pulse"></div>
              <div className="w-28 h-8 bg-neutral-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - More Human */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
        <div className="w-6 h-10 border-2 border-neutral-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-neutral-400 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>

      {/* "This Actually Matters" Data Visualization Cards */}
      <div className="card-grid max-w-6xl mx-auto">
        {dataCards.map((card, index) => (
          <div
            key={card.id}
            className="data-card group"
            style={{ background: card.background }}
          >
            {/* Card Overlay */}
            <div className="data-card-overlay group-hover:opacity-20 transition-opacity duration-300"></div>
            
            {/* Card Content */}
            <div className="data-card-content">
              {/* Data Value and Unit */}
              <div className="flex items-baseline justify-center mb-2">
                <span className="data-value text-4xl font-bold text-white">
                  {card.value}
                </span>
                <span className="data-unit text-xl font-semibold text-white/90 ml-1">
                  {card.unit}
                </span>
              </div>
              
              {/* Data Label */}
              <h3 className="data-label text-lg font-semibold text-white mb-2">
                {card.label}
              </h3>
              
              {/* Data Description */}
              <p className="data-description text-sm text-white/80 mb-4">
                {card.description}
              </p>
              
              {/* Chart */}
              <div className="mb-3">
                {card.chart}
              </div>
              
              {/* Timeline Markers */}
              <div className="timeline-markers">
                {card.timeline.map((marker, idx) => (
                  <span key={idx} className="text-xs text-white/70">
                    {marker}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Hero;