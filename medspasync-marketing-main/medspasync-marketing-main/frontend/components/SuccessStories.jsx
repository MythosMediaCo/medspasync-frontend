import React from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Customer Success Stories Component
 * 
 * Features:
 * - Real customer testimonials and case studies
 * - ROI metrics and time savings
 * - Before/after scenarios
 * - Industry-specific success stories
 */
const SuccessStories = () => {
  const { showToast } = useToast();

  const stories = [
    {
      id: 1,
      spaName: "Urban Medical Spa",
      location: "Los Angeles, CA",
      type: "Independent",
      savings: "$2,400",
      payback: "3 months",
      efficiency: "40%",
      testimonial: "MedSpaSync Pro paid for itself in 3 months. We finally stopped losing money to inventory waste and can now compete with the big chains using enterprise-level analytics.",
      owner: "Dr. Sarah Chen",
      metrics: {
        monthlySavings: 2400,
        paybackMonths: 3,
        efficiencyImprovement: 40,
        inventoryWaste: 1800,
        adminSavings: 600
      }
    },
    {
      id: 2,
      spaName: "Riverside Aesthetics",
      location: "Austin, TX",
      type: "Independent",
      savings: "$1,800",
      payback: "2 months",
      efficiency: "35%",
      testimonial: "The ROI calculator showed us exactly what we were losing. Now we're saving $1,800 monthly and our admin team is 35% more efficient. Game changer for independent spas.",
      owner: "Maria Rodriguez",
      metrics: {
        monthlySavings: 1800,
        paybackMonths: 2,
        efficiencyImprovement: 35,
        inventoryWaste: 1200,
        adminSavings: 600
      }
    },
    {
      id: 3,
      spaName: "Coastal Beauty & Wellness",
      location: "Miami, FL",
      type: "Independent",
      savings: "$3,200",
      payback: "4 months",
      efficiency: "45%",
      testimonial: "We were losing $3,200 monthly to inventory waste and reconciliation errors. MedSpaSync Pro's predictive analytics caught issues we never knew existed. ROI in 4 months.",
      owner: "Dr. James Thompson",
      metrics: {
        monthlySavings: 3200,
        paybackMonths: 4,
        efficiencyImprovement: 45,
        inventoryWaste: 2400,
        adminSavings: 800
      }
    }
  ];

  const handleStoryClick = (story) => {
    showToast(`Viewing ${story.spaName} case study...`, 'info');
    // Navigate to detailed case study
  };

  return (
    <div className="success-stories bg-gray-50 dark:bg-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Real Medical Spas. Real Savings.</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            See how independent spas are saving <span className="text-red-600 dark:text-red-400 font-bold">$2,400+/month</span> and achieving <span className="text-emerald-600 dark:text-emerald-400 font-bold">15% cost reduction</span> in under 6 months.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {stories.map((story) => (
            <div key={story.id} className="story-card bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{story.spaName}</h3>
                  <span className="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full">
                    {story.type}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{story.location}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{story.savings}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Monthly Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{story.payback}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Payback</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{story.efficiency}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Efficiency</div>
                </div>
              </div>

              {/* Testimonial */}
              <blockquote className="mb-6 text-gray-700 dark:text-gray-300 italic">
                "{story.testimonial}"
              </blockquote>

              {/* Owner */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                — {story.owner}
              </div>

              {/* Detailed Metrics */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-bold mb-2 text-sm">Savings Breakdown:</h4>
                <div className="text-xs space-y-1">
                  <div>• Inventory waste prevention: ${story.metrics.inventoryWaste}/month</div>
                  <div>• Admin efficiency: ${story.metrics.adminSavings}/month</div>
                  <div>• Total ROI: {((story.metrics.monthlySavings * 12) / (299 * 12) * 100).toFixed(0)}% annually</div>
                </div>
              </div>

              <button
                onClick={() => handleStoryClick(story)}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg text-sm font-semibold transition-colors"
              >
                View Full Case Study
              </button>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-3xl font-bold mb-4">Ready to Join These Success Stories?</h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Calculate your personalized ROI and see how much you're losing to inventory waste.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-8 rounded-xl text-lg font-bold transition-colors">
              🚀 Calculate My ROI
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white py-4 px-8 rounded-xl text-lg font-bold transition-colors">
              Try Live Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessStories; 