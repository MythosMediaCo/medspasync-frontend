'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, DollarSign, Target, BarChart3, PieChart, 
  Calendar, Zap, Eye, Download, Filter, RefreshCw, AlertTriangle,
  CheckCircle, ArrowUpRight, ArrowDownRight, Activity, Clock,
  Wifi, WifiOff, Database, Server, Cpu, Memory, HardDrive
} from 'lucide-react';

const RealTimeAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [dateRange, setDateRange] = useState('last_24_hours');
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    transactions: [],
    revenue: [],
    users: [],
    performance: [],
    alerts: []
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock real-time data generator
  const generateRealTimeData = () => {
    const now = new Date();
    const baseRevenue = 45000;
    const baseTransactions = 150;
    
    return {
      transactions: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString(),
        count: baseTransactions + Math.floor(Math.random() * 50),
        amount: baseRevenue + Math.floor(Math.random() * 10000)
      })),
      revenue: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString(),
        value: baseRevenue + Math.floor(Math.random() * 10000),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })),
      users: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString(),
        active: 50 + Math.floor(Math.random() * 100),
        new: Math.floor(Math.random() * 20)
      })),
      performance: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString(),
        loadTime: 0.5 + Math.random() * 2,
        errorRate: Math.random() * 0.05,
        cpu: 20 + Math.random() * 60,
        memory: 30 + Math.random() * 50
      }))
    };
  };

  useEffect(() => {
    // Initialize real-time data
    setRealTimeData(generateRealTimeData());
    
    // Update data every 30 seconds
    const interval = setInterval(() => {
      setRealTimeData(generateRealTimeData());
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate real-time metrics
  const liveMetrics = useMemo(() => {
    const currentRevenue = realTimeData.revenue[realTimeData.revenue.length - 1]?.value || 0;
    const previousRevenue = realTimeData.revenue[realTimeData.revenue.length - 2]?.value || 0;
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    const currentTransactions = realTimeData.transactions[realTimeData.transactions.length - 1]?.count || 0;
    const previousTransactions = realTimeData.transactions[realTimeData.transactions.length - 2]?.count || 0;
    const transactionChange = previousTransactions > 0 ? ((currentTransactions - previousTransactions) / previousTransactions) * 100 : 0;

    return {
      currentRevenue,
      revenueChange,
      currentTransactions,
      transactionChange,
      activeUsers: realTimeData.users[realTimeData.users.length - 1]?.active || 0,
      avgLoadTime: realTimeData.performance[realTimeData.performance.length - 1]?.loadTime || 0,
      errorRate: realTimeData.performance[realTimeData.performance.length - 1]?.errorRate || 0
    };
  }, [realTimeData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">Real-Time Analytics</h1>
                <div className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600">Live</span>
                </div>
              </div>
              <p className="text-gray-600">Live monitoring and analytics for real-time insights</p>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="last_hour">Last Hour</option>
                <option value="last_24_hours">Last 24 Hours</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
              </select>
              <button
                onClick={() => {
                  setRealTimeData(generateRealTimeData());
                  setLastUpdate(new Date());
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
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
                { id: 'live', name: 'Live Metrics', icon: Activity },
                { id: 'revenue', name: 'Revenue Analytics', icon: DollarSign },
                { id: 'transactions', name: 'Transaction Flow', icon: BarChart3 },
                { id: 'performance', name: 'System Performance', icon: Server },
                { id: 'users', name: 'User Activity', icon: Users }
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
          {/* Live Metrics Tab */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(liveMetrics.currentRevenue)}</p>
                      <div className="flex items-center mt-1">
                        {liveMetrics.revenueChange > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ml-1 ${liveMetrics.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(liveMetrics.revenueChange)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">{liveMetrics.currentTransactions}</p>
                      <div className="flex items-center mt-1">
                        {liveMetrics.transactionChange > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ml-1 ${liveMetrics.transactionChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(liveMetrics.transactionChange)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Active Users */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">{liveMetrics.activeUsers}</p>
                      <p className="text-sm text-gray-500 mt-1">Currently online</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Load Time</p>
                      <p className="text-2xl font-bold text-gray-900">{liveMetrics.avgLoadTime.toFixed(1)}s</p>
                      <p className="text-sm text-gray-500 mt-1">Error rate: {(liveMetrics.errorRate * 100).toFixed(2)}%</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'API Server', status: 'healthy', icon: Server },
                    { name: 'Database', status: 'healthy', icon: Database },
                    { name: 'WebSocket', status: 'healthy', icon: Wifi },
                    { name: 'File Storage', status: 'warning', icon: HardDrive }
                  ].map((service) => {
                    const IconComponent = service.icon;
                    return (
                      <div key={service.name} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{service.name}</p>
                          <div className="flex items-center mt-1">
                            {getStatusIcon(service.status)}
                            <span className="text-xs text-gray-600 ml-1 capitalize">{service.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Other tabs would go here - simplified for demo */}
          {activeTab !== 'live' && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'revenue' && 'Revenue Analytics'}
                  {activeTab === 'transactions' && 'Transaction Flow'}
                  {activeTab === 'performance' && 'System Performance'}
                  {activeTab === 'users' && 'User Activity'}
                </h3>
                <p className="text-gray-600">
                  Advanced analytics and detailed insights for {activeTab} will be displayed here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { RealTimeAnalyticsDashboard }; 