<section id="contactSection" className="py-20 bg-gray-50"></section>
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useToast } from '../context/ToastContext';

const ContactPage = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    spa_name: '',
    current_challenge: '',
    message: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('https://api.medspasyncpro.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to send message');

      showToast("Message sent! We'll respond within 24 hours with practical next steps.", 'success');
      setFormData({ name: '', email: '', spa_name: '', current_challenge: '', message: '' });
    } catch (err) {
      showToast('Message failed to send. Please try again or email us directly.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const challengeOptions = [
    { value: '', label: 'Select your biggest reconciliation challenge...' },
    { value: 'time_waste', label: 'Spending 8+ hours weekly on manual reconciliation' },
    { value: 'missed_revenue', label: 'Missing revenue from unmatched transactions' },
    { value: 'alle_aspire', label: 'Alle and Aspire reconciliation complexity' },
    { value: 'financial_accuracy', label: 'Inaccurate financial reports affecting decisions' },
    { value: 'staff_frustration', label: 'Staff frustrated with manual processes' },
    { value: 'compliance_concerns', label: 'HIPAA compliance with current systems' },
    { value: 'other', label: 'Other reconciliation challenge' }
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us | Stop Losing 8+ Hours Weekly to Reconciliation</title>
        <meta 
          name="description" 
          content="Get help eliminating manual reconciliation. Our team understands the operational challenges costing spas $2,500+ monthly." 
        />
      </Helmet>

      <main className="pt-24 pb-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="inline-flex items-center bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
            Real Support from Operations Experts
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Stop Losing Revenue to<br />
            Reconciliation Problems
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Questions about eliminating <strong>8+ hours weekly</strong> of manual reconciliation? 
            Our team understands the operational challenges costing spas <strong>$2,500+ monthly</strong> 
            in missed revenue.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">8+ hrs</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Weekly Time Waste</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">$2,500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue Loss</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">24hrs</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Our Response Time</div>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="max-w-6xl mx-auto px-6 mb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Direct Contact */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold mb-3">Quick Questions</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Need fast answers about AI matching, implementation, or pricing?
              </p>
              <a 
                href="mailto:support@medspasyncpro.com"
                className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                support@medspasyncpro.com
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            {/* Demo Request */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-700 dark:text-indigo-300">Live Demo</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                See AI matching in action with your actual reconciliation data.
              </p>
              <a 
                href="https://app.medspasyncpro.com/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Try Live Demo
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Operational Consultation */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-3">Implementation Help</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Need guidance on reconciliation workflow optimization?
              </p>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Use the form below for detailed questions
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="max-w-2xl mx-auto px-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Tell Us About Your Reconciliation Challenge
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
              We respond within 24 hours with practical next steps—no sales pitch, 
              just operational solutions from people who understand the reconciliation nightmare.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="spa_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spa/Practice Name
                </label>
                <input
                  id="spa_name"
                  name="spa_name"
                  type="text"
                  value={formData.spa_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Your spa or practice name"
                />
              </div>

              <div>
                <label htmlFor="current_challenge" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Biggest Reconciliation Challenge
                </label>
                <select
                  id="current_challenge"
                  name="current_challenge"
                  value={formData.current_challenge}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  {challengeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Details *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Tell us more about your reconciliation challenges. How many hours weekly do you spend? What systems are you using? Any specific pain points with Alle, Aspire, or POS reconciliation?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full px-4 py-2 text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                We respond within 24 hours with actionable solutions
              </div>
            </div>
          </div>
        </section>

        {/* Why Contact Us */}
        <section className="max-w-4xl mx-auto px-6 mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Why Our Support Is Different</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              We built MedSpaSync Pro because we understand reconciliation nightmares firsthand.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-lg font-semibold mb-2">Operations-Focused</h4>
              <p className="text-gray-600 dark:text-gray-300">
                We understand spa workflow challenges, not just software features.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-lg font-semibold mb-2">24-Hour Response</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Fast answers to reconciliation questions—we know time is money.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h4 className="text-lg font-semibold mb-2">Practical Solutions</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Real implementation guidance, not generic software support.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ContactPage;