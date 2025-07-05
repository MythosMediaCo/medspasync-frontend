const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CustomerSuccessAutomation {
  constructor() {
    this.interventionThresholds = {
      lowEngagement: 0.3,
      churnRisk: 0.7,
      expansionOpportunity: 0.8,
      successMilestone: 0.9
    };
    
    this.milestoneDefinitions = {
      onboarding: [
        { id: 'first-upload', title: 'First Upload', description: 'Complete first data upload', weight: 0.2 },
        { id: 'first-reconciliation', title: 'First Reconciliation', description: 'Process first reconciliation', weight: 0.3 },
        { id: 'dashboard-exploration', title: 'Dashboard Exploration', description: 'Explore dashboard features', weight: 0.2 },
        { id: 'first-insights', title: 'First Insights', description: 'View first AI insights', weight: 0.3 }
      ],
      adoption: [
        { id: 'weekly-usage', title: 'Weekly Usage', description: 'Use platform for 7 consecutive days', weight: 0.4 },
        { id: 'feature-adoption', title: 'Feature Adoption', description: 'Use 3+ core features', weight: 0.3 },
        { id: 'data-import', title: 'Data Import', description: 'Import data from multiple sources', weight: 0.3 }
      ],
      value: [
        { id: 'time-saved', title: 'Time Saved', description: 'Save 10+ hours of manual work', weight: 0.4 },
        { id: 'revenue-recovered', title: 'Revenue Recovered', description: 'Recover $1,000+ in lost revenue', weight: 0.4 },
        { id: 'accuracy-improvement', title: 'Accuracy Improvement', description: 'Achieve 95%+ reconciliation accuracy', weight: 0.2 }
      ]
    };
  }

  // Calculate customer health score
  async calculateHealthScore(userId, practiceId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          practice: {
            include: {
              usageMetrics: true,
              reconciliationData: true,
              supportTickets: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const healthFactors = await this.analyzeHealthFactors(user);
      const healthScore = this.computeHealthScore(healthFactors);

      // Update health score in database
      await prisma.customerHealth.upsert({
        where: { userId },
        update: {
          score: healthScore,
          factors: healthFactors,
          lastCalculated: new Date()
        },
        create: {
          userId,
          practiceId,
          score: healthScore,
          factors: healthFactors,
          lastCalculated: new Date()
        }
      });

      return {
        score: healthScore,
        factors: healthFactors,
        riskLevel: this.getRiskLevel(healthScore),
        recommendations: this.generateRecommendations(healthFactors)
      };
    } catch (error) {
      console.error('Error calculating health score:', error);
      throw error;
    }
  }

  // Analyze health factors
  async analyzeHealthFactors(user) {
    const practice = user.practice;
    const usageMetrics = practice.usageMetrics;
    const reconciliationData = practice.reconciliationData;
    const supportTickets = practice.supportTickets;

    const factors = {
      engagement: this.calculateEngagementScore(usageMetrics),
      adoption: this.calculateAdoptionScore(usageMetrics),
      value: this.calculateValueScore(reconciliationData),
      support: this.calculateSupportScore(supportTickets),
      retention: this.calculateRetentionScore(user, practice)
    };

    return factors;
  }

  // Calculate engagement score
  calculateEngagementScore(usageMetrics) {
    if (!usageMetrics || usageMetrics.length === 0) return 0;

    const recentMetrics = usageMetrics.filter(metric => 
      new Date(metric.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentMetrics.length === 0) return 0;

    const avgDailyUsage = recentMetrics.reduce((sum, metric) => sum + metric.dailyUsage, 0) / recentMetrics.length;
    const avgSessionDuration = recentMetrics.reduce((sum, metric) => sum + metric.sessionDuration, 0) / recentMetrics.length;
    const featureUsage = recentMetrics.reduce((sum, metric) => sum + metric.featuresUsed, 0) / recentMetrics.length;

    const engagementScore = (
      (avgDailyUsage / 24) * 0.4 +
      (avgSessionDuration / 3600) * 0.3 +
      (featureUsage / 10) * 0.3
    );

    return Math.min(1, Math.max(0, engagementScore));
  }

  // Calculate adoption score
  calculateAdoptionScore(usageMetrics) {
    if (!usageMetrics || usageMetrics.length === 0) return 0;

    const coreFeatures = ['upload', 'reconciliation', 'analytics', 'reports'];
    const adoptedFeatures = coreFeatures.filter(feature => {
      return usageMetrics.some(metric => metric.featuresUsed.includes(feature));
    });

    const adoptionRate = adoptedFeatures.length / coreFeatures.length;
    const usageConsistency = this.calculateUsageConsistency(usageMetrics);

    return (adoptionRate * 0.6) + (usageConsistency * 0.4);
  }

  // Calculate value score
  calculateValueScore(reconciliationData) {
    if (!reconciliationData || reconciliationData.length === 0) return 0;

    const totalTransactions = reconciliationData.reduce((sum, data) => sum + data.totalTransactions, 0);
    const accuracyRate = reconciliationData.reduce((sum, data) => sum + data.accuracy, 0) / reconciliationData.length;
    const timeSaved = reconciliationData.reduce((sum, data) => sum + data.timeSaved, 0);
    const revenueRecovered = reconciliationData.reduce((sum, data) => sum + data.revenueRecovered, 0);

    const valueScore = (
      (accuracyRate / 100) * 0.3 +
      Math.min(timeSaved / 100, 1) * 0.3 +
      Math.min(revenueRecovered / 10000, 1) * 0.4
    );

    return Math.min(1, Math.max(0, valueScore));
  }

  // Calculate support score
  calculateSupportScore(supportTickets) {
    if (!supportTickets || supportTickets.length === 0) return 1; // No tickets = good

    const recentTickets = supportTickets.filter(ticket => 
      new Date(ticket.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentTickets.length === 0) return 1;

    const resolvedTickets = recentTickets.filter(ticket => ticket.status === 'resolved');
    const avgResolutionTime = resolvedTickets.reduce((sum, ticket) => {
      const resolutionTime = new Date(ticket.resolvedAt) - new Date(ticket.createdAt);
      return sum + resolutionTime;
    }, 0) / resolvedTickets.length;

    const resolutionRate = resolvedTickets.length / recentTickets.length;
    const satisfactionScore = resolvedTickets.reduce((sum, ticket) => sum + (ticket.satisfactionRating || 3), 0) / resolvedTickets.length;

    const supportScore = (
      resolutionRate * 0.4 +
      (satisfactionScore / 5) * 0.3 +
      Math.max(0, 1 - (avgResolutionTime / (24 * 60 * 60 * 1000))) * 0.3
    );

    return Math.min(1, Math.max(0, supportScore));
  }

  // Calculate retention score
  calculateRetentionScore(user, practice) {
    const daysSinceSignup = (new Date() - new Date(user.createdAt)) / (24 * 60 * 60 * 1000);
    const lastActivity = practice.usageMetrics.length > 0 ? 
      new Date(Math.max(...practice.usageMetrics.map(m => new Date(m.date)))) : 
      new Date(user.createdAt);
    
    const daysSinceLastActivity = (new Date() - lastActivity) / (24 * 60 * 60 * 1000);

    const retentionScore = Math.max(0, 1 - (daysSinceLastActivity / 30));
    return Math.min(1, retentionScore);
  }

  // Calculate usage consistency
  calculateUsageConsistency(usageMetrics) {
    if (!usageMetrics || usageMetrics.length < 7) return 0;

    const recentMetrics = usageMetrics.slice(-7);
    const usageDays = recentMetrics.filter(metric => metric.dailyUsage > 0).length;
    return usageDays / 7;
  }

  // Compute overall health score
  computeHealthScore(factors) {
    const weights = {
      engagement: 0.25,
      adoption: 0.25,
      value: 0.25,
      support: 0.15,
      retention: 0.10
    };

    const healthScore = Object.keys(factors).reduce((score, factor) => {
      return score + (factors[factor] * weights[factor]);
    }, 0);

    return Math.min(1, Math.max(0, healthScore));
  }

  // Get risk level based on health score
  getRiskLevel(healthScore) {
    if (healthScore >= 0.8) return 'excellent';
    if (healthScore >= 0.6) return 'good';
    if (healthScore >= 0.4) return 'fair';
    if (healthScore >= 0.2) return 'poor';
    return 'critical';
  }

  // Generate recommendations based on health factors
  generateRecommendations(factors) {
    const recommendations = [];

    if (factors.engagement < 0.5) {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        title: 'Increase Platform Engagement',
        description: 'Your team could benefit from more regular platform usage',
        actions: [
          'Schedule daily reconciliation sessions',
          'Explore advanced analytics features',
          'Set up automated data imports'
        ]
      });
    }

    if (factors.adoption < 0.6) {
      recommendations.push({
        type: 'adoption',
        priority: 'medium',
        title: 'Expand Feature Usage',
        description: 'Unlock more value by using additional features',
        actions: [
          'Try the advanced reporting module',
          'Set up automated reconciliation workflows',
          'Explore the API integration options'
        ]
      });
    }

    if (factors.value < 0.5) {
      recommendations.push({
        type: 'value',
        priority: 'high',
        title: 'Optimize Value Realization',
        description: 'Maximize your ROI by improving reconciliation processes',
        actions: [
          'Review and optimize data import processes',
          'Analyze reconciliation accuracy trends',
          'Implement suggested workflow improvements'
        ]
      });
    }

    if (factors.support < 0.7) {
      recommendations.push({
        type: 'support',
        priority: 'medium',
        title: 'Improve Support Experience',
        description: 'Address any outstanding support issues',
        actions: [
          'Review and resolve open support tickets',
          'Schedule a training session',
          'Explore self-service resources'
        ]
      });
    }

    return recommendations;
  }

  // Track success milestones
  async trackMilestones(userId, practiceId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          practice: {
            include: {
              usageMetrics: true,
              reconciliationData: true,
              milestones: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const achievedMilestones = [];
      const allMilestones = this.getAllMilestones();

      for (const milestone of allMilestones) {
        const isAchieved = await this.checkMilestoneAchievement(user, milestone);
        
        if (isAchieved) {
          const existingMilestone = user.practice.milestones.find(m => m.milestoneId === milestone.id);
          
          if (!existingMilestone) {
            const newMilestone = await prisma.milestone.create({
              data: {
                userId,
                practiceId,
                milestoneId: milestone.id,
                title: milestone.title,
                description: milestone.description,
                category: milestone.category,
                achievedAt: new Date(),
                reward: milestone.reward
              }
            });
            
            achievedMilestones.push(newMilestone);
            
            // Trigger milestone celebration
            await this.triggerMilestoneCelebration(user, newMilestone);
          }
        }
      }

      return achievedMilestones;
    } catch (error) {
      console.error('Error tracking milestones:', error);
      throw error;
    }
  }

  // Get all milestone definitions
  getAllMilestones() {
    const allMilestones = [];
    
    Object.keys(this.milestoneDefinitions).forEach(category => {
      this.milestoneDefinitions[category].forEach(milestone => {
        allMilestones.push({
          ...milestone,
          category
        });
      });
    });
    
    return allMilestones;
  }

  // Check if milestone is achieved
  async checkMilestoneAchievement(user, milestone) {
    const practice = user.practice;
    
    switch (milestone.id) {
      case 'first-upload':
        return practice.reconciliationData.length > 0;
      
      case 'first-reconciliation':
        return practice.reconciliationData.some(data => data.status === 'completed');
      
      case 'dashboard-exploration':
        return practice.usageMetrics.some(metric => metric.featuresUsed.includes('dashboard'));
      
      case 'first-insights':
        return practice.reconciliationData.some(data => data.insightsGenerated);
      
      case 'weekly-usage':
        const recentUsage = practice.usageMetrics.filter(metric => 
          new Date(metric.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        return recentUsage.length >= 7;
      
      case 'feature-adoption':
        const usedFeatures = new Set();
        practice.usageMetrics.forEach(metric => {
          metric.featuresUsed.forEach(feature => usedFeatures.add(feature));
        });
        return usedFeatures.size >= 3;
      
      case 'time-saved':
        const totalTimeSaved = practice.reconciliationData.reduce((sum, data) => sum + data.timeSaved, 0);
        return totalTimeSaved >= 10;
      
      case 'revenue-recovered':
        const totalRevenueRecovered = practice.reconciliationData.reduce((sum, data) => sum + data.revenueRecovered, 0);
        return totalRevenueRecovered >= 1000;
      
      case 'accuracy-improvement':
        const avgAccuracy = practice.reconciliationData.reduce((sum, data) => sum + data.accuracy, 0) / practice.reconciliationData.length;
        return avgAccuracy >= 95;
      
      default:
        return false;
    }
  }

  // Trigger milestone celebration
  async triggerMilestoneCelebration(user, milestone) {
    try {
      // Create celebration notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'milestone_achieved',
          title: 'Milestone Achieved! 🎉',
          message: `Congratulations! You've achieved: ${milestone.title}`,
          data: {
            milestoneId: milestone.id,
            reward: milestone.reward,
            achievedAt: milestone.achievedAt
          },
          isRead: false
        }
      });

      // Send celebration email
      await this.sendCelebrationEmail(user, milestone);

      // Update user progress
      await prisma.userProgress.upsert({
        where: { userId: user.id },
        update: {
          milestonesAchieved: {
            increment: 1
          },
          lastMilestoneAt: new Date()
        },
        create: {
          userId: user.id,
          milestonesAchieved: 1,
          lastMilestoneAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error triggering milestone celebration:', error);
    }
  }

  // Send celebration email
  async sendCelebrationEmail(user, milestone) {
    try {
      const emailData = {
        to: user.email,
        subject: `🎉 Milestone Achieved: ${milestone.title}`,
        template: 'milestone-celebration',
        data: {
          userName: user.name,
          milestoneTitle: milestone.title,
          milestoneDescription: milestone.description,
          reward: milestone.reward,
          achievedAt: milestone.achievedAt
        }
      };

      // In production, integrate with email service
      console.log('Sending celebration email:', emailData);
      
    } catch (error) {
      console.error('Error sending celebration email:', error);
    }
  }

  // Trigger interventions based on health score
  async triggerInterventions(userId, practiceId) {
    try {
      const healthData = await this.calculateHealthScore(userId, practiceId);
      const interventions = [];

      // Low engagement intervention
      if (healthData.factors.engagement < this.interventionThresholds.lowEngagement) {
        const intervention = await this.createIntervention(userId, 'low_engagement', {
          priority: 'high',
          title: 'Boost Your Engagement',
          description: 'We noticed you could benefit from more regular platform usage',
          actions: [
            'Schedule a personalized onboarding session',
            'Set up automated data imports',
            'Explore advanced features with our team'
          ]
        });
        interventions.push(intervention);
      }

      // Churn risk intervention
      if (healthData.score < this.interventionThresholds.churnRisk) {
        const intervention = await this.createIntervention(userId, 'churn_risk', {
          priority: 'critical',
          title: 'Let\'s Keep You on Track',
          description: 'We want to ensure you\'re getting maximum value from MedSpaSync Pro',
          actions: [
            'Schedule a success review call',
            'Identify and resolve any blockers',
            'Create a personalized success plan'
          ]
        });
        interventions.push(intervention);
      }

      // Expansion opportunity
      if (healthData.score > this.interventionThresholds.expansionOpportunity) {
        const intervention = await this.createIntervention(userId, 'expansion_opportunity', {
          priority: 'medium',
          title: 'Ready for More?',
          description: 'You\'re doing great! Let\'s explore advanced features',
          actions: [
            'Upgrade to premium features',
            'Explore enterprise integrations',
            'Schedule a growth consultation'
          ]
        });
        interventions.push(intervention);
      }

      return interventions;
    } catch (error) {
      console.error('Error triggering interventions:', error);
      throw error;
    }
  }

  // Create intervention
  async createIntervention(userId, type, data) {
    try {
      const intervention = await prisma.intervention.create({
        data: {
          userId,
          type,
          priority: data.priority,
          title: data.title,
          description: data.description,
          actions: data.actions,
          status: 'active',
          createdAt: new Date()
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'intervention',
          title: data.title,
          message: data.description,
          data: {
            interventionId: intervention.id,
            actions: data.actions
          },
          isRead: false
        }
      });

      return intervention;
    } catch (error) {
      console.error('Error creating intervention:', error);
      throw error;
    }
  }

  // Run automated retention campaigns
  async runRetentionCampaigns() {
    try {
      const atRiskUsers = await this.identifyAtRiskUsers();
      
      for (const user of atRiskUsers) {
        await this.executeRetentionCampaign(user);
      }

      return {
        processed: atRiskUsers.length,
        campaigns: atRiskUsers.map(user => ({
          userId: user.id,
          email: user.email,
          riskLevel: user.riskLevel
        }))
      };
    } catch (error) {
      console.error('Error running retention campaigns:', error);
      throw error;
    }
  }

  // Identify at-risk users
  async identifyAtRiskUsers() {
    try {
      const users = await prisma.user.findMany({
        include: {
          practice: {
            include: {
              usageMetrics: true
            }
          },
          customerHealth: true
        }
      });

      const atRiskUsers = [];

      for (const user of users) {
        const healthData = await this.calculateHealthScore(user.id, user.practice.id);
        
        if (healthData.score < 0.4) {
          atRiskUsers.push({
            ...user,
            riskLevel: healthData.riskLevel
          });
        }
      }

      return atRiskUsers;
    } catch (error) {
      console.error('Error identifying at-risk users:', error);
      throw error;
    }
  }

  // Execute retention campaign for user
  async executeRetentionCampaign(user) {
    try {
      const campaignData = {
        userId: user.id,
        email: user.email,
        riskLevel: user.riskLevel,
        personalizedMessage: this.generatePersonalizedMessage(user),
        offers: this.generateRetentionOffers(user)
      };

      // Send retention email
      await this.sendRetentionEmail(campaignData);

      // Create retention campaign record
      await prisma.retentionCampaign.create({
        data: {
          userId: user.id,
          type: 'automated',
          riskLevel: user.riskLevel,
          message: campaignData.personalizedMessage,
          offers: campaignData.offers,
          sentAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error executing retention campaign:', error);
    }
  }

  // Generate personalized retention message
  generatePersonalizedMessage(user) {
    const healthData = user.customerHealth;
    
    if (healthData.score < 0.2) {
      return `Hi ${user.name}, we miss you! Let's get you back on track with MedSpaSync Pro.`;
    } else if (healthData.score < 0.4) {
      return `Hi ${user.name}, we want to ensure you're getting the most out of MedSpaSync Pro.`;
    } else {
      return `Hi ${user.name}, let's optimize your MedSpaSync Pro experience!`;
    }
  }

  // Generate retention offers
  generateRetentionOffers(user) {
    const offers = [];
    
    if (user.riskLevel === 'critical') {
      offers.push({
        type: 'discount',
        value: 50,
        description: '50% off next month'
      });
    }
    
    offers.push({
      type: 'support',
      value: 'free_consultation',
      description: 'Free success consultation'
    });
    
    return offers;
  }

  // Send retention email
  async sendRetentionEmail(campaignData) {
    try {
      const emailData = {
        to: campaignData.email,
        subject: 'Let\'s Get You Back on Track',
        template: 'retention-campaign',
        data: {
          userName: campaignData.userName,
          message: campaignData.personalizedMessage,
          offers: campaignData.offers
        }
      };

      // In production, integrate with email service
      console.log('Sending retention email:', emailData);
      
    } catch (error) {
      console.error('Error sending retention email:', error);
    }
  }

  // Get customer success analytics
  async getSuccessAnalytics() {
    try {
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: {
          practice: {
            usageMetrics: {
              some: {
                date: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      });

      const healthScores = await prisma.customerHealth.findMany({
        select: { score: true }
      });

      const avgHealthScore = healthScores.reduce((sum, health) => sum + health.score, 0) / healthScores.length;

      const milestones = await prisma.milestone.count();
      const interventions = await prisma.intervention.count({
        where: { status: 'active' }
      });

      return {
        totalUsers,
        activeUsers,
        activationRate: activeUsers / totalUsers,
        avgHealthScore,
        totalMilestones: milestones,
        activeInterventions: interventions
      };
    } catch (error) {
      console.error('Error getting success analytics:', error);
      throw error;
    }
  }
}

module.exports = CustomerSuccessAutomation; 