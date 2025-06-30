'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, Memory, HardDrive, Wifi, 
  Clock, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Settings, RefreshCw, BarChart3
} from 'lucide-react';

const PerformanceMonitoringDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceData, setPerformanceData] = useState({
    cpu: 45,
    memory: 62,
    disk: 28,
    network: 12,
    responseTime: 1.2,
    throughput: 1250,
    errors: 0.1,
    uptime: 99.9
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setPerformanceData(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(85, prev.memory + (Math.random() - 0.5) * 5)),
        disk: Math.max(15, Math.min(60, prev.disk + (Math.random() - 0.5) * 3)),
        network: Math.max(5, Math.min(25, prev.network + (Math.random() - 0.5) * 8))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'Good', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (value <= thresholds.warning) return { status: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { status: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const formatMetric = (value: number, unit: string) => {
    if (unit === 'percent') return `${value.toFixed(1)}%`;
    if (unit === 'ms') return `${value.toFixed(1)}ms`;
    if (unit === 'mbps') return `${value.toFixed(0)} Mbps`;
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Activity className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Performance & Monitoring</h1>
              </div>
              <p className="text-gray-600">Real-time system performance monitoring and optimization</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'System Overview', icon: Activity },
                { id: 'resources', name: 'Resource Usage', icon: Cpu },
                { id: 'network', name: 'Network', icon: Wifi },
                { id: 'applications', name: 'Applications', icon: BarChart3 },
                { id: 'alerts', name: 'Alerts', icon: AlertTriangle }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* System Health Score */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg className="w-20 h-20" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray={`${100 - performanceData.cpu}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{performanceData.cpu.toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">CPU Usage</p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg className="w-20 h-20" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray={`${performanceData.memory}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{performanceData.memory.toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Memory Usage</p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg className="w-20 h-20" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray={`${performanceData.disk}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{performanceData.disk.toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Disk Usage</p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg className="w-20 h-20" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="2"
                          strokeDasharray={`${performanceData.network * 4}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{performanceData.network.toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Network</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Response Time</p>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(performanceData.responseTime, 'ms')}</p>
                      <div className="flex items-center mt-1">
                        <TrendingDown className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 ml-1">-5.2%</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Throughput</p>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(performanceData.throughput, 'mbps')}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 ml-1">+12.8%</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Error Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(performanceData.errors, 'percent')}</p>
                      <div className="flex items-center mt-1">
                        <TrendingDown className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 ml-1">-0.05%</span>
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(performanceData.uptime, 'percent')}</p>
                      <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Web Server', status: 'Operational', icon: Server, color: 'text-green-600' },
                    { name: 'Database', status: 'Operational', icon: Database, color: 'text-green-600' },
                    { name: 'Cache Server', status: 'Operational', icon: Memory, color: 'text-green-600' },
                    { name: 'Load Balancer', status: 'Operational', icon: Activity, color: 'text-green-600' }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <service.icon className={`w-5 h-5 ${service.color}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-green-600">{service.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other tabs - simplified for demo */}
          {activeTab !== 'overview' && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'resources' && 'Resource Usage'}
                  {activeTab === 'network' && 'Network Monitoring'}
                  {activeTab === 'applications' && 'Application Performance'}
                  {activeTab === 'alerts' && 'Performance Alerts'}
                </h3>
                <p className="text-gray-600">
                  Detailed {activeTab} monitoring and metrics will be displayed here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PerformanceMonitoringDashboard }; 