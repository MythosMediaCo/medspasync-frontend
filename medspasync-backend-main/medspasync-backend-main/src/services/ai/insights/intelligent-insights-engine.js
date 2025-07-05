/**
 * Intelligent Insights Engine
 * MedSpaSync Pro AI-Powered Business Intelligence
 * 
 * Features:
 * - Automated insight discovery and pattern detection
 * - Actionable business recommendations
 * - Real-time decision support and alerts
 * - Performance benchmarking and optimization
 * - Predictive business intelligence
 */

const { Pool } = require('pg');
const redis = require('redis');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class IntelligentInsightsEngine {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 11 // Insights-specific Redis DB
    });

    this.patternAnalyzer = new PatternAnalysisService(this.db);
    this.recommendationGenerator = new RecommendationService(this.db);
    this.benchmarkingService = new BenchmarkingService(this.db);
    this.alertManager = new AlertManagementService(this.db);
    this.performanceTracker = new PerformanceTrackingService(this.db);
    
    this.initializeInsightsEngine();
  }

  /**
   * Initialize insights engine
   */
  async initializeInsightsEngine() {
    try {
      console.log('🧠 Initializing Intelligent Insights Engine...');
      
      // Initialize Redis connection
      await this.redisClient.connect();
      
      // Load business rules and thresholds
      await this.loadBusinessRules();
      
      // Initialize pattern recognition models
      await this.patternAnalyzer.initialize();
      
      // Setup real-time insights generation
      this.setupRealTimeInsightsGeneration();
      
      // Initialize alert management system
      await this.alertManager.initialize();
      
      console.log('✅ Intelligent Insights Engine initialized successfully');
    } catch (error) {
      console.error('❌ Insights Engine initialization error:', error);
      throw error;
    }
  }

  /**
   * Load business rules and thresholds
   */
  async loadBusinessRules() {
    try {
      const businessRules = {
        revenueThresholds: {
          lowRevenue: 0.8, // 80% of target
          highRevenue: 1.2, // 120% of target
          criticalDecline: 0.6 // 60% of target
        },
        performanceThresholds: {
          minSatisfaction: 4.0,
          maxResponseTime: 2000, // ms
          minUptime: 0.99, // 99%
          maxErrorRate: 0.05 // 5%
        },
        operationalThresholds: {
          maxWaitTime: 15, // minutes
          minStaffUtilization: 0.7, // 70%
          maxInventoryWaste: 0.1, // 10%
          minCustomerRetention: 0.85 // 85%
        }
      };

      await this.redisClient.setex(
        'insights:business_rules',
        86400, // 24 hours
        JSON.stringify(businessRules)
      );

      console.log('📋 Business rules loaded successfully');
    } catch (error) {
      console.error('❌ Business rules loading error:', error);
    }
  }

  /**
   * Setup real-time insights generation
   */
  setupRealTimeInsightsGeneration() {
    // Generate daily insights every day at 6 AM
    const dailyInsightsInterval = this.scheduleDailyInsights();
    
    // Generate real-time alerts every 30 seconds
    setInterval(async () => {
      await this.generateRealTimeAlerts();
    }, 30000);

    // Update performance benchmarks every hour
    setInterval(async () => {
      await this.updatePerformanceBenchmarks();
    }, 60 * 60 * 1000);

    // Generate trend analysis every 6 hours
    setInterval(async () => {
      await this.generateTrendAnalysis();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Schedule daily insights generation
   */
  scheduleDailyInsights() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    
    const timeUntilTomorrow = tomorrow.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.generateDailyInsights();
      
      // Schedule for subsequent days
      setInterval(async () => {
        await this.generateDailyInsights();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilTomorrow);
  }

  /**
   * Generate daily business insights
   */
  async generateDailyInsights(tenantId = null) {
    try {
      console.log('📊 Generating daily business insights...');
      
      const tenants = tenantId ? [{ tenant_id: tenantId }] : 
        (await this.db.query('SELECT DISTINCT tenant_id FROM patients WHERE status = \'active\'')).rows;

      for (const tenant of tenants) {
        const tenantId = tenant.tenant_id;
        
        const today = new Date();
        const timeframes = {
          today: { start: this.startOfDay(today), end: this.endOfDay(today) },
          week: { start: this.startOfWeek(today), end: this.endOfWeek(today) },
          month: { start: this.startOfMonth(today), end: this.endOfMonth(today) },
          quarter: { start: this.startOfQuarter(today), end: this.endOfQuarter(today) }
        };

        // Gather comprehensive business data
        const businessData = await this.gatherBusinessMetrics(tenantId, timeframes);

        // Pattern analysis and anomaly detection
        const patterns = await this.patternAnalyzer.analyzeBusinessPatterns(businessData, {
          detectAnomalies: true,
          identifyTrends: true,
          correlationAnalysis: true,
          seasonalityAdjustment: true
        });

        // Generate insights from patterns
        const insights = await Promise.all([
          this.generateRevenueInsights(patterns.revenue, tenantId),
          this.generateOperationalInsights(patterns.operations, tenantId),
          this.generatePatientInsights(patterns.patients, tenantId),
          this.generateStaffInsights(patterns.staff, tenantId),
          this.generateMarketingInsights(patterns.marketing, tenantId)
        ]);

        // Prioritize insights by business impact
        const prioritizedInsights = await this.prioritizeInsights(insights.flat(), {
          businessGoals: await this.getBusinessGoals(tenantId),
          currentChallenges: await this.getCurrentChallenges(tenantId),
          historicalPerformance: businessData.historical
        });

        // Generate actionable recommendations
        const recommendations = await this.generateActionableRecommendations(
          prioritizedInsights,
          tenantId
        );

        const dailyInsights = {
          date: today,
          tenantId: tenantId,
          keyInsights: prioritizedInsights.slice(0, 5), // Top 5 insights
          recommendations: recommendations,
          alerts: await this.generateAlerts(patterns, tenantId),
          performanceSummary: await this.generatePerformanceSummary(businessData),
          nextSteps: await this.generateNextSteps(recommendations, tenantId),
          generatedAt: new Date().toISOString()
        };

        // Store daily insights
        await this.storeDailyInsights(tenantId, dailyInsights);
        
        // Send insights notification
        await this.sendInsightsNotification(tenantId, dailyInsights);
      }

      console.log('✅ Daily insights generated successfully');
    } catch (error) {
      console.error('❌ Daily insights generation error:', error);
    }
  }

  /**
   * Generate revenue optimization insights
   */
  async generateRevenueInsights(revenueData, tenantId) {
    try {
      const insights = [];

      // Revenue trend analysis
      const trendAnalysis = await this.analyzeTrends(revenueData.timeSeries, {
        detectTrendChanges: true,
        seasonalityAdjustment: true,
        forecastNextPeriod: true
      });

      if (trendAnalysis.trendChange && trendAnalysis.significance > 0.8) {
        insights.push({
          type: 'revenue_trend',
          title: `Revenue ${trendAnalysis.direction} by ${trendAnalysis.magnitude}%`,
          description: `Revenue has been ${trendAnalysis.direction} ${trendAnalysis.magnitude}% over the past ${trendAnalysis.period}`,
          impact: 'high',
          confidence: trendAnalysis.significance,
          recommendations: await this.generateTrendRecommendations(trendAnalysis, tenantId),
          dataSupport: trendAnalysis.evidence,
          priority: 'high'
        });
      }

      // Service performance analysis
      const serviceAnalysis = await this.analyzeServicePerformance(revenueData.byService);
      const underperformingServices = serviceAnalysis.filter(s => s.performance < 0.7);
      
      if (underperformingServices.length > 0) {
        insights.push({
          type: 'service_optimization',
          title: `${underperformingServices.length} services underperforming`,
          description: `Services ${underperformingServices.map(s => s.name).join(', ')} are below expected performance`,
          impact: 'medium',
          confidence: 0.9,
          recommendations: await this.generateServiceOptimizationRecommendations(underperformingServices),
          potentialImpact: await this.calculateServiceOptimizationImpact(underperformingServices),
          priority: 'medium'
        });
      }

      // Price optimization opportunities
      const pricingAnalysis = await this.analyzePricingOpportunities(revenueData, tenantId);
      if (pricingAnalysis.opportunities.length > 0) {
        insights.push({
          type: 'pricing_optimization',
          title: `${pricingAnalysis.opportunities.length} pricing optimization opportunities`,
          description: 'AI identified services with pricing optimization potential',
          impact: 'high',
          confidence: pricingAnalysis.confidence,
          recommendations: await this.generatePricingRecommendations(pricingAnalysis.opportunities),
          estimatedRevenue: pricingAnalysis.potentialIncrease,
          priority: 'high'
        });
      }

      return insights;
    } catch (error) {
      console.error('❌ Revenue insights generation error:', error);
      return [];
    }
  }

  /**
   * Generate operational insights
   */
  async generateOperationalInsights(operationsData, tenantId) {
    try {
      const insights = [];

      // Staff utilization analysis
      const staffUtilization = await this.analyzeStaffUtilization(operationsData.staff);
      if (staffUtilization.underutilized.length > 0) {
        insights.push({
          type: 'staff_optimization',
          title: 'Staff utilization optimization opportunities',
          description: `${staffUtilization.underutilized.length} staff members are underutilized`,
          impact: 'medium',
          confidence: 0.85,
          recommendations: await this.generateStaffOptimizationRecommendations(staffUtilization),
          potentialSavings: staffUtilization.potentialSavings,
          priority: 'medium'
        });
      }

      // Appointment efficiency analysis
      const appointmentEfficiency = await this.analyzeAppointmentEfficiency(operationsData.appointments);
      if (appointmentEfficiency.inefficiencies.length > 0) {
        insights.push({
          type: 'appointment_optimization',
          title: 'Appointment scheduling inefficiencies detected',
          description: `${appointmentEfficiency.inefficiencies.length} scheduling inefficiencies identified`,
          impact: 'medium',
          confidence: 0.88,
          recommendations: await this.generateAppointmentOptimizationRecommendations(appointmentEfficiency),
          potentialImprovement: appointmentEfficiency.potentialImprovement,
          priority: 'medium'
        });
      }

      // Inventory optimization
      const inventoryAnalysis = await this.analyzeInventoryEfficiency(operationsData.inventory);
      if (inventoryAnalysis.optimizationOpportunities.length > 0) {
        insights.push({
          type: 'inventory_optimization',
          title: 'Inventory optimization opportunities',
          description: `${inventoryAnalysis.optimizationOpportunities.length} inventory optimization opportunities`,
          impact: 'medium',
          confidence: 0.82,
          recommendations: await this.generateInventoryOptimizationRecommendations(inventoryAnalysis),
          potentialSavings: inventoryAnalysis.potentialSavings,
          priority: 'low'
        });
      }

      return insights;
    } catch (error) {
      console.error('❌ Operational insights generation error:', error);
      return [];
    }
  }

  /**
   * Generate patient insights
   */
  async generatePatientInsights(patientsData, tenantId) {
    try {
      const insights = [];

      // Patient satisfaction analysis
      const satisfactionAnalysis = await this.analyzePatientSatisfaction(patientsData.satisfaction);
      if (satisfactionAnalysis.trend === 'declining' && satisfactionAnalysis.significance > 0.8) {
        insights.push({
          type: 'satisfaction_decline',
          title: 'Patient satisfaction declining',
          description: `Patient satisfaction has decreased by ${satisfactionAnalysis.decline}% over the past ${satisfactionAnalysis.period}`,
          impact: 'high',
          confidence: satisfactionAnalysis.significance,
          recommendations: await this.generateSatisfactionImprovementRecommendations(satisfactionAnalysis),
          priority: 'high'
        });
      }

      // Patient retention analysis
      const retentionAnalysis = await this.analyzePatientRetention(patientsData.retention);
      if (retentionAnalysis.atRisk.length > 0) {
        insights.push({
          type: 'retention_risk',
          title: `${retentionAnalysis.atRisk.length} patients at retention risk`,
          description: 'High-value patients identified as at risk of churning',
          impact: 'high',
          confidence: 0.9,
          recommendations: await this.generateRetentionRecommendations(retentionAnalysis),
          potentialRevenue: retentionAnalysis.potentialRevenue,
          priority: 'high'
        });
      }

      // Patient acquisition analysis
      const acquisitionAnalysis = await this.analyzePatientAcquisition(patientsData.acquisition);
      if (acquisitionAnalysis.opportunities.length > 0) {
        insights.push({
          type: 'acquisition_opportunity',
          title: 'Patient acquisition opportunities identified',
          description: `${acquisitionAnalysis.opportunities.length} acquisition opportunities detected`,
          impact: 'medium',
          confidence: 0.85,
          recommendations: await this.generateAcquisitionRecommendations(acquisitionAnalysis),
          potentialGrowth: acquisitionAnalysis.potentialGrowth,
          priority: 'medium'
        });
      }

      return insights;
    } catch (error) {
      console.error('❌ Patient insights generation error:', error);
      return [];
    }
  }

  /**
   * Generate actionable recommendations
   */
  async generateActionableRecommendations(insights, tenantId) {
    try {
      const recommendations = [];

      for (const insight of insights) {
        const baseRecommendations = await this.generateBaseRecommendations(insight);
        
        // Customize recommendations based on spa context
        const contextualizedRecs = await Promise.all(
          baseRecommendations.map(async (rec) => {
            const context = await this.getSpaContext(tenantId);
            const customized = await this.customizeRecommendation(rec, context);
            
            return {
              ...customized,
              implementation: await this.generateImplementationPlan(customized, context),
              timeline: await this.estimateImplementationTimeline(customized, context),
              resources: await this.identifyRequiredResources(customized, context),
              expectedOutcome: await this.predictOutcome(customized, context),
              riskAssessment: await this.assessImplementationRisk(customized, context),
              priority: insight.priority
            };
          })
        );

        recommendations.push(...contextualizedRecs);
      }

      // Prioritize recommendations by ROI and feasibility
      return this.prioritizeRecommendations(recommendations, {
        roiThreshold: 1.5, // Minimum 150% ROI
        feasibilityThreshold: 0.7, // 70% feasibility score
        maxRecommendations: 10 // Top 10 recommendations
      });
    } catch (error) {
      console.error('❌ Actionable recommendations generation error:', error);
      return [];
    }
  }

  /**
   * Generate real-time alerts
   */
  async generateRealTimeAlerts() {
    try {
      const alerts = [];
      
      // Get all active tenants
      const tenants = await this.db.query(`
        SELECT DISTINCT tenant_id FROM patients WHERE status = 'active'
      `);
      
      for (const tenant of tenants.rows) {
        const tenantId = tenant.tenant_id;
        
        // Monitor key business metrics in real-time
        const currentMetrics = await this.getCurrentMetrics(tenantId);
        const baselineMetrics = await this.getBaselineMetrics(tenantId);
        
        // Revenue alerts
        if (currentMetrics.dailyRevenue < baselineMetrics.dailyRevenue * 0.8) {
          alerts.push({
            type: 'revenue_drop',
            severity: 'high',
            tenantId: tenantId,
            title: 'Significant revenue drop detected',
            message: `Today's revenue is ${Math.round((1 - currentMetrics.dailyRevenue / baselineMetrics.dailyRevenue) * 100)}% below baseline`,
            recommendations: await this.generateRevenueBoostingActions(tenantId),
            autoActions: ['notify_management', 'analyze_root_cause', 'suggest_promotions'],
            timestamp: new Date().toISOString()
          });
        }

        // Appointment availability alerts
        const availabilityAnalysis = await this.analyzeAppointmentAvailability(tenantId);
        if (availabilityAnalysis.lowAvailabilityPeriods.length > 0) {
          alerts.push({
            type: 'capacity_optimization',
            severity: 'medium',
            tenantId: tenantId,
            title: 'Capacity optimization opportunities detected',
            message: `${availabilityAnalysis.lowAvailabilityPeriods.length} time periods with low availability`,
            recommendations: await this.generateCapacityRecommendations(availabilityAnalysis),
            autoActions: ['adjust_scheduling', 'suggest_staff_changes'],
            timestamp: new Date().toISOString()
          });
        }

        // Patient satisfaction alerts
        const satisfactionTrend = await this.analyzeSatisfactionTrend(tenantId);
        if (satisfactionTrend.isDecreasing && satisfactionTrend.significance > 0.8) {
          alerts.push({
            type: 'satisfaction_decline',
            severity: 'high',
            tenantId: tenantId,
            title: 'Patient satisfaction trend declining',
            message: `Patient satisfaction has decreased by ${satisfactionTrend.decline}% over the past ${satisfactionTrend.period}`,
            recommendations: await this.generateSatisfactionImprovementActions(satisfactionTrend),
            autoActions: ['analyze_feedback', 'identify_issues', 'create_action_plan'],
            timestamp: new Date().toISOString()
          });
        }
      }

      // Process and store alerts
      if (alerts.length > 0) {
        await this.processAlerts(alerts);
      }
    } catch (error) {
      console.error('❌ Real-time alerts generation error:', error);
    }
  }

  /**
   * Process and store alerts
   */
  async processAlerts(alerts) {
    try {
      for (const alert of alerts) {
        // Store alert in database
        await this.db.query(`
          INSERT INTO business_alerts (
            tenant_id, alert_type, severity, title, message,
            recommendations, auto_actions, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          alert.tenantId,
          alert.type,
          alert.severity,
          alert.title,
          alert.message,
          JSON.stringify(alert.recommendations),
          JSON.stringify(alert.autoActions)
        ]);

        // Send alert notification
        await this.sendAlertNotification(alert);
        
        // Execute auto-actions
        await this.executeAutoActions(alert);
      }
    } catch (error) {
      console.error('❌ Alert processing error:', error);
    }
  }

  /**
   * Send alert notification
   */
  async sendAlertNotification(alert) {
    try {
      // Integrate with notification service
      console.log(`🚨 Sending alert notification: ${alert.title}`);
      
      // This would integrate with email, SMS, or in-app notification service
      const notification = {
        type: 'business_alert',
        tenantId: alert.tenantId,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp
      };
      
      // Store notification for delivery
      await this.redisClient.lpush('notifications:queue', JSON.stringify(notification));
    } catch (error) {
      console.error('❌ Alert notification error:', error);
    }
  }

  /**
   * Execute auto-actions for alerts
   */
  async executeAutoActions(alert) {
    try {
      for (const action of alert.autoActions) {
        switch (action) {
          case 'notify_management':
            await this.notifyManagement(alert);
            break;
          case 'analyze_root_cause':
            await this.analyzeRootCause(alert);
            break;
          case 'suggest_promotions':
            await this.suggestPromotions(alert);
            break;
          case 'adjust_scheduling':
            await this.adjustScheduling(alert);
            break;
          case 'suggest_staff_changes':
            await this.suggestStaffChanges(alert);
            break;
          case 'analyze_feedback':
            await this.analyzeFeedback(alert);
            break;
          case 'identify_issues':
            await this.identifyIssues(alert);
            break;
          case 'create_action_plan':
            await this.createActionPlan(alert);
            break;
        }
      }
    } catch (error) {
      console.error('❌ Auto-action execution error:', error);
    }
  }

  /**
   * Gather comprehensive business metrics
   */
  async gatherBusinessMetrics(tenantId, timeframes) {
    try {
      const metrics = {};
      
      // Revenue metrics
      metrics.revenue = await this.getRevenueMetrics(tenantId, timeframes);
      
      // Operational metrics
      metrics.operations = await this.getOperationalMetrics(tenantId, timeframes);
      
      // Patient metrics
      metrics.patients = await this.getPatientMetrics(tenantId, timeframes);
      
      // Staff metrics
      metrics.staff = await this.getStaffMetrics(tenantId, timeframes);
      
      // Marketing metrics
      metrics.marketing = await this.getMarketingMetrics(tenantId, timeframes);
      
      // Historical data for trend analysis
      metrics.historical = await this.getHistoricalMetrics(tenantId, timeframes);
      
      return metrics;
    } catch (error) {
      console.error('❌ Business metrics gathering error:', error);
      return {};
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(tenantId, timeframes) {
    try {
      const result = await this.db.query(`
        SELECT 
          DATE(timestamp) as date,
          SUM(amount) as daily_revenue,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_transaction_value
        FROM transactions 
        WHERE tenant_id = $1 
          AND timestamp BETWEEN $2 AND $3
        GROUP BY DATE(timestamp)
        ORDER BY date
      `, [tenantId, timeframes.month.start, timeframes.month.end]);
      
      return {
        timeSeries: result.rows,
        byService: await this.getRevenueByService(tenantId, timeframes),
        trends: await this.calculateRevenueTrends(result.rows)
      };
    } catch (error) {
      console.error('❌ Revenue metrics error:', error);
      return { timeSeries: [], byService: {}, trends: {} };
    }
  }

  /**
   * Get operational metrics
   */
  async getOperationalMetrics(tenantId, timeframes) {
    try {
      return {
        appointments: await this.getAppointmentMetrics(tenantId, timeframes),
        staff: await this.getStaffUtilizationMetrics(tenantId, timeframes),
        inventory: await this.getInventoryMetrics(tenantId, timeframes),
        efficiency: await this.getEfficiencyMetrics(tenantId, timeframes)
      };
    } catch (error) {
      console.error('❌ Operational metrics error:', error);
      return {};
    }
  }

  /**
   * Get patient metrics
   */
  async getPatientMetrics(tenantId, timeframes) {
    try {
      return {
        satisfaction: await this.getSatisfactionMetrics(tenantId, timeframes),
        retention: await this.getRetentionMetrics(tenantId, timeframes),
        acquisition: await this.getAcquisitionMetrics(tenantId, timeframes),
        demographics: await this.getDemographicsMetrics(tenantId, timeframes)
      };
    } catch (error) {
      console.error('❌ Patient metrics error:', error);
      return {};
    }
  }

  /**
   * Store daily insights
   */
  async storeDailyInsights(tenantId, insights) {
    try {
      // Store in database
      await this.db.query(`
        INSERT INTO daily_insights (
          tenant_id, insights_data, generated_at
        ) VALUES ($1, $2, NOW())
      `, [tenantId, JSON.stringify(insights)]);
      
      // Store in Redis for quick access
      await this.redisClient.setex(
        `daily_insights:${tenantId}:${insights.date.toISOString().split('T')[0]}`,
        86400, // 24 hours
        JSON.stringify(insights)
      );
    } catch (error) {
      console.error('❌ Daily insights storage error:', error);
    }
  }

  /**
   * Send insights notification
   */
  async sendInsightsNotification(tenantId, insights) {
    try {
      const notification = {
        type: 'daily_insights',
        tenantId: tenantId,
        title: 'Daily Business Insights Available',
        message: `${insights.keyInsights.length} key insights and ${insights.recommendations.length} recommendations generated`,
        insights: insights.keyInsights.slice(0, 3), // Top 3 insights
        timestamp: insights.generatedAt
      };
      
      // Store notification for delivery
      await this.redisClient.lpush('notifications:queue', JSON.stringify(notification));
    } catch (error) {
      console.error('❌ Insights notification error:', error);
    }
  }

  /**
   * Get insights engine statistics
   */
  async getInsightsStatistics(tenantId) {
    try {
      const stats = {
        totalInsights: 0,
        totalRecommendations: 0,
        totalAlerts: 0,
        averageInsightConfidence: 0,
        lastGenerated: null,
        insightsByType: {
          revenue: 0,
          operational: 0,
          patient: 0,
          staff: 0,
          marketing: 0
        }
      };
      
      // Get statistics from database
      const result = await this.db.query(`
        SELECT 
          COUNT(*) as total_insights,
          COUNT(*) FILTER (WHERE type = 'recommendation') as total_recommendations,
          COUNT(*) FILTER (WHERE type = 'alert') as total_alerts,
          AVG(confidence) as avg_confidence,
          MAX(created_at) as last_generated
        FROM insights_log
        WHERE tenant_id = $1
      `, [tenantId]);
      
      if (result.rows[0]) {
        const row = result.rows[0];
        stats.totalInsights = parseInt(row.total_insights) || 0;
        stats.totalRecommendations = parseInt(row.total_recommendations) || 0;
        stats.totalAlerts = parseInt(row.total_alerts) || 0;
        stats.averageInsightConfidence = parseFloat(row.avg_confidence) || 0;
        stats.lastGenerated = row.last_generated;
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Insights statistics error:', error);
      return {};
    }
  }

  // Helper methods for date calculations
  startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  endOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  endOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
    return new Date(d.setDate(diff));
  }

  startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  startOfQuarter(date) {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
  }

  endOfQuarter(date) {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), (quarter + 1) * 3, 0);
  }

  /**
   * Get AI-generated recommendations for a tenant
   */
  async getRecommendations(tenantId) {
    try {
      console.log(`🎯 Getting recommendations for tenant: ${tenantId}`);
      
      // Get recommendations from database
      const result = await this.db.query(`
        SELECT 
          id, action, description, expected_impact, implementation,
          timeline, resources, priority, status, created_at
        FROM ai_recommendations
        WHERE tenant_id = $1 AND status = 'pending'
        ORDER BY priority DESC, created_at DESC
        LIMIT 20
      `, [tenantId]);
      
      const recommendations = result.rows.map(row => ({
        id: row.id,
        action: row.action,
        description: row.description,
        expectedImpact: row.expected_impact,
        implementation: row.implementation,
        timeline: row.timeline,
        resources: row.resources ? JSON.parse(row.resources) : [],
        priority: row.priority,
        status: row.status,
        timestamp: row.created_at
      }));
      
      return recommendations;
    } catch (error) {
      console.error('❌ Get recommendations error:', error);
      return [];
    }
  }

  /**
   * Execute AI recommendation
   */
  async executeRecommendation(recommendationId, tenantId) {
    try {
      console.log(`⚡ Executing recommendation: ${recommendationId}`);
      
      // Get recommendation details
      const result = await this.db.query(`
        SELECT * FROM ai_recommendations
        WHERE id = $1 AND tenant_id = $2
      `, [recommendationId, tenantId]);
      
      if (result.rows.length === 0) {
        throw new Error('Recommendation not found');
      }
      
      const recommendation = result.rows[0];
      
      // Execute the recommendation based on type
      let executionResult;
      switch (recommendation.action_type) {
        case 'pricing_adjustment':
          executionResult = await this.executePricingAdjustment(recommendation);
          break;
        case 'staff_scheduling':
          executionResult = await this.executeStaffScheduling(recommendation);
          break;
        case 'marketing_campaign':
          executionResult = await this.executeMarketingCampaign(recommendation);
          break;
        case 'inventory_management':
          executionResult = await this.executeInventoryManagement(recommendation);
          break;
        default:
          executionResult = await this.executeGenericAction(recommendation);
      }
      
      // Update recommendation status
      await this.db.query(`
        UPDATE ai_recommendations
        SET status = 'in_progress', executed_at = NOW()
        WHERE id = $1
      `, [recommendationId]);
      
      return {
        success: true,
        action: recommendation.action,
        result: executionResult,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Execute recommendation error:', error);
      throw error;
    }
  }

  /**
   * Execute pricing adjustment recommendation
   */
  async executePricingAdjustment(recommendation) {
    try {
      const actionData = JSON.parse(recommendation.action_data);
      
      // Update pricing in the system
      await this.db.query(`
        UPDATE services
        SET price = price * $1
        WHERE id = ANY($2) AND tenant_id = $3
      `, [actionData.adjustment_factor, actionData.service_ids, recommendation.tenant_id]);
      
      return {
        type: 'pricing_adjustment',
        servicesUpdated: actionData.service_ids.length,
        adjustmentFactor: actionData.adjustment_factor
      };
    } catch (error) {
      console.error('❌ Pricing adjustment execution error:', error);
      throw error;
    }
  }

  /**
   * Execute staff scheduling recommendation
   */
  async executeStaffScheduling(recommendation) {
    try {
      const actionData = JSON.parse(recommendation.action_data);
      
      // Update staff schedules
      await this.db.query(`
        UPDATE staff_schedules
        SET hours = $1, days = $2
        WHERE staff_id = $3 AND tenant_id = $4
      `, [actionData.hours, actionData.days, actionData.staff_id, recommendation.tenant_id]);
      
      return {
        type: 'staff_scheduling',
        staffId: actionData.staff_id,
        hours: actionData.hours,
        days: actionData.days
      };
    } catch (error) {
      console.error('❌ Staff scheduling execution error:', error);
      throw error;
    }
  }

  /**
   * Execute marketing campaign recommendation
   */
  async executeMarketingCampaign(recommendation) {
    try {
      const actionData = JSON.parse(recommendation.action_data);
      
      // Create marketing campaign
      await this.db.query(`
        INSERT INTO marketing_campaigns (
          tenant_id, name, type, target_audience, budget, start_date, end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        recommendation.tenant_id,
        actionData.campaign_name,
        actionData.campaign_type,
        actionData.target_audience,
        actionData.budget,
        actionData.start_date,
        actionData.end_date
      ]);
      
      return {
        type: 'marketing_campaign',
        campaignName: actionData.campaign_name,
        budget: actionData.budget
      };
    } catch (error) {
      console.error('❌ Marketing campaign execution error:', error);
      throw error;
    }
  }

  /**
   * Execute inventory management recommendation
   */
  async executeInventoryManagement(recommendation) {
    try {
      const actionData = JSON.parse(recommendation.action_data);
      
      // Update inventory levels
      await this.db.query(`
        UPDATE inventory
        SET reorder_point = $1, max_stock = $2
        WHERE product_id = $3 AND tenant_id = $4
      `, [actionData.reorder_point, actionData.max_stock, actionData.product_id, recommendation.tenant_id]);
      
      return {
        type: 'inventory_management',
        productId: actionData.product_id,
        reorderPoint: actionData.reorder_point,
        maxStock: actionData.max_stock
      };
    } catch (error) {
      console.error('❌ Inventory management execution error:', error);
      throw error;
    }
  }

  /**
   * Execute generic action recommendation
   */
  async executeGenericAction(recommendation) {
    try {
      // Log the action for manual execution
      await this.db.query(`
        INSERT INTO manual_actions (
          tenant_id, recommendation_id, action, description, priority
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        recommendation.tenant_id,
        recommendation.id,
        recommendation.action,
        recommendation.description,
        recommendation.priority
      ]);
      
      return {
        type: 'manual_action',
        action: recommendation.action,
        status: 'queued_for_manual_execution'
      };
    } catch (error) {
      console.error('❌ Generic action execution error:', error);
      throw error;
    }
  }
}

// Supporting service classes (simplified implementations)
class PatternAnalysisService {
  constructor(db) {
    this.db = db;
  }

  async initialize() {
    console.log('🔍 Initializing Pattern Analysis Service');
  }

  async analyzeBusinessPatterns(data, options) {
    // Implementation for pattern analysis
    return {
      revenue: {
        timeSeries: data.revenue.timeSeries,
        trends: data.revenue.trends,
        anomalies: []
      },
      operations: {
        efficiency: data.operations.efficiency,
        bottlenecks: []
      },
      patients: {
        satisfaction: data.patients.satisfaction,
        retention: data.patients.retention
      },
      staff: {
        utilization: data.staff.utilization,
        performance: data.staff.performance
      },
      marketing: {
        campaigns: data.marketing.campaigns,
        effectiveness: data.marketing.effectiveness
      }
    };
  }
}

class RecommendationService {
  constructor(db) {
    this.db = db;
  }

  async generateBaseRecommendations(insight) {
    // Implementation for generating base recommendations
    return [
      {
        type: 'optimization',
        title: 'Optimize based on insight',
        description: 'Implement changes based on the identified insight',
        expectedImpact: 'medium',
        implementationDifficulty: 'medium'
      }
    ];
  }
}

class BenchmarkingService {
  constructor(db) {
    this.db = db;
  }

  async updatePerformanceBenchmarks() {
    console.log('📊 Updating performance benchmarks');
  }
}

class AlertManagementService {
  constructor(db) {
    this.db = db;
  }

  async initialize() {
    console.log('🚨 Initializing Alert Management Service');
  }
}

class PerformanceTrackingService {
  constructor(db) {
    this.db = db;
  }
}

module.exports = { IntelligentInsightsEngine }; 