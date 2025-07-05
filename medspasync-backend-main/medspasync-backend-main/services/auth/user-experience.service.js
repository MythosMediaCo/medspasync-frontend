/**
 * User Experience Service for MedSpaSync Pro
 * Handles onboarding, intelligent defaults, contextual help, and session optimization
 */

const { PrismaClient } = require('@prisma/client');
const redis = require('redis');
const { promisify } = require('util');

class UserExperienceService {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    });
    
    this.redisGet = promisify(this.redis.get).bind(this.redis);
    this.redisSetex = promisify(this.redis.setex).bind(this.redis);
    this.redisDel = promisify(this.redis.del).bind(this.redis);
  }

  /**
   * Progressive onboarding system
   */
  async createOnboardingPlan(user, organizationType) {
    try {
      const plan = {
        steps: this.generateOnboardingSteps(user.role, organizationType),
        estimatedTime: this.calculateOnboardingTime(user.role),
        personalizedContent: await this.generatePersonalizedContent(user),
        progressTracking: true,
        completionRewards: this.getCompletionRewards(user.role)
      };

      // Quality of life: Save progress for later continuation
      await this.redisSetex(
        `onboarding:${user.id}`,
        86400 * 7, // 1 week
        JSON.stringify(plan)
      );

      return plan;
    } catch (error) {
      console.error('Onboarding plan creation error:', error);
      throw error;
    }
  }

  /**
   * Generate onboarding steps based on user role and organization type
   */
  generateOnboardingSteps(role, organizationType) {
    const baseSteps = [
      {
        id: 'welcome',
        title: 'Welcome to MedSpaSync Pro',
        description: 'Get started with your personalized setup',
        duration: 2,
        required: true,
        completed: false
      },
      {
        id: 'profile-setup',
        title: 'Complete Your Profile',
        description: 'Set up your personal information and preferences',
        duration: 3,
        required: true,
        completed: false
      }
    ];

    const roleSpecificSteps = this.getRoleSpecificSteps(role);
    const organizationSteps = this.getOrganizationSteps(organizationType);

    return [...baseSteps, ...roleSpecificSteps, ...organizationSteps];
  }

  /**
   * Get role-specific onboarding steps
   */
  getRoleSpecificSteps(role) {
    const roleSteps = {
      'SPA_OWNER': [
        {
          id: 'business-setup',
          title: 'Configure Your Business',
          description: 'Set up your spa details, services, and pricing',
          duration: 10,
          required: true,
          completed: false
        },
        {
          id: 'team-invitation',
          title: 'Invite Your Team',
          description: 'Add staff members and assign roles',
          duration: 5,
          required: false,
          completed: false
        },
        {
          id: 'integrations',
          title: 'Connect Your Systems',
          description: 'Integrate with your existing POS and booking systems',
          duration: 8,
          required: false,
          completed: false
        }
      ],
      'SPA_MANAGER': [
        {
          id: 'staff-management',
          title: 'Staff Management Setup',
          description: 'Learn how to manage your team and schedules',
          duration: 8,
          required: true,
          completed: false
        },
        {
          id: 'operational-reports',
          title: 'Understanding Reports',
          description: 'Learn to read and use operational reports',
          duration: 6,
          required: true,
          completed: false
        }
      ],
      'FRONT_DESK_STAFF': [
        {
          id: 'appointment-basics',
          title: 'Appointment Management',
          description: 'Learn to book, modify, and manage appointments',
          duration: 7,
          required: true,
          completed: false
        },
        {
          id: 'patient-checkin',
          title: 'Patient Check-in Process',
          description: 'Master the patient check-in workflow',
          duration: 5,
          required: true,
          completed: false
        },
        {
          id: 'payment-processing',
          title: 'Payment Processing',
          description: 'Learn to process payments and handle refunds',
          duration: 6,
          required: true,
          completed: false
        }
      ],
      'MEDICAL_PROVIDER': [
        {
          id: 'clinical-workflow',
          title: 'Clinical Workflow Setup',
          description: 'Configure your clinical documentation workflow',
          duration: 8,
          required: true,
          completed: false
        },
        {
          id: 'patient-records',
          title: 'Patient Records Management',
          description: 'Learn to manage patient records and notes',
          duration: 6,
          required: true,
          completed: false
        },
        {
          id: 'treatment-plans',
          title: 'Treatment Plan Creation',
          description: 'Create and manage treatment plans',
          duration: 7,
          required: true,
          completed: false
        }
      ],
      'AESTHETICIAN': [
        {
          id: 'treatment-protocols',
          title: 'Treatment Protocols',
          description: 'Set up your treatment protocols and templates',
          duration: 6,
          required: true,
          completed: false
        },
        {
          id: 'product-management',
          title: 'Product Recommendations',
          description: 'Learn to manage product recommendations',
          duration: 5,
          required: true,
          completed: false
        }
      ]
    };

    return roleSteps[role] || [];
  }

  /**
   * Get organization-specific onboarding steps
   */
  getOrganizationSteps(organizationType) {
    const orgSteps = {
      'single-location': [
        {
          id: 'location-setup',
          title: 'Location Configuration',
          description: 'Configure your spa location and settings',
          duration: 4,
          required: true,
          completed: false
        }
      ],
      'multi-location': [
        {
          id: 'multi-location-setup',
          title: 'Multi-Location Setup',
          description: 'Configure multiple locations and staff assignments',
          duration: 8,
          required: true,
          completed: false
        },
        {
          id: 'cross-location-reports',
          title: 'Cross-Location Reporting',
          description: 'Learn to view and manage reports across locations',
          duration: 6,
          required: true,
          completed: false
        }
      ],
      'franchise': [
        {
          id: 'franchise-setup',
          title: 'Franchise Configuration',
          description: 'Set up franchise-specific settings and branding',
          duration: 10,
          required: true,
          completed: false
        },
        {
          id: 'franchise-compliance',
          title: 'Franchise Compliance',
          description: 'Understand franchise compliance requirements',
          duration: 8,
          required: true,
          completed: false
        }
      ]
    };

    return orgSteps[organizationType] || [];
  }

  /**
   * Calculate estimated onboarding time
   */
  calculateOnboardingTime(role) {
    const roleTimes = {
      'SPA_OWNER': 25,
      'SPA_MANAGER': 20,
      'FRONT_DESK_SUPERVISOR': 18,
      'FRONT_DESK_STAFF': 15,
      'MEDICAL_PROVIDER': 21,
      'AESTHETICIAN': 16
    };

    return roleTimes[role] || 20;
  }

  /**
   * Generate personalized content based on user context
   */
  async generatePersonalizedContent(user) {
    const content = {
      welcomeMessage: this.generateWelcomeMessage(user),
      tips: await this.getPersonalizedTips(user),
      tutorials: await this.getRelevantTutorials(user.role),
      shortcuts: this.getRoleSpecificShortcuts(user.role)
    };

    return content;
  }

  /**
   * Generate personalized welcome message
   */
  generateWelcomeMessage(user) {
    const timeOfDay = new Date().getHours();
    let greeting = 'Good morning';
    
    if (timeOfDay >= 12 && timeOfDay < 17) {
      greeting = 'Good afternoon';
    } else if (timeOfDay >= 17) {
      greeting = 'Good evening';
    }

    const roleMessages = {
      'SPA_OWNER': `${greeting}! Let's get your medical spa running smoothly with MedSpaSync Pro.`,
      'SPA_MANAGER': `${greeting}! Ready to streamline your spa operations?`,
      'FRONT_DESK_STAFF': `${greeting}! Let's make your front desk workflow effortless.`,
      'MEDICAL_PROVIDER': `${greeting}! Time to optimize your clinical workflow.`,
      'AESTHETICIAN': `${greeting}! Let's enhance your treatment delivery.`
    };

    return roleMessages[user.role] || `${greeting}! Welcome to MedSpaSync Pro.`;
  }

  /**
   * Get personalized tips based on user role and context
   */
  async getPersonalizedTips(user) {
    const baseTips = [
      'Use keyboard shortcuts to work faster',
      'Set up your dashboard for quick access to common tasks',
      'Enable notifications to stay updated'
    ];

    const roleTips = {
      'SPA_OWNER': [
        'Review financial reports weekly to track performance',
        'Set up automated billing to reduce manual work',
        'Use the team management features to delegate tasks'
      ],
      'FRONT_DESK_STAFF': [
        'Use the quick check-in feature for faster patient processing',
        'Set up payment shortcuts for common services',
        'Enable appointment reminders to reduce no-shows'
      ],
      'MEDICAL_PROVIDER': [
        'Use voice notes for faster documentation',
        'Set up treatment templates for common procedures',
        'Enable photo capture for before/after documentation'
      ]
    };

    return [...baseTips, ...(roleTips[user.role] || [])];
  }

  /**
   * Get role-specific shortcuts
   */
  getRoleSpecificShortcuts(role) {
    const shortcuts = {
      'SPA_OWNER': [
        { key: 'Ctrl+1', action: 'Financial Dashboard' },
        { key: 'Ctrl+2', action: 'Team Management' },
        { key: 'Ctrl+3', action: 'System Settings' }
      ],
      'FRONT_DESK_STAFF': [
        { key: 'Ctrl+1', action: 'Quick Check-in' },
        { key: 'Ctrl+2', action: 'New Appointment' },
        { key: 'Ctrl+3', action: 'Process Payment' }
      ],
      'MEDICAL_PROVIDER': [
        { key: 'Ctrl+1', action: 'Patient Notes' },
        { key: 'Ctrl+2', action: 'Take Photo' },
        { key: 'Ctrl+3', action: 'Treatment Plan' }
      ]
    };

    return shortcuts[role] || [];
  }

  /**
   * Smart default configuration
   */
  async applyIntelligentDefaults(userId, contextHints) {
    try {
      const defaults = await this.calculateIntelligentDefaults(contextHints);
      
      // Dashboard layout based on role
      await this.setUserPreference(userId, 'dashboard.layout', defaults.dashboardLayout);
      
      // Notification preferences based on role and location type
      await this.setUserPreference(userId, 'notifications', defaults.notifications);
      
      // Mobile app configuration
      if (contextHints.primaryDevice === 'mobile') {
        await this.setUserPreference(userId, 'mobile.quickActions', defaults.mobileQuickActions);
      }

      // Quality of life: Set up tutorial progress tracking
      await this.initializeTutorialProgress(userId, defaults.recommendedTutorials);

      return { success: true, appliedDefaults: defaults };
    } catch (error) {
      console.error('Intelligent defaults application error:', error);
      throw error;
    }
  }

  /**
   * Calculate intelligent defaults based on context
   */
  async calculateIntelligentDefaults(contextHints) {
    const { role, organizationType, primaryDevice, locationType } = contextHints;

    const defaults = {
      dashboardLayout: this.getDefaultDashboardLayout(role),
      notifications: this.getDefaultNotifications(role, organizationType),
      mobileQuickActions: this.getDefaultMobileQuickActions(role),
      recommendedTutorials: this.getRecommendedTutorials(role)
    };

    // Adjust based on device type
    if (primaryDevice === 'mobile') {
      defaults.dashboardLayout = 'mobile-optimized';
    } else if (primaryDevice === 'tablet') {
      defaults.dashboardLayout = 'tablet-optimized';
    }

    // Adjust based on location type
    if (locationType === 'medical') {
      defaults.notifications.hipaaAlerts = true;
    }

    return defaults;
  }

  /**
   * Get default dashboard layout for role
   */
  getDefaultDashboardLayout(role) {
    const layouts = {
      'SPA_OWNER': 'executive',
      'SPA_MANAGER': 'management',
      'FRONT_DESK_STAFF': 'operational',
      'MEDICAL_PROVIDER': 'clinical',
      'AESTHETICIAN': 'clinical'
    };

    return layouts[role] || 'operational';
  }

  /**
   * Get default notification preferences
   */
  getDefaultNotifications(role, organizationType) {
    const baseNotifications = {
      email: true,
      push: true,
      sms: false,
      hipaaAlerts: false
    };

    const roleNotifications = {
      'SPA_OWNER': {
        ...baseNotifications,
        financialAlerts: true,
        systemAlerts: true
      },
      'SPA_MANAGER': {
        ...baseNotifications,
        staffAlerts: true,
        operationalAlerts: true
      },
      'FRONT_DESK_STAFF': {
        ...baseNotifications,
        appointmentReminders: true,
        paymentAlerts: true
      },
      'MEDICAL_PROVIDER': {
        ...baseNotifications,
        patientAlerts: true,
        clinicalAlerts: true
      }
    };

    return roleNotifications[role] || baseNotifications;
  }

  /**
   * Get default mobile quick actions
   */
  getDefaultMobileQuickActions(role) {
    const actions = {
      'FRONT_DESK_STAFF': ['quick-checkin', 'payment-shortcuts', 'common-services'],
      'MEDICAL_PROVIDER': ['voice-notes', 'photo-capture', 'quick-templates'],
      'AESTHETICIAN': ['treatment-notes', 'before-after-photos', 'product-recommendations']
    };

    return actions[role] || [];
  }

  /**
   * Get recommended tutorials for role
   */
  getRecommendedTutorials(role) {
    const tutorials = {
      'SPA_OWNER': ['financial-management', 'team-setup', 'system-configuration'],
      'FRONT_DESK_STAFF': ['appointment-basics', 'patient-checkin', 'payment-processing'],
      'MEDICAL_PROVIDER': ['clinical-workflow', 'patient-records', 'treatment-plans']
    };

    return tutorials[role] || ['getting-started'];
  }

  /**
   * Contextual help system
   */
  async getContextualHelp(userId, currentPage, userAction) {
    try {
      const user = await this.getUserWithContext(userId);
      const helpContent = await this.generateContextualHelp(user, currentPage, userAction);
      
      // Quality of life: Track help engagement to improve content
      await this.trackHelpEngagement(userId, currentPage, helpContent.id);
      
      return {
        content: helpContent,
        relatedArticles: await this.getRelatedHelpArticles(helpContent.tags),
        videoTutorials: await this.getRelevantVideoTutorials(user.role, currentPage),
        contactSupport: this.getSupportOptions(user.subscriptionTier)
      };
    } catch (error) {
      console.error('Contextual help error:', error);
      throw error;
    }
  }

  /**
   * Generate contextual help content
   */
  async generateContextualHelp(user, currentPage, userAction) {
    const helpContent = {
      id: `${currentPage}-${userAction || 'general'}`,
      title: this.getHelpTitle(currentPage, userAction),
      content: await this.getHelpContent(currentPage, userAction, user.role),
      tags: this.getHelpTags(currentPage, userAction),
      difficulty: this.getHelpDifficulty(user.role, currentPage)
    };

    return helpContent;
  }

  /**
   * Get help title based on page and action
   */
  getHelpTitle(currentPage, userAction) {
    const titles = {
      'dashboard': 'Dashboard Overview',
      'appointments': userAction === 'create' ? 'Creating Appointments' : 'Managing Appointments',
      'patients': userAction === 'checkin' ? 'Patient Check-in Process' : 'Patient Management',
      'payments': 'Payment Processing',
      'reports': 'Understanding Reports',
      'settings': 'System Configuration'
    };

    return titles[currentPage] || 'Getting Help';
  }

  /**
   * Get help content based on context
   */
  async getHelpContent(currentPage, userAction, role) {
    // In a real implementation, this would fetch from a help content database
    const content = {
      'dashboard': 'Your dashboard provides quick access to your most important tasks and recent activity.',
      'appointments': 'Manage appointments, check availability, and handle scheduling conflicts.',
      'patients': 'Access patient records, manage check-ins, and track patient history.',
      'payments': 'Process payments, handle refunds, and manage billing.',
      'reports': 'Generate and view reports to track performance and trends.',
      'settings': 'Configure system settings, user preferences, and integrations.'
    };

    return content[currentPage] || 'Need help? Contact support for assistance.';
  }

  /**
   * Get help tags for related content
   */
  getHelpTags(currentPage, userAction) {
    const tags = [currentPage];
    if (userAction) tags.push(userAction);
    return tags;
  }

  /**
   * Get help difficulty level
   */
  getHelpDifficulty(role, currentPage) {
    const difficulties = {
      'SPA_OWNER': 'intermediate',
      'SPA_MANAGER': 'intermediate',
      'FRONT_DESK_STAFF': 'beginner',
      'MEDICAL_PROVIDER': 'intermediate',
      'AESTHETICIAN': 'beginner'
    };

    return difficulties[role] || 'beginner';
  }

  /**
   * Session experience optimization
   */
  async optimizeSessionExperience(userId, sessionData) {
    try {
      const userPatterns = await this.getUserBehaviorPatterns(userId);
      
      return {
        // Intelligent session duration based on usage patterns
        sessionDuration: this.calculateOptimalSessionDuration(userPatterns),
        
        // Preload likely-to-be-accessed data
        preloadSuggestions: this.generatePreloadSuggestions(userPatterns, sessionData),
        
        // Optimize UI based on user preferences and device
        uiOptimizations: await this.generateUIOptimizations(userId, sessionData.deviceInfo),
        
        // Quality of life: Restore previous session state
        sessionRestore: await this.generateSessionRestoreData(userId)
      };
    } catch (error) {
      console.error('Session optimization error:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal session duration
   */
  calculateOptimalSessionDuration(userPatterns) {
    const baseDuration = 3600; // 1 hour
    const averageSessionLength = userPatterns.averageSessionLength || 30; // minutes
    
    // Extend session for users with longer average sessions
    if (averageSessionLength > 45) {
      return baseDuration * 1.5; // 1.5 hours
    } else if (averageSessionLength > 30) {
      return baseDuration * 1.25; // 1.25 hours
    }
    
    return baseDuration;
  }

  /**
   * Generate preload suggestions
   */
  generatePreloadSuggestions(userPatterns, sessionData) {
    const suggestions = [];
    
    // Preload frequently accessed data
    if (userPatterns.frequentlyAccessedPages?.includes('appointments')) {
      suggestions.push('today-appointments');
    }
    
    if (userPatterns.frequentlyAccessedPages?.includes('patients')) {
      suggestions.push('recent-patients');
    }
    
    // Preload based on time of day
    const hour = new Date().getHours();
    if (hour >= 8 && hour <= 12) {
      suggestions.push('morning-reports');
    } else if (hour >= 16 && hour <= 20) {
      suggestions.push('evening-summary');
    }
    
    return suggestions;
  }

  /**
   * Generate UI optimizations
   */
  async generateUIOptimizations(userId, deviceInfo) {
    const user = await this.getUserWithContext(userId);
    const preferences = await this.getUserPreferences(userId);
    
    const optimizations = {
      theme: preferences.theme || 'light',
      fontSize: deviceInfo.isMobile ? 'medium' : 'normal',
      layout: deviceInfo.isMobile ? 'mobile-optimized' : preferences.dashboard.layout,
      quickActions: preferences.dashboard.quickActions || []
    };
    
    // Mobile-specific optimizations
    if (deviceInfo.isMobile) {
      optimizations.touchTargets = 'large';
      optimizations.oneHandedMode = preferences.mobile.oneHandedMode || false;
    }
    
    return optimizations;
  }

  /**
   * Generate session restore data
   */
  async generateSessionRestoreData(userId) {
    const lastSession = await this.redisGet(`last-session:${userId}`);
    
    if (lastSession) {
      return JSON.parse(lastSession);
    }
    
    return {
      lastPage: '/dashboard',
      lastAction: null,
      openTabs: []
    };
  }

  // Helper methods
  async getUserWithContext(userId) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: { practice: true }
    });
  }

  async getUserPreferences(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });
    
    return user?.preferences || {};
  }

  async setUserPreference(userId, key, value) {
    const preferences = await this.getUserPreferences(userId);
    const keys = key.split('.');
    let current = preferences;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences }
    });
  }

  async initializeTutorialProgress(userId, tutorials) {
    const progress = tutorials.reduce((acc, tutorial) => {
      acc[tutorial] = { completed: false, progress: 0 };
      return acc;
    }, {});
    
    await this.redisSetex(`tutorial-progress:${userId}`, 86400 * 30, JSON.stringify(progress));
  }

  async trackHelpEngagement(userId, page, helpId) {
    const engagement = {
      userId,
      page,
      helpId,
      timestamp: Date.now()
    };
    
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'HELP_ENGAGEMENT',
        details: engagement,
        timestamp: new Date()
      }
    });
  }

  async getRelatedHelpArticles(tags) {
    // In a real implementation, this would fetch from a help content database
    return [];
  }

  async getRelevantVideoTutorials(role, page) {
    // In a real implementation, this would fetch from a tutorial database
    return [];
  }

  getSupportOptions(subscriptionTier) {
    const supportOptions = {
      'starter': ['email', 'chat'],
      'professional': ['email', 'chat', 'phone'],
      'enterprise': ['email', 'chat', 'phone', 'dedicated']
    };
    
    return supportOptions[subscriptionTier] || ['email'];
  }

  async getUserBehaviorPatterns(userId) {
    // In a real implementation, this would analyze user behavior
    return {
      averageSessionLength: 45,
      frequentlyAccessedPages: ['dashboard', 'appointments', 'patients'],
      typicalUsageTime: 'business-hours'
    };
  }

  getCompletionRewards(role) {
    const rewards = {
      'SPA_OWNER': ['advanced-analytics', 'priority-support'],
      'FRONT_DESK_STAFF': ['quick-action-shortcuts', 'performance-badges'],
      'MEDICAL_PROVIDER': ['clinical-templates', 'voice-notes']
    };
    
    return rewards[role] || ['basic-features'];
  }
}

module.exports = UserExperienceService;
