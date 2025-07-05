// services/enhancedReconciliationService.js
const axios = require('axios');

class EnhancedReconciliationService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL;
    this.apiKey = process.env.AI_API_KEY;
    this.isDemoMode = !this.mlServiceUrl;
  }

  async processReconciliation(request) {
    const startTime = Date.now();
    
    try {
      let results;
      
      if (this.isDemoMode || !this.mlServiceUrl) {
        console.log('🔧 Using enhanced demo reconciliation');
        results = await this.processReconciliationEnhanced(request);
      } else {
        console.log(`🤖 Processing via ML service: ${this.mlServiceUrl}`);
        results = await this.callMLService(request);
      }

      return {
        jobId: this.generateJobId(),
        status: 'completed',
        results: this.structureResults(results, request),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Enhanced reconciliation error:', error);
      throw new Error(`Reconciliation failed: ${error.message}`);
    }
  }

  async callMLService(request) {
    const { alleTransactions = [], aspireTransactions = [], posTransactions } = request;
    
    try {
      const response = await axios.post(`${this.mlServiceUrl}/reconcile`, {
        reward_transactions: [...alleTransactions, ...aspireTransactions],
        pos_transactions: posTransactions,
        confidence_threshold: request.confidenceThreshold || 0.95
      }, {
        timeout: 300000,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      return response.data;

    } catch (error) {
      console.warn('ML service failed, falling back to enhanced demo mode');
      return await this.processReconciliationEnhanced(request);
    }
  }

  async processReconciliationEnhanced({ alleTransactions = [], aspireTransactions = [], posTransactions, planType = 'core' }) {
    const rewardTransactions = [...alleTransactions, ...aspireTransactions];
    const results = [];
    let totalRevenue = 0;
    
    // Enhanced matching logic
    for (const posRecord of posTransactions) {
      let bestMatch = null;
      let matchType = null;
      let confidence = 0;
      let matchFeatures = {};
      
      // Check all reward transactions
      for (const rewardRecord of rewardTransactions) {
        const matchResult = this.calculateEnhancedMatchScore(posRecord, rewardRecord);
        
        if (matchResult.score > confidence) {
          confidence = matchResult.score;
          bestMatch = rewardRecord;
          matchType = rewardRecord.program;
          matchFeatures = matchResult.features;
        }
      }
      
      // Determine status based on confidence
      let status, recommendation;
      if (confidence >= 95) {
        status = 'auto-accepted';
        recommendation = 'Auto-Accept';
      } else if (confidence >= 80) {
        status = 'needs-review';
        recommendation = 'Manual Review';
      } else {
        status = 'unmatched';
        recommendation = 'Likely No Match';
      }
      
      if (status !== 'unmatched') {
        results.push({
          id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          posTransaction: this.sanitizeRecord(posRecord),
          rewardTransaction: bestMatch ? this.sanitizeRecord(bestMatch) : null,
          confidence: Math.round(confidence),
          recommendation,
          status,
          matchType,
          featureAnalysis: matchFeatures,
          processingTimestamp: new Date().toISOString()
        });
        
        // Calculate recovered revenue
        if (status === 'auto-accepted' && bestMatch) {
          totalRevenue += bestMatch.amount || 0;
        }
      }
    }
    
    return {
      matches: results,
      totalRevenue,
      metadata: {
        planType,
        processingTime: Date.now(),
        enhanced: true
      }
    };
  }

  calculateEnhancedMatchScore(posRecord, rewardRecord) {
    const features = {};
    let totalScore = 0;
    
    // Name matching (40% weight)
    features.nameMatch = this.calculateNameSimilarity(posRecord.name, rewardRecord.name);
    totalScore += features.nameMatch * 40;
    
    // Email matching (30% weight)
    if (posRecord.email && rewardRecord.email) {
      features.emailMatch = posRecord.email.toLowerCase() === rewardRecord.email.toLowerCase() ? 100 : 0;
      totalScore += features.emailMatch * 30;
    }
    
    // Date proximity (20% weight)
    features.dateProximity = this.calculateDateProximity(posRecord.date, rewardRecord.date);
    totalScore += features.dateProximity * 20;
    
    // Service similarity (10% weight)
    features.serviceMatch = this.calculateServiceSimilarity(posRecord.service, rewardRecord.service);
    totalScore += features.serviceMatch * 10;
    
    return {
      score: Math.min(totalScore / 100 * 100, 100), // Normalize to 0-100
      features: {
        nameSimilarity: features.nameMatch / 100,
        emailMatch: (features.emailMatch || 0) / 100,
        dateProximity: features.dateProximity / 100,
        serviceMatch: features.serviceMatch / 100
      }
    };
  }

  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    
    // Exact match
    if (n1 === n2) return 100;
    
    // Handle "Last, First" vs "First Last" format
    const reversed1 = this.reverseName(n1);
    const reversed2 = this.reverseName(n2);
    
    if (n1 === reversed2 || n2 === reversed1) return 95;
    
    // Fuzzy matching using simple algorithm
    return this.calculateLevenshteinSimilarity(n1, n2);
  }

  reverseName(name) {
    const parts = name.split(',').map(p => p.trim());
    if (parts.length === 2) {
      return `${parts[1]} ${parts[0]}`;
    }
    return name;
  }

  calculateLevenshteinSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 100 : ((maxLen - matrix[len2][len1]) / maxLen) * 100;
  }

  calculateDateProximity(date1, date2) {
    if (!date1 || !date2) return 0;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 100;
    if (diffDays <= 1) return 90;
    if (diffDays <= 3) return 70;
    if (diffDays <= 7) return 50;
    if (diffDays <= 30) return 20;
    
    return 0;
  }

  calculateServiceSimilarity(service1, service2) {
    if (!service1 || !service2) return 0;
    
    const s1 = service1.toLowerCase();
    const s2 = service2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 100;
    
    // Service keyword matching
    const keywords = {
      botox: ['botox', 'neurotoxin', 'dysport', 'lyft'],
      filler: ['filler', 'juvederm', 'voluma', 'restylane'],
      coolsculpting: ['coolsculpting', 'body sculpting', 'fat freezing'],
      laser: ['laser', 'ipl', 'photofacial']
    };
    
    for (const [category, words] of Object.entries(keywords)) {
      const s1Match = words.some(word => s1.includes(word));
      const s2Match = words.some(word => s2.includes(word));
      
      if (s1Match && s2Match) return 80;
    }
    
    // Basic string similarity
    return this.calculateLevenshteinSimilarity(s1, s2) * 0.5;
  }

  structureResults(rawResults, originalRequest) {
    const { alleTransactions = [], aspireTransactions = [], posTransactions } = originalRequest;
    const allRewards = [...alleTransactions, ...aspireTransactions];
    
    const autoAccepted = rawResults.matches?.filter(m => m.status === 'auto-accepted') || [];
    const needsReview = rawResults.matches?.filter(m => m.status === 'needs-review') || [];
    
    // Find unmatched transactions
    const matchedRewardIds = new Set();
    const matchedPOSIds = new Set();
    
    [...autoAccepted, ...needsReview].forEach(match => {
      matchedRewardIds.add(match.rewardTransaction?.id);
      matchedPOSIds.add(match.posTransaction?.id);
    });
    
    const unmatched = [];
    
    // Unmatched rewards
    allRewards.forEach(reward => {
      if (!matchedRewardIds.has(reward.id)) {
        unmatched.push({
          type: 'reward',
          transaction: reward,
          reason: 'No suitable POS match found'
        });
      }
    });
    
    // Unmatched POS
    posTransactions.forEach(pos => {
      if (!matchedPOSIds.has(pos.id)) {
        unmatched.push({
          type: 'pos',
          transaction: pos,
          reason: 'No suitable reward match found'
        });
      }
    });
    
    const summary = {
      totalRewardTransactions: allRewards.length,
      totalPOSTransactions: posTransactions.length,
      autoAcceptedCount: autoAccepted.length,
      needsReviewCount: needsReview.length,
      unmatchedCount: unmatched.length,
      autoMatchRate: allRewards.length > 0 ? (autoAccepted.length / allRewards.length * 100) : 0,
      recoveredRevenue: rawResults.totalRevenue || 0,
      processingDate: new Date().toISOString()
    };
    
    return {
      autoAccepted,
      needsReview,
      unmatched,
      summary
    };
  }

  sanitizeRecord(record) {
    return {
      id: record.id,
      name: record.name,
      amount: parseFloat(record.amount) || 0,
      date: record.date,
      email: record.email,
      service: record.service,
      program: record.program || record.sourceSystem
    };
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = EnhancedReconciliationService;