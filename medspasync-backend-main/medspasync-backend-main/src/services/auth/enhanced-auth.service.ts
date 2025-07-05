/**
 * MedSpaSync Pro - Enhanced Authentication Service
 * Multi-modal authentication with medical spa specific role-based access control
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// import { Request } from 'express'; // Removed unused import

const prisma = new PrismaClient();

export interface AuthCredentials {
  identifier: string; // email, phone, or username
  password?: string;
  method: 'traditional' | 'biometric' | 'magicLink' | 'sso';
  deviceFingerprint?: string;
  biometricData?: any;
  magicToken?: string;
  ssoProvider?: string;
  ssoToken?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  sessionOptimizations: SessionOptimizations;
  userPreferences: UserExperienceSettings;
  user: any;
}

export interface SessionOptimizations {
  sessionDuration: number;
  autoRefresh: boolean;
  deviceTrusted: boolean;
  multiFactorRequired: boolean;
}

export interface UserExperienceSettings {
  dashboardLayout: string;
  defaultLanding: string;
  quickActions: string[];
  mobileOptimizations: string[];
  theme: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export type MedSpaRole = 'spa-owner' | 'front-desk' | 'medical-provider' | 'manager' | 'admin';

export interface RoleConfiguration {
  permissions: string[];
  dashboardLayout: string;
  defaultLanding: string;
  quickActions: string[];
  mobileOptimizations: string[];
  dataAccess: string[];
  features: string[];
}

export class EnhancedAuthenticationService {
  private readonly JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret-key';
  private readonly MAGIC_LINK_SECRET = process.env['MAGIC_LINK_SECRET'] || 'your-magic-link-secret';

  async authenticateUser(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Validate credentials based on authentication method
      const authMethods = {
        traditional: () => this.validateEmailPassword(credentials),
        biometric: () => this.validateBiometric(credentials),
        magicLink: () => this.validateMagicLink(credentials),
        sso: () => this.validateSSO(credentials)
      };

      const authMethod = authMethods[credentials.method];
      if (!authMethod) {
        throw new Error(`Unsupported authentication method: ${credentials.method}`);
      }

      const user = await authMethod();

      // Get user preferences and session optimizations
      const preferredMethod = await this.getUserAuthPreference(user.id);
      const sessionConfig = await this.calculateOptimalSession(credentials, user);
      const userPreferences = await this.getUserExperienceSettings(user.id);

      // Generate enhanced tokens
      const accessToken = await this.generateEnhancedJWT(user, sessionConfig);
      const refreshToken = await this.generateSecureRefreshToken(user);

      // Audit logging for HIPAA compliance
      await this.auditService.logAuthActivity({
        userId: user.id,
        method: credentials.method,
        deviceFingerprint: await this.generateDeviceFingerprint(credentials),
        riskAssessment: await this.assessAuthRisk(credentials, user),
        success: true,
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent
      });

      // Update user session
      await this.updateUserSession(user.id, {
        method: credentials.method,
        deviceFingerprint: credentials.deviceFingerprint,
        lastLogin: new Date()
      });

      return {
        accessToken,
        refreshToken,
        sessionOptimizations: sessionConfig,
        userPreferences,
        user: this.sanitizeUserData(user)
      };
    } catch (error) {
      // Log failed authentication attempt
      await this.auditService.logAuthActivity({
        userId: credentials.identifier,
        method: credentials.method,
        deviceFingerprint: credentials.deviceFingerprint,
        riskAssessment: 'high',
        success: false,
        error: error.message,
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent
      });

      throw error;
    }
  }

  private async validateEmailPassword(credentials: AuthCredentials): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.identifier },
      include: { practice: true, staff: true }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(credentials.password!, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  private async validateBiometric(credentials: AuthCredentials): Promise<any> {
    // Validate biometric credentials using WebAuthn or similar
    const user = await prisma.user.findUnique({
      where: { email: credentials.identifier },
      include: { practice: true, staff: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate biometric data (simplified for demo)
    const isValidBiometric = await this.validateBiometricCredential(
      credentials.biometricData,
      user.id
    );

    if (!isValidBiometric) {
      throw new Error('Biometric validation failed');
    }

    return user;
  }

  private async validateMagicLink(credentials: AuthCredentials): Promise<any> {
    if (!credentials.magicToken) {
      throw new Error('Magic token required');
    }

    // Verify magic token
    const tokenData = await this.verifyMagicToken(credentials.magicToken);
    if (!tokenData) {
      throw new Error('Invalid or expired magic token');
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      include: { practice: true, staff: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Invalidate used token
    await this.invalidateMagicToken(credentials.magicToken);

    return user;
  }

  private async validateSSO(credentials: AuthCredentials): Promise<any> {
    if (!credentials.ssoProvider || !credentials.ssoToken) {
      throw new Error('SSO provider and token required');
    }

    // Validate SSO token with provider
    const ssoUser = await this.validateSSOToken(
      credentials.ssoProvider,
      credentials.ssoToken
    );

    if (!ssoUser) {
      throw new Error('SSO validation failed');
    }

    // Find or create user based on SSO data
    const user = await this.findOrCreateSSOUser(ssoUser);

    return user;
  }

  async configureRoleBasedAccess(userId: string, role: MedSpaRole): Promise<RoleConfiguration> {
    const roleConfigs: Record<MedSpaRole, RoleConfiguration> = {
      'spa-owner': {
        permissions: ['*'], // Full access
        dashboardLayout: 'executive-overview',
        defaultLanding: '/dashboard/business-intelligence',
        quickActions: ['view-daily-revenue', 'staff-performance', 'ai-insights'],
        mobileOptimizations: ['executive-summary', 'key-metrics-widget'],
        dataAccess: ['all'],
        features: ['all']
      },
      
      'front-desk': {
        permissions: ['appointments:*', 'patients:read', 'payments:process', 'reports:view'],
        dashboardLayout: 'operational-workflow',
        defaultLanding: '/appointments/today',
        quickActions: ['check-in-patient', 'process-payment', 'book-appointment'],
        mobileOptimizations: ['one-handed-mode', 'large-touch-targets', 'quick-checkout'],
        dataAccess: ['appointments', 'patients', 'payments'],
        features: ['appointments', 'patients', 'payments', 'basic-reports']
      },
      
      'medical-provider': {
        permissions: ['patients:*', 'treatments:*', 'clinical-notes:*', 'reports:clinical'],
        dashboardLayout: 'clinical-focused',
        defaultLanding: '/patients/my-schedule',
        quickActions: ['voice-notes', 'photo-capture', 'treatment-plans'],
        mobileOptimizations: ['voice-activation', 'hands-free-mode', 'glove-compatible'],
        dataAccess: ['patients', 'treatments', 'clinical-notes'],
        features: ['patients', 'treatments', 'clinical-notes', 'voice-notes']
      },

      'manager': {
        permissions: ['staff:*', 'reports:*', 'settings:*', 'appointments:*'],
        dashboardLayout: 'management-overview',
        defaultLanding: '/dashboard/management',
        quickActions: ['staff-schedule', 'performance-reports', 'settings'],
        mobileOptimizations: ['management-dashboard', 'staff-overview'],
        dataAccess: ['staff', 'reports', 'settings', 'appointments'],
        features: ['staff-management', 'reports', 'settings', 'appointments']
      },

      'admin': {
        permissions: ['*'],
        dashboardLayout: 'admin-panel',
        defaultLanding: '/admin/dashboard',
        quickActions: ['system-settings', 'user-management', 'audit-logs'],
        mobileOptimizations: ['admin-panel', 'system-monitoring'],
        dataAccess: ['all'],
        features: ['all']
      }
    };

    const config = roleConfigs[role];
    
    // Store role configuration in user preferences
    await this.updateUserPreferences(userId, 'role', {
      role,
      configuration: config,
      lastUpdated: new Date()
    });

    return config;
  }

  async generateMagicLink(email: string, redirectUrl?: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store magic link token
    await prisma.userSession.create({
      data: {
        userId: user.id,
        practiceId: user.practiceId || '',
        sessionToken: token,
        expiresAt,
        deviceInfo: { type: 'magic-link', redirectUrl }
      }
    });

    const baseUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';
    return `${baseUrl}/auth/magic-link?token=${token}&redirect=${encodeURIComponent(redirectUrl || '/dashboard')}`;
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { practice: true, staff: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const sessionConfig = await this.calculateOptimalSession({ method: 'traditional' }, user);
      const userPreferences = await this.getUserExperienceSettings(user.id);

      const accessToken = await this.generateEnhancedJWT(user, sessionConfig);
      const newRefreshToken = await this.generateSecureRefreshToken(user);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        sessionOptimizations: sessionConfig,
        userPreferences,
        user: this.sanitizeUserData(user)
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  private async generateEnhancedJWT(user: any, sessionConfig: SessionOptimizations): Promise<string> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      practiceId: user.practiceId,
      sessionOptimizations: sessionConfig,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (sessionConfig.sessionDuration || 3600)
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  private async generateSecureRefreshToken(user: any): Promise<string> {
    const payload = {
      userId: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, this.JWT_REFRESH_SECRET);
  }

  private async getUserAuthPreference(userId: string): Promise<string> {
    const preference = await prisma.userPreference.findUnique({
      where: { userId_category_key: { userId, category: 'authentication' } }
    });

    return (preference?.value as any)?.preferredMethod || 'traditional';
  }

  private async calculateOptimalSession(credentials: AuthCredentials, user: any): Promise<SessionOptimizations> {
    const deviceTrusted = await this.isDeviceTrusted(credentials.deviceFingerprint, user.id);
    const riskLevel = await this.assessAuthRisk(credentials, user);

    return {
      sessionDuration: deviceTrusted ? 24 * 60 * 60 : 4 * 60 * 60, // 24h vs 4h
      autoRefresh: deviceTrusted,
      deviceTrusted,
      multiFactorRequired: riskLevel === 'high'
    };
  }

  private async getUserExperienceSettings(userId: string): Promise<UserExperienceSettings> {
    const preferences = await prisma.userPreference.findMany({
      where: { userId }
    });

    const defaultSettings: UserExperienceSettings = {
      dashboardLayout: 'default',
      defaultLanding: '/dashboard',
      quickActions: [],
      mobileOptimizations: [],
      theme: 'light',
      notifications: {
        email: true,
        sms: false,
        push: true,
        frequency: 'immediate'
      }
    };

    // Merge user preferences with defaults
    preferences.forEach(pref => {
      if (pref.category === 'dashboard') {
        Object.assign(defaultSettings, pref.value as any);
      }
    });

    return defaultSettings;
  }

  private async updateUserPreferences(userId: string, category: string, preferences: any): Promise<void> {
    await prisma.userPreference.upsert({
      where: { userId_category_key: { userId, category } },
      update: { value: preferences },
      create: { userId, category, key: category, value: preferences }
    });
  }

  private async isDeviceTrusted(deviceFingerprint: string, userId: string): Promise<boolean> {
    if (!deviceFingerprint) return false;

    const session = await prisma.userSession.findFirst({
      where: {
        userId,
        deviceInfo: { path: ['fingerprint'], equals: deviceFingerprint },
        expiresAt: { gt: new Date() }
      }
    });

    return !!session;
  }

  private async assessAuthRisk(credentials: AuthCredentials, user: any): Promise<'low' | 'medium' | 'high'> {
    // Implement risk assessment logic
    // Factors: location, device, time, previous attempts, etc.
    return 'low'; // Simplified for demo
  }

  private async generateDeviceFingerprint(credentials: AuthCredentials): Promise<string> {
    // Generate device fingerprint from available data
    const fingerprintData = {
      userAgent: credentials.userAgent,
      ipAddress: credentials.ipAddress,
      timestamp: Date.now()
    };

    return crypto.createHash('sha256').update(JSON.stringify(fingerprintData)).digest('hex');
  }

  private async updateUserSession(userId: string, sessionData: any): Promise<void> {
    // Update user session information
    await prisma.userSession.updateMany({
      where: { userId, expiresAt: { gt: new Date() } },
      data: { lastActivity: new Date() }
    });
  }

  private sanitizeUserData(user: any): any {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Placeholder methods for demo
  private async validateBiometricCredential(biometricData: any, userId: string): Promise<boolean> {
    // Implement biometric validation
    return true; // Simplified for demo
  }

  private async verifyMagicToken(token: string): Promise<any> {
    // Implement magic token verification
    return { userId: 'demo-user-id' }; // Simplified for demo
  }

  private async invalidateMagicToken(token: string): Promise<void> {
    // Implement token invalidation
  }

  private async validateSSOToken(provider: string, token: string): Promise<any> {
    // Implement SSO token validation
    return { email: 'demo@example.com', name: 'Demo User' }; // Simplified for demo
  }

  private async findOrCreateSSOUser(ssoUser: any): Promise<any> {
    // Find or create user based on SSO data
    return await prisma.user.findUnique({ where: { email: ssoUser.email } });
  }

  // Audit service placeholder
  private auditService = {
    logAuthActivity: async (data: any) => {
      // Implement audit logging
      console.log('Auth activity logged:', data);
    }
  };
} 