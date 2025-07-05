// src/components/Features.jsx  
import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { features } from '../data/features';

/**
 * MedSpaSync Features Component - Function Health Aesthetic
 * 
 * Implements the features section with:
 * - AI Intelligence Layer positioning
 * - Proven metrics (95%+, $2,500+, 24hr)
 * - Real user transformation proof
 * - Expert industry voice
 * 
 * Design System:
 * - Clean, modern Function Health aesthetic
 * - Card-based layout with subtle shadows
 * - High contrast accessibility
 */
const Features = () => {
  // Color Mapping - Function Health Style
  const colorClasses = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    red: "text-red-600 bg-red-50 border-red-200", 
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    green: "text-green-600 bg-green-50 border-green-200"
  };

  // Helper function to render icon from object format
  const renderIcon = (iconObj) => {
    if (!iconObj || !iconObj.type) return null;
    
    return React.createElement(iconObj.type, {
      ...iconObj.props,
      key: 'icon'
    });
  };

  return (
    <section className="section-padding bg-background-secondary">
      <div className="container-function">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-display-medium text-brand-primary mb-6">
            Comprehensive AI-Powered Features
          </h2>
          <p className="text-body-large text-neutral-600 max-w-3xl mx-auto">
            Everything you need to streamline medical spa reconciliation, reduce errors, 
            and improve operational efficiency with intelligent automation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="info-card group"
            >
              {/* Feature Icon */}
              <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-accent/20 transition-colors duration-300">
                <svg
                  className="w-6 h-6 text-brand-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {renderIcon(feature.icon)}
                </svg>
              </div>

              {/* Feature Content */}
              <div>
                <h3 className="text-title-medium text-brand-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-body text-neutral-600 mb-4">
                  {feature.description}
                </p>
                
                {/* Feature Benefits */}
                {feature.benefits && (
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <svg
                          className="w-4 h-4 text-semantic-success mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-body-small text-neutral-600">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-title-large text-brand-primary mb-4">
              Advanced Capabilities
            </h3>
            <p className="text-body text-neutral-600 max-w-2xl mx-auto">
              Beyond basic reconciliation, our platform offers advanced features designed 
              specifically for medical spa operations and compliance requirements.
            </p>
          </div>

          {/* Advanced Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* HIPAA Compliance */}
            <div className="info-card">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-semantic-medical/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-semantic-medical"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-title-medium text-brand-primary mb-2">
                    HIPAA Compliant
                  </h4>
                  <p className="text-body text-neutral-600">
                    Full HIPAA compliance with encrypted data transmission, secure storage, 
                    and audit trails for all reconciliation activities.
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time Analytics */}
            <div className="info-card">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-semantic-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-semantic-info"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-title-medium text-brand-primary mb-2">
                    Real-time Analytics
                  </h4>
                  <p className="text-body text-neutral-600">
                    Live dashboards and reporting with customizable metrics, 
                    trend analysis, and performance insights.
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-location Support */}
            <div className="info-card">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-semantic-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-semantic-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-title-medium text-brand-primary mb-2">
                    Multi-location Support
                  </h4>
                  <p className="text-body text-neutral-600">
                    Manage multiple medical spa locations from a single dashboard 
                    with centralized reporting and oversight.
                  </p>
                </div>
              </div>
            </div>

            {/* API Integration */}
            <div className="info-card">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-brand-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-title-medium text-brand-primary mb-2">
                    API Integration
                  </h4>
                  <p className="text-body text-neutral-600">
                    Seamless integration with existing practice management systems, 
                    payment processors, and accounting software.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-background-primary rounded-2xl p-8 shadow-card">
            <h3 className="text-title-large text-brand-primary mb-4">
              Ready to Transform Your Reconciliation Process?
            </h3>
            <p className="text-body text-neutral-600 mb-6 max-w-2xl mx-auto">
              Join hundreds of medical spas already saving time and reducing errors 
              with our AI-powered reconciliation platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Start Free Trial
              </button>
              <button className="btn-secondary">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;