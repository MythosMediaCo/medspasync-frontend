/**
 * Enhanced Registration Service for MedSpaSync Pro
 * Provides frictionless onboarding with intelligent defaults and quality-of-life features
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const redis = require('redis');
const { promisify } = require('util');

class EnhancedRegistrationService {
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
   * One-click organizational setup with intelligent defaults
   */
  async setupOrganization(organizationData) {
    try {
      const {
        spaType,
        spaName,
        ownerEmail,
        ownerName,
        locationCount,
        existingSystems,
        staffCount
      } = organizationData;

      // Auto-detect spa type if not provided
      const detectedType = spaType || await this.detectSpaType(organizationData);
      
      // Create practice with intelligent defaults
      const practice = await this.prisma.practice.create({
        data: {
          name: spaName,
          type: detectedType,
          size: this.calculateSpaSize(locationCount, staffCount),
          services: this.getDefaultServices(detectedType),
          settings: this.getDefaultSettings(detectedType),
          integrations: this.detectIntegrations(existingSystems)
        }
      });

      // Create owner account with enhanced permissions
      const owner = await this.createOwnerAccount(ownerEmail, ownerName, practice.id);

      // Apply intelligent defaults based on spa type
      await this.applyIntelligentDefaults(practice.id, detectedType, organizationData);

      // Quality of life: Set up bulk staff import if provided
      if (organizationData.staffList) {
        await this.bulkImportStaff(practice.id, organizationData.staffList);
      }

      return {
        success: true,
        practice,
        owner,
        setupComplete: true,
        nextSteps: this.getNextSteps(detectedType)
      };

    } catch (error) {
      console.error('Organization setup error:', error);
      throw error;
    }
  }

  /**
   * Auto-detect spa type from organization data
   */
  async detectSpaType(organizationData) {
    const { locationCount, staffCount, existingSystems, spaName } = organizationData;
    
    // Analyze spa name for type indicators
    const nameIndicators = this.analyzeSpaName(spaName);
    
    // Analyze existing systems for type indicators
    const systemIndicators = this.analyzeExistingSystems(existingSystems);
    
    // Determine type based on indicators
    if (locationCount > 5 || nameIndicators.includes('franchise') || systemIndicators.includes('franchise')) {
      return 'franchise';
    } else if (locationCount > 1 || nameIndicators.includes('chain') || systemIndicators.includes('multi-location')) {
      return 'multi-location';
    } else {
      return 'single-location';
    }
  }

  /**
   * Analyze spa name for type indicators
   */
  analyzeSpaName(spaName) {
    const indicators = [];
    const lowerName = spaName.toLowerCase();
    
    if (lowerName.includes('franchise') || lowerName.includes('franchising')) {
      indicators.push('franchise');
    }
    if (lowerName.includes('chain') || lowerName.includes('group')) {
      indicators.push('chain');
    }
    if (lowerName.includes('medical') || lowerName.includes('clinic')) {
      indicators.push('medical');
    }
    if (lowerName.includes('aesthetic') || lowerName.includes('beauty')) {
      indicators.push('aesthetic');
    }
    
    return indicators;
  }

  /**
   * Analyze existing systems for type indicators
   */
  analyzeExistingSystems(systems) {
    const indicators = [];
    
    if (!systems || systems.length === 0) return indicators;
    
    // Check for enterprise-level systems
    const enterpriseSystems = ['zenoti', 'mindbody', 'vagaro', 'boulevard'];
    const hasEnterpriseSystem = systems.some(system => 
      enterpriseSystems.some(enterprise => system.toLowerCase().includes(enterprise))
    );
    
    if (hasEnterpriseSystem) {
      indicators.push('multi-location');
    }
    
    // Check for franchise management systems
    const franchiseSystems = ['franchise', 'corporate', 'headquarters'];
    const hasFranchiseSystem = systems.some(system => 
      franchiseSystems.some(franchise => system.toLowerCase().includes(franchise))
    );
    
    if (hasFranchiseSystem) {
      indicators.push('franchise');
    }
    
    return indicators;
  }

  /**
   * Calculate spa size based on locations and staff
   */
  calculateSpaSize(locationCount, staffCount) {
    const totalStaff = staffCount || 0;
    
    if (locationCount > 10 || totalStaff > 50) {
      return 'enterprise';
    } else if (locationCount > 3 || totalStaff > 20) {
      return 'large';
    } else if (locationCount > 1 || totalStaff > 10) {
      return 'medium';
    } else {
      return 'small';
    }
  }

  /**
   * Get default services based on spa type
   */
  getDefaultServices(spaType) {
    const baseServices = [
      { name: 'Consultation', category: 'Consultation', duration: 30, price: 0 },
      { name: 'Follow-up', category: 'Consultation', duration: 15, price: 0 }
    ];

    const medicalServices = [
      { name: 'Botox Treatment', category: 'Injectables', duration: 30, price: 500 },
      { name: 'Dermal Fillers', category: 'Injectables', duration: 45, price: 800 },
      { name: 'Chemical Peel', category: 'Treatments', duration: 60, price: 200 }
    ];

    const aestheticServices = [
      { name: 'Facial', category: 'Treatments', duration: 60, price: 150 },
      { name: 'Microdermabrasion', category: 'Treatments', duration: 45, price: 120 },
      { name: 'LED Therapy', category: 'Treatments', duration: 30, price: 100 }
    ];

    switch (spaType) {
      case 'medical':
        return [...baseServices, ...medicalServices];
      case 'aesthetic':
        return [...baseServices, ...aestheticServices];
      default:
        return [...baseServices, ...medicalServices, ...aestheticServices];
    }
  }

  /**
   * Get default settings based on spa type
   */
  getDefaultSettings(spaType) {
    const baseSettings = {
      appointmentDuration: 60,
      bufferTime: 15,
      cancellationPolicy: '24-hours',
      reminderSettings: {
        email: true,
        sms: true,
        push: false
      }
    };

    const medicalSettings = {
      ...baseSettings,
      hipaaCompliance: true,
      clinicalNotes: true,
      photoConsent: true,
      treatmentPlans: true
    };

    const aestheticSettings = {
      ...baseSettings,
      beforeAfterPhotos: true,
      productRecommendations: true,
      treatmentProtocols: true
    };

    switch (spaType) {
      case 'medical':
        return medicalSettings;
      case 'aesthetic':
        return aestheticSettings;
      default:
        return { ...baseSettings, hipaaCompliance: true };
    }
  }

  /**
   * Detect integrations from existing systems
   */
  detectIntegrations(existingSystems) {
    if (!existingSystems || existingSystems.length === 0) {
      return [];
    }

    const integrations = [];
    const systemMap = {
      'zenoti': 'ZENOTI',
      'mindbody': 'MINDBODY',
      'vagaro': 'VAGARO',
      'boulevard': 'BOULEVARD',
      'alle': 'ALLE',
      'aspire': 'ASPIRE'
    };

    existingSystems.forEach(system => {
      const lowerSystem = system.toLowerCase();
      for (const [key, value] of Object.entries(systemMap)) {
        if (lowerSystem.includes(key)) {
          integrations.push({
            type: value,
            status: 'DETECTED',
            autoConfigure: true
          });
        }
      }
    });

    return integrations;
  }

  /**
   * Create owner account with enhanced permissions
   */
  async createOwnerAccount(email, name, practiceId) {
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || 'Owner';
    
    const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
    
    const owner = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'SPA_OWNER',
        practiceId,
        preferences: this.getOwnerPreferences()
      }
    });

    // Send welcome email with setup instructions
    await this.sendWelcomeEmail(owner, 'owner');

    return owner;
  }

  /**
   * Get owner-specific preferences
   */
  getOwnerPreferences() {
    return {
      dashboard: {
        layout: 'executive',
        defaultLanding: '/dashboard/overview',
        quickActions: ['financial-reports', 'user-management', 'system-settings']
      },
      notifications: {
        email: true,
        push: true,
        sms: false,
        financialAlerts: true,
        systemAlerts: true
      },
      mobile: {
        biometricEnabled: false,
        quickActions: ['financial-overview', 'team-status', 'system-health']
      }
    };
  }

  /**
   * Apply intelligent defaults based on spa type
   */
  async applyIntelligentDefaults(practiceId, spaType, organizationData) {
    // Set up default roles based on spa type
    await this.setupDefaultRoles(practiceId, spaType);
    
    // Configure default workflows
    await this.configureDefaultWorkflows(practiceId, spaType);
    
    // Set up default reports
    await this.setupDefaultReports(practiceId, spaType);
    
    // Configure integrations
    if (organizationData.existingSystems) {
      await this.configureIntegrations(practiceId, organizationData.existingSystems);
    }
  }

  /**
   * Set up default roles based on spa type
   */
  async setupDefaultRoles(practiceId, spaType) {
    const roleTemplates = {
      'single-location': [
        { name: 'SPA_MANAGER', description: 'Practice Manager' },
        { name: 'FRONT_DESK_STAFF', description: 'Front Desk Staff' },
        { name: 'MEDICAL_PROVIDER', description: 'Medical Provider' },
        { name: 'AESTHETICIAN', description: 'Aesthetician' }
      ],
      'multi-location': [
        { name: 'SPA_MANAGER', description: 'Location Manager' },
        { name: 'FRONT_DESK_SUPERVISOR', description: 'Front Desk Supervisor' },
        { name: 'FRONT_DESK_STAFF', description: 'Front Desk Staff' },
        { name: 'MEDICAL_PROVIDER', description: 'Medical Provider' },
        { name: 'AESTHETICIAN', description: 'Aesthetician' }
      ],
      'franchise': [
        { name: 'SPA_MANAGER', description: 'Franchise Manager' },
        { name: 'FRONT_DESK_SUPERVISOR', description: 'Front Desk Supervisor' },
        { name: 'FRONT_DESK_STAFF', description: 'Front Desk Staff' },
        { name: 'MEDICAL_PROVIDER', description: 'Medical Provider' },
        { name: 'AESTHETICIAN', description: 'Aesthetician' }
      ]
    };

    const roles = roleTemplates[spaType] || roleTemplates['single-location'];
    
    // Store role templates for the practice
    await this.prisma.practice.update({
      where: { id: practiceId },
      data: { 
        roleTemplates: roles,
        settings: {
          ...(await this.prisma.practice.findUnique({ where: { id: practiceId } })).settings,
          defaultRoles: roles
        }
      }
    });
  }

  /**
   * Configure default workflows
   */
  async configureDefaultWorkflows(practiceId, spaType) {
    const workflows = {
      'single-location': {
        appointmentWorkflow: 'standard',
        checkinWorkflow: 'simple',
        paymentWorkflow: 'basic'
      },
      'multi-location': {
        appointmentWorkflow: 'advanced',
        checkinWorkflow: 'enhanced',
        paymentWorkflow: 'comprehensive'
      },
      'franchise': {
        appointmentWorkflow: 'franchise',
        checkinWorkflow: 'franchise',
        paymentWorkflow: 'franchise'
      }
    };

    const practiceWorkflows = workflows[spaType] || workflows['single-location'];
    
    await this.prisma.practice.update({
      where: { id: practiceId },
      data: { 
        settings: {
          ...(await this.prisma.practice.findUnique({ where: { id: practiceId } })).settings,
          workflows: practiceWorkflows
        }
      }
    });
  }

  /**
   * Set up default reports
   */
  async setupDefaultReports(practiceId, spaType) {
    const reportTemplates = {
      'single-location': [
        { name: 'Daily Summary', type: 'operational', schedule: 'daily' },
        { name: 'Weekly Performance', type: 'financial', schedule: 'weekly' },
        { name: 'Monthly Overview', type: 'comprehensive', schedule: 'monthly' }
      ],
      'multi-location': [
        { name: 'Location Comparison', type: 'comparative', schedule: 'weekly' },
        { name: 'Cross-Location Performance', type: 'analytical', schedule: 'monthly' }
      ],
      'franchise': [
        { name: 'Franchise Performance', type: 'franchise', schedule: 'weekly' },
        { name: 'Compliance Report', type: 'compliance', schedule: 'monthly' }
      ]
    };

    const templates = reportTemplates[spaType] || reportTemplates['single-location'];
    
    // Create scheduled reports
    for (const template of templates) {
      await this.prisma.scheduledReport.create({
        data: {
          tenantId: practiceId,
          name: template.name,
          type: template.type,
          schedule: template.schedule,
          isActive: true
        }
      });
    }
  }

  /**
   * Configure integrations
   */
  async configureIntegrations(practiceId, existingSystems) {
    const integrations = this.detectIntegrations(existingSystems);
    
    for (const integration of integrations) {
      await this.prisma.pOSIntegration.create({
        data: {
          tenantId: practiceId,
          type: integration.type,
          status: 'CONFIGURED',
          config: {
            autoDetected: true,
            needsConfiguration: true
          }
        }
      });
    }
  }

  /**
   * Bulk import staff with role auto-assignment
   */
  async bulkImportStaff(practiceId, staffList) {
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    for (const staffMember of staffList) {
      try {
        // Check if staff member already exists
        const existingUser = await this.prisma.user.findUnique({
          where: { email: staffMember.email.toLowerCase() }
        });

        if (existingUser) {
          results.skipped.push({
            email: staffMember.email,
            reason: 'User already exists'
          });
          continue;
        }

        // Auto-assign role based on title/position
        const role = this.autoAssignRole(staffMember.title, staffMember.position);
        
        // Create user account
        const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
        
        const user = await this.prisma.user.create({
          data: {
            email: staffMember.email.toLowerCase(),
            password: hashedPassword,
            firstName: staffMember.firstName,
            lastName: staffMember.lastName,
            role,
            practiceId,
            preferences: this.getRoleSpecificPreferences(role)
          }
        });

        // Send invitation email
        await this.sendStaffInvitation(user, role);

        results.successful.push({
          email: staffMember.email,
          role,
          userId: user.id
        });

      } catch (error) {
        console.error(`Failed to import staff member ${staffMember.email}:`, error);
        results.failed.push({
          email: staffMember.email,
          reason: error.message
        });
      }
    }

    return results;
  }

  /**
   * Auto-assign role based on title/position
   */
  autoAssignRole(title, position) {
    const lowerTitle = (title || '').toLowerCase();
    const lowerPosition = (position || '').toLowerCase();
    
    // Manager roles
    if (lowerTitle.includes('manager') || lowerPosition.includes('manager')) {
      return 'SPA_MANAGER';
    }
    
    // Supervisor roles
    if (lowerTitle.includes('supervisor') || lowerPosition.includes('supervisor')) {
      return 'FRONT_DESK_SUPERVISOR';
    }
    
    // Medical roles
    if (lowerTitle.includes('doctor') || lowerTitle.includes('nurse') || 
        lowerTitle.includes('practitioner') || lowerPosition.includes('medical')) {
      return 'MEDICAL_PROVIDER';
    }
    
    // Aesthetician roles
    if (lowerTitle.includes('aesthetician') || lowerTitle.includes('esthetician') ||
        lowerPosition.includes('aesthetic')) {
      return 'AESTHETICIAN';
    }
    
    // Front desk roles
    if (lowerTitle.includes('receptionist') || lowerTitle.includes('front desk') ||
        lowerPosition.includes('reception')) {
      return 'FRONT_DESK_STAFF';
    }
    
    // Default to staff
    return 'FRONT_DESK_STAFF';
  }

  /**
   * Get role-specific preferences
   */
  getRoleSpecificPreferences(role) {
    const preferences = {
      'SPA_MANAGER': {
        dashboard: {
          layout: 'management',
          defaultLanding: '/dashboard/management',
          quickActions: ['staff-schedule', 'performance-reports', 'inventory']
        }
      },
      'FRONT_DESK_STAFF': {
        dashboard: {
          layout: 'operational',
          defaultLanding: '/appointments/today',
          quickActions: ['check-in-patient', 'book-appointment', 'process-payment']
        }
      },
      'MEDICAL_PROVIDER': {
        dashboard: {
          layout: 'clinical',
          defaultLanding: '/patients/my-schedule',
          quickActions: ['patient-notes', 'take-photo', 'treatment-plan']
        }
      },
      'AESTHETICIAN': {
        dashboard: {
          layout: 'clinical',
          defaultLanding: '/treatments/schedule',
          quickActions: ['treatment-notes', 'before-after-photos', 'product-recommendations']
        }
      }
    };

    return preferences[role] || preferences['FRONT_DESK_STAFF'];
  }

  /**
   * Get next steps after setup
   */
  getNextSteps(spaType) {
    const baseSteps = [
      'Complete your profile',
      'Set up your first appointment',
      'Invite your team members'
    ];

    const typeSpecificSteps = {
      'single-location': [
        'Configure your services and pricing',
        'Set up your payment methods'
      ],
      'multi-location': [
        'Configure location-specific settings',
        'Set up cross-location reporting'
      ],
      'franchise': [
        'Configure franchise compliance settings',
        'Set up franchise reporting'
      ]
    };

    return [...baseSteps, ...(typeSpecificSteps[spaType] || [])];
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user, userType) {
    // In a real implementation, this would send an email
    console.log(`Welcome email sent to ${user.email} (${userType})`);
  }

  /**
   * Send staff invitation
   */
  async sendStaffInvitation(user, role) {
    // In a real implementation, this would send an invitation email
    console.log(`Staff invitation sent to ${user.email} (${role})`);
  }
}

module.exports = EnhancedRegistrationService; 