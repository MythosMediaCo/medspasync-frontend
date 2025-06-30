'use client';

import React, { useState } from 'react';
import { 
  Shield, Lock, Eye, AlertTriangle, CheckCircle, 
  Users, Database, Server, Key, FileText,
  Activity, Clock, Settings, RefreshCw
} from 'lucide-react';

const SecurityComplianceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const mockSecurityData = {
    overallScore: 94,
    threats: {
      blocked: 1247,
      detected: 12,
      critical: 0
    },
    compliance: {
      hipaa: 'Compliant',
      gdpr: 'Compliant',
      sox: 'Compliant',
      pci: 'Compliant'
    },
    access: {
      activeUsers: 45,
      failedLogins: 3,
      suspiciousActivity: 1
    },
    encryption: {
      dataAtRest: 'AES-256',
      dataInTransit: 'TLS 1.3',
      keyRotation: '30 days'
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
      case 'secure':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
      case 'secure':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
                <Shield className="w-8 h-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900">Security & Compliance</h1>
              </div>
              <p className="text-gray-600">Comprehensive security monitoring and compliance management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
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
                { id: 'overview', name: 'Security Overview', icon: Shield },
                { id: 'compliance', name: 'Compliance', icon: FileText },
                { id: 'access', name: 'Access Control', icon: Users },
                { id: 'threats', name: 'Threat Monitoring', icon: AlertTriangle },
                { id: 'encryption', name: 'Encryption', icon: Lock }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
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
              {/* Security Score */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Security Score</h3>
                  <span className="text-sm text-gray-500">Last updated: 2 minutes ago</span>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <svg className="w-24 h-24" viewBox="0 0 36 36">
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
                        strokeDasharray={`${mockSecurityData.overallScore}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{mockSecurityData.overallScore}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{mockSecurityData.threats.blocked}</p>
                        <p className="text-sm text-gray-600">Threats Blocked</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{mockSecurityData.threats.detected}</p>
                        <p className="text-sm text-gray-600">Threats Detected</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{mockSecurityData.threats.critical}</p>
                        <p className="text-sm text-gray-600">Critical Alerts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">{mockSecurityData.access.activeUsers}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                      <p className="text-2xl font-bold text-gray-900">{mockSecurityData.access.failedLogins}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <Lock className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Suspicious Activity</p>
                      <p className="text-2xl font-bold text-gray-900">{mockSecurityData.access.suspiciousActivity}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Status</p>
                      <p className="text-2xl font-bold text-green-600">Secure</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h3>
                <div className="space-y-3">
                  {[
                    { time: '2 min ago', event: 'User login successful', user: 'john.doe@example.com', status: 'secure' },
                    { time: '5 min ago', event: 'Failed login attempt', user: 'unknown@example.com', status: 'warning' },
                    { time: '12 min ago', event: 'Data backup completed', user: 'system', status: 'secure' },
                    { time: '1 hour ago', event: 'Security scan completed', user: 'system', status: 'secure' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(event.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.event}</p>
                          <p className="text-xs text-gray-500">{event.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{event.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(mockSecurityData.compliance).map(([standard, status]) => (
                    <div key={standard} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{standard.toUpperCase()}</p>
                          <p className="text-sm text-gray-500">Compliance Standard</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other tabs - simplified for demo */}
          {activeTab !== 'overview' && activeTab !== 'compliance' && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'access' && 'Access Control'}
                  {activeTab === 'threats' && 'Threat Monitoring'}
                  {activeTab === 'encryption' && 'Encryption Management'}
                </h3>
                <p className="text-gray-600">
                  Detailed {activeTab} features and monitoring will be displayed here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { SecurityComplianceDashboard }; 