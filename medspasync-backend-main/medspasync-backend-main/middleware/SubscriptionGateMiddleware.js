/**
 * Subscription Gate Middleware
 * Enforces subscription tier-based feature gating for MedSpaSync Pro
 * Controls access to file uploads, report templates, POS integrations, AI insights, and real-time data
 */

const { PrismaClient } = require('@prisma/client');

class SubscriptionGateMiddleware {
  constructor() {
    this.prisma = new PrismaClient();
    
    // Define tier limits and features
    this.tierConfig = {
      core: {
        maxFiles: 5,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        templates: ['Monthly Financial Summary'],
        formats: ['PDF', 'Excel'],
        aiInsights: false,
        realTimeData: false,
        posIntegrations: 0,
        scheduledReports: 0,
        dataRetention: 30, // days
        supportLevel: 'email'
      },
      professional: {
        maxFiles: -1, // Unlimited
        maxFileSize: 100 * 1024 * 1024, // 100MB
        templates: [
          'Monthly Financial Summary',
          'Provider Performance Analysis',
          'Patient Journey & Retention',
          'Inventory & Product Analysis',
          'Custom Templates'
        ],
        formats: ['PDF', 'Excel', 'Interactive Dashboard', 'JSON'],
        aiInsights: true,
        realTimeData: true,
        posIntegrations: 3,
        scheduledReports: 10,
        dataRetention: 365, // days
        supportLevel: 'priority'
      }
    };
  }

  /**
   * Check file upload limits based on subscription tier
   */
  checkFileUploadLimits() {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const tenantId = req.user.practiceId;
        
        // Get user's subscription tier
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            practice: {
              include: {
                subscription: true
              }
            }
          }
        });

        if (!user || !user.practice?.subscription) {
          return res.status(403).json({
            error: 'Subscription required',
            message: 'Active subscription required for file uploads'
          });
        }

        const tier = user.practice.subscription.tier || 'core';
        const limits = this.tierConfig[tier];

        if (!limits) {
          return res.status(403).json({
            error: 'Invalid subscription tier',
            message: 'Please contact support to resolve subscription issues'
          });
        }

        // Check file count limits
        if (limits.maxFiles > 0) {
          const currentFileCount = await this.prisma.fileProcessingJob.count({
            where: {
              userId,
              tenantId,
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          });

          if (currentFileCount >= limits.maxFiles) {
            return res.status(403).json({
              error: 'File limit exceeded',
              message: `Maximum ${limits.maxFiles} files per month for ${tier} tier. Upgrade to Professional for unlimited files.`
            });
          }
        }

        // Check file size limits
        if (req.files) {
          for (const file of req.files) {
            if (file.size > limits.maxFileSize) {
              return res.status(413).json({
                error: 'File too large',
                message: `Maximum file size is ${this.formatBytes(limits.maxFileSize)} for ${tier} tier. Upgrade to Professional for larger files.`
              });
            }
          }
        }

        // Add tier info to request for downstream use
        req.userTier = tier;
        req.tierLimits = limits;

        next();
      } catch (error) {
        console.error('Subscription gate error:', error);
        res.status(500).json({
          error: 'Subscription verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Check report template access based on subscription tier
   */
  checkReportTemplateAccess() {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const { templateId } = req.body;

        // Get user's subscription tier
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            practice: {
              include: {
                subscription: true
              }
            }
          }
        });

        if (!user || !user.practice?.subscription) {
          return res.status(403).json({
            error: 'Subscription required',
            message: 'Active subscription required for report generation'
          });
        }

        const tier = user.practice.subscription.tier || 'core';
        const limits = this.tierConfig[tier];

        // Get template details
        const template = await this.prisma.reportTemplate.findUnique({
          where: { id: templateId }
        });

        if (!template) {
          return res.status(404).json({
            error: 'Template not found',
            message: 'The specified report template does not exist'
          });
        }

        // Check if template is available for user's tier
        if (!limits.templates.includes(template.name) && template.name !== 'Custom Templates') {
          return res.status(403).json({
            error: 'Template not available',
            message: `This template is not available for ${tier} tier. Upgrade to Professional for access to all templates.`
          });
        }

        // Check AI insights access
        if (template.requiresAIInsights && !limits.aiInsights) {
          return res.status(403).json({
            error: 'AI insights not available',
            message: 'AI-powered insights require Professional tier. Upgrade to access advanced analytics.'
          });
        }

        req.userTier = tier;
        req.tierLimits = limits;
        req.template = template;

        next();
      } catch (error) {
        console.error('Template access check error:', error);
        res.status(500).json({
          error: 'Template access verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Check POS integration limits based on subscription tier
   */
  checkPOSIntegrationLimits() {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const tenantId = req.user.practiceId;

        // Get user's subscription tier
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            practice: {
              include: {
                subscription: true
              }
            }
          }
        });

        if (!user || !user.practice?.subscription) {
          return res.status(403).json({
            error: 'Subscription required',
            message: 'Active subscription required for POS integrations'
          });
        }

        const tier = user.practice.subscription.tier || 'core';
        const limits = this.tierConfig[tier];

        // Check if POS integrations are available for this tier
        if (limits.posIntegrations === 0) {
          return res.status(403).json({
            error: 'POS integrations not available',
            message: 'POS integrations require Professional tier. Upgrade to connect your point-of-sale systems.'
          });
        }

        // Check current integration count
        const currentIntegrations = await this.prisma.pOSIntegration.count({
          where: { tenantId }
        });

        if (limits.posIntegrations > 0 && currentIntegrations >= limits.posIntegrations) {
          return res.status(403).json({
            error: 'Integration limit exceeded',
            message: `Maximum ${limits.posIntegrations} POS integrations for ${tier} tier. Upgrade to Professional for more integrations.`
          });
        }

        req.userTier = tier;
        req.tierLimits = limits;

        next();
      } catch (error) {
        console.error('POS integration check error:', error);
        res.status(500).json({
          error: 'Integration verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Check subscription tier for specific features
   */
  checkSubscriptionTier(feature, operation = 'access') {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;

        // Get user's subscription tier
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            practice: {
              include: {
                subscription: true
              }
            }
          }
        });

        if (!user || !user.practice?.subscription) {
          return res.status(403).json({
            error: 'Subscription required',
            message: `Active subscription required for ${feature}`
          });
        }

        const tier = user.practice.subscription.tier || 'core';
        const limits = this.tierConfig[tier];

        // Check feature availability based on tier
        const featureChecks = {
          'ai-insights': () => limits.aiInsights,
          'real-time-data': () => limits.realTimeData,
          'advanced-reports': () => tier === 'professional',
          'scheduling': () => limits.scheduledReports > 0,
          'custom-templates': () => limits.templates.includes('Custom Templates'),
          'interactive-dashboards': () => limits.formats.includes('Interactive Dashboard'),
          'priority-support': () => limits.supportLevel === 'priority'
        };

        const checkFunction = featureChecks[feature];
        if (!checkFunction) {
          return res.status(400).json({
            error: 'Invalid feature',
            message: 'The specified feature is not recognized'
          });
        }

        if (!checkFunction()) {
          const upgradeMessage = this.getUpgradeMessage(feature, tier);
          return res.status(403).json({
            error: 'Feature not available',
            message: upgradeMessage
          });
        }

        req.userTier = tier;
        req.tierLimits = limits;

        next();
      } catch (error) {
        console.error('Feature access check error:', error);
        res.status(500).json({
          error: 'Feature access verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Check data retention and cleanup based on subscription tier
   */
  checkDataRetention() {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const tenantId = req.user.practiceId;

        // Get user's subscription tier
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            practice: {
              include: {
                subscription: true
              }
            }
          }
        });

        if (!user || !user.practice?.subscription) {
          return res.status(403).json({
            error: 'Subscription required',
            message: 'Active subscription required for data access'
          });
        }

        const tier = user.practice.subscription.tier || 'core';
        const limits = this.tierConfig[tier];

        // Check if data is within retention period
        const retentionDate = new Date(Date.now() - limits.dataRetention * 24 * 60 * 60 * 1000);

        // Add retention info to request
        req.dataRetention = {
          tier,
          retentionDays: limits.dataRetention,
          retentionDate,
          cutoffDate: retentionDate
        };

        next();
      } catch (error) {
        console.error('Data retention check error:', error);
        res.status(500).json({
          error: 'Data retention verification failed',
          message: 'Please try again or contact support'
        });
      }
    };
  }

  /**
   * Get upgrade message for specific features
   */
  getUpgradeMessage(feature, currentTier) {
    const messages = {
      'ai-insights': 'AI-powered insights require Professional tier. Upgrade to access advanced analytics and recommendations.',
      'real-time-data': 'Real-time data synchronization requires Professional tier. Upgrade for live data updates.',
      'advanced-reports': 'Advanced reporting features require Professional tier. Upgrade to access all report templates and formats.',
      'scheduling': 'Scheduled reports require Professional tier. Upgrade to automate report generation and delivery.',
      'custom-templates': 'Custom report templates require Professional tier. Upgrade to create personalized reports.',
      'interactive-dashboards': 'Interactive dashboards require Professional tier. Upgrade for dynamic data visualization.',
      'priority-support': 'Priority support requires Professional tier. Upgrade for faster response times and dedicated assistance.'
    };

    return messages[feature] || 'This feature requires Professional tier. Upgrade to access all features.';
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get tier information for client
   */
  async getTierInfo(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          practice: {
            include: {
              subscription: true
            }
          }
        }
      });

      if (!user || !user.practice?.subscription) {
        return {
          tier: 'core',
          limits: this.tierConfig.core,
          active: false
        };
      }

      const tier = user.practice.subscription.tier || 'core';
      return {
        tier,
        limits: this.tierConfig[tier],
        active: true,
        subscription: user.practice.subscription
      };
    } catch (error) {
      console.error('Get tier info error:', error);
      return {
        tier: 'core',
        limits: this.tierConfig.core,
        active: false
      };
    }
  }

  /**
   * Validate subscription status
   */
  async validateSubscription(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          practice: {
            include: {
              subscription: true
            }
          }
        }
      });

      if (!user || !user.practice?.subscription) {
        return {
          valid: false,
          message: 'No active subscription found'
        };
      }

      const subscription = user.practice.subscription;
      const now = new Date();

      // Check if subscription is active
      if (subscription.status !== 'active') {
        return {
          valid: false,
          message: `Subscription is ${subscription.status}`
        };
      }

      // Check if subscription has expired
      if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < now) {
        return {
          valid: false,
          message: 'Subscription has expired'
        };
      }

      return {
        valid: true,
        tier: subscription.tier || 'core',
        limits: this.tierConfig[subscription.tier || 'core']
      };
    } catch (error) {
      console.error('Validate subscription error:', error);
      return {
        valid: false,
        message: 'Subscription validation failed'
      };
    }
  }
}

module.exports = SubscriptionGateMiddleware; 