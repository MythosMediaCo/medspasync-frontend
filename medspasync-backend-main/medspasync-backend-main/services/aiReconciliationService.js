// services/aiReconciliationService.js (enhanced for your setup)
const axios = require('axios');

class AIReconciliationService {
  constructor() {
    this.serviceUrl = process.env.ML_SERVICE_URL || process.env.AI_API_URL;
    this.apiKey = process.env.AI_API_KEY;
    this.isDemoMode = !this.serviceUrl;
    this.timeout = 300000; // 5 minutes
  }

  async processReconciliation(request) {
    const jobId = this.generateJobId();
    
    try {
      let results;
      
      if (this.isDemoMode) {
        console.log('🔧 Running in demo mode - using mock AI results');
        results = this.generateDemoResults(request);
      } else {
        console.log(`🤖 Processing reconciliation via AI service: ${this.serviceUrl}`);
        results = await this.callAIService(request);
      }

      return {
        jobId,
        status: 'completed',
        results: this.structureResults(results, request),
        processingTime: Date.now()
      };

    } catch (error) {
      console.error('AI reconciliation error:', error);
      throw new Error(`Reconciliation failed: ${error.message}`);
    }
  }

  async callAIService(request) {
    const { alleTransactions = [], aspireTransactions = [], posTransactions } = request;
    const rewardTransactions = [...alleTransactions, ...aspireTransactions];

    if (!this.serviceUrl) {
      throw new Error('AI service URL not configured');
    }

    try {
      // Use your existing FastAPI endpoint structure
      const response = await axios.post(`${this.serviceUrl}/predict`, {
        reward_transactions: rewardTransactions.map(this.formatTransactionForAI),
        pos_transactions: posTransactions.map(this.formatTransactionForAI),
        threshold: request.confidenceThreshold || 0.95
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      return response.data;

    } catch (error) {
      if (error.response) {
        throw new Error(`AI service error: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('AI service not responding');
      } else {
        throw new Error(`AI request error: ${error.message}`);
      }
    }
  }

  formatTransactionForAI(transaction) {
    return {
      customer_name: transaction.customerName,
      service: transaction.service,
      amount: transaction.amount,
      date: transaction.date,
      phone: transaction.phone || '',
      email: transaction.email || '',
      provider: transaction.provider || ''
    };
  }

  // Demo mode implementation for testing without AI service
  generateDemoResults(request) {
    const { alleTransactions = [], aspireTransactions = [], posTransactions } = request;
    const rewardTransactions = [...alleTransactions, ...aspireTransactions];
    
    const results = [];
    
    // Create some realistic demo matches
    rewardTransactions.forEach((reward, index) => {
      const confidence = 0.5 + (Math.random() * 0.5); // Random confidence 0.5-1.0
      
      let recommendation;
      if (confidence >= 0.95) recommendation = 'Auto-Accept';
      else if (confidence >= 0.80) recommendation = 'Manual Review';
      else recommendation = 'Likely No Match';

      // Only include matches above threshold
      if (confidence >= 0.80 && index < posTransactions.length) {
        results.push({
          reward_transaction: reward,
          pos_transaction: posTransactions[index],
          match_probability: confidence,
          recommendation,
          feature_analysis: {
            name_similarity: Math.random() * 0.8 + 0.2,
            service_similarity: Math.random() * 0.7 + 0.3,
            date_proximity: Math.random() * 0.9 + 0.1,
            amount_ratio_valid: Math.random() > 0.3,
            overall_similarity: confidence
          },
          processing_timestamp: new Date().toISOString()
        });
      }
    });

    console.log(`📊 Demo mode generated ${results.length} matches from ${rewardTransactions.length} rewards and ${posTransactions.length} POS transactions`);
    
    return results;
  }

  structureResults(rawResults, originalRequest) {
    const autoAccepted = [];
    const needsReview = [];
    const unmatched = [];

    // Process AI results
    rawResults.forEach(result => {
      const match = {
        id: this.generateMatchId(),
        rewardTransaction: result.reward_transaction,
        posTransaction: result.pos_transaction,
        confidence: result.match_probability,
        recommendation: result.recommendation,
        featureAnalysis: result.feature_analysis || {},
        processingTimestamp: result.processing_timestamp || new Date().toISOString()
      };

      if (result.recommendation === 'Auto-Accept') {
        autoAccepted.push(match);
      } else if (result.recommendation === 'Manual Review') {
        needsReview.push(match);
      }
    });

    // Identify unmatched transactions
    const matchedIds = new Set();
    [...autoAccepted, ...needsReview].forEach(match => {
      matchedIds.add(match.rewardTransaction.id);
      matchedIds.add(match.posTransaction.id);
    });

    // Add unmatched rewards
    const allRewards = [
      ...(originalRequest.alleTransactions || []),
      ...(originalRequest.aspireTransactions || [])
    ];

    allRewards.forEach(reward => {
      if (!matchedIds.has(reward.id)) {
        unmatched.push({
          type: 'reward',
          transaction: reward,
          reason: 'No suitable POS match found'
        });
      }
    });

    // Add unmatched POS
    originalRequest.posTransactions.forEach(pos => {
      if (!matchedIds.has(pos.id)) {
        unmatched.push({
          type: 'pos',
          transaction: pos,
          reason: 'No suitable reward match found'
        });
      }
    });

    const summary = {
      totalRewardTransactions: allRewards.length,
      totalPOSTransactions: originalRequest.posTransactions.length,
      autoAcceptedCount: autoAccepted.length,
      needsReviewCount: needsReview.length,
      unmatchedCount: unmatched.length,
      autoMatchRate: allRewards.length > 0 ? (autoAccepted.length / allRewards.length * 100) : 0,
      processingDate: new Date().toISOString()
    };

    return {
      autoAccepted,
      needsReview,
      unmatched,
      summary
    };
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateMatchId() {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = AIReconciliationService;