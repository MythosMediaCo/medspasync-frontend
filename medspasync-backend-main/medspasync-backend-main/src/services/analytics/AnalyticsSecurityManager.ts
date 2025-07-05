import { z } from 'zod';
import { createHash, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
// import { logger } from '@/lib/logger';

// Input validation schemas
const AnalyticsAccessSchema = z.object({
  user_id: z.string().uuid(),
  spa_id: z.string().uuid(),
  data_types: z.array(z.enum(['revenue', 'patient_data', 'provider_metrics', 'treatment_data'])),
  access_level: z.enum(['read', 'aggregate', 'export']),
  purpose: z.string().min(10).max(500),
  time_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  })
});

const SecureExportSchema = z.object({
  data_types: z.array(z.string()),
  anonymization_level: z.enum(['AGGREGATE_ONLY', 'REMOVE_PII', 'HASH_IDENTIFIERS', 'FULL_ANONYMIZATION']),
  export_format: z.enum(['CSV', 'JSON', 'PDF']),
  purpose: z.string().min(10).max(500)
});

// Type definitions
interface AccessValidation {
  access_token: string;
  anonymization_required: boolean;
  expiry: Date;
  restrictions: string[];
}

interface AnonymizedData {
  data: any;
  anonymization_level: string;
  phi_removed: boolean;
  identifiers_hashed: boolean;
}

interface SecureExport {
  export_id: string;
  download_url: string;
  encryption_key: string;
  expiry: Date;
  file_size: number;
  checksum: string;
}

type AnonymizationLevel = 'AGGREGATE_ONLY' | 'REMOVE_PII' | 'HASH_IDENTIFIERS' | 'FULL_ANONYMIZATION';

class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class AnalyticsSecurityManager {
  private prisma: PrismaClient;
  private auditLogger: any; // Would be implemented with actual audit logging
  private dataAnonymizer: DataAnonymizer;

  constructor() {
    this.prisma = new PrismaClient();
    this.dataAnonymizer = new DataAnonymizer();
  }

  async validateAnalyticsAccess(request: z.infer<typeof AnalyticsAccessSchema>): Promise<AccessValidation> {
    const validation = AnalyticsAccessSchema.parse(request);

    // Check user permissions
    const permissions = await this.getUserAnalyticsPermissions(validation.user_id);

    // Validate access level
    if (!permissions.allowed_access_levels.includes(validation.access_level)) {
      throw new SecurityError('Insufficient permissions for requested access level');
    }

    // Validate data types
    const unauthorizedTypes = validation.data_types.filter(
      type => !permissions.allowed_data_types.includes(type)
    );

    if (unauthorizedTypes.length > 0) {
      throw new SecurityError(`Unauthorized data types: ${unauthorizedTypes.join(', ')}`);
    }

    // Log access request
    await this.auditLogger.logAnalyticsAccess({
      user_id: validation.user_id,
      spa_id: validation.spa_id,
      data_types: validation.data_types,
      access_level: validation.access_level,
      purpose: validation.purpose,
      time_range: validation.time_range,
      timestamp: new Date(),
      session_id: this.getCurrentSessionId(),
      ip_address: this.getCurrentIPAddress()
    });

    return {
      access_token: this.generateAccessToken(validation),
      anonymization_required: this.requiresAnonymization(validation),
      expiry: new Date(Date.now() + 3600000), // 1 hour
      restrictions: await this.calculateRestrictions(validation)
    };
  }

  async anonymizeAnalyticsData(data: any, level: AnonymizationLevel): Promise<AnonymizedData> {
    switch (level) {
      case 'AGGREGATE_ONLY':
        return this.dataAnonymizer.aggregateOnly(data);
      case 'REMOVE_PII':
        return this.dataAnonymizer.removePII(data);
      case 'HASH_IDENTIFIERS':
        return this.dataAnonymizer.hashIdentifiers(data);
      case 'FULL_ANONYMIZATION':
        return this.dataAnonymizer.fullAnonymization(data);
      default:
        throw new Error(`Unknown anonymization level: ${level}`);
    }
  }

  async generateSecureExport(
    data: any,
    user_id: string,
    spa_id: string,
    exportRequest: z.infer<typeof SecureExportSchema>
  ): Promise<SecureExport> {
    // const validated = SecureExportSchema.parse(exportRequest);

    // Anonymize data based on export permissions
    const permissions = await this.getUserExportPermissions(user_id);
    const anonymizedData = await this.anonymizeAnalyticsData(data, permissions.anonymization_level);

    // Create secure export package
    const exportId = randomBytes(16).toString('hex');
    const encryption_key = randomBytes(32);

    const encryptedData = await this.encryptData(anonymizedData);

    // Store export record
    await this.auditLogger.logDataExport({
      export_id: exportId,
      user_id,
      spa_id,
      data_types: data.types,
      record_count: data.records.length,
      anonymization_level: permissions.anonymization_level,
      timestamp: new Date()
    });

    return {
      export_id: exportId,
      download_url: await this.generateSecureDownloadURL(exportId),
      encryption_key: encryption_key.toString('base64'),
      expiry: new Date(Date.now() + 86400000), // 24 hours
      file_size: encryptedData.length,
      checksum: createHash('sha256').update(encryptedData).digest('hex')
    };
  }

  private async getUserAnalyticsPermissions(user_id: string) {
    // Get user role and permissions
    const user = await this.prisma.user.findUnique({
      where: { id: user_id }
    });

    if (!user) {
      throw new SecurityError('User not found');
    }

    // Define role-based permissions
    const rolePermissions = {
      ADMIN: {
        allowed_access_levels: ['read', 'aggregate', 'export'],
        allowed_data_types: ['revenue', 'patient_data', 'provider_metrics', 'treatment_data']
      },
      MANAGER: {
        allowed_access_levels: ['read', 'aggregate'],
        allowed_data_types: ['revenue', 'provider_metrics', 'treatment_data']
      },
      STAFF: {
        allowed_access_levels: ['read'],
        allowed_data_types: ['revenue', 'treatment_data']
      }
    };

    return rolePermissions[user.role as keyof typeof rolePermissions] || rolePermissions.STAFF;
  }

  private async getUserExportPermissions(user_id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: user_id }
    });

    // Define export permissions by role
    const exportPermissions = {
      ADMIN: {
        anonymization_level: 'REMOVE_PII' as AnonymizationLevel,
        allowed_formats: ['CSV', 'JSON', 'PDF']
      },
      MANAGER: {
        anonymization_level: 'HASH_IDENTIFIERS' as AnonymizationLevel,
        allowed_formats: ['CSV', 'JSON']
      },
      STAFF: {
        anonymization_level: 'AGGREGATE_ONLY' as AnonymizationLevel,
        allowed_formats: ['CSV']
      }
    };

    return exportPermissions[user?.role as keyof typeof exportPermissions] || exportPermissions.STAFF;
  }

  private generateAccessToken(validation: z.infer<typeof AnalyticsAccessSchema>): string {
    const payload = {
      user_id: validation.user_id,
      spa_id: validation.spa_id,
      data_types: validation.data_types,
      access_level: validation.access_level,
      purpose: validation.purpose,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    // In production, use proper JWT signing
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private requiresAnonymization(validation: z.infer<typeof AnalyticsAccessSchema>): boolean {
    // Require anonymization for patient data access
    return validation.data_types.includes('patient_data') || 
           validation.access_level === 'export';
  }

  private async calculateRestrictions(validation: z.infer<typeof AnalyticsAccessSchema>): Promise<string[]> {
    const restrictions = [];

    if (validation.access_level === 'read') {
      restrictions.push('NO_EXPORT');
    }

    if (validation.data_types.includes('patient_data')) {
      restrictions.push('ANONYMIZATION_REQUIRED');
      restrictions.push('AUDIT_LOGGING_ENABLED');
    }

    if (validation.access_level === 'export') {
      restrictions.push('ENCRYPTION_REQUIRED');
      restrictions.push('24_HOUR_EXPIRY');
    }

    return restrictions;
  }

  private async encryptData(data: any): Promise<Buffer> {
    // In production, use proper encryption (AES-256-GCM)
    const dataString = JSON.stringify(data);
    return Buffer.from(dataString, 'utf8');
  }

  private async generateSecureDownloadURL(exportId: string): Promise<string> {
    // In production, generate signed S3 URLs or similar
    return `/api/analytics/exports/${exportId}/download`;
  }

  private getCurrentSessionId(): string {
    // In production, get from session management
    return randomBytes(16).toString('hex');
  }

  private getCurrentIPAddress(): string {
    // In production, get from request context
    return '127.0.0.1';
  }
}

// Data anonymization utilities
class DataAnonymizer {
  aggregateOnly(data: any): AnonymizedData {
    // Only return aggregated statistics, no individual records
    const aggregated = {
      total_count: data.records?.length || 0,
      summary_stats: this.calculateSummaryStats(data),
      trends: this.calculateTrends(data)
    };

    return {
      data: aggregated,
      anonymization_level: 'AGGREGATE_ONLY',
      phi_removed: true,
      identifiers_hashed: false
    };
  }

  removePII(data: any): AnonymizedData {
    // Remove personally identifiable information
    const anonymized = this.deepClone(data);
    
    if (anonymized.records) {
      anonymized.records = anonymized.records.map((record: any) => {
        const { name, email, phone, address, ...anonymizedRecord } = record;
        return {
          ...anonymizedRecord,
          patient_id: this.hashIdentifier(record.patient_id || ''),
          provider_id: this.hashIdentifier(record.provider_id || '')
        };
      });
    }

    return {
      data: anonymized,
      anonymization_level: 'REMOVE_PII',
      phi_removed: true,
      identifiers_hashed: true
    };
  }

  hashIdentifiers(data: any): AnonymizedData {
    // Hash all identifiers but keep structure
    const hashed = this.deepClone(data);
    
    if (hashed.records) {
      hashed.records = hashed.records.map((record: any) => {
        const hashedRecord: any = {};
        for (const [key, value] of Object.entries(record)) {
          if (this.isIdentifier(key)) {
            hashedRecord[key] = this.hashIdentifier(value as string);
          } else {
            hashedRecord[key] = value;
          }
        }
        return hashedRecord;
      });
    }

    return {
      data: hashed,
      anonymization_level: 'HASH_IDENTIFIERS',
      phi_removed: false,
      identifiers_hashed: true
    };
  }

  fullAnonymization(data: any): AnonymizedData {
    // Maximum anonymization - only aggregate statistics
    return this.aggregateOnly(data);
  }

  private calculateSummaryStats(data: any) {
    // Calculate summary statistics
    const records = data.records || [];
    const amounts = records.map((r: any) => r.amount || 0).filter((a: number) => !isNaN(a));
    
    return {
      count: records.length,
      total_amount: amounts.reduce((sum: number, amount: number) => sum + amount, 0),
      avg_amount: amounts.length > 0 ? amounts.reduce((sum: number, amount: number) => sum + amount, 0) / amounts.length : 0,
      min_amount: amounts.length > 0 ? Math.min(...amounts) : 0,
      max_amount: amounts.length > 0 ? Math.max(...amounts) : 0
    };
  }

  private calculateTrends(data: any) {
    // Calculate trends over time
    const records = data.records || [];
    const dailyTotals = new Map<string, number>();
    
    records.forEach((record: any) => {
      const date = new Date(record.created_at || record.date).toISOString().split('T')[0];
      dailyTotals.set(date || '', (dailyTotals.get(date || '') || 0) + (record.amount || 0));
    });

    return Array.from(dailyTotals.entries()).map(([date, total]) => ({
      date,
      total
    }));
  }

  private hashIdentifier(value: string): string {
    if (!value) return '';
    return createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  private isIdentifier(key: string): boolean {
    const identifierKeys = ['id', 'patient_id', 'provider_id', 'user_id', 'spa_id', 'email', 'phone'];
    return identifierKeys.some(idKey => key.toLowerCase().includes(idKey));
  }

  private deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }
}

// Analytics Security Middleware
export function requireAnalyticsPermission(dataTypes: string[], accessLevel: string) {
  return async (req: any, res: any, next: any) => {
    try {
      const securityManager = new AnalyticsSecurityManager();
      
      const validation = await securityManager.validateAnalyticsAccess({
        user_id: req.user.id,
        spa_id: req.params.spa_id || req.user.spa_id,
        data_types: dataTypes as ("revenue" | "patient_data" | "provider_metrics" | "treatment_data")[],
        access_level: accessLevel as "aggregate" | "read" | "export",
        purpose: req.headers['x-analytics-purpose'] as string || 'Dashboard access',
        time_range: {
          start: req.query.start_date as string || new Date().toISOString(),
          end: req.query.end_date as string || new Date().toISOString()
        }
      });
      
      req.analytics_access = validation;
      next();
      
    } catch (error) {
      if (error instanceof SecurityError) {
        return res.status(403).json({ error: error.message });
      }
      
      console.error('Analytics security validation failed', { error, user: req.user.id });
      res.status(500).json({ error: 'Security validation failed' });
    }
  };
} 