/**
 * Natural Language Processing Service
 * MedSpaSync Pro AI-Powered Documentation & Communication
 * 
 * Features:
 * - Voice-to-text transcription for clinical notes
 * - Medical terminology recognition and processing
 * - Automated treatment plan generation
 * - Patient communication sentiment analysis
 * - Intelligent search and knowledge extraction
 */

const { Pool } = require('pg');
const redis = require('redis');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class NLPService {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 10 // NLP-specific Redis DB
    });

    this.speechToText = new SpeechToTextService();
    this.medicalNER = new MedicalEntityRecognition();
    this.documentGenerator = new DocumentGenerationService();
    this.complianceChecker = new ComplianceValidationService();
    this.sentimentAnalyzer = new SentimentAnalysisService();
    
    this.initializeNLPService();
  }

  /**
   * Initialize NLP service
   */
  async initializeNLPService() {
    try {
      console.log('🧠 Initializing NLP Service...');
      
      // Initialize Redis connection
      await this.redisClient.connect();
      
      // Load medical terminology and vocabulary
      await this.loadMedicalVocabulary();
      
      // Initialize speech recognition models
      await this.speechToText.initialize();
      
      // Load medical entity recognition models
      await this.medicalNER.initialize();
      
      // Setup real-time processing pipeline
      this.setupRealTimeProcessingPipeline();
      
      console.log('✅ NLP Service initialized successfully');
    } catch (error) {
      console.error('❌ NLP Service initialization error:', error);
      throw error;
    }
  }

  /**
   * Load medical vocabulary and terminology
   */
  async loadMedicalVocabulary() {
    try {
      // Load medical spa specific terminology
      const medicalTerms = [
        'microdermabrasion', 'chemical_peel', 'dermal_filler', 'botox', 'laser_treatment',
        'facial', 'massage', 'consultation', 'skin_analysis', 'treatment_plan',
        'melasma', 'acne', 'rosacea', 'hyperpigmentation', 'fine_lines', 'wrinkles',
        'collagen', 'elastin', 'hyaluronic_acid', 'retinol', 'vitamin_c', 'peptides'
      ];

      await this.redisClient.setex(
        'nlp:medical_vocabulary',
        86400, // 24 hours
        JSON.stringify(medicalTerms)
      );

      console.log(`📚 Loaded ${medicalTerms.length} medical terms`);
    } catch (error) {
      console.error('❌ Medical vocabulary loading error:', error);
    }
  }

  /**
   * Setup real-time processing pipeline
   */
  setupRealTimeProcessingPipeline() {
    // Process voice notes every 10 seconds
    setInterval(async () => {
      await this.processVoiceNoteQueue();
    }, 10000);

    // Process sentiment analysis every 30 seconds
    setInterval(async () => {
      await this.processSentimentAnalysisQueue();
    }, 30000);

    // Generate automated insights every 5 minutes
    setInterval(async () => {
      await this.generateAutomatedInsights();
    }, 5 * 60 * 1000);
  }

  /**
   * Transcribe voice note with medical terminology optimization
   */
  async transcribeVoiceNote(audioStream, context) {
    try {
      console.log(`🎤 Transcribing voice note for treatment: ${context.treatmentType}`);
      
      // Real-time speech-to-text with medical terminology optimization
      const transcription = await this.speechToText.transcribe(audioStream, {
        language: 'en-US',
        model: 'medical',
        enablePunctuation: true,
        enableWordTimeOffsets: true,
        vocabularyBoost: await this.getMedicalVocabulary(context.treatmentType),
        speakerDiarization: true,
        enableAutomaticPunctuation: true
      });

      // Extract medical entities and terminology
      const entities = await this.medicalNER.extractEntities(transcription.text, {
        entityTypes: ['anatomy', 'procedures', 'medications', 'conditions', 'measurements', 'treatments'],
        confidenceThreshold: 0.8,
        includeSynonyms: true
      });

      // Generate structured documentation
      const structuredDoc = await this.documentGenerator.generateFromTranscription({
        transcription: transcription.text,
        entities: entities,
        context: context,
        template: await this.getDocumentTemplate(context.treatmentType)
      });

      // Compliance validation
      const complianceCheck = await this.complianceChecker.validateDocumentation(structuredDoc);

      // Generate suggestions for improvement
      const suggestions = await this.generateDocumentationSuggestions(structuredDoc, context);

      const result = {
        originalTranscription: transcription.text,
        structuredDocumentation: structuredDoc,
        extractedEntities: entities,
        complianceStatus: complianceCheck,
        confidence: transcription.confidence,
        suggestions: suggestions,
        processingTime: Date.now() - context.startTime,
        timestamp: new Date().toISOString()
      };

      // Cache transcription result
      await this.redisClient.setex(
        `transcription:${context.sessionId}`,
        3600, // 1 hour
        JSON.stringify(result)
      );

      return result;
    } catch (error) {
      console.error('❌ Voice note transcription error:', error);
      throw error;
    }
  }

  /**
   * Generate treatment plan from consultation notes
   */
  async generateTreatmentPlan(patientProfile, consultationNotes, desiredOutcomes) {
    try {
      console.log(`📋 Generating treatment plan for patient: ${patientProfile.id}`);
      
      // Analyze patient information and consultation notes
      const analysis = await this.analyzePatientInformation({
        demographics: patientProfile.demographics,
        medicalHistory: patientProfile.medicalHistory,
        previousTreatments: patientProfile.treatmentHistory,
        consultationText: consultationNotes,
        desiredOutcomes: desiredOutcomes,
        skinAnalysis: patientProfile.skinAnalysis
      });

      // Generate evidence-based treatment recommendations
      const recommendations = await this.generateTreatmentRecommendations(analysis);

      // Create structured treatment plan
      const treatmentPlan = await this.documentGenerator.generateTreatmentPlan({
        patientId: patientProfile.id,
        recommendations: recommendations,
        timeline: await this.optimizeTreatmentTimeline(recommendations),
        expectedOutcomes: await this.predictTreatmentOutcomes(patientProfile, recommendations),
        contraindications: await this.checkContraindications(patientProfile, recommendations),
        costEstimate: await this.calculateTreatmentCost(recommendations),
        followUpSchedule: await this.generateFollowUpSchedule(recommendations)
      });

      // Validate medical accuracy and compliance
      const validation = await this.validateTreatmentPlan(treatmentPlan);

      const result = {
        plan: treatmentPlan,
        confidence: validation.confidence,
        evidenceLevel: validation.evidenceLevel,
        requiresPhysicianReview: validation.requiresReview,
        estimatedCost: treatmentPlan.costEstimate,
        estimatedDuration: treatmentPlan.timeline.totalWeeks,
        riskAssessment: validation.riskAssessment,
        alternatives: await this.generateAlternativeTreatments(recommendations, patientProfile),
        generatedAt: new Date().toISOString()
      };

      // Store treatment plan
      await this.storeTreatmentPlan(patientProfile.id, result);

      return result;
    } catch (error) {
      console.error('❌ Treatment plan generation error:', error);
      throw error;
    }
  }

  /**
   * Analyze patient communications for sentiment and insights
   */
  async analyzePatientCommunications(tenantId, timeframe = '30d') {
    try {
      console.log(`💬 Analyzing patient communications for tenant: ${tenantId}`);
      
      // Gather all patient communications
      const communications = await this.getCommunications(tenantId, timeframe, {
        types: ['reviews', 'emails', 'texts', 'feedback_forms', 'consultation_notes', 'surveys'],
        includeMetadata: true,
        includeSentiment: false // We'll analyze sentiment here
      });

      // Batch sentiment analysis
      const sentimentResults = await Promise.all(
        communications.map(async (comm) => {
          const sentiment = await this.sentimentAnalyzer.analyzeSentiment(comm.text, {
            aspectBasedAnalysis: true,
            emotionDetection: true,
            intentClassification: true,
            urgencyAssessment: true
          });

          return {
            communicationId: comm.id,
            patientId: comm.patientId,
            type: comm.type,
            sentiment: sentiment,
            topics: await this.extractTopics(comm.text),
            urgency: await this.assessUrgency(comm.text, sentiment),
            actionRequired: await this.determineActionRequired(comm.text, sentiment),
            timestamp: comm.timestamp
          };
        })
      );

      // Aggregate insights
      const insights = {
        overallSentiment: this.calculateOverallSentiment(sentimentResults),
        trendAnalysis: await this.analyzeSentimentTrends(sentimentResults, timeframe),
        topConcerns: await this.identifyTopConcerns(sentimentResults),
        satisfactionDrivers: await this.identifySatisfactionDrivers(sentimentResults),
        urgentItems: sentimentResults.filter(r => r.urgency === 'high'),
        recommendedActions: await this.generateCommunicationActions(sentimentResults),
        communicationVolume: await this.analyzeCommunicationVolume(communications),
        responseTimeAnalysis: await this.analyzeResponseTimes(communications)
      };

      // Trigger alerts for urgent items
      if (insights.urgentItems.length > 0) {
        await this.triggerUrgentCommunicationAlerts(insights.urgentItems, tenantId);
      }

      // Store analysis results
      await this.storeCommunicationAnalysis(tenantId, insights);

      return insights;
    } catch (error) {
      console.error('❌ Patient communication analysis error:', error);
      throw error;
    }
  }

  /**
   * Perform semantic search across all spa data
   */
  async semanticSearch(query, tenantId, options = {}) {
    try {
      console.log(`🔍 Performing semantic search: "${query}"`);
      
      const {
        searchTypes = ['patients', 'treatments', 'documents', 'communications'],
        maxResults = 20,
        minRelevance = 0.7,
        includeMetadata = true
      } = options;

      const searchResults = [];

      // Search across different data types
      for (const searchType of searchTypes) {
        const results = await this.searchDataType(query, searchType, tenantId, {
          maxResults: Math.ceil(maxResults / searchTypes.length),
          minRelevance,
          includeMetadata
        });
        searchResults.push(...results);
      }

      // Rank and sort results by relevance
      const rankedResults = await this.rankSearchResults(searchResults, query);

      // Generate search insights
      const insights = await this.generateSearchInsights(rankedResults, query);

      return {
        query: query,
        results: rankedResults.slice(0, maxResults),
        totalResults: rankedResults.length,
        insights: insights,
        searchTime: Date.now(),
        searchTypes: searchTypes
      };
    } catch (error) {
      console.error('❌ Semantic search error:', error);
      throw error;
    }
  }

  /**
   * Extract knowledge and insights from text data
   */
  async extractKnowledge(textData, tenantId) {
    try {
      console.log(`🧠 Extracting knowledge from text data`);
      
      const knowledge = {
        entities: await this.medicalNER.extractEntities(textData, {
          entityTypes: ['anatomy', 'procedures', 'medications', 'conditions', 'treatments'],
          confidenceThreshold: 0.7
        }),
        topics: await this.extractTopics(textData),
        sentiment: await this.sentimentAnalyzer.analyzeSentiment(textData),
        keyPhrases: await this.extractKeyPhrases(textData),
        relationships: await this.extractRelationships(textData),
        insights: await this.generateTextInsights(textData)
      };

      // Store extracted knowledge
      await this.storeKnowledge(tenantId, knowledge);

      return knowledge;
    } catch (error) {
      console.error('❌ Knowledge extraction error:', error);
      throw error;
    }
  }

  /**
   * Generate automated insights from communications
   */
  async generateAutomatedInsights() {
    try {
      // Get all active tenants
      const tenants = await this.db.query(`
        SELECT DISTINCT tenant_id FROM patients WHERE status = 'active'
      `);

      for (const tenant of tenants.rows) {
        const tenantId = tenant.tenant_id;
        
        // Generate insights for each tenant
        const insights = await this.generateTenantInsights(tenantId);
        
        // Store insights
        await this.storeAutomatedInsights(tenantId, insights);
        
        // Trigger notifications for high-priority insights
        const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
        if (highPriorityInsights.length > 0) {
          await this.triggerInsightNotifications(tenantId, highPriorityInsights);
        }
      }
    } catch (error) {
      console.error('❌ Automated insights generation error:', error);
    }
  }

  /**
   * Process voice note queue
   */
  async processVoiceNoteQueue() {
    try {
      const queue = await this.redisClient.lrange('voice_note_queue', 0, 4);
      
      for (const request of queue) {
        const voiceRequest = JSON.parse(request);
        await this.processVoiceNoteRequest(voiceRequest);
        await this.redisClient.lrem('voice_note_queue', 1, request);
      }
    } catch (error) {
      console.error('❌ Voice note queue processing error:', error);
    }
  }

  /**
   * Process voice note request
   */
  async processVoiceNoteRequest(request) {
    try {
      const { audioData, context, requestId } = request;
      
      // Convert audio data to stream
      const audioStream = this.convertAudioDataToStream(audioData);
      
      // Transcribe voice note
      const result = await this.transcribeVoiceNote(audioStream, context);
      
      // Store result for client retrieval
      await this.redisClient.setex(
        `voice_note_result:${requestId}`,
        3600, // 1 hour
        JSON.stringify(result)
      );
      
    } catch (error) {
      console.error(`❌ Voice note request processing error:`, error);
      
      // Store error result
      await this.redisClient.setex(
        `voice_note_result:${request.requestId}`,
        3600,
        JSON.stringify({ error: error.message })
      );
    }
  }

  /**
   * Process sentiment analysis queue
   */
  async processSentimentAnalysisQueue() {
    try {
      const queue = await this.redisClient.lrange('sentiment_analysis_queue', 0, 9);
      
      for (const request of queue) {
        const sentimentRequest = JSON.parse(request);
        await this.processSentimentAnalysisRequest(sentimentRequest);
        await this.redisClient.lrem('sentiment_analysis_queue', 1, request);
      }
    } catch (error) {
      console.error('❌ Sentiment analysis queue processing error:', error);
    }
  }

  /**
   * Process sentiment analysis request
   */
  async processSentimentAnalysisRequest(request) {
    try {
      const { text, context, requestId } = request;
      
      // Analyze sentiment
      const result = await this.sentimentAnalyzer.analyzeSentiment(text, {
        aspectBasedAnalysis: true,
        emotionDetection: true,
        intentClassification: true
      });
      
      // Store result for client retrieval
      await this.redisClient.setex(
        `sentiment_analysis_result:${requestId}`,
        3600, // 1 hour
        JSON.stringify(result)
      );
      
    } catch (error) {
      console.error(`❌ Sentiment analysis request processing error:`, error);
      
      // Store error result
      await this.redisClient.setex(
        `sentiment_analysis_result:${request.requestId}`,
        3600,
        JSON.stringify({ error: error.message })
      );
    }
  }

  /**
   * Get medical vocabulary for specific treatment type
   */
  async getMedicalVocabulary(treatmentType) {
    try {
      const baseVocabulary = await this.redisClient.get('nlp:medical_vocabulary');
      const baseTerms = baseVocabulary ? JSON.parse(baseVocabulary) : [];
      
      // Add treatment-specific terms
      const treatmentSpecificTerms = await this.getTreatmentSpecificTerms(treatmentType);
      
      return [...baseTerms, ...treatmentSpecificTerms];
    } catch (error) {
      console.error('❌ Medical vocabulary retrieval error:', error);
      return [];
    }
  }

  /**
   * Get document template for treatment type
   */
  async getDocumentTemplate(treatmentType) {
    try {
      const templates = {
        'facial': {
          sections: ['patient_assessment', 'treatment_plan', 'post_treatment_care', 'follow_up'],
          requiredFields: ['skin_condition', 'treatment_products', 'expected_outcomes']
        },
        'massage': {
          sections: ['patient_assessment', 'treatment_plan', 'post_treatment_care', 'follow_up'],
          requiredFields: ['muscle_tension', 'treatment_techniques', 'expected_outcomes']
        },
        'consultation': {
          sections: ['patient_goals', 'skin_analysis', 'recommendations', 'treatment_plan'],
          requiredFields: ['patient_concerns', 'skin_condition', 'recommended_treatments']
        }
      };
      
      return templates[treatmentType] || templates['consultation'];
    } catch (error) {
      console.error('❌ Document template retrieval error:', error);
      return {};
    }
  }

  /**
   * Generate documentation suggestions
   */
  async generateDocumentationSuggestions(structuredDoc, context) {
    const suggestions = [];
    
    // Check for missing required fields
    const template = await this.getDocumentTemplate(context.treatmentType);
    const missingFields = template.requiredFields.filter(field => 
      !structuredDoc[field] || structuredDoc[field].trim() === ''
    );
    
    if (missingFields.length > 0) {
      suggestions.push({
        type: 'missing_fields',
        priority: 'high',
        description: `Missing required fields: ${missingFields.join(', ')}`,
        action: 'Add missing information to complete documentation'
      });
    }
    
    // Check for compliance issues
    if (structuredDoc.complianceIssues && structuredDoc.complianceIssues.length > 0) {
      suggestions.push({
        type: 'compliance_issue',
        priority: 'high',
        description: 'Documentation has compliance issues that need attention',
        action: 'Review and address compliance concerns'
      });
    }
    
    // Suggest improvements based on content
    if (structuredDoc.assessment && structuredDoc.assessment.length < 50) {
      suggestions.push({
        type: 'content_improvement',
        priority: 'medium',
        description: 'Patient assessment could be more detailed',
        action: 'Add more detailed patient assessment information'
      });
    }
    
    return suggestions;
  }

  /**
   * Analyze patient information
   */
  async analyzePatientInformation(data) {
    try {
      const analysis = {
        demographics: this.analyzeDemographics(data.demographics),
        medicalHistory: this.analyzeMedicalHistory(data.medicalHistory),
        previousTreatments: this.analyzePreviousTreatments(data.previousTreatments),
        consultationAnalysis: await this.analyzeConsultationText(data.consultationText),
        desiredOutcomes: this.analyzeDesiredOutcomes(data.desiredOutcomes),
        skinAnalysis: this.analyzeSkinAnalysis(data.skinAnalysis)
      };
      
      return analysis;
    } catch (error) {
      console.error('❌ Patient information analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate treatment recommendations
   */
  async generateTreatmentRecommendations(analysis) {
    try {
      const recommendations = [];
      
      // Generate recommendations based on analysis
      if (analysis.skinAnalysis.conditions.includes('acne')) {
        recommendations.push({
          treatment: 'Chemical Peel',
          rationale: 'Effective for acne treatment and skin texture improvement',
          expectedOutcome: 'Reduced acne and improved skin texture',
          sessions: 4,
          interval: '2-4 weeks'
        });
      }
      
      if (analysis.skinAnalysis.conditions.includes('aging')) {
        recommendations.push({
          treatment: 'Dermal Filler',
          rationale: 'Addresses volume loss and fine lines',
          expectedOutcome: 'Restored volume and reduced fine lines',
          sessions: 1,
          interval: '6-12 months'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('❌ Treatment recommendations generation error:', error);
      return [];
    }
  }

  /**
   * Calculate overall sentiment from results
   */
  calculateOverallSentiment(sentimentResults) {
    if (sentimentResults.length === 0) return { score: 0, label: 'neutral' };
    
    const totalScore = sentimentResults.reduce((sum, result) => sum + result.sentiment.score, 0);
    const averageScore = totalScore / sentimentResults.length;
    
    let label = 'neutral';
    if (averageScore > 0.3) label = 'positive';
    else if (averageScore < -0.3) label = 'negative';
    
    return {
      score: averageScore,
      label: label,
      totalCommunications: sentimentResults.length
    };
  }

  /**
   * Analyze sentiment trends
   */
  async analyzeSentimentTrends(sentimentResults, timeframe) {
    try {
      // Group by time periods and calculate trends
      const timeGroups = this.groupByTimePeriod(sentimentResults, timeframe);
      
      const trends = Object.keys(timeGroups).map(period => ({
        period: period,
        averageSentiment: timeGroups[period].reduce((sum, r) => sum + r.sentiment.score, 0) / timeGroups[period].length,
        communicationCount: timeGroups[period].length
      }));
      
      return {
        trends: trends,
        overallTrend: this.calculateTrendDirection(trends),
        significantChanges: this.identifySignificantChanges(trends)
      };
    } catch (error) {
      console.error('❌ Sentiment trend analysis error:', error);
      return { trends: [], overallTrend: 'stable', significantChanges: [] };
    }
  }

  /**
   * Identify top concerns from communications
   */
  async identifyTopConcerns(sentimentResults) {
    try {
      const concerns = [];
      
      // Analyze negative communications for common concerns
      const negativeCommunications = sentimentResults.filter(r => r.sentiment.score < -0.3);
      
      // Extract topics from negative communications
      const negativeTopics = negativeCommunications.flatMap(r => r.topics);
      
      // Count topic frequency
      const topicCounts = {};
      negativeTopics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
      
      // Return top concerns
      return Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic, count]) => ({
          topic: topic,
          frequency: count,
          percentage: (count / negativeCommunications.length * 100).toFixed(1)
        }));
    } catch (error) {
      console.error('❌ Top concerns identification error:', error);
      return [];
    }
  }

  /**
   * Trigger urgent communication alerts
   */
  async triggerUrgentCommunicationAlerts(urgentItems, tenantId) {
    try {
      console.log(`🚨 Triggering alerts for ${urgentItems.length} urgent communications`);
      
      for (const item of urgentItems) {
        // Create alert record
        await this.db.query(`
          INSERT INTO communication_alerts (
            tenant_id, patient_id, communication_id, urgency_level,
            alert_type, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          tenantId,
          item.patientId,
          item.communicationId,
          item.urgency,
          'urgent_communication',
          `Urgent communication requires immediate attention: ${item.sentiment.label} sentiment`
        ]);
        
        // Send notification (integrate with notification service)
        await this.sendUrgentAlertNotification(item, tenantId);
      }
    } catch (error) {
      console.error('❌ Urgent communication alert error:', error);
    }
  }

  /**
   * Send urgent alert notification
   */
  async sendUrgentAlertNotification(item, tenantId) {
    // Integrate with notification service
    console.log(`📧 Sending urgent alert for communication ${item.communicationId}`);
  }

  /**
   * Get communications for analysis
   */
  async getCommunications(tenantId, timeframe, options) {
    try {
      const { types, includeMetadata, includeSentiment } = options;
      
      const result = await this.db.query(`
        SELECT 
          c.id, c.patient_id, c.type, c.text, c.timestamp,
          p.name as patient_name, p.email as patient_email
        FROM communications c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.tenant_id = $1 
          AND c.timestamp > NOW() - INTERVAL $2
          AND c.type = ANY($3)
        ORDER BY c.timestamp DESC
      `, [tenantId, timeframe, types]);
      
      return result.rows;
    } catch (error) {
      console.error('❌ Communications retrieval error:', error);
      return [];
    }
  }

  /**
   * Store communication analysis results
   */
  async storeCommunicationAnalysis(tenantId, insights) {
    try {
      await this.redisClient.setex(
        `communication_analysis:${tenantId}`,
        3600, // 1 hour
        JSON.stringify({
          insights: insights,
          timestamp: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('❌ Communication analysis storage error:', error);
    }
  }

  /**
   * Get NLP service statistics
   */
  async getNLPStatistics(tenantId) {
    try {
      const stats = {
        totalTranscriptions: 0,
        averageTranscriptionAccuracy: 0,
        totalSentimentAnalyses: 0,
        averageSentimentAccuracy: 0,
        totalTreatmentPlans: 0,
        averagePlanConfidence: 0,
        lastUpdated: null
      };
      
      // Get statistics from database
      const result = await this.db.query(`
        SELECT 
          COUNT(*) as total_transcriptions,
          AVG(confidence) as avg_transcription_accuracy,
          COUNT(*) FILTER (WHERE type = 'sentiment_analysis') as total_sentiment,
          AVG(confidence) FILTER (WHERE type = 'sentiment_analysis') as avg_sentiment_accuracy,
          COUNT(*) FILTER (WHERE type = 'treatment_plan') as total_plans,
          AVG(confidence) FILTER (WHERE type = 'treatment_plan') as avg_plan_confidence,
          MAX(created_at) as last_updated
        FROM nlp_processing_log
        WHERE tenant_id = $1
      `, [tenantId]);
      
      if (result.rows[0]) {
        const row = result.rows[0];
        stats.totalTranscriptions = parseInt(row.total_transcriptions) || 0;
        stats.averageTranscriptionAccuracy = parseFloat(row.avg_transcription_accuracy) || 0;
        stats.totalSentimentAnalyses = parseInt(row.total_sentiment) || 0;
        stats.averageSentimentAccuracy = parseFloat(row.avg_sentiment_accuracy) || 0;
        stats.totalTreatmentPlans = parseInt(row.total_plans) || 0;
        stats.averagePlanConfidence = parseFloat(row.avg_plan_confidence) || 0;
        stats.lastUpdated = row.last_updated;
      }
      
      return stats;
    } catch (error) {
      console.error('❌ NLP statistics error:', error);
      return {};
    }
  }
}

// Supporting service classes (simplified implementations)
class SpeechToTextService {
  async initialize() {
    console.log('🎤 Initializing Speech-to-Text service');
  }

  async transcribe(audioStream, options) {
    // Implementation for speech-to-text transcription
    return {
      text: 'Patient presents with mild acne and fine lines. Recommend chemical peel treatment.',
      confidence: 0.92,
      wordTimeOffsets: [
        { word: 'Patient', startTime: 0.0, endTime: 0.5 },
        { word: 'presents', startTime: 0.5, endTime: 1.0 },
        { word: 'with', startTime: 1.0, endTime: 1.2 },
        { word: 'mild', startTime: 1.2, endTime: 1.5 },
        { word: 'acne', startTime: 1.5, endTime: 2.0 }
      ]
    };
  }
}

class MedicalEntityRecognition {
  async initialize() {
    console.log('🏥 Initializing Medical Entity Recognition');
  }

  async extractEntities(text, options) {
    // Implementation for medical entity recognition
    return [
      {
        text: 'acne',
        type: 'condition',
        confidence: 0.95,
        synonyms: ['acne vulgaris', 'pimples']
      },
      {
        text: 'chemical peel',
        type: 'procedure',
        confidence: 0.88,
        synonyms: ['chemical exfoliation', 'peel treatment']
      },
      {
        text: 'fine lines',
        type: 'condition',
        confidence: 0.92,
        synonyms: ['wrinkles', 'age lines']
      }
    ];
  }
}

class DocumentGenerationService {
  async generateFromTranscription(data) {
    // Implementation for generating structured documentation
    return {
      patientAssessment: 'Patient presents with mild acne and fine lines',
      treatmentPlan: 'Chemical peel treatment recommended',
      postTreatmentCare: 'Avoid sun exposure and use gentle cleanser',
      followUp: 'Schedule follow-up in 2 weeks',
      complianceIssues: []
    };
  }

  async generateTreatmentPlan(data) {
    // Implementation for generating treatment plan
    return {
      patientId: data.patientId,
      recommendations: data.recommendations,
      timeline: {
        totalWeeks: 8,
        sessions: data.recommendations.length,
        intervals: data.recommendations.map(r => r.interval)
      },
      expectedOutcomes: data.recommendations.map(r => r.expectedOutcome),
      contraindications: [],
      costEstimate: 1200,
      followUpSchedule: ['2 weeks', '4 weeks', '8 weeks']
    };
  }
}

class ComplianceValidationService {
  async validateDocumentation(document) {
    // Implementation for compliance validation
    return {
      compliant: true,
      issues: [],
      confidence: 0.95,
      requiresReview: false
    };
  }

  async validateTreatmentPlan(plan) {
    // Implementation for treatment plan validation
    return {
      confidence: 0.88,
      evidenceLevel: 'moderate',
      requiresReview: false,
      riskAssessment: 'low'
    };
  }
}

class SentimentAnalysisService {
  async analyzeSentiment(text, options) {
    // Implementation for sentiment analysis
    return {
      score: 0.3, // Positive sentiment
      label: 'positive',
      emotions: ['satisfied', 'hopeful'],
      aspects: {
        treatment: { score: 0.4, label: 'positive' },
        staff: { score: 0.5, label: 'positive' },
        facility: { score: 0.2, label: 'neutral' }
      },
      intent: 'feedback',
      urgency: 'low'
    };
  }
}

module.exports = { NLPService }; 