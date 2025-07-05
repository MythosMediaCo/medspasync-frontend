const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const DemoDataManager = require('./DemoDataManager.js');
const EmailService = require('./EmailService.js');
const logger = require('../utils/logger.js');

const prisma = new PrismaClient();

class AutomatedTrialSystem {
  constructor() {
    this.demoDataManager = new DemoDataManager();
    this.emailService = new EmailService();
    this.trialDuration = 14; // 14 days
  }

  /**
   * Create instant trial account with minimal friction
   */
  async createTrialAccount(trialData) {
    const {
      email,
      practiceName,
      practiceSize = 'medium',
      firstName,
      lastName,
      phone,
      source = 'marketing_site',
      utmData = {}
    } = trialData;

    try {
      // Validate required fields
      if (!email || !practiceName) {
        throw new Error('Email and practice name are required');
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Generate secure password
      const password = this.generateSecurePassword();
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user account
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName: firstName || this.generateFirstName(),
          lastName: lastName || this.generateLastName(),
          phone: phone || null,
          role: 'OWNER',
          status: 'ACTIVE',
          emailVerified: false,
          trialEndDate: new Date(Date.now() + this.trialDuration * 24 * 60 * 60 * 1000),
          source: source,
          utmSource: utmData.utm_source || null,
          utmMedium: utmData.utm_medium || null,
          utmCampaign: utmData.utm_campaign || null,
          utmTerm: utmData.utm_term || null,
          utmContent: utmData.utm_content || null
        }
      });

      // Create practice/tenant
      const practice = await prisma.practice.create({
        data: {
          name: practiceName,
          size: practiceSize,
          status: 'ACTIVE',
          ownerId: user.id,
          settings: {
            trialMode: true,
            practiceSize: practiceSize,
            features: this.getTrialFeatures(practiceSize)
          }
        }
      });

      // Create user practice relationship
      await prisma.userPractice.create({
        data: {
          userId: user.id,
          practiceId: practice.id,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      });

      // Generate and inject demo data
      const demoData = await this.demoDataManager.generateDemoData(practiceSize);
      await this.injectDemoData(practice.id, demoData);

      // Create onboarding progress tracker
      await this.createOnboardingProgress(user.id, practice.id);

      // Send welcome email with credentials
      await this.sendWelcomeEmail(user, password, practice);

      // Track trial creation event
      await this.trackTrialEvent('trial_created', {
        userId: user.id,
        practiceId: practice.id,
        practiceSize,
        source
      });

      logger.info(`Trial account created successfully for ${email}`, {
        userId: user.id,
        practiceId: practice.id,
        practiceSize
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        practice: {
          id: practice.id,
          name: practice.name,
          size: practice.size
        },
        trialEndDate: user.trialEndDate,
        demoDataInjected: true
      };

    } catch (error) {
      logger.error('Failed to create trial account', {
        error: error.message,
        email,
        practiceName
      });
      throw error;
    }
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate random first name for demo purposes
   */
  generateFirstName() {
    const names = [
      'Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Quinn', 'Avery',
      'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper', 'Indigo'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Generate random last name for demo purposes
   */
  generateLastName() {
    const names = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Get trial features based on practice size
   */
  getTrialFeatures(practiceSize) {
    const baseFeatures = [
      'ai_reconciliation',
      'basic_analytics',
      'csv_upload',
      'email_support'
    ];

    const sizeFeatures = {
      small: [...baseFeatures, 'single_location', 'basic_reports'],
      medium: [...baseFeatures, 'multi_location', 'advanced_reports', 'api_access'],
      large: [...baseFeatures, 'multi_location', 'advanced_reports', 'api_access', 'priority_support', 'custom_integrations']
    };

    return sizeFeatures[practiceSize] || sizeFeatures.medium;
  }

  /**
   * Inject demo data into the practice
   */
  async injectDemoData(practiceId, demoData) {
    try {
      // Create demo clients
      const clients = await this.createDemoClients(practiceId, demoData.sampleData);
      
      // Create demo transactions
      const transactions = await this.createDemoTransactions(practiceId, demoData.sampleData, clients);
      
      // Create demo reconciliation history
      await this.createDemoReconciliationHistory(practiceId, demoData.reconciliationHistory);
      
      // Create demo performance metrics
      await this.createDemoPerformanceMetrics(practiceId, demoData.performanceMetrics);

      logger.info(`Demo data injected successfully for practice ${practiceId}`, {
        clientsCount: clients.length,
        transactionsCount: transactions.length
      });

      return true;
    } catch (error) {
      logger.error('Failed to inject demo data', {
        error: error.message,
        practiceId
      });
      throw error;
    }
  }

  /**
   * Create demo clients
   */
  async createDemoClients(practiceId, sampleData) {
    const clients = [];
    const uniqueClientIds = [...new Set(sampleData.map(item => item.clientId))];

    for (const clientId of uniqueClientIds) {
      const client = await prisma.client.create({
        data: {
          practiceId: practiceId,
          externalId: clientId,
          firstName: this.generateFirstName(),
          lastName: this.generateLastName(),
          email: `${clientId.toLowerCase()}@demo.com`,
          phone: this.generatePhoneNumber(),
          status: 'ACTIVE',
          source: 'demo_data',
          metadata: {
            demo: true,
            originalId: clientId
          }
        }
      });
      clients.push(client);
    }

    return clients;
  }

  /**
   * Create demo transactions
   */
  async createDemoTransactions(practiceId, sampleData, clients) {
    const transactions = [];
    const clientMap = new Map(clients.map(client => [client.externalId, client.id]));

    for (const item of sampleData) {
      const clientId = clientMap.get(item.clientId);
      if (!clientId) continue;

      const transaction = await prisma.transaction.create({
        data: {
          practiceId: practiceId,
          clientId: clientId,
          externalId: item.id,
          date: new Date(item.date),
          amount: parseFloat(item.amount),
          service: item.service,
          status: item.status,
          location: item.location,
          provider: item.provider,
          source: 'demo_data',
          metadata: {
            demo: true,
            originalData: item
          }
        }
      });
      transactions.push(transaction);
    }

    return transactions;
  }

  /**
   * Create demo reconciliation history
   */
  async createDemoReconciliationHistory(practiceId, history) {
    for (const record of history) {
      await prisma.reconciliationHistory.create({
        data: {
          practiceId: practiceId,
          date: new Date(record.date),
          transactionsProcessed: record.transactionsProcessed,
          discrepanciesFound: record.discrepanciesFound,
          accuracyRate: parseFloat(record.accuracyRate),
          timeSaved: record.timeSaved,
          revenueRecovered: record.revenueRecovered,
          source: 'demo_data',
          metadata: {
            demo: true,
            originalData: record
          }
        }
      });
    }
  }

  /**
   * Create demo performance metrics
   */
  async createDemoPerformanceMetrics(practiceId, metrics) {
    await prisma.performanceMetrics.create({
      data: {
        practiceId: practiceId,
        averageTransactionValue: parseFloat(metrics.averageTransactionValue),
        monthlySavings: metrics.monthlySavings,
        annualSavings: metrics.annualSavings,
        timeSavedPerMonth: metrics.timeSavedPerMonth,
        accuracyImprovement: metrics.accuracyImprovement,
        revenueRecoveryRate: metrics.revenueRecoveryRate,
        customerSatisfaction: metrics.customerSatisfaction,
        processingSpeed: metrics.processingSpeed,
        source: 'demo_data',
        metadata: {
          demo: true,
          originalData: metrics
        }
      }
    });
  }

  /**
   * Generate phone number for demo purposes
   */
  generatePhoneNumber() {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }

  /**
   * Create onboarding progress tracker
   */
  async createOnboardingProgress(userId, practiceId) {
    await prisma.onboardingProgress.create({
      data: {
        userId: userId,
        practiceId: practiceId,
        currentStep: 1,
        totalSteps: 7,
        completedSteps: [1],
        progress: 14.28, // 1/7 * 100
        startedAt: new Date(),
        lastActivityAt: new Date(),
        status: 'IN_PROGRESS',
        steps: {
          1: { name: 'Account Created', completed: true, completedAt: new Date() },
          2: { name: 'Upload First File', completed: false },
          3: { name: 'Review Results', completed: false },
          4: { name: 'Configure Settings', completed: false },
          5: { name: 'Invite Team Members', completed: false },
          6: { name: 'Set Up Integrations', completed: false },
          7: { name: 'Complete Onboarding', completed: false }
        }
      }
    });
  }

  /**
   * Send welcome email with credentials
   */
  async sendWelcomeEmail(user, password, practice) {
    try {
      const emailData = {
        to: user.email,
        subject: 'Welcome to MedSpaSync Pro - Your Trial is Ready!',
        template: 'welcome-trial',
        data: {
          firstName: user.firstName,
          practiceName: practice.name,
          email: user.email,
          password: password,
          trialEndDate: user.trialEndDate,
          loginUrl: `${process.env.FRONTEND_URL}/login`,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          supportEmail: 'support@medspasync.com'
        }
      };

      await this.emailService.sendEmail(emailData);
      
      logger.info('Welcome email sent successfully', {
        userId: user.id,
        email: user.email
      });
    } catch (error) {
      logger.error('Failed to send welcome email', {
        error: error.message,
        userId: user.id,
        email: user.email
      });
      // Don't throw error - email failure shouldn't break trial creation
    }
  }

  /**
   * Track trial events for analytics
   */
  async trackTrialEvent(eventType, eventData) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: eventType,
          eventData: eventData,
          timestamp: new Date(),
          source: 'trial_system'
        }
      });
    } catch (error) {
      logger.error('Failed to track trial event', {
        error: error.message,
        eventType,
        eventData
      });
      // Don't throw error - analytics failure shouldn't break trial creation
    }
  }

  /**
   * Convert trial to paid account
   */
  async convertTrialToPaid(userId, practiceId, subscriptionData) {
    try {
      // Update user trial status
      await prisma.user.update({
        where: { id: userId },
        data: {
          trialEndDate: null,
          subscriptionStatus: 'ACTIVE',
          subscriptionData: subscriptionData
        }
      });

      // Update practice settings
      await prisma.practice.update({
        where: { id: practiceId },
        data: {
          settings: {
            trialMode: false,
            subscriptionPlan: subscriptionData.plan,
            billingCycle: subscriptionData.billingCycle
          }
        }
      });

      // Track conversion event
      await this.trackTrialEvent('trial_converted', {
        userId,
        practiceId,
        subscriptionData
      });

      logger.info('Trial converted to paid successfully', {
        userId,
        practiceId,
        subscriptionData
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to convert trial to paid', {
        error: error.message,
        userId,
        practiceId
      });
      throw error;
    }
  }

  /**
   * Extend trial period
   */
  async extendTrial(userId, days = 7) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const newTrialEndDate = new Date(user.trialEndDate);
      newTrialEndDate.setDate(newTrialEndDate.getDate() + days);

      await prisma.user.update({
        where: { id: userId },
        data: {
          trialEndDate: newTrialEndDate
        }
      });

      // Track extension event
      await this.trackTrialEvent('trial_extended', {
        userId,
        originalEndDate: user.trialEndDate,
        newEndDate: newTrialEndDate,
        extensionDays: days
      });

      logger.info('Trial extended successfully', {
        userId,
        originalEndDate: user.trialEndDate,
        newEndDate: newTrialEndDate
      });

      return { success: true, newTrialEndDate };
    } catch (error) {
      logger.error('Failed to extend trial', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get trial statistics
   */
  async getTrialStats() {
    try {
      const stats = await prisma.$transaction([
        // Total trial users
        prisma.user.count({
          where: {
            trialEndDate: { not: null },
            status: 'ACTIVE'
          }
        }),
        // Trials created today
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
            trialEndDate: { not: null }
          }
        }),
        // Trials expiring in 3 days
        prisma.user.count({
          where: {
            trialEndDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            },
            status: 'ACTIVE'
          }
        }),
        // Conversion rate (last 30 days)
        prisma.user.count({
          where: {
            trialEndDate: null,
            subscriptionStatus: 'ACTIVE',
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        totalTrials: stats[0],
        trialsCreatedToday: stats[1],
        trialsExpiringSoon: stats[2],
        conversionsLast30Days: stats[3],
        conversionRate: stats[0] > 0 ? (stats[3] / stats[0] * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error('Failed to get trial stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Clean up expired trials
   */
  async cleanupExpiredTrials() {
    try {
      const expiredUsers = await prisma.user.findMany({
        where: {
          trialEndDate: {
            lt: new Date()
          },
          subscriptionStatus: null,
          status: 'ACTIVE'
        },
        include: {
          practices: true
        }
      });

      for (const user of expiredUsers) {
        // Update user status
        await prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'TRIAL_EXPIRED',
            trialEndDate: null
          }
        });

        // Update practice status
        for (const practice of user.practices) {
          await prisma.practice.update({
            where: { id: practice.id },
            data: {
              status: 'TRIAL_EXPIRED'
            }
          });
        }

        // Send expiration email
        await this.sendTrialExpirationEmail(user);

        // Track expiration event
        await this.trackTrialEvent('trial_expired', {
          userId: user.id,
          practiceIds: user.practices.map(p => p.id)
        });
      }

      logger.info(`Cleaned up ${expiredUsers.length} expired trials`);
      return { processed: expiredUsers.length };
    } catch (error) {
      logger.error('Failed to cleanup expired trials', { error: error.message });
      throw error;
    }
  }

  /**
   * Send trial expiration email
   */
  async sendTrialExpirationEmail(user) {
    try {
      const emailData = {
        to: user.email,
        subject: 'Your MedSpaSync Pro Trial Has Expired',
        template: 'trial-expired',
        data: {
          firstName: user.firstName,
          email: user.email,
          upgradeUrl: `${process.env.FRONTEND_URL}/upgrade`,
          supportEmail: 'support@medspasync.com'
        }
      };

      await this.emailService.sendEmail(emailData);
    } catch (error) {
      logger.error('Failed to send trial expiration email', {
        error: error.message,
        userId: user.id
      });
    }
  }
}

module.exports = AutomatedTrialSystem; 