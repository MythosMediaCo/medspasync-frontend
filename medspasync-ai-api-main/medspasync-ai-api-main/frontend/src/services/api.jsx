import { API_BASE_URL } from '../config';

const apiService = {
  checkHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('API Health check failed');
    return response.json();
  },

  predict: async (rewardTransaction, posTransaction) => {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reward_transaction: rewardTransaction,
        pos_transaction: posTransaction,
        threshold: 0.95
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Prediction API failed');
    }
    return response.json();
  },

  batchPredict: async (transactionPairs) => {
    const response = await fetch(`${API_BASE_URL}/batch_predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_pairs: transactionPairs })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Batch Prediction API failed');
    }
    return response.json();
  },

  testApi: async () => {
    const response = await fetch(`${API_BASE_URL}/test`);
    if (!response.ok) throw new Error('Test API failed');
    return response.json();
  },
};

export default apiService;