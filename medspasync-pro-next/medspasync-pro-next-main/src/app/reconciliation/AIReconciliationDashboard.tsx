'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, Upload, CheckCircle, AlertTriangle, Clock, 
  BarChart3, TrendingUp, Users, DollarSign, Activity,
  FileText, Search, Filter, Download, RefreshCw
} from 'lucide-react';

const AIReconciliationDashboard = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const mockProcessingSteps = [
    'Analyzing transaction data...',
    'Identifying patterns and anomalies...',
    'Running AI matching algorithms...',
    'Validating matches with confidence scores...',
    'Generating reconciliation report...',
    'Finalizing results...'
  ];

  const mockResults = {
    totalTransactions: 1247,
    matchedTransactions: 1189,
    unmatchedTransactions: 58,
    confidenceScore: 95.4,
    processingTime: '2.3 seconds',
    accuracy: 98.7,
    savings: 15420
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
  };

  const startReconciliation = () => {
    setIsProcessing(true);
    setProgress(0);
    setResults(null);
    
    let stepIndex = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setResults(mockResults);
          return 100;
        }
        return newProgress;
      });
      
      if (stepIndex < mockProcessingSteps.length) {
        setCurrentStep(mockProcessingSteps[stepIndex]);
        stepIndex++;
      }
    }, 500);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Brain className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">AI Reconciliation</h1>
              </div>
              <p className="text-gray-600">Intelligent transaction matching and reconciliation powered by AI</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Drop your transaction files here</p>
                  <p className="text-xs text-gray-500">CSV, Excel, or JSON formats supported</p>
                  <input
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-2 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer"
                  >
                    Choose Files
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900">Uploaded Files:</h3>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={startReconciliation}
                  disabled={uploadedFiles.length === 0 || isProcessing}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Start AI Reconciliation'}
                </button>
              </div>
            </div>
          </div>

          {/* Processing Status */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h2>
              
              {isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{currentStep}</span>
                  </div>
                </div>
              )}

              {results && (
                <div className="space-y-6">
                  {/* Results Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">Matched</p>
                          <p className="text-2xl font-bold text-green-900">{results.matchedTransactions}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">Unmatched</p>
                          <p className="text-2xl font-bold text-red-900">{results.unmatchedTransactions}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-800">Confidence</p>
                          <p className="text-2xl font-bold text-blue-900">{results.confidenceScore}%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-800">Savings</p>
                          <p className="text-2xl font-bold text-purple-900">{formatCurrency(results.savings)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Processing Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Transactions:</span>
                          <span className="font-medium">{results.totalTransactions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Processing Time:</span>
                          <span className="font-medium">{results.processingTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Accuracy Rate:</span>
                          <span className="font-medium">{results.accuracy}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </button>
                        <button className="w-full flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                          <Search className="w-4 h-4 mr-2" />
                          Review Unmatched
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isProcessing && !results && (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Process</h3>
                  <p className="text-gray-600">Upload your transaction files and start AI reconciliation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AIReconciliationDashboard }; 