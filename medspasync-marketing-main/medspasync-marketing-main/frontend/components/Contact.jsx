// ✅ About.jsx

import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import Button from './Button';

/**
 * MedSpaSync Contact Component
 * 
 * Implements the contact section with:
 * - Expert consultation positioning
 * - 24-hour implementation focus
 * - Industry veteran credibility
 * - Clear next steps
 * 
 * Design System:
 * - Uses card and form styling
 * - Grid layout for contact options
 * - High contrast accessibility
 */
const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    spaName: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Message sent successfully! We&apos;ll get back to you within 24 hours.', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        spaName: '',
        message: ''
      });
    } catch (error) {
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="demo-section contact-section">
      <div className="container">
        <div className="text-center mb-12">
          <div className="status-badge info mb-4">
            📞 Get Started
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Stop Losing Revenue?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            &quot;We&apos;ll have you reconciling in 24 hours. No complex integrations, no API dependencies.&quot;
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="card-feature">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Why Choose MedSpaSync Pro?
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  97% match rate accuracy from real medical spas
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  24-hour implementation timeline
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  HIPAA-conscious security
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  No complex integrations required
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Built by 10-year medical spa veteran
                </li>
              </ul>
            </div>

            <div className="card-testimonial">
              <blockquote className="text-gray-700 dark:text-gray-300 italic mb-4">
                &quot;We reduced reconciliation from 6 hours weekly to just 15 minutes. Our operations manager can now focus on patient experience instead of spreadsheets.&quot;
              </blockquote>
              <cite className="text-sm text-gray-600 dark:text-gray-400">
                — Multi-location Med Spa, Atlanta
              </cite>
            </div>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="spaName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spa Name
                </label>
                <input
                  type="text"
                  id="spaName"
                  name="spaName"
                  value={formData.spaName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Your medical spa name"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Tell us about your reconciliation challenges..."
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="large"
              >
                {isSubmitting ? 'Sending...' : 'Start Reconciling in 24 Hours'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
