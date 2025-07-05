import React, { useState, useEffect } from 'react';
import Button from './Button';

/**
 * Interactive Demo Component - AI Reconciliation Simulation
 * 
 * Features:
 * - Real-time transaction matching simulation
 * - Interactive file upload demonstration
 * - Live accuracy metrics
 * - Step-by-step process visualization
 */
const InteractiveDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [unmatchedCount, setUnmatchedCount] = useState(0);

  // Sample transaction data for demo
  const sampleTransactions = [
    { id: 1, pos: 'Facial Treatment - Sarah M.', loyalty: 'Facial Treatment - Sarah M.', status: 'matched', confidence: 98 },
    { id: 2, pos: 'Botox Injection - John D.', loyalty: 'Botox - John D.', status: 'matched', confidence: 95 },
    { id: 3, pos: 'Chemical Peel - Lisa R.', loyalty: 'Chemical Peel - Lisa R.', status: 'matched', confidence: 99 },
    { id: 4, pos: 'Laser Hair Removal - Mike T.', loyalty: 'Laser Treatment - Mike T.', status: 'unmatched', confidence: 45 },
    { id: 5, pos: 'Dermal Fillers - Amy K.', loyalty: 'Dermal Fillers - Amy K.', status: 'matched', confidence: 97 },
    { id: 6, pos: 'Microdermabrasion - Tom W.', loyalty: 'Microdermabrasion - Tom W.', status: 'matched', confidence: 96 },
    { id: 7, pos: 'IPL Treatment - Rachel L.', loyalty: 'IPL - Rachel L.', status: 'matched', confidence: 94 },
    { id: 8, pos: 'CoolSculpting - David P.', loyalty: 'CoolSculpting - David P.', status: 'matched', confidence: 98 },
  ];

  const steps = [
    {
      title: 'Upload Files',
      description: 'Drag and drop your POS and loyalty program CSV files',
      icon: '📁',
      duration: 2000
    },
    {
      title: 'AI Analysis',
      description: 'Our AI analyzes transaction patterns and naming variations',
      icon: '🧠',
      duration: 3000
    },
    {
      title: 'Smart Matching',
      description: 'Intelligent matching with confidence scoring',
      icon: '🔗',
      duration: 4000
    },
    {
      title: 'Results Ready',
      description: 'Review matched and unmatched transactions',
      icon: '✅',
      duration: 2000
    }
  ];

  const startDemo = () => {
    setCurrentStep(0);
    setIsProcessing(true);
    setProgress(0);
    setResults(null);
    setMatchedCount(0);
    setUnmatchedCount(0);
    
    // Simulate step-by-step process
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        setProgress(((index + 1) / steps.length) * 100);
        
        if (index === steps.length - 1) {
          // Show results
          setTimeout(() => {
            setIsProcessing(false);
            setResults(sampleTransactions);
            setMatchedCount(sampleTransactions.filter(t => t.status === 'matched').length);
            setUnmatchedCount(sampleTransactions.filter(t => t.status === 'unmatched').length);
          }, step.duration);
        }
      }, steps.slice(0, index).reduce((acc, s) => acc + s.duration, 0));
    });
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsProcessing(false);
    setProgress(0);
    setResults(null);
    setMatchedCount(0);
    setUnmatchedCount(0);
  };

  return (
    <section className="section-padding bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <div className="container-function">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-display-medium text-brand-primary mb-6">
            See AI Reconciliation in Action
          </h2>
          <p className="text-body-large text-neutral-600 max-w-3xl mx-auto">
            Experience how our AI transforms 8+ hours of manual work into minutes of automated processing.
          </p>
        </div>

        {/* Demo Container */}
        <div className="max-w-4xl mx-auto">
          {/* Demo Controls */}
          <div className="text-center mb-8">
            {!isProcessing && !results && (
              <Button 
                variant="primary" 
                size="large"
                onClick={startDemo}
                className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700"
              >
                🚀 Start Interactive Demo
              </Button>
            )}
            
            {results && (
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="medium"
                  onClick={resetDemo}
                >
                  🔄 Run Again
                </Button>
                <Button 
                  variant="primary" 
                  size="medium"
                  className="bg-gradient-to-r from-emerald-600 to-indigo-600"
                >
                  📊 View Full Report
                </Button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body font-medium text-neutral-700">
                  {steps[currentStep]?.title}
                </span>
                <span className="text-body-small text-neutral-500">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-body-small text-neutral-600 mt-2 text-center">
                {steps[currentStep]?.description}
              </p>
            </div>
          )}

          {/* Demo Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Process Visualization */}
            <div className="space-y-6">
              <div className="info-card">
                <h3 className="text-title-medium text-brand-primary mb-4">
                  AI Processing Pipeline
                </h3>
                
                {isProcessing && (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div 
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                          index <= currentStep 
                            ? 'bg-emerald-50 border border-emerald-200' 
                            : 'bg-neutral-50 border border-neutral-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                          index <= currentStep 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-neutral-300 text-neutral-600'
                        }`}>
                          {index < currentStep ? '✓' : step.icon}
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium ${
                            index <= currentStep ? 'text-emerald-700' : 'text-neutral-500'
                          }`}>
                            {step.title}
                          </div>
                          <div className="text-body-small text-neutral-600">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">{matchedCount}</div>
                        <div className="text-body-small text-emerald-700">Matched</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{unmatchedCount}</div>
                        <div className="text-body-small text-red-700">Unmatched</div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((matchedCount / sampleTransactions.length) * 100)}%
                      </div>
                      <div className="text-body-small text-blue-700">Accuracy Rate</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Transaction List */}
            <div className="info-card">
              <h3 className="text-title-medium text-brand-primary mb-4">
                Transaction Matching Results
              </h3>
              
              {!results && !isProcessing && (
                <div className="text-center py-12 text-neutral-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-body">Click "Start Interactive Demo" to see AI matching in action</p>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-3">
                  {sampleTransactions.slice(0, 4).map((transaction, index) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg animate-pulse"
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-neutral-700">{transaction.pos}</div>
                        <div className="text-body-small text-neutral-500">{transaction.loyalty}</div>
                      </div>
                      <div className="text-body-small text-neutral-400">Processing...</div>
                    </div>
                  ))}
                </div>
              )}

              {results && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sampleTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        transaction.status === 'matched' 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-neutral-700">{transaction.pos}</div>
                        <div className="text-body-small text-neutral-500">{transaction.loyalty}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.status === 'matched' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></div>
                        <div className={`text-body-small font-medium ${
                          transaction.status === 'matched' ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {transaction.confidence}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Summary */}
          {results && (
            <div className="mt-8 info-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-emerald-600 mb-2">6.5 hours</div>
                  <div className="text-body-small text-neutral-600">Time Saved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">$1,200</div>
                  <div className="text-body-small text-neutral-600">Revenue Recovered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
                  <div className="text-body-small text-neutral-600">Accuracy Rate</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo; 