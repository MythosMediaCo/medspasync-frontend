import React, { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Download, Eye, Search } from 'lucide-react';

const ResultsDashboard = ({ results, onManualReview, onExport }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter results based on status and search
  const filteredResults = useMemo(() => {
    let filtered = results.results || [];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(result => {
        switch (filterStatus) {
          case 'auto-accept': return result.recommendation === 'Auto-Accept';
          case 'manual-review': return result.recommendation === 'Manual Review';
          case 'no-match': return result.recommendation === 'Likely No Match';
          default: return true;
        }
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(result => 
        (result.reward_transaction?.customer_name || '').toLowerCase().includes(term) ||
        (result.pos_transaction?.customer_name || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [results.results, filterStatus, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-900">{results.summary?.total || 0}</div>
          <div className="text-sm text-blue-700">Total Pairs</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <div className="text-3xl font-bold text-green-900">{results.summary?.auto_accept || 0}</div>
          <div className="text-sm text-green-700">Auto-Accept</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="text-3xl font-bold text-yellow-900">{results.summary?.manual_review || 0}</div>
          <div className="text-sm text-yellow-700">Manual Review</div>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <div className="text-3xl font-bold text-red-900">{results.summary?.likely_no_match || 0}</div>
          <div className="text-sm text-red-700">No Match</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border p-4 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Results</option>
          <option value="auto-accept">Auto-Accept</option>
          <option value="manual-review">Manual Review</option>
          <option value="no-match">No Match</option>
        </select>
        <button
          onClick={() => onExport('csv')}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Service</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Confidence</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Recommendation</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredResults.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{result.reward_transaction?.customer_name || 'N/A'}</div>
                    <div className="text-gray-500 text-sm">POS: {result.pos_transaction?.customer_name || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div>{result.reward_transaction?.service || 'N/A'}</div>
                    <div className="text-gray-500 text-sm">{result.pos_transaction?.service || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="font-medium">{((result.match_probability || 0) * 100).toFixed(1)}%</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      result.confidence_level === 'High' ? 'bg-green-100 text-green-800' :
                      result.confidence_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.confidence_level}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    result.recommendation === 'Auto-Accept' ? 'bg-green-100 text-green-800' :
                    result.recommendation === 'Manual Review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.recommendation}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {result.recommendation === 'Manual Review' && (
                    <button
                      onClick={() => onManualReview(`manual-${index}`, 'approve', 'Approved via dashboard')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsDashboard;
