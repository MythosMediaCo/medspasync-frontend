/**
 * Medical Spa Role-Based Access Control Service
 * Provides context-aware permissions and quality-of-life features
 */

const { PrismaClient } = require('@prisma/client');

class MedSpaRBACService {
  constructor() {
    this.prisma = new PrismaClient();
    
    // Medical spa specific role definitions
    this.roleDefinitions = {
      'SPA_OWNER': {
        level: 100,
        permissions: ['*'], // Full access
        qualityOfLife: {
          dashboardLayout: 'executive',
          defaultLanding: '/dashboard/overview',
          preferredReports: ['financial', 'operational'],
          quickActions: ['financial-reports', 'user-management', 'system-settings']
        },
        description: 'Complete system access and administrative control'
      },
      
      'SPA_MANAGER': {
        level: 80,
        permissions: [
          'staff:manage',
          'schedule:manage',
          'financial:view',
          'patient:read',
          'patient:update',
          'reports:view',
          'inventory:manage'
        ],
        restrictions: ['no_billing_changes', 'no_user_deletion'],
        qualityOfLife: {
          dashboardLayout: 'management',
          defaultLanding: '/dashboard/management',
          quickActions: ['staff-schedule', 'performance-reports', 'inventory']
        },
        description: 'Operational management without billing access'
      },

      'FRONT_DESK_SUPERVISOR': {
        level: 60,
        permissions: [
          'appointment:manage',
          'patient:checkin',
          'payment:process',
          'reports:basic',
          'staff:view'
        ],
        workflowOptimizations: ['quick_checkin_mode', 'payment_shortcuts', 'common_services_hotkeys'],
        qualityOfLife: {
          dashboardLayout: 'operational',
          defaultLanding: '/appointments/today',
          quickActions: ['check-in-patient', 'process-payment', 'book-appointment']
        },
        description: 'Enhanced front desk with supervisory capabilities'
      },

      'FRONT_DESK_STAFF': {
        level: 40,
        permissions: [
          'appointment:view',
          'appointment:create',
          'patient:checkin',
          'payment:basic'
        ],
        qualityOfLife: {
          dashboardLayout: 'operational',
          defaultLanding: '/appointments/today',
          quickActions: ['check-in-patient', 'book-appointment', 'process-payment'],
          simplifiedInterface: true,
          guidedWorkflows: true
        },
        description: 'Streamlined access for daily front desk operations'
      },

      'MEDICAL_PROVIDER': {
        level: 70,
        permissions: [
          'patient:read',
          'patient:update',
          'treatment:manage',
          'medical_history:read',
          'clinical_photos:manage',
          'notes:manage'
        ],
        mobileOptimizations: ['voice_notes', 'photo_capture', 'quick_templates'],
        qualityOfLife: {
          dashboardLayout: 'clinical',
          defaultLanding: '/patients/my-schedule',
          quickActions: ['patient-notes', 'take-photo', 'treatment-plan']
        },
        description: 'Clinical access optimized for treatment workflows'
      },

      'AESTHETICIAN': {
        level: 50,
        permissions: [
          'treatment:protocols',
          'product:recommendations',
          'before_after:photos',
          'patient:read'
        ],
        workflowFeatures: ['treatment_templates', 'product_calculator', 'skin_analysis_tools'],
        qualityOfLife: {
          dashboardLayout: 'clinical',
          defaultLanding: '/treatments/schedule',
          quickActions: ['treatment-notes', 'before-after-photos', 'product-recommendations']
        },
        description: 'Specialized access for aesthetic treatments'
      }
    };

    // Permission hierarchy for inheritance
    this.permissionHierarchy = {
      'SPA_OWNER': ['SPA_MANAGER', 'FRONT_DESK_SUPERVISOR', 'FRONT_DESK_STAFF', 'MEDICAL_PROVIDER', 'AESTHETICIAN'],
      'SPA_MANAGER': ['FRONT_DESK_SUPERVISOR', 'FRONT_DESK_STAFF'],
      'FRONT_DESK_SUPERVISOR': ['FRONT_DESK_STAFF'],
      'MEDICAL_PROVIDER': ['AESTHETICIAN']
    };
  }

  /**
   * Context-aware permission checking
   */
  async checkPermission(userId, resource, action, context = {}) {
    try {
      const user = await this.getUserWithRoles(userId);
      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      // Check base permission
      const basePermission = await this.checkBasePermission(user.roles, resource, action);
      if (!basePermission.allowed) {
        return basePermission;
      }

      // Apply context-aware restrictions
      if (context) {
        const contextualPermission = await this.checkContextualPermission(
          user, resource, action, context
        );
        
        if (!contextualPermission.allowed) {
          // Quality of life: Provide helpful error messages
          contextualPermission.helpText = await this.generateHelpText(user, resource, action, context);
          return contextualPermission;
        }
      }

      // Check time-based restrictions
      const timeRestriction = await this.checkTimeRestrictions(user, resource, action);
      if (!timeRestriction.allowed) {
        return timeRestriction;
      }

      // Check location-based restrictions
      const locationRestriction = await this.checkLocationRestrictions(user, resource, action, context);
      if (!locationRestriction.allowed) {
        return locationRestriction;
      }

      return { allowed: true, user, context };

    } catch (error) {
      console.error('Permission check error:', error);
      return { allowed: false, reason: 'Permission check failed', error: error.message };
    }
  }

  /**
   * Check base permissions based on user roles
   */
  async checkBasePermission(roles, resource, action) {
    for (const role of roles) {
      const roleDef = this.roleDefinitions[role];
      if (!roleDef) continue;

      // Check wildcard permission
      if (roleDef.permissions.includes('*')) {
        return { allowed: true, role };
      }

      // Check specific permission
      const permission = `${resource}:${action}`;
      if (roleDef.permissions.includes(permission)) {
        return { allowed: true, role };
      }

      // Check inherited permissions
      const inheritedRoles = this.permissionHierarchy[role] || [];
      for (const inheritedRole of inheritedRoles) {
        const inheritedDef = this.roleDefinitions[inheritedRole];
        if (inheritedDef && inheritedDef.permissions.includes(permission)) {
          return { allowed: true, role: inheritedRole, inherited: true };
        }
      }
    }

    return { allowed: false, reason: 'Insufficient permissions' };
  }

  /**
   * Check contextual permissions (time, location, device, etc.)
   */
  async checkContextualPermission(user, resource, action, context) {
    const { time, location, device, patientId, appointmentId } = context;

    // Time-based restrictions
    if (time) {
      const timeCheck = await this.checkTimeBasedPermissions(user, resource, action, time);
      if (!timeCheck.allowed) return timeCheck;
    }

    // Location-based restrictions
    if (location) {
      const locationCheck = await this.checkLocationBasedPermissions(user, resource, action, location);
      if (!locationCheck.allowed) return locationCheck;
    }

    // Device-based restrictions
    if (device) {
      const deviceCheck = await this.checkDeviceBasedPermissions(user, resource, action, device);
      if (!deviceCheck.allowed) return deviceCheck;
    }

    // Patient-specific restrictions
    if (patientId) {
      const patientCheck = await this.checkPatientSpecificPermissions(user, resource, action, patientId);
      if (!patientCheck.allowed) return patientCheck;
    }

    // Appointment-specific restrictions
    if (appointmentId) {
      const appointmentCheck = await this.checkAppointmentSpecificPermissions(user, resource, action, appointmentId);
      if (!appointmentCheck.allowed) return appointmentCheck;
    }

    return { allowed: true };
  }

  /**
   * Check time-based restrictions
   */
  async checkTimeBasedPermissions(user, resource, action, time) {
    const now = new Date(time);
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // After-hours restrictions for certain roles
    if (hour < 6 || hour > 22) {
      const afterHoursRoles = ['FRONT_DESK_STAFF', 'AESTHETICIAN'];
      if (afterHoursRoles.includes(user.primaryRole)) {
        return {
          allowed: false,
          reason: 'Access restricted outside business hours',
          suggestion: 'Contact your manager for after-hours access'
        };
      }
    }

    // Weekend restrictions for certain operations
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      if (resource === 'billing' && action === 'process') {
        return {
          allowed: false,
          reason: 'Billing operations restricted on weekends',
          suggestion: 'Process billing during business hours'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check location-based restrictions
   */
  async checkLocationBasedPermissions(user, resource, action, location) {
    const userLocations = await this.getUserLocations(user.id);
    
    if (location.practiceId && !userLocations.includes(location.practiceId)) {
      return {
        allowed: false,
        reason: 'Access restricted to specific locations',
        suggestion: 'Contact your manager to add location access'
      };
    }

    return { allowed: true };
  }

  /**
   * Check device-based restrictions
   */
  async checkDeviceBasedPermissions(user, resource, action, device) {
    // Mobile-specific restrictions
    if (device.isMobile && resource === 'financial' && action === 'process') {
      return {
        allowed: false,
        reason: 'Financial operations restricted on mobile devices',
        suggestion: 'Use desktop or tablet for financial operations'
      };
    }

    // Tablet-specific optimizations
    if (device.isTablet && resource === 'clinical') {
      return { allowed: true, optimizations: ['tablet-optimized'] };
    }

    return { allowed: true };
  }

  /**
   * Check patient-specific permissions
   */
  async checkPatientSpecificPermissions(user, resource, action, patientId) {
    // Check if user has access to this specific patient
    const patientAccess = await this.prisma.appointment.findFirst({
      where: {
        clientId: patientId,
        staffId: user.id
      }
    });

    if (!patientAccess && user.primaryRole !== 'SPA_OWNER' && user.primaryRole !== 'SPA_MANAGER') {
      return {
        allowed: false,
        reason: 'No access to this patient',
        suggestion: 'Patient access is limited to assigned staff'
      };
    }

    return { allowed: true };
  }

  /**
   * Check appointment-specific permissions
   */
  async checkAppointmentSpecificPermissions(user, resource, action, appointmentId) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { staff: true }
    });

    if (!appointment) {
      return { allowed: false, reason: 'Appointment not found' };
    }

    // Only assigned staff can modify appointments
    if (appointment.staffId !== user.id && user.primaryRole !== 'SPA_OWNER' && user.primaryRole !== 'SPA_MANAGER') {
      return {
        allowed: false,
        reason: 'Not assigned to this appointment',
        suggestion: 'Contact the assigned staff member or your manager'
      };
    }

    return { allowed: true };
  }

  /**
   * Dynamic role assignment for multi-location
   */
  async assignLocationRole(userId, locationId, roleId) {
    try {
      // Quality of life: Validate role makes sense for location
      const locationContext = await this.getLocationContext(locationId);
      const roleCompatibility = this.validateRoleLocationCompatibility(roleId, locationContext);
      
      if (!roleCompatibility.compatible) {
        return {
          success: false,
          reason: roleCompatibility.reason,
          suggestions: roleCompatibility.alternativeRoles
        };
      }

      // Create or update user location role
      await this.prisma.userLocationRole.upsert({
        where: {
          userId_locationId: { userId, locationId }
        },
        update: {
          roleId,
          assignedAt: new Date()
        },
        create: {
          userId,
          locationId,
          roleId,
          assignedAt: new Date()
        }
      });

      // Quality of life: Automatically configure user preferences for location
      await this.configureLocationSpecificPreferences(userId, locationId, roleId);

      return { success: true, roleId, locationId };

    } catch (error) {
      console.error('Role assignment error:', error);
      return { success: false, reason: 'Role assignment failed', error: error.message };
    }
  }

  /**
   * Get user with all roles and context
   */
  async getUserWithRoles(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        practice: true,
        userLocationRoles: {
          include: { location: true, role: true }
        }
      }
    });

    if (!user) return null;

    // Determine primary role (highest level)
    const roles = user.userLocationRoles.map(ulr => ulr.role.name);
    const primaryRole = this.getPrimaryRole(roles);

    return {
      ...user,
      roles,
      primaryRole
    };
  }

  /**
   * Generate helpful error messages for permission denials
   */
  async generateHelpText(user, resource, action, context) {
    const helpTexts = {
      'patient:update': {
        'no_access': 'You need to be assigned to this patient to make changes. Contact your manager.',
        'time_restriction': 'Patient updates are restricted outside business hours.',
        'location_restriction': 'You can only update patients at your assigned locations.'
      },
      'financial:process': {
        'mobile_restriction': 'Financial operations require a desktop or tablet for security.',
        'time_restriction': 'Financial operations are restricted to business hours.',
        'role_restriction': 'Only managers and owners can process financial transactions.'
      },
      'appointment:manage': {
        'not_assigned': 'You can only manage appointments you are assigned to.',
        'time_restriction': 'Appointment changes are restricted outside business hours.'
      }
    };

    const key = `${resource}:${action}`;
    const helpText = helpTexts[key];
    
    if (helpText) {
      // Determine the specific reason and return appropriate help text
      if (context.time && context.time.getHours() < 6) {
        return helpText.time_restriction;
      }
      if (context.device?.isMobile && resource === 'financial') {
        return helpText.mobile_restriction;
      }
      // Add more specific help text logic as needed
    }

    return 'Contact your manager for assistance with this operation.';
  }

  /**
   * Get user's assigned locations
   */
  async getUserLocations(userId) {
    const userLocationRoles = await this.prisma.userLocationRole.findMany({
      where: { userId },
      include: { location: true }
    });

    return userLocationRoles.map(ulr => ulr.locationId);
  }

  /**
   * Get location context for role validation
   */
  async getLocationContext(locationId) {
    const location = await this.prisma.practice.findUnique({
      where: { id: locationId }
    });

    return {
      type: location?.type || 'standard',
      size: location?.size || 'medium',
      services: location?.services || []
    };
  }

  /**
   * Validate role compatibility with location
   */
  validateRoleLocationCompatibility(roleId, locationContext) {
    // In a real implementation, this would check if the role makes sense for the location
    const incompatibleRoles = {
      'SPA_OWNER': [], // Owner can be assigned anywhere
      'SPA_MANAGER': [], // Manager can be assigned anywhere
      'FRONT_DESK_SUPERVISOR': ['micro'], // Supervisor might not be needed for very small locations
      'FRONT_DESK_STAFF': [],
      'MEDICAL_PROVIDER': [],
      'AESTHETICIAN': []
    };

    if (locationContext.type === 'micro' && incompatibleRoles[roleId]?.includes('micro')) {
      return {
        compatible: false,
        reason: 'This role is not suitable for micro locations',
        alternativeRoles: ['FRONT_DESK_STAFF', 'AESTHETICIAN']
      };
    }

    return { compatible: true };
  }

  /**
   * Configure location-specific user preferences
   */
  async configureLocationSpecificPreferences(userId, locationId, roleId) {
    const roleDef = this.roleDefinitions[roleId];
    if (!roleDef) return;

    const preferences = await this.getUserPreferences(userId);
    
    // Set location-specific dashboard layout
    preferences.dashboard.layout = roleDef.qualityOfLife.dashboardLayout;
    preferences.dashboard.quickActions = roleDef.qualityOfLife.quickActions;
    preferences.dashboard.defaultLanding = roleDef.qualityOfLife.defaultLanding;

    // Update user preferences
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences }
    });
  }

  /**
   * Get user preferences (placeholder - would integrate with auth service)
   */
  async getUserPreferences(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    return user?.preferences || {};
  }

  /**
   * Determine primary role from user's roles
   */
  getPrimaryRole(roles) {
    if (!roles || roles.length === 0) return 'STAFF';

    // Return the role with the highest level
    let primaryRole = 'STAFF';
    let highestLevel = 0;

    for (const role of roles) {
      const roleDef = this.roleDefinitions[role];
      if (roleDef && roleDef.level > highestLevel) {
        highestLevel = roleDef.level;
        primaryRole = role;
      }
    }

    return primaryRole;
  }

  /**
   * Get role definition with quality-of-life features
   */
  getRoleDefinition(roleName) {
    return this.roleDefinitions[roleName] || null;
  }

  /**
   * Get all available roles for a location
   */
  getAvailableRolesForLocation(locationContext) {
    return Object.keys(this.roleDefinitions).filter(roleId => {
      const compatibility = this.validateRoleLocationCompatibility(roleId, locationContext);
      return compatibility.compatible;
    });
  }
}

module.exports = MedSpaRBACService;
