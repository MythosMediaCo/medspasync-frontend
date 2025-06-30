# MedSpaSync Pro - Phase 2: Security Architecture Framework

## 1. Zero-Trust Security Model Implementation

### 1.1 Zero-Trust Principles

```typescript
// Zero-Trust Security Service
class ZeroTrustSecurityService {
  private readonly NEVER_TRUST_ALWAYS_VERIFY = true;
  private readonly LEAST_PRIVILEGE_ACCESS = true;
  private readonly ASSUME_BREACH = true;

  async verifyRequest(request: Request): Promise<SecurityContext> {
    // 1. Verify Identity
    const identity = await this.verifyIdentity(request);
    
    // 2. Verify Device
    const device = await this.verifyDevice(request);
    
    // 3. Verify Network
    const network = await this.verifyNetwork(request);
    
    // 4. Verify Application
    const application = await this.verifyApplication(request);
    
    // 5. Verify Data Access
    const dataAccess = await this.verifyDataAccess(request, identity);
    
    return {
      identity,
      device,
      network,
      application,
      dataAccess,
      riskScore: this.calculateRiskScore(identity, device, network, application, dataAccess)
    };
  }

  private async verifyIdentity(request: Request): Promise<IdentityContext> {
    const token = this.extractToken(request);
    const user = await this.validateJWT(token);
    const mfaStatus = await this.verifyMFA(request);
    const sessionValid = await this.validateSession(request);
    
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      mfaVerified: mfaStatus,
      sessionValid,
      lastLogin: user.lastLogin,
      loginAttempts: user.loginAttempts
    };
  }

  private async verifyDevice(request: Request): Promise<DeviceContext> {
    const deviceId = this.extractDeviceId(request);
    const deviceTrust = await this.checkDeviceTrust(deviceId);
    const deviceCompliance = await this.checkDeviceCompliance(deviceId);
    
    return {
      deviceId,
      trusted: deviceTrust,
      compliant: deviceCompliance,
      lastSeen: new Date(),
      location: this.extractLocation(request)
    };
  }

  private calculateRiskScore(...contexts: any[]): number {
    let riskScore = 0;
    
    // Identity risk factors
    if (!contexts[0].mfaVerified) riskScore += 30;
    if (contexts[0].loginAttempts > 3) riskScore += 20;
    
    // Device risk factors
    if (!contexts[1].trusted) riskScore += 25;
    if (!contexts[1].compliant) riskScore += 15;
    
    // Network risk factors
    if (contexts[2].untrustedNetwork) riskScore += 20;
    if (contexts[2].vpnRequired && !contexts[2].vpnConnected) riskScore += 30;
    
    return Math.min(riskScore, 100);
  }
}
```

### 1.2 Continuous Verification

```typescript
// Continuous Verification Service
class ContinuousVerificationService {
  private verificationInterval = 30000; // 30 seconds
  private activeSessions = new Map<string, SessionContext>();

  async startContinuousVerification(sessionId: string, context: SecurityContext): Promise<void> {
    this.activeSessions.set(sessionId, {
      context,
      lastVerified: new Date(),
      verificationCount: 0
    });

    // Start periodic verification
    setInterval(async () => {
      await this.verifySession(sessionId);
    }, this.verificationInterval);
  }

  private async verifySession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const currentContext = await this.securityService.verifyRequest(session.context.request);
    const riskChange = Math.abs(currentContext.riskScore - session.context.riskScore);

    // If risk increased significantly, require re-authentication
    if (riskChange > 20) {
      await this.requireReAuthentication(sessionId);
    }

    // Update session context
    session.context = currentContext;
    session.lastVerified = new Date();
    session.verificationCount++;
  }

  private async requireReAuthentication(sessionId: string): Promise<void> {
    // Invalidate current session
    await this.sessionService.invalidate(sessionId);
    
    // Log security event
    await this.auditService.logSecurityEvent({
      type: 'RE_AUTHENTICATION_REQUIRED',
      sessionId,
      reason: 'Risk score increased significantly',
      timestamp: new Date()
    });
  }
}
```

## 2. Authentication & Authorization Architecture

### 2.1 Multi-Factor Authentication (MFA)

```typescript
// MFA Service Implementation
class MFAService {
  private totpService: TOTPService;
  private smsService: SMSService;
  private emailService: EmailService;

  async setupMFA(userId: string, method: MFAMethod): Promise<MFASetupResult> {
    switch (method) {
      case 'TOTP':
        return await this.setupTOTP(userId);
      case 'SMS':
        return await this.setupSMS(userId);
      case 'EMAIL':
        return await this.setupEmail(userId);
      default:
        throw new Error('Unsupported MFA method');
    }
  }

  private async setupTOTP(userId: string): Promise<MFASetupResult> {
    const secret = speakeasy.generateSecret({
      name: `MedSpaSync (${userId})`,
      issuer: 'MedSpaSync Pro'
    });

    // Store encrypted secret in Azure Key Vault
    await this.keyVaultService.setSecret(`mfa-${userId}`, secret.base32);

    return {
      method: 'TOTP',
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      backupCodes: await this.generateBackupCodes(userId)
    };
  }

  async verifyMFA(userId: string, method: MFAMethod, token: string): Promise<boolean> {
    switch (method) {
      case 'TOTP':
        return await this.verifyTOTP(userId, token);
      case 'SMS':
        return await this.verifySMS(userId, token);
      case 'EMAIL':
        return await this.verifyEmail(userId, token);
      default:
        return false;
    }
  }

  private async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secret = await this.keyVaultService.getSecret(`mfa-${userId}`);
    
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps for clock skew
      algorithm: 'sha256'
    });
  }

  private async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    
    // Store hashed backup codes
    const hashedCodes = await Promise.all(
      codes.map(code => bcrypt.hash(code, 12))
    );
    
    await this.keyVaultService.setSecret(`backup-codes-${userId}`, JSON.stringify(hashedCodes));
    
    return codes;
  }
}
```

### 2.2 Role-Based Access Control (RBAC)

```typescript
// RBAC Service Implementation
class RBACService {
  private permissionMatrix = {
    ADMIN: {
      permissions: ['*'],
      resources: ['*'],
      actions: ['*']
    },
    PRACTITIONER: {
      permissions: [
        'read:patients',
        'write:patients',
        'read:appointments',
        'write:appointments',
        'read:services',
        'read:reports'
      ],
      resources: ['patients', 'appointments', 'services', 'reports'],
      actions: ['read', 'write']
    },
    STAFF: {
      permissions: [
        'read:patients',
        'read:appointments',
        'write:appointments',
        'read:services'
      ],
      resources: ['patients', 'appointments', 'services'],
      actions: ['read', 'write']
    },
    MANAGER: {
      permissions: [
        'read:*',
        'write:appointments',
        'write:services',
        'read:reports',
        'write:reports'
      ],
      resources: ['*'],
      actions: ['read', 'write']
    }
  };

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    const userPermissions = this.permissionMatrix[user.role];

    // Check wildcard permissions
    if (userPermissions.permissions.includes('*')) {
      return true;
    }

    // Check specific permission
    const permission = `${action}:${resource}`;
    return userPermissions.permissions.includes(permission);
  }

  async enforceRBAC(request: Request, response: Response, next: NextFunction): Promise<void> {
    const resource = this.extractResource(request.path);
    const action = this.extractAction(request.method);
    const userId = request.user.id;

    const hasPermission = await this.checkPermission(userId, resource, action);
    
    if (!hasPermission) {
      response.status(403).json({
        error: 'Insufficient permissions',
        required: `${action}:${resource}`,
        user: userId
      });
      return;
    }

    next();
  }

  private extractResource(path: string): string {
    const parts = path.split('/');
    return parts[1] || 'root';
  }

  private extractAction(method: string): string {
    const actionMap = {
      GET: 'read',
      POST: 'write',
      PUT: 'write',
      PATCH: 'write',
      DELETE: 'delete'
    };
    return actionMap[method] || 'read';
  }
}
```

## 3. Secrets Management & Configuration Security

### 3.1 Azure Key Vault Integration

```typescript
// Key Vault Service Implementation
class KeyVaultService {
  private client: SecretClient;
  private keyClient: KeyClient;
  private certificateClient: CertificateClient;

  constructor() {
    const credential = new DefaultAzureCredential();
    const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net/`;
    
    this.client = new SecretClient(vaultUrl, credential);
    this.keyClient = new KeyClient(vaultUrl, credential);
    this.certificateClient = new CertificateClient(vaultUrl, credential);
  }

  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value;
    } catch (error) {
      throw new Error(`Failed to retrieve secret ${secretName}: ${error.message}`);
    }
  }

  async setSecret(secretName: string, value: string): Promise<void> {
    try {
      await this.client.setSecret(secretName, value);
    } catch (error) {
      throw new Error(`Failed to set secret ${secretName}: ${error.message}`);
    }
  }

  async rotateSecret(secretName: string): Promise<string> {
    const newValue = this.generateSecureSecret();
    await this.setSecret(`${secretName}-new`, newValue);
    
    // Update application to use new secret
    await this.updateApplicationSecret(secretName, newValue);
    
    // Delete old secret
    await this.client.beginDeleteSecret(secretName);
    
    return newValue;
  }

  private generateSecureSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  async getEncryptionKey(keyName: string): Promise<KeyVaultKey> {
    try {
      return await this.keyClient.getKey(keyName);
    } catch (error) {
      throw new Error(`Failed to retrieve encryption key ${keyName}: ${error.message}`);
    }
  }

  async encryptData(keyName: string, data: string): Promise<string> {
    const key = await this.getEncryptionKey(keyName);
    const algorithm = 'RSA-OAEP';
    
    const result = await this.keyClient.encrypt({
      name: keyName,
      algorithm,
      plaintext: Buffer.from(data, 'utf8')
    });
    
    return result.result.toString('base64');
  }

  async decryptData(keyName: string, encryptedData: string): Promise<string> {
    const algorithm = 'RSA-OAEP';
    
    const result = await this.keyClient.decrypt({
      name: keyName,
      algorithm,
      ciphertext: Buffer.from(encryptedData, 'base64')
    });
    
    return result.result.toString('utf8');
  }
}
```

### 3.2 Configuration Security

```typescript
// Secure Configuration Service
class SecureConfigurationService {
  private keyVault: KeyVaultService;
  private cache: Map<string, any> = new Map();

  async getConfiguration(key: string): Promise<any> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Retrieve from Key Vault
    const value = await this.keyVault.getSecret(key);
    const parsed = JSON.parse(value);
    
    // Cache for performance
    this.cache.set(key, parsed);
    
    return parsed;
  }

  async getDatabaseConfig(): Promise<DatabaseConfig> {
    return await this.getConfiguration('database-config');
  }

  async getAPIConfig(): Promise<APIConfig> {
    return await this.getConfiguration('api-config');
  }

  async getSecurityConfig(): Promise<SecurityConfig> {
    return await this.getConfiguration('security-config');
  }

  // Environment-specific configuration
  async getEnvironmentConfig(): Promise<EnvironmentConfig> {
    const env = process.env.NODE_ENV || 'development';
    return await this.getConfiguration(`${env}-config`);
  }
}

// Configuration validation
class ConfigurationValidator {
  private schemas = {
    database: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().port().required(),
      database: Joi.string().required(),
      username: Joi.string().required(),
      ssl: Joi.boolean().default(true)
    }),
    
    security: Joi.object({
      jwtSecret: Joi.string().min(32).required(),
      jwtExpiry: Joi.number().min(300).max(86400).required(),
      mfaRequired: Joi.boolean().default(true),
      passwordPolicy: Joi.object({
        minLength: Joi.number().min(8).required(),
        requireUppercase: Joi.boolean().default(true),
        requireLowercase: Joi.boolean().default(true),
        requireNumbers: Joi.boolean().default(true),
        requireSpecialChars: Joi.boolean().default(true)
      })
    })
  };

  async validateConfiguration(config: any, type: string): Promise<ValidationResult> {
    const schema = this.schemas[type];
    if (!schema) {
      throw new Error(`Unknown configuration type: ${type}`);
    }

    const { error, value } = schema.validate(config);
    
    return {
      valid: !error,
      value,
      errors: error ? error.details : []
    };
  }
}
```

## 4. Audit Logging & Compliance Monitoring

### 4.1 Comprehensive Audit System

```typescript
// Audit Service Implementation
class AuditService {
  private database: Database;
  private eventQueue: EventQueue;

  async logEvent(event: AuditEvent): Promise<void> {
    // Add metadata
    const enrichedEvent = {
      ...event,
      timestamp: new Date(),
      correlationId: this.generateCorrelationId(),
      sessionId: event.sessionId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent
    };

    // Store in database
    await this.storeAuditEvent(enrichedEvent);

    // Send to event queue for real-time monitoring
    await this.eventQueue.publish('audit.events', enrichedEvent);
  }

  async logPHIAccess(userId: string, resource: string, action: string, recordId: string): Promise<void> {
    await this.logEvent({
      type: 'PHI_ACCESS',
      userId,
      resource,
      action,
      recordId,
      severity: 'HIGH',
      metadata: {
        phiAccessed: true,
        dataType: this.determinePHIType(resource)
      }
    });
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.logEvent({
      type: 'SECURITY_EVENT',
      userId: event.userId,
      resource: event.resource,
      action: event.action,
      severity: event.severity,
      metadata: {
        threatLevel: event.threatLevel,
        sourceIP: event.sourceIP,
        userAgent: event.userAgent
      }
    });
  }

  async logComplianceEvent(event: ComplianceEvent): Promise<void> {
    await this.logEvent({
      type: 'COMPLIANCE_EVENT',
      userId: event.userId,
      resource: event.resource,
      action: event.action,
      severity: 'MEDIUM',
      metadata: {
        complianceType: event.complianceType,
        regulation: event.regulation,
        requirement: event.requirement
      }
    });
  }

  private async storeAuditEvent(event: AuditEvent): Promise<void> {
    await this.database.query(`
      INSERT INTO audit_logs (
        user_id, action, table_name, record_id, 
        old_values, new_values, ip_address, 
        user_agent, metadata, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      event.userId,
      event.action,
      event.resource,
      event.recordId,
      event.oldValues ? JSON.stringify(event.oldValues) : null,
      event.newValues ? JSON.stringify(event.newValues) : null,
      event.ipAddress,
      event.userAgent,
      JSON.stringify(event.metadata),
      event.severity
    ]);
  }

  private determinePHIType(resource: string): string {
    const phiTypes = {
      'patients': 'PATIENT_DEMOGRAPHICS',
      'appointments': 'MEDICAL_RECORDS',
      'medical_records': 'MEDICAL_RECORDS',
      'billing': 'BILLING_INFORMATION'
    };
    return phiTypes[resource] || 'UNKNOWN';
  }
}
```

### 4.2 Real-Time Compliance Monitoring

```typescript
// Compliance Monitoring Service
class ComplianceMonitoringService {
  private auditService: AuditService;
  private alertService: AlertService;
  private rules: ComplianceRule[];

  constructor() {
    this.rules = this.loadComplianceRules();
  }

  private loadComplianceRules(): ComplianceRule[] {
    return [
      {
        id: 'HIPAA_ACCESS_CONTROL',
        name: 'HIPAA Access Control',
        description: 'Monitor access to PHI',
        condition: (event) => event.type === 'PHI_ACCESS',
        action: async (event) => {
          await this.alertService.sendAlert({
            type: 'COMPLIANCE_ALERT',
            severity: 'HIGH',
            message: `PHI accessed by user ${event.userId}`,
            metadata: event
          });
        }
      },
      {
        id: 'MULTIPLE_FAILED_LOGINS',
        name: 'Multiple Failed Login Attempts',
        description: 'Detect potential brute force attacks',
        condition: (event) => event.type === 'LOGIN_FAILED',
        action: async (event) => {
          const failedAttempts = await this.countFailedLogins(event.userId, 15);
          if (failedAttempts > 5) {
            await this.alertService.sendAlert({
              type: 'SECURITY_ALERT',
              severity: 'HIGH',
              message: `Multiple failed login attempts for user ${event.userId}`,
              metadata: { failedAttempts, userId: event.userId }
            });
          }
        }
      },
      {
        id: 'UNUSUAL_ACCESS_PATTERN',
        name: 'Unusual Access Pattern',
        description: 'Detect unusual access patterns',
        condition: (event) => event.type === 'PHI_ACCESS',
        action: async (event) => {
          const accessPattern = await this.analyzeAccessPattern(event.userId);
          if (accessPattern.riskScore > 0.7) {
            await this.alertService.sendAlert({
              type: 'ANOMALY_ALERT',
              severity: 'MEDIUM',
              message: `Unusual access pattern detected for user ${event.userId}`,
              metadata: { accessPattern, userId: event.userId }
            });
          }
        }
      }
    ];
  }

  async processEvent(event: AuditEvent): Promise<void> {
    for (const rule of this.rules) {
      if (rule.condition(event)) {
        await rule.action(event);
      }
    }
  }

  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    const events = await this.auditService.getEvents(startDate, endDate);
    
    return {
      period: { startDate, endDate },
      totalEvents: events.length,
      phiAccessEvents: events.filter(e => e.type === 'PHI_ACCESS').length,
      securityEvents: events.filter(e => e.type === 'SECURITY_EVENT').length,
      complianceEvents: events.filter(e => e.type === 'COMPLIANCE_EVENT').length,
      riskScore: this.calculateOverallRiskScore(events),
      recommendations: this.generateRecommendations(events)
    };
  }

  private calculateOverallRiskScore(events: AuditEvent[]): number {
    let riskScore = 0;
    
    // PHI access without proper authorization
    const unauthorizedPHIAccess = events.filter(e => 
      e.type === 'PHI_ACCESS' && e.severity === 'HIGH'
    ).length;
    riskScore += unauthorizedPHIAccess * 10;
    
    // Security events
    const securityEvents = events.filter(e => e.type === 'SECURITY_EVENT').length;
    riskScore += securityEvents * 5;
    
    return Math.min(riskScore, 100);
  }
}
```

## 5. Threat Modeling & Risk Assessment

### 5.1 Threat Model

```typescript
// Threat Modeling Service
class ThreatModelingService {
  private threats = [
    {
      id: 'THREAT_001',
      name: 'Unauthorized Access to PHI',
      description: 'Attackers gain unauthorized access to patient health information',
      likelihood: 'MEDIUM',
      impact: 'HIGH',
      mitigations: [
        'Multi-factor authentication',
        'Role-based access control',
        'Encryption at rest and in transit',
        'Audit logging'
      ]
    },
    {
      id: 'THREAT_002',
      name: 'Data Breach',
      description: 'Sensitive data is exposed through system vulnerabilities',
      likelihood: 'LOW',
      impact: 'CRITICAL',
      mitigations: [
        'Regular security assessments',
        'Vulnerability scanning',
        'Penetration testing',
        'Incident response procedures'
      ]
    },
    {
      id: 'THREAT_003',
      name: 'Insider Threat',
      description: 'Authorized users misuse their access privileges',
      likelihood: 'MEDIUM',
      impact: 'HIGH',
      mitigations: [
        'Least privilege access',
        'Continuous monitoring',
        'Behavioral analytics',
        'Regular access reviews'
      ]
    },
    {
      id: 'THREAT_004',
      name: 'Denial of Service',
      description: 'Attackers overwhelm the system to disrupt services',
      likelihood: 'MEDIUM',
      impact: 'MEDIUM',
      mitigations: [
        'DDoS protection',
        'Rate limiting',
        'Load balancing',
        'Auto-scaling'
      ]
    }
  ];

  async assessThreats(): Promise<ThreatAssessment> {
    const assessment = {
      threats: this.threats,
      overallRisk: this.calculateOverallRisk(),
      recommendations: this.generateRecommendations(),
      lastUpdated: new Date()
    };

    return assessment;
  }

  private calculateOverallRisk(): RiskLevel {
    const highImpactThreats = this.threats.filter(t => t.impact === 'HIGH' || t.impact === 'CRITICAL');
    const mediumLikelihoodThreats = this.threats.filter(t => t.likelihood === 'MEDIUM' || t.likelihood === 'HIGH');
    
    if (highImpactThreats.length > 2 && mediumLikelihoodThreats.length > 2) {
      return 'HIGH';
    } else if (highImpactThreats.length > 1 || mediumLikelihoodThreats.length > 2) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  private generateRecommendations(): string[] {
    return [
      'Implement comprehensive MFA for all user accounts',
      'Conduct regular security awareness training',
      'Perform quarterly penetration testing',
      'Establish incident response procedures',
      'Implement real-time threat detection',
      'Regular access privilege reviews'
    ];
  }
}
```

### 5.2 Risk Assessment Framework

```typescript
// Risk Assessment Service
class RiskAssessmentService {
  async performRiskAssessment(): Promise<RiskAssessment> {
    const [
      technicalRisks,
      operationalRisks,
      complianceRisks,
      businessRisks
    ] = await Promise.all([
      this.assessTechnicalRisks(),
      this.assessOperationalRisks(),
      this.assessComplianceRisks(),
      this.assessBusinessRisks()
    ]);

    return {
      technicalRisks,
      operationalRisks,
      complianceRisks,
      businessRisks,
      overallRisk: this.calculateOverallRisk([
        technicalRisks,
        operationalRisks,
        complianceRisks,
        businessRisks
      ]),
      recommendations: this.generateRiskRecommendations([
        technicalRisks,
        operationalRisks,
        complianceRisks,
        businessRisks
      ])
    };
  }

  private async assessTechnicalRisks(): Promise<RiskCategory> {
    const vulnerabilities = await this.scanVulnerabilities();
    const securityControls = await this.assessSecurityControls();
    
    return {
      category: 'TECHNICAL',
      risks: [
        {
          id: 'TECH_001',
          name: 'Vulnerability Exposure',
          likelihood: this.calculateLikelihood(vulnerabilities.length),
          impact: 'HIGH',
          score: this.calculateRiskScore(vulnerabilities.length, 'HIGH')
        },
        {
          id: 'TECH_002',
          name: 'Insufficient Security Controls',
          likelihood: this.calculateLikelihood(securityControls.gaps),
          impact: 'HIGH',
          score: this.calculateRiskScore(securityControls.gaps, 'HIGH')
        }
      ]
    };
  }

  private async assessComplianceRisks(): Promise<RiskCategory> {
    const hipaaCompliance = await this.assessHIPAACompliance();
    const auditFindings = await this.getAuditFindings();
    
    return {
      category: 'COMPLIANCE',
      risks: [
        {
          id: 'COMP_001',
          name: 'HIPAA Non-Compliance',
          likelihood: this.calculateLikelihood(hipaaCompliance.violations),
          impact: 'CRITICAL',
          score: this.calculateRiskScore(hipaaCompliance.violations, 'CRITICAL')
        },
        {
          id: 'COMP_002',
          name: 'Audit Failures',
          likelihood: this.calculateLikelihood(auditFindings.critical),
          impact: 'HIGH',
          score: this.calculateRiskScore(auditFindings.critical, 'HIGH')
        }
      ]
    };
  }

  private calculateRiskScore(factor: number, impact: ImpactLevel): number {
    const impactMultiplier = {
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3,
      'CRITICAL': 4
    };
    
    return Math.min(factor * impactMultiplier[impact], 100);
  }
}
```

This security architecture framework provides a comprehensive, zero-trust approach to securing the MedSpaSync Pro healthcare platform with full HIPAA compliance and enterprise-grade security controls. 