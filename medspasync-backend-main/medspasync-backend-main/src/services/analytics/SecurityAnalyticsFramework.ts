/**
 * Security Analytics Framework for MedSpa Analytics Pro
 * HIPAA-compliant analytics with role-based access, anonymization, and audit logging
 * Performance target: <100ms for security checks
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

interface SecurityContext {
  userId: string;
  userRole: string;
  practiceId: string;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

interface AnonymizationLevel {
  level: 'none' | 'partial' | 'full';
  fields: string[];
  hashAlgorithm: string;
  saltLength: number;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

interface SecurityMetrics {
  totalAccesses: number;
  unauthorizedAttempts: number;
  anonymizedRequests: number;
  auditLogEntries: number;
  averageProcessingTime: number;
  lastSecurityIncident?: Date;
}

export class SecurityAnalyticsFramework {
  private prisma: PrismaClient;
  private redis: Redis;
  private auditLogs: AuditLogEntry[] = [];
  private securityMetrics: SecurityMetrics = {
    totalAccesses: 0,
    unauthorizedAttempts: 0,
    anonymizedRequests: 0,
    auditLogEntries: 0,
    averageProcessingTime: 0
  };

  // Role-based access control matrix
  private readonly rolePermissions = {
    ADMIN: {
      canAccessAllData: true,
      canExportData: true,
      canViewAuditLogs: true,
      anonymizationLevel: 'none' as const,
      allowedOperations: ['read', 'write', 'delete', 'export']
    },
    MANAGER: {
      canAccessAllData: true,
      canExportData: true,
      canViewAuditLogs: false,
      anonymizationLevel: 'partial' as const,
      allowedOperations: ['read', 'write']
    },
    STAFF: {
      canAccessAllData: false,
      canExportData: false,
      canViewAuditLogs: false,
      anonymizationLevel: 'partial' as const,
      allowedOperations: ['read']
    },
    PRACTITIONER: {
      canAccessAllData: false,
      canExportData: false,
      canViewAuditLogs: false,
      anonymizationLevel: 'full' as const,
      allowedOperations: ['read']
    }
  };

  // Anonymization configurations
  private readonly anonymizationConfigs: Record<string, AnonymizationLevel> = {
    none: {
      level: 'none',
      fields: [],
      hashAlgorithm: 'sha256',
      saltLength: 32
    },
    partial: {
      level: 'partial',
      fields: ['client_id', 'email_hash', 'phone_hash'],
      hashAlgorithm: 'sha256',
      saltLength: 32
    },
    full: {
      level: 'full',
      fields: ['client_id', 'email_hash', 'phone_hash', 'first_name_hash', 'last_name_hash'],
      hashAlgorithm: 'sha256',
      saltLength: 32
    }
  };

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      password: process.env['REDIS_PASSWORD'] || '',
      db: parseInt(process.env['REDIS_DB'] || '7'), // Separate DB for security
      maxRetriesPerRequest: 3
    });
  }

  /**
   * Validate user access to analytics data
   */
  async validateAccess(context: SecurityContext, resource: string, operation: string): Promise<{
    allowed: boolean;
    anonymizationLevel: string;
    reason?: string;
  }> {
    const startTime = performance.now();
    
    try {
      // Get user role permissions
      const permissions = this.rolePermissions[context.userRole as keyof typeof this.rolePermissions];
      if (!permissions) {
        await this.logSecurityEvent(context, 'access_denied', resource, 'Invalid user role');
        return { allowed: false, anonymizationLevel: 'full', reason: 'Invalid user role' };
      }

      // Check if operation is allowed for this role
      if (!permissions.allowedOperations.includes(operation)) {
        await this.logSecurityEvent(context, 'access_denied', resource, 'Operation not permitted');
        return { allowed: false, anonymizationLevel: 'full', reason: 'Operation not permitted' };
      }

      // Check practice access for non-admin users
      if (context.userRole !== 'ADMIN' && !permissions.canAccessAllData) {
        const hasPracticeAccess = await this.validatePracticeAccess(context.userId, context.practiceId);
        if (!hasPracticeAccess) {
          await this.logSecurityEvent(context, 'access_denied', resource, 'No practice access');
          return { allowed: false, anonymizationLevel: 'full', reason: 'No practice access' };
        }
      }

      // Log successful access
      await this.logSecurityEvent(context, 'access_granted', resource);
      
      const processingTime = performance.now() - startTime;
      this.updateSecurityMetrics(processingTime, true);

      return {
        allowed: true,
        anonymizationLevel: permissions.anonymizationLevel
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateSecurityMetrics(processingTime, false);
      
      await this.logSecurityEvent(context, 'access_error', resource, (error as Error).message);
      return { allowed: false, anonymizationLevel: 'full', reason: 'Security validation error' };
    }
  }

  /**
   * Anonymize data based on security level
   */
  async anonymizeData(data: any, anonymizationLevel: string, context: SecurityContext): Promise<any> {
    const startTime = performance.now();
    
    try {
      const config = this.anonymizationConfigs[anonymizationLevel];
      if (!config || config.level === 'none') {
        return data;
      }

      const anonymizedData = this.deepClone(data);
      await this.applyAnonymization(anonymizedData, config, context);
      
      const processingTime = performance.now() - startTime;
      this.updateSecurityMetrics(processingTime, true);
      
      await this.logSecurityEvent(context, 'data_anonymized', 'analytics_data', 
        `Applied ${anonymizationLevel} anonymization`);
      
      return anonymizedData;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateSecurityMetrics(processingTime, false);
      
      await this.logSecurityEvent(context, 'anonymization_error', 'analytics_data', (error as Error).message);
      throw new Error('Data anonymization failed');
    }
  }

  /**
   * Apply anonymization to data recursively
   */
  private async applyAnonymization(data: any, config: AnonymizationLevel, context: SecurityContext): Promise<void> {
    if (Array.isArray(data)) {
      for (const item of data) {
        await this.applyAnonymization(item, config, context);
      }
      return;
    }

    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (config.fields.includes(key)) {
          data[key] = await this.hashValue(value, config, context);
        } else if (typeof value === 'object' && value !== null) {
          await this.applyAnonymization(value, config, context);
        }
      }
    }
  }

  /**
   * Hash sensitive values
   */
  private async hashValue(value: any, config: AnonymizationLevel, context: SecurityContext): Promise<string> {
    if (!value) return '';
    
    const salt = crypto.randomBytes(config.saltLength).toString('hex');
    const valueStr = String(value);
    const hash = crypto.createHash(config.hashAlgorithm);
    
    // Include user context in hash for traceability
    const hashInput = `${valueStr}:${context.userId}:${context.timestamp.getTime()}:${salt}`;
    hash.update(hashInput);
    
    return `${salt}:${hash.digest('hex')}`;
  }

  /**
   * Create secure data export
   */
  async createSecureExport(
    data: any, 
    context: SecurityContext, 
    format: 'csv' | 'json' | 'excel',
    anonymizationLevel: string = 'partial'
  ): Promise<{
    exportId: string;
    downloadUrl: string;
    expiresAt: Date;
    auditLogId: string;
  }> {
    const startTime = performance.now();
    
    try {
      // Validate export permissions
      const permissions = this.rolePermissions[context.userRole as keyof typeof this.rolePermissions];
      if (!permissions?.canExportData) {
        await this.logSecurityEvent(context, 'export_denied', 'data_export', 'No export permission');
        throw new Error('Export permission denied');
      }

      // Anonymize data for export
      const anonymizedData = await this.anonymizeData(data, anonymizationLevel, context);
      
      // Generate secure export ID
      const exportId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store export data securely
      const exportData = {
        data: anonymizedData,
        format,
        createdBy: context.userId,
        createdAt: new Date(),
        expiresAt,
        anonymizationLevel
      };
      
      await this.redis.setex(`export:${exportId}`, 86400, JSON.stringify(exportData));
      
      // Generate secure download URL
      const downloadUrl = `/api/analytics/exports/${exportId}?token=${this.generateExportToken(exportId, context)}`;
      
      const processingTime = performance.now() - startTime;
      this.updateSecurityMetrics(processingTime, true);
      
      // Log export creation
      const auditLogId = await this.logSecurityEvent(context, 'export_created', 'data_export', 
        `Created ${format} export with ${anonymizationLevel} anonymization`);
      
      return {
        exportId,
        downloadUrl,
        expiresAt,
        auditLogId
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateSecurityMetrics(processingTime, false);
      
      await this.logSecurityEvent(context, 'export_error', 'data_export', (error as Error).message);
      throw new Error('Data export failed');
    }
  }

  /**
   * Generate secure export token
   */
  private generateExportToken(exportId: string, context: SecurityContext): string {
    const payload = {
      exportId,
      userId: context.userId,
      timestamp: context.timestamp.getTime(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };
    
    const secret = process.env['EXPORT_TOKEN_SECRET'] || 'default-secret';
    const signature = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return `${Buffer.from(JSON.stringify(payload)).toString('base64')}.${signature}`;
  }

  /**
   * Validate practice access for user
   */
  private async validatePracticeAccess(userId: string, practiceId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { practiceId: true }
      });
      
      return user?.practiceId === practiceId;
    } catch (error) {
      console.error('Practice access validation error:', error);
      return false;
    }
  }

  /**
   * Log security events for audit trail
   */
  private async logSecurityEvent(
    context: SecurityContext, 
    action: string, 
    resource: string, 
    details?: string
  ): Promise<string> {
    const startTime = performance.now();
    
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      userId: context.userId,
      action,
      resource: resource || '',
      ipAddress: context.ipAddress || '',
      userAgent: context.userAgent || '',
      createdAt: new Date()
    };

    // Store in memory for quick access
    this.auditLogs.push(auditEntry);
    
    // Store in database for persistence
    try {
      await this.prisma.auditLog.create({
        data: {
          id: auditEntry.id,
          userId: auditEntry.userId,
          action: auditEntry.action,
          resource: auditEntry.resource || '',
          ipAddress: auditEntry.ipAddress,
          userAgent: auditEntry.userAgent,
          createdAt: auditEntry.createdAt
        }
      });
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }
    
    // Store in Redis for real-time access
    await this.redis.setex(`audit:${auditEntry.id}`, 86400, JSON.stringify(auditEntry));
    
    const processingTime = performance.now() - startTime;
    this.updateSecurityMetrics(processingTime, !!(action.includes('granted') || action.includes('created')));
    
    return auditEntry.id;
  }

  /**
   * Update security metrics
   */
  private updateSecurityMetrics(processingTime: number, success: boolean): void {
    this.securityMetrics.totalAccesses++;
    this.securityMetrics.auditLogEntries++;
    
    if (!success) {
      this.securityMetrics.unauthorizedAttempts++;
    }
    
    // Update average processing time
    const totalTime = this.securityMetrics.averageProcessingTime * (this.securityMetrics.totalAccesses - 1) + processingTime;
    this.securityMetrics.averageProcessingTime = totalTime / this.securityMetrics.totalAccesses;
    
    // Update last security incident
    if (!success) {
      this.securityMetrics.lastSecurityIncident = new Date();
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    return {
      ...this.securityMetrics,
      averageProcessingTime: Math.round(this.securityMetrics.averageProcessingTime * 100) / 100
    };
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<AuditLogEntry[]> {
    const { limit = 100, ...otherFilters } = filters;
    
    try {
      const whereClause: any = {};
      
      if (otherFilters.userId) whereClause.userId = otherFilters.userId;
      if (otherFilters.action) whereClause.action = otherFilters.action;
      if (otherFilters.resource) whereClause.resource = otherFilters.resource;
      if (otherFilters.startDate || otherFilters.endDate) {
        whereClause.createdAt = {};
        if (otherFilters.startDate) whereClause.createdAt.gte = otherFilters.startDate;
        if (otherFilters.endDate) whereClause.createdAt.lte = otherFilters.endDate;
      }
      
      const auditLogs = await this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      return auditLogs.map(log => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: log.resource || '',
        ipAddress: log.ipAddress || '',
        userAgent: log.userAgent || '',
        createdAt: log.createdAt
      }));
      
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Deep clone object
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; metrics: SecurityMetrics }> {
    try {
      await this.redis.ping();
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        metrics: await this.getSecurityMetrics()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: this.securityMetrics
      };
    }
  }
} 