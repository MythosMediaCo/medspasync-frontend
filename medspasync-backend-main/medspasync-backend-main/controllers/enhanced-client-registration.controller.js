/**
 * Enhanced Client Registration Controller
 * Integrates autonomous registration engine with subscription gating
 * Implements HIPAA compliance and production-validated performance
 */

const AutonomousRegistrationEngine = require('../services/autonomous-registration-engine.service');
const EnhancedSubscriptionGatingService = require('../services/enhanced-subscription-gating.service');
const { PrismaClient } = require('@prisma/client');

class EnhancedClientRegistrationController {
  constructor() {
    this.prisma = new PrismaClient();
    this.autonomousEngine = new AutonomousRegistrationEngine();
    this.subscriptionGating = new EnhancedSubscriptionGatingService();
    
    console.log('🎯 Enhanced Client Registration Controller initialized');
  }

  /**
   * Register new client with autonomous routing
   */
  async registerClient(req, res) {
    const startTime = performance.now();
    
    try {
      const { tenantId } = req.user;
      const registrationData = req.body;
      const context = {
        source: req.headers['x-registration-source'] || 'web',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.headers['x-session-id'],
        tenantId
      };

      // Validate required fields
      const validation = this.validateRegistrationData(registrationData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.message,
          missingFields: validation.missingFields
        });
      }

      // Process registration with autonomous engine
      const result = await this.autonomousEngine.processRegistration(
        tenantId,
        registrationData,
        context
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message || 'Registration failed',
          upgradeRequired: result.upgradeRequired,
          processingTime: result.processingTime
        });
      }

      // Return success response
      return res.status(201).json({
        success: true,
        clientId: result.clientId,
        autonomous: result.autonomous,
        confidence: result.confidence,
        biasScore: result.biasScore,
        processingTime: result.processingTime,
        routingDecision: result.routingDecision,
        nextSteps: result.nextSteps,
        status: result.status || 'APPROVED',
        message: result.autonomous 
          ? 'Client registered successfully with autonomous processing'
          : 'Client registration submitted for human review'
      });

    } catch (error) {
      console.error('❌ Client registration error:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during registration',
        processingTime: performance.now() - startTime
      });
    }
  }

  /**
   * Get client registration status
   */
  async getRegistrationStatus(req, res) {
    try {
      const { clientId } = req.params;
      const { tenantId } = req.user;

      const client = await this.prisma.client.findFirst({
        where: {
          id: clientId,
          tenantId
        },
        select: {
          id: true,
          registrationStatus: true,
          autonomousRegistration: true,
          confidenceScore: true,
          biasScore: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'CLIENT_NOT_FOUND',
          message: 'Client not found'
        });
      }

      return res.json({
        success: true,
        clientId: client.id,
        status: client.registrationStatus,
        autonomous: client.autonomousRegistration,
        confidence: client.confidenceScore,
        biasScore: client.biasScore,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      });

    } catch (error) {
      console.error('❌ Get registration status error:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve registration status'
      });
    }
  }

  /**
   * Get registration analytics for tenant
   */
  async getRegistrationAnalytics(req, res) {
    try {
      const { tenantId } = req.user;
      const { period = '30d' } = req.query;

      // Get registration metrics
      const metrics = await this.getRegistrationMetrics(tenantId, period);
      
      // Get autonomous decision metrics
      const autonomousMetrics = await this.autonomousEngine.getPerformanceMetrics();
      
      // Get subscription usage
      const usage = await this.subscriptionGating.getCurrentUsage(tenantId);

      return res.json({
        success: true,
        metrics: {
          ...metrics,
          autonomous: autonomousMetrics,
          usage
        }
      });

    } catch (error) {
      console.error('❌ Get analytics error:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve analytics'
      });
    }
  }

  /**
   * Pre-validate registration data
   */
  async preValidateRegistration(req, res) {
    try {
      const { tenantId } = req.user;
      const registrationData = req.body;

      // Validate subscription access
      const accessValidation = await this.subscriptionGating.validateAccess(
        tenantId,
        'client_registration'
      );

      if (!accessValidation.hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'SUBSCRIPTION_LIMIT_EXCEEDED',
          message: 'Client registration requires active subscription',
          upgradeRequired: accessValidation.suggestedTier,
          currentTier: accessValidation.currentTier
        });
      }

      // Validate registration data
      const validation = this.validateRegistrationData(registrationData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.message,
          missingFields: validation.missingFields
        });
      }

      // Get confidence score prediction
      const features = await this.autonomousEngine.extractFeatures(registrationData, { tenantId });
      const prediction = await this.autonomousEngine.mlModelInference(features, tenantId);

      return res.json({
        success: true,
        canProcess: true,
        confidence: prediction.confidence,
        autonomous: prediction.confidence >= 0.808,
        suggestedActions: prediction.prediction.suggestedActions,
        subscription: {
          tier: accessValidation.tier,
          limits: accessValidation.limits,
          currentUsage: accessValidation.currentUsage
        }
      });

    } catch (error) {
      console.error('❌ Pre-validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Pre-validation failed'
      });
    }
  }

  /**
   * Get subscription tier information
   */
  async getSubscriptionInfo(req, res) {
    try {
      const { tenantId } = req.user;

      const subscription = await this.subscriptionGating.getActiveSubscription(tenantId);
      const usage = await this.subscriptionGating.getCurrentUsage(tenantId);
      const tierConfig = subscription 
        ? this.subscriptionGating.getSubscriptionTier(subscription.subscriptionTier)
        : null;

      return res.json({
        success: true,
        subscription: {
          status: subscription?.subscriptionStatus || 'INACTIVE',
          tier: subscription?.subscriptionTier || 'CORE',
          tierConfig,
          usage,
          limits: tierConfig?.limits || {}
        }
      });

    } catch (error) {
      console.error('❌ Get subscription info error:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve subscription information'
      });
    }
  }

  /**
   * Validate registration data
   */
  validateRegistrationData(data) {
    const requiredFields = [
      'firstName',
      'lastName', 
      'email',
      'phone',
      'dateOfBirth',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelation',
      'hipaaConsent',
      'privacyPolicy'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        message: 'Required fields are missing',
        missingFields
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        valid: false,
        message: 'Invalid email format',
        missingFields: ['email']
      };
    }

    // Validate phone format
    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (!phoneRegex.test(data.phone)) {
      return {
        valid: false,
        message: 'Invalid phone number format',
        missingFields: ['phone']
      };
    }

    // Validate date of birth
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13 || age > 120) {
      return {
        valid: false,
        message: 'Invalid date of birth',
        missingFields: ['dateOfBirth']
      };
    }

    // Validate consents
    if (!data.hipaaConsent || !data.privacyPolicy) {
      return {
        valid: false,
        message: 'HIPAA consent and privacy policy acceptance required',
        missingFields: ['hipaaConsent', 'privacyPolicy']
      };
    }

    return {
      valid: true,
      message: 'Validation successful'
    };
  }

  /**
   * Get registration metrics for tenant
   */
  async getRegistrationMetrics(tenantId, period) {
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const metrics = await this.prisma.client.groupBy({
      by: ['registrationStatus', 'autonomousRegistration'],
      where: {
        tenantId,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    const totalRegistrations = metrics.reduce((sum, m) => sum + m._count.id, 0);
    const autonomousRegistrations = metrics
      .filter(m => m.autonomousRegistration)
      .reduce((sum, m) => sum + m._count.id, 0);

    return {
      totalRegistrations,
      autonomousRegistrations,
      autonomousRate: totalRegistrations > 0 ? autonomousRegistrations / totalRegistrations : 0,
      period,
      breakdown: metrics.map(m => ({
        status: m.registrationStatus,
        autonomous: m.autonomousRegistration,
        count: m._count.id
      }))
    };
  }

  /**
   * Cleanup method
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}

module.exports = EnhancedClientRegistrationController; 