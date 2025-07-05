const { verifySubscription } = require('../middleware/verifySubscription');
const { isProfessional, isEnterprise } = require('../utils/planHelpers');

/**
 * Subscription gate middleware for reporting features
 * Enforces tier-based access control for reporting capabilities
 */
class SubscriptionGateMiddleware {
  constructor() {
    this.featureGates = {
      // Core tier features ($299/month)
      core: {
        'file-upload': {
          maxFiles: 5,
          maxFileSize: '50MB',
          templates: ['monthly-financial-summary'],
          formats: ['PDF', 'Excel'],
          aiInsights: false,
          realTimeData: false,
          posIntegrations: 0
        },
        'basic-reports': {
          templates: ['monthly-financial-summary'],
          scheduling: false,
          apiAccess: false,
          customTemplates: false
        }
      },
      
      // Professional tier features ($499/month)
      professional: {
        'file-upload': {
          maxFiles: -1, // Unlimited
          maxFileSize: '100MB',
          templates: ['monthly-financial-summary', 'provider-performance-analysis', 'patient-journey-retention', 'inventory-product-analysis'],
          formats: ['PDF', 'Excel', 'Interactive Dashboard'],
          aiInsights: true,
          realTimeData: true,
          posIntegrations: 3
        },
        'advanced-reports': {
          templates: ['monthly-financial-summary', 'provider-performance-analysis', 'patient-journey-retention', 'inventory-product-analysis'],
          scheduling: true,
          apiAccess: false,
          customTemplates: false,
          aiInsights: true,
          realTimeDashboards: true
        },
        'pos-integrations': {
          maxIntegrations: 3,
          realTimeSync: true,
          webhooks: true,
          advancedScheduling: true
        }
      },
      
      // Enterprise tier features ($799/month)
      enterprise: {
        'file-upload': {
          maxFiles: -1, // Unlimited
          maxFileSize: '200MB',
          templates: ['monthly-financial-summary', 'provider-performance-analysis', 'patient-journey-retention', 'inventory-product-analysis', 'hipaa-compliance-audit'],
          formats: ['PDF', 'Excel', 'Interactive Dashboard', 'JSON', 'API'],
          aiInsights: true,
          realTimeData: true,
          posIntegrations: -1 // Unlimited
        },
        'enterprise-reports': {
          templates: ['monthly-financial-summary', 'provider-performance-analysis', 'patient-journey-retention', 'inventory-product-analysis', 'hipaa-compliance-audit'],
          scheduling: true,
          apiAccess: true,
          customTemplates: true,
          aiInsights: true,
          realTimeDashboards: true,
          whiteLabel: true,
          multiLocation: true
        },
        'pos-integrations': {
          maxIntegrations: -1, // Unlimited
          realTimeSync: true,
          webhooks: true,
          advancedScheduling: true,
          customIntegrations: true
        },
        'support': {
          priorityPhone: true,
          dedicatedAccountManager: true,
          customTraining: true,
          sla: '4-hour response'
        }
      }
    };
  }

  /**
   * Middleware to check subscription tier and gate features
   */
  checkSubscriptionTier(feature, subFeature = null) {
    return async (req, res, next) => {
      try {
        // First verify subscription is active
        await verifySubscription(req, res, () => {});

        const tier = req.subscriptionTier || req.user.planType || 'core';
        const tierFeatures = this.featureGates[tier];

        if (!tierFeatures) {
          return res.status(403).json({
            error: 'Invalid subscription tier',
            message: 'Please contact support to resolve subscription issues'
          });
        }

        // Check if feature is available for tier
        if (!tierFeatures[feature]) {
          return res.status(403).json({
            error: 'Feature not available',
            message: `This feature requires a higher subscription tier. Current tier: ${tier}`,
            currentTier: tier,
            requiredTier: this.getRequiredTierForFeature(feature)
          });
        }

        // Check sub-feature if specified
        if (subFeature && !tierFeatures[feature][subFeature]) {
          return res.status(403).json({
            error: 'Sub-feature not available',
            message: `This sub-feature requires a higher subscription tier`,
            currentTier: tier,
            feature,
            subFeature
          });
        }

        // Attach tier limits to request for use in controllers
        req.tierLimits = tierFeatures[feature];
        req.currentTier = tier;

        next();
      } catch (error) {
        console.error('Subscription gate error:', error);
        return res.status(500).json({
          error: 'Subscription verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Middleware to check file upload limits
   */
  checkFileUploadLimits() {
    return async (req, res, next) => {
      try {
        await verifySubscription(req, res, () => {});
        
        const tier = req.subscriptionTier || req.user.planType || 'core';
        const limits = this.featureGates[tier]?.['file-upload'];

        if (!limits) {
          return res.status(403).json({
            error: 'File upload not available',
            message: 'File upload requires a valid subscription'
          });
        }

        // Check file count limit
        const fileCount = req.files ? Object.keys(req.files).length : 0;
        if (limits.maxFiles > 0 && fileCount > limits.maxFiles) {
          return res.status(403).json({
            error: 'File limit exceeded',
            message: `Maximum ${limits.maxFiles} files allowed for ${tier} tier`,
            currentCount: fileCount,
            maxAllowed: limits.maxFiles
          });
        }

        // Check individual file size limits
        if (req.files) {
          for (const [fieldName, files] of Object.entries(req.files)) {
            for (const file of Array.isArray(files) ? files : [files]) {
              const maxSizeBytes = this.parseFileSize(limits.maxFileSize);
              if (file.size > maxSizeBytes) {
                return res.status(403).json({
                  error: 'File size exceeded',
                  message: `Maximum file size is ${limits.maxFileSize} for ${tier} tier`,
                  fileName: file.originalname,
                  fileSize: file.size,
                  maxAllowed: limits.maxFileSize
                });
              }
            }
          }
        }

        req.fileUploadLimits = limits;
        next();
      } catch (error) {
        console.error('File upload limits check error:', error);
        return res.status(500).json({
          error: 'File upload verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Middleware to check report template access
   */
  checkReportTemplateAccess() {
    return async (req, res, next) => {
      try {
        await verifySubscription(req, res, () => {});
        
        const tier = req.subscriptionTier || req.user.planType || 'core';
        const limits = this.featureGates[tier]?.['advanced-reports'] || this.featureGates[tier]?.['basic-reports'];

        if (!limits) {
          return res.status(403).json({
            error: 'Report generation not available',
            message: 'Report generation requires a valid subscription'
          });
        }

        const requestedTemplate = req.body.templateId || req.params.templateId;
        
        if (requestedTemplate && !limits.templates.includes(requestedTemplate)) {
          return res.status(403).json({
            error: 'Template not available',
            message: `Template "${requestedTemplate}" not available for ${tier} tier`,
            availableTemplates: limits.templates,
            currentTier: tier
          });
        }

        req.reportLimits = limits;
        next();
      } catch (error) {
        console.error('Report template access check error:', error);
        return res.status(500).json({
          error: 'Report access verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Middleware to check POS integration limits
   */
  checkPOSIntegrationLimits() {
    return async (req, res, next) => {
      try {
        await verifySubscription(req, res, () => {});
        
        const tier = req.subscriptionTier || req.user.planType || 'core';
        const limits = this.featureGates[tier]?.['pos-integrations'];

        if (!limits) {
          return res.status(403).json({
            error: 'POS integrations not available',
            message: 'POS integrations require Professional or Enterprise tier'
          });
        }

        // Check integration count limit
        const currentIntegrations = req.body.currentIntegrations || 0;
        if (limits.maxIntegrations > 0 && currentIntegrations >= limits.maxIntegrations) {
          return res.status(403).json({
            error: 'Integration limit exceeded',
            message: `Maximum ${limits.maxIntegrations} POS integrations allowed for ${tier} tier`,
            currentCount: currentIntegrations,
            maxAllowed: limits.maxIntegrations
          });
        }

        req.posIntegrationLimits = limits;
        next();
      } catch (error) {
        console.error('POS integration limits check error:', error);
        return res.status(500).json({
          error: 'POS integration verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Middleware to check AI insights access
   */
  checkAIInsightsAccess() {
    return async (req, res, next) => {
      try {
        await verifySubscription(req, res, () => {});
        
        const tier = req.subscriptionTier || req.user.planType || 'core';
        const hasAIInsights = this.featureGates[tier]?.['file-upload']?.aiInsights || 
                             this.featureGates[tier]?.['advanced-reports']?.aiInsights ||
                             this.featureGates[tier]?.['enterprise-reports']?.aiInsights;

        if (!hasAIInsights) {
          return res.status(403).json({
            error: 'AI insights not available',
            message: 'AI insights require Professional or Enterprise tier',
            currentTier: tier,
            requiredTier: 'professional'
          });
        }

        next();
      } catch (error) {
        console.error('AI insights access check error:', error);
        return res.status(500).json({
          error: 'AI insights verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Middleware to check real-time data access
   */
  checkRealTimeDataAccess() {
    return async (req, res, next) => {
      try {
        await verifySubscription(req, res, () => {});
        
        const tier = req.subscriptionTier || req.user.planType || 'core';
        const hasRealTimeData = this.featureGates[tier]?.['file-upload']?.realTimeData ||
                               this.featureGates[tier]?.['advanced-reports']?.realTimeDashboards ||
                               this.featureGates[tier]?.['enterprise-reports']?.realTimeDashboards;

        if (!hasRealTimeData) {
          return res.status(403).json({
            error: 'Real-time data not available',
            message: 'Real-time data requires Professional or Enterprise tier',
            currentTier: tier,
            requiredTier: 'professional'
          });
        }

        next();
      } catch (error) {
        console.error('Real-time data access check error:', error);
        return res.status(500).json({
          error: 'Real-time data verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Get required tier for a specific feature
   */
  getRequiredTierForFeature(feature) {
    for (const [tier, features] of Object.entries(this.featureGates)) {
      if (features[feature]) {
        return tier;
      }
    }
    return 'enterprise'; // Default to highest tier if not found
  }

  /**
   * Parse file size string to bytes
   */
  parseFileSize(sizeString) {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeString.match(/^(\d+)\s*([KMGT]?B)$/i);
    if (!match) return 0;

    const [, size, unit] = match;
    const normalizedUnit = unit.toUpperCase();
    
    return parseInt(size) * (units[normalizedUnit] || 1);
  }

  /**
   * Get feature limits for current tier
   */
  getFeatureLimits(tier, feature) {
    return this.featureGates[tier]?.[feature] || null;
  }

  /**
   * Get upgrade recommendations
   */
  getUpgradeRecommendations(currentTier, requestedFeature) {
    const recommendations = [];
    
    if (currentTier === 'core') {
      if (requestedFeature === 'ai-insights' || requestedFeature === 'real-time-data') {
        recommendations.push({
          tier: 'professional',
          price: '$499/month',
          benefits: [
            'Unlimited file uploads',
            'AI-powered insights',
            'Real-time dashboards',
            'Up to 3 POS integrations',
            'Advanced scheduling'
          ]
        });
      }
    }
    
    if (currentTier === 'professional') {
      if (requestedFeature === 'custom-templates' || requestedFeature === 'api-access') {
        recommendations.push({
          tier: 'enterprise',
          price: '$799/month',
          benefits: [
            'Custom report templates',
            'API access',
            'Multi-location support',
            'White-label options',
            'Priority phone support',
            'Dedicated account management'
          ]
        });
      }
    }

    return recommendations;
  }

  /**
   * Validate subscription upgrade path
   */
  validateUpgradePath(currentTier, targetTier) {
    const validUpgrades = {
      'core': ['professional', 'enterprise'],
      'professional': ['enterprise'],
      'enterprise': []
    };

    return validUpgrades[currentTier]?.includes(targetTier) || false;
  }
}

// Create singleton instance
const subscriptionGateMiddleware = new SubscriptionGateMiddleware();

// Export middleware functions
module.exports = {
  // Core middleware functions
  checkSubscriptionTier: subscriptionGateMiddleware.checkSubscriptionTier.bind(subscriptionGateMiddleware),
  checkFileUploadLimits: subscriptionGateMiddleware.checkFileUploadLimits.bind(subscriptionGateMiddleware),
  checkReportTemplateAccess: subscriptionGateMiddleware.checkReportTemplateAccess.bind(subscriptionGateMiddleware),
  checkPOSIntegrationLimits: subscriptionGateMiddleware.checkPOSIntegrationLimits.bind(subscriptionGateMiddleware),
  checkAIInsightsAccess: subscriptionGateMiddleware.checkAIInsightsAccess.bind(subscriptionGateMiddleware),
  checkRealTimeDataAccess: subscriptionGateMiddleware.checkRealTimeDataAccess.bind(subscriptionGateMiddleware),
  
  // Utility functions
  getFeatureLimits: subscriptionGateMiddleware.getFeatureLimits.bind(subscriptionGateMiddleware),
  getUpgradeRecommendations: subscriptionGateMiddleware.getUpgradeRecommendations.bind(subscriptionGateMiddleware),
  validateUpgradePath: subscriptionGateMiddleware.validateUpgradePath.bind(subscriptionGateMiddleware),
  
  // Export instance for direct access
  subscriptionGateMiddleware
}; 