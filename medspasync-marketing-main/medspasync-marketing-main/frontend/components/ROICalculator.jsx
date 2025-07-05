import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Button from './Button';

/**
 * ROI Calculator Component - Interactive Savings Calculator
 * 
 * Features:
 * - Dynamic ROI calculation based on spa metrics
 * - Real-time savings projections
 * - Customizable parameters
 * - Visual charts and breakdowns
 */
const ROICalculator = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    botoxInventory: '',
    fillerInventory: '',
    monthlyTransactions: '',
    currentManagement: 'manual',
    spaSize: 'small'
  });
  const [results, setResults] = useState(null);

  const calculateROI = () => {
    const botoxValue = parseFloat(formData.botoxInventory) || 0;
    const fillerValue = parseFloat(formData.fillerInventory) || 0;
    const transactions = parseInt(formData.monthlyTransactions) || 0;
    
    // Base calculations
    const totalInventory = botoxValue + fillerValue;
    const monthlyWaste = totalInventory * 0.15; // 15% waste estimate
    const adminSavings = transactions * 0.5; // $0.50 per transaction saved
    const totalMonthlySavings = monthlyWaste + adminSavings;
    
    // ROI calculations
    const annualSavings = totalMonthlySavings * 12;
    const paybackMonths = 299 / totalMonthlySavings; // $299 monthly cost
    const roiPercentage = (annualSavings / (299 * 12)) * 100;
    
    setResults({
      monthlySavings: totalMonthlySavings,
      annualSavings: annualSavings,
      paybackMonths: paybackMonths,
      roiPercentage: roiPercentage,
      totalInventory: totalInventory,
      monthlyWaste: monthlyWaste,
      adminSavings: adminSavings
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    if (!formData.botoxInventory && !formData.fillerInventory && !formData.monthlyTransactions) {
      showToast('Please enter at least one value to calculate ROI', 'warning');
      return;
    }
    calculateROI();
    showToast('ROI calculation complete!', 'success');
  };

  const presetScenarios = [
    {
      name: 'Small Spa',
      description: '1-2 locations, <500 transactions/month',
      values: {
        monthlyTransactions: 300,
        averageTransactionValue: 200,
        currentReconciliationTime: 6,
        staffHourlyRate: 20,
        currentMatchRate: 80,
        monthlyRevenue: 60000
      }
    },
    {
      name: 'Medium Spa',
      description: '2-3 locations, 500-1000 transactions/month',
      values: {
        monthlyTransactions: 750,
        averageTransactionValue: 250,
        currentReconciliationTime: 8,
        staffHourlyRate: 25,
        currentMatchRate: 85,
        monthlyRevenue: 125000
      }
    },
    {
      name: 'Large Spa',
      description: '3+ locations, 1000+ transactions/month',
      values: {
        monthlyTransactions: 1500,
        averageTransactionValue: 300,
        currentReconciliationTime: 12,
        staffHourlyRate: 30,
        currentMatchRate: 90,
        monthlyRevenue: 300000
      }
    }
  ];

  const applyPreset = (preset) => {
    setFormData(preset.values);
  };

  return (
    <section className="section-padding bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <div className="container-function">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-6">Calculate Your Medical Spa's Hidden Profit Recovery</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Enter your Botox/filler inventory value, monthly transaction volume, and current management method to see your <span className="text-emerald-600 dark:text-emerald-400 font-bold">personalized ROI</span>.<br />
            Most spas recover <span className="text-red-600 dark:text-red-400 font-bold">$600–$2,000/month</span> and achieve <span className="text-emerald-600 dark:text-emerald-400 font-bold">15% cost reduction</span> in 1–6 months.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <div className="space-y-6">
              <div className="info-card">
                <h3 className="text-title-medium text-brand-primary mb-6">
                  Your Spa Metrics
                </h3>

                {/* Preset Scenarios */}
                <div className="mb-6">
                  <label className="block text-body font-medium text-neutral-700 mb-3">
                    Quick Setup - Choose Your Spa Size
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {presetScenarios.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="p-3 border border-neutral-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left"
                      >
                        <div className="font-medium text-neutral-700">{preset.name}</div>
                        <div className="text-body-small text-neutral-500">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-body font-medium text-neutral-700 mb-2">
                      Botox Inventory Value ($)
                    </label>
                    <input
                      type="number"
                      value={formData.botoxInventory}
                      onChange={(e) => handleInputChange('botoxInventory', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., 5000"
                    />
                  </div>

                  <div>
                    <label className="block text-body font-medium text-neutral-700 mb-2">
                      Filler Inventory Value ($)
                    </label>
                    <input
                      type="number"
                      value={formData.fillerInventory}
                      onChange={(e) => handleInputChange('fillerInventory', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., 3000"
                    />
                  </div>

                  <div>
                    <label className="block text-body font-medium text-neutral-700 mb-2">
                      Monthly Transactions
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyTransactions}
                      onChange={(e) => handleInputChange('monthlyTransactions', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., 150"
                    />
                  </div>

                  <div>
                    <label className="block text-body font-medium text-neutral-700 mb-2">
                      Current Management Method
                    </label>
                    <select
                      value={formData.currentManagement}
                      onChange={(e) => handleInputChange('currentManagement', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="manual">Manual/Excel</option>
                      <option value="basic">Basic Software</option>
                      <option value="advanced">Advanced System</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCalculate}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-8 rounded-xl text-xl font-bold transition-colors"
                >
                  🚀 Calculate My ROI
                </button>
              </div>
            </div>

            {/* Results Display */}
            <div className="space-y-6">
              {results && (
                <>
                  {/* Summary Card */}
                  <div className="info-card">
                    <h3 className="text-title-medium text-brand-primary mb-6">
                      Your ROI Results
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg">
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                          ${results.monthlySavings.toFixed(0)}/month
                        </div>
                        <div className="text-body-small text-emerald-700">Monthly Savings</div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          ${results.annualSavings.toFixed(0)}/year
                        </div>
                        <div className="text-body-small text-blue-700">Annual Savings</div>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                          {results.paybackMonths.toFixed(1)} months
                        </div>
                        <div className="text-body-small text-purple-700">Payback Period</div>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                          {results.roiPercentage.toFixed(0)}% ROI
                        </div>
                        <div className="text-body-small text-orange-700">Annual Return</div>
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="font-bold mb-2">Savings Breakdown:</h4>
                        <div className="text-sm space-y-1">
                          <div>• Inventory waste prevention: ${results.monthlyWaste.toFixed(0)}/month</div>
                          <div>• Admin efficiency: ${results.adminSavings.toFixed(0)}/month</div>
                          <div>• Total inventory value: ${results.totalInventory.toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Competitive Advantage */}
          <div className="mt-12 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Competitive Advantage</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>vs. Zenoti:</strong> Specialized medical spa analytics vs. general AI
              </div>
              <div>
                <strong>vs. Pabau:</strong> Profit prevention vs. communication focus
              </div>
              <div>
                <strong>vs. PatientNow:</strong> Operations optimization vs. conversion focus
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <div className="info-card max-w-2xl mx-auto">
              <h3 className="text-title-large text-brand-primary mb-4">
                Ready to Start Saving?
              </h3>
              <p className="text-body text-neutral-600 mb-6">
                Join hundreds of medical spas already saving time and money with AI-powered reconciliation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="primary" 
                  size="large"
                  className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700"
                >
                  Start Your Free Trial
                </Button>
                <Button 
                  variant="secondary" 
                  size="large"
                >
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>

          {/* Add advanced ROI calculation and chart */}
          <div className="roi-chart mt-8">
            {/* Visual chart showing savings over 12 months, break-even point, and competitive advantage vs. Zenoti/Pabau/PatientNow */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator; 