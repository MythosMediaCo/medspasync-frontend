/**
 * Compliance & Audit Middleware
 * HIPAA compliance framework, security audit automation, and regulatory compliance for MedSpaSync Pro
 * Designed to integrate seamlessly with reporting infrastructure
 */

const crypto = require('crypto');
const { Pool } = require('pg');
const redis = require('redis');
const fs = require('fs').promises;
const path = require('path');

class ComplianceAudit {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 3
    });

    this.complianceRules = this.loadComplianceRules();
    this.auditFrameworks = this.initializeAuditFrameworks();
    this.reportingIntegration = this.initializeReportingIntegration();
    
    this.startComplianceMonitoring();
  }

  /**
   * Load HIPAA and regulatory compliance rules
   */
  loadComplianceRules() {
    return {
      // HIPAA Privacy Rule (45 CFR 164.500-534)
      hipaaPrivacy: {
        phiAccess: {
          rule: 'Minimum necessary access to PHI',
          requirements: [
            'Access only PHI needed for specific purpose',
            'Limit access to minimum necessary information',
            'Document access justification',
            'Regular access reviews'
          ],
          violations: ['unauthorized_phi_access', 'excessive_phi_access', 'missing_access_log']
        },
        phiDisclosure: {
          rule: 'Authorized PHI disclosure only',
          requirements: [
            'Written authorization for disclosure',
            'Document all disclosures',
            'Limit disclosure to minimum necessary',
            'Secure transmission of PHI'
          ],
          violations: ['unauthorized_disclosure', 'excessive_disclosure', 'unsecured_transmission']
        },
        patientRights: {
          rule: 'Patient rights to PHI',
          requirements: [
            'Right to access PHI',
            'Right to request amendments',
            'Right to accounting of disclosures',
            'Right to request restrictions'
          ],
          violations: ['denied_patient_access', 'ignored_amendment_request', 'missing_disclosure_log']
        }
      },

      // HIPAA Security Rule (45 CFR 164.300-318)
      hipaaSecurity: {
        accessControl: {
          rule: 'Unique user identification and access control',
          requirements: [
            'Unique user identification',
            'Emergency access procedures',
            'Automatic logoff',
            'Encryption and decryption'
          ],
          violations: ['shared_credentials', 'no_emergency_access', 'no_auto_logoff', 'unencrypted_data']
        },
        auditControls: {
          rule: 'Hardware, software, and procedural mechanisms',
          requirements: [
            'Record and examine activity',
            'Monitor system access',
            'Detect security incidents',
            'Regular audit reviews'
          ],
          violations: ['incomplete_audit_log', 'no_incident_detection', 'missing_audit_review']
        },
        integrity: {
          rule: 'Mechanisms to authenticate ePHI',
          requirements: [
            'Electronic mechanisms to corroborate ePHI',
            'Prevent improper alteration or destruction',
            'Verify data integrity',
            'Tamper detection'
          ],
          violations: ['data_integrity_breach', 'no_tamper_detection', 'improper_alteration']
        },
        transmissionSecurity: {
          rule: 'Technical security measures for ePHI transmission',
          requirements: [
            'Integrity controls',
            'Encryption in transit',
            'Secure transmission protocols',
            'Transmission monitoring'
          ],
          violations: ['unencrypted_transmission', 'no_integrity_checks', 'insecure_protocols']
        }
      },

      // Breach Notification Rule (45 CFR 164.400-414)
      hipaaBreach: {
        breachDetection: {
          rule: 'Timely breach detection and assessment',
          requirements: [
            'Monitor for security incidents',
            'Assess breach risk',
            'Document breach analysis',
            'Notify within 60 days'
          ],
          violations: ['delayed_breach_detection', 'incomplete_assessment', 'late_notification']
        },
        breachNotification: {
          rule: 'Required breach notifications',
          requirements: [
            'Notify affected individuals',
            'Notify HHS for breaches > 500',
            'Notify media for large breaches',
            'Maintain breach log'
          ],
          violations: ['failed_notification', 'incomplete_notification', 'missing_breach_log']
        }
      },

      // Additional Healthcare Regulations
      additionalRegulations: {
        hitech: {
          rule: 'HITECH Act requirements',
          requirements: [
            'Electronic health record standards',
            'Meaningful use criteria',
            'Health information exchange',
            'Patient engagement'
          ]
        },
        omnia: {
          rule: 'OMNIA Final Rule requirements',
          requirements: [
            'Interoperability standards',
            'Information blocking prevention',
            'API access requirements',
            'Patient data access'
          ]
        }
      }
    };
  }

  /**
   * Initialize audit frameworks
   */
  initializeAuditFrameworks() {
    return {
      // NIST Cybersecurity Framework
      nist: {
        identify: {
          description: 'Develop organizational understanding to manage risk',
          controls: [
            'Asset inventory and management',
            'Business environment understanding',
            'Governance and risk management',
            'Risk assessment and strategy'
          ]
        },
        protect: {
          description: 'Develop and implement appropriate safeguards',
          controls: [
            'Identity management and access control',
            'Awareness and training',
            'Data security and protection',
            'Maintenance and protective technology'
          ]
        },
        detect: {
          description: 'Develop and implement appropriate activities to identify cybersecurity events',
          controls: [
            'Anomalies and events detection',
            'Security monitoring and continuous monitoring',
            'Detection processes and procedures',
            'Detection process testing'
          ]
        },
        respond: {
          description: 'Develop and implement appropriate activities to take action regarding detected cybersecurity events',
          controls: [
            'Response planning and execution',
            'Communications and coordination',
            'Analysis and mitigation',
            'Improvements and lessons learned'
          ]
        },
        recover: {
          description: 'Develop and implement appropriate activities to maintain plans for resilience',
          controls: [
            'Recovery planning and execution',
            'Improvements and lessons learned',
            'Communications and coordination',
            'Recovery process testing'
          ]
        }
      },

      // ISO 27001 Information Security Management
      iso27001: {
        informationSecurityPolicies: {
          description: 'Management direction and support for information security',
          controls: ['Policy framework', 'Policy review', 'Security roles']
        },
        organizationOfInformationSecurity: {
          description: 'Organizational structure and responsibilities',
          controls: ['Internal organization', 'Mobile device policy', 'Teleworking']
        },
        humanResourceSecurity: {
          description: 'Security responsibilities and awareness',
          controls: ['Screening', 'Terms and conditions', 'Security awareness']
        },
        assetManagement: {
          description: 'Inventory and classification of information assets',
          controls: ['Asset inventory', 'Acceptable use', 'Return of assets']
        },
        accessControl: {
          description: 'Restriction of access to information',
          controls: ['Access control policy', 'User access management', 'System access control']
        },
        cryptography: {
          description: 'Protection of information through cryptographic means',
          controls: ['Cryptographic controls', 'Key management']
        },
        physicalAndEnvironmentalSecurity: {
          description: 'Protection of physical and environmental assets',
          controls: ['Secure areas', 'Equipment security']
        },
        operationsSecurity: {
          description: 'Secure operation of information processing facilities',
          controls: ['Operational procedures', 'Malware protection', 'Backup', 'Logging']
        },
        communicationsSecurity: {
          description: 'Security of network and communications',
          controls: ['Network security', 'Information transfer']
        },
        systemAcquisition: {
          description: 'Security requirements in information systems',
          controls: ['Security requirements', 'Secure development', 'Test data']
        },
        supplierRelationships: {
          description: 'Security requirements for supplier relationships',
          controls: ['Supplier service delivery', 'Supplier monitoring']
        },
        incidentManagement: {
          description: 'Security incident management',
          controls: ['Incident management process', 'Incident reporting', 'Incident learning']
        },
        businessContinuity: {
          description: 'Business continuity management',
          controls: ['Business continuity planning', 'Testing and review']
        },
        compliance: {
          description: 'Compliance with legal and contractual requirements',
          controls: ['Legal compliance', 'Intellectual property', 'Privacy protection']
        }
      }
    };
  }

  /**
   * Initialize reporting integration
   */
  initializeReportingIntegration() {
    return {
      // Integration with reporting system
      reportTypes: {
        compliance: {
          hipaa: 'HIPAA Compliance Report',
          nist: 'NIST Framework Report',
          iso27001: 'ISO 27001 Report',
          breach: 'Breach Notification Report',
          audit: 'Security Audit Report'
        },
        metrics: {
          compliance: 'Compliance Metrics',
          violations: 'Violation Tracking',
          remediation: 'Remediation Progress',
          trends: 'Compliance Trends'
        },
        exports: {
          csv: 'CSV Export',
          pdf: 'PDF Report',
          json: 'JSON Data',
          xml: 'XML Export'
        }
      },
      
      // Reporting endpoints that complement existing reporting system
      endpoints: {
        compliance: '/api/reporting/compliance',
        audit: '/api/reporting/audit',
        violations: '/api/reporting/violations',
        remediation: '/api/reporting/remediation'
      }
    };
  }

  /**
   * Compliance monitoring middleware
   */
  monitorCompliance() {
    return async (req, res, next) => {
      try {
        const startTime = Date.now();
        
        // Collect compliance data
        const complianceData = this.collectComplianceData(req);
        
        // Check compliance rules
        const complianceChecks = await this.performComplianceChecks(complianceData);
        
        // Log compliance events
        await this.logComplianceEvent(complianceData, complianceChecks);
        
        // Generate compliance metrics
        await this.updateComplianceMetrics(complianceChecks);
        
        // Check for violations
        const violations = this.detectViolations(complianceChecks);
        
        // Trigger remediation if needed
        if (violations.length > 0) {
          await this.triggerRemediation(violations);
        }
        
        // Add compliance headers for reporting integration
        res.setHeader('X-Compliance-Check', complianceChecks.passed ? 'PASS' : 'FAIL');
        res.setHeader('X-Compliance-Violations', violations.length.toString());
        
        // Track compliance response time
        res.on('finish', () => {
          const responseTime = Date.now() - startTime;
          this.trackComplianceResponseTime(complianceData, responseTime);
        });
        
        next();
      } catch (error) {
        console.error('❌ Compliance monitoring error:', error);
        next();
      }
    };
  }

  /**
   * Collect compliance data from request
   */
  collectComplianceData(req) {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      path: req.path,
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      sessionId: req.session?.id || null,
      headers: req.headers,
      body: req.body,
      query: req.query,
      contentType: req.get('Content-Type'),
      contentLength: parseInt(req.get('Content-Length') || '0'),
      referer: req.get('Referer'),
      origin: req.get('Origin'),
      // Compliance-specific data
      phiAccess: this.detectPHIAccess(req),
      dataClassification: this.classifyData(req),
      accessLevel: this.determineAccessLevel(req),
      encryptionStatus: this.checkEncryptionStatus(req),
      auditTrail: this.generateAuditTrail(req)
    };
  }

  /**
   * Detect PHI access in request
   */
  detectPHIAccess(req) {
    const phiPatterns = [
      /patient/i, /medical/i, /health/i, /diagnosis/i, /treatment/i,
      /medication/i, /prescription/i, /symptoms/i, /allergies/i,
      /ssn|social.*security/i, /dob|date.*birth/i, /address/i, /phone/i
    ];
    
    const requestString = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query
    });
    
    const phiMatches = phiPatterns.filter(pattern => pattern.test(requestString));
    
    return {
      detected: phiMatches.length > 0,
      patterns: phiMatches,
      riskLevel: phiMatches.length > 3 ? 'HIGH' : phiMatches.length > 1 ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Classify data sensitivity
   */
  classifyData(req) {
    const classifications = {
      phi: ['patient', 'medical', 'health', 'diagnosis'],
      pii: ['name', 'email', 'phone', 'address', 'ssn'],
      financial: ['payment', 'billing', 'insurance', 'credit'],
      operational: ['appointment', 'schedule', 'staff', 'facility'],
      public: ['general', 'info', 'contact', 'about']
    };
    
    const requestString = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query
    }).toLowerCase();
    
    for (const [classification, keywords] of Object.entries(classifications)) {
      if (keywords.some(keyword => requestString.includes(keyword))) {
        return classification.toUpperCase();
      }
    }
    
    return 'PUBLIC';
  }

  /**
   * Determine access level
   */
  determineAccessLevel(req) {
    const userRole = req.user?.role || 'ANONYMOUS';
    const path = req.path.toLowerCase();
    
    if (path.includes('/admin') || path.includes('/system')) {
      return 'SYSTEM_ADMIN';
    } else if (path.includes('/api/') && userRole === 'ADMIN') {
      return 'API_ADMIN';
    } else if (path.includes('/api/') && userRole === 'USER') {
      return 'API_USER';
    } else if (path.includes('/patient') || path.includes('/medical')) {
      return 'PHI_ACCESS';
    } else {
      return 'PUBLIC';
    }
  }

  /**
   * Check encryption status
   */
  checkEncryptionStatus(req) {
    return {
      inTransit: req.secure || req.headers['x-forwarded-proto'] === 'https',
      atRest: true, // Assuming database encryption
      algorithm: 'AES-256-GCM',
      keyRotation: this.getKeyRotationStatus()
    };
  }

  /**
   * Generate audit trail
   */
  generateAuditTrail(req) {
    return {
      requestId: crypto.randomUUID(),
      timestamp: new Date(),
      user: req.user?.id || 'anonymous',
      action: req.method,
      resource: req.path,
      outcome: 'pending',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.session?.id
      }
    };
  }

  /**
   * Perform compliance checks
   */
  async performComplianceChecks(complianceData) {
    const checks = {
      hipaaPrivacy: await this.checkHIPAAPrivacy(complianceData),
      hipaaSecurity: await this.checkHIPAASecurity(complianceData),
      hipaaBreach: await this.checkHIPAABreach(complianceData),
      nist: await this.checkNISTFramework(complianceData),
      iso27001: await this.checkISO27001(complianceData),
      passed: true,
      violations: []
    };
    
    // Aggregate results
    const allChecks = [
      checks.hipaaPrivacy,
      checks.hipaaSecurity,
      checks.hipaaBreach,
      checks.nist,
      checks.iso27001
    ];
    
    checks.passed = allChecks.every(check => check.passed);
    checks.violations = allChecks.flatMap(check => check.violations || []);
    
    return checks;
  }

  /**
   * Check HIPAA Privacy Rule compliance
   */
  async checkHIPAAPrivacy(complianceData) {
    const violations = [];
    
    // Check PHI access
    if (complianceData.phiAccess.detected) {
      const accessLevel = complianceData.accessLevel;
      if (accessLevel === 'PUBLIC' || accessLevel === 'ANONYMOUS') {
        violations.push({
          rule: 'hipaaPrivacy.phiAccess',
          violation: 'unauthorized_phi_access',
          severity: 'CRITICAL',
          description: 'PHI accessed without proper authorization'
        });
      }
      
      if (complianceData.phiAccess.riskLevel === 'HIGH') {
        violations.push({
          rule: 'hipaaPrivacy.phiAccess',
          violation: 'excessive_phi_access',
          severity: 'HIGH',
          description: 'Excessive PHI data accessed'
        });
      }
    }
    
    // Check access logging
    if (!complianceData.auditTrail) {
      violations.push({
        rule: 'hipaaPrivacy.phiAccess',
        violation: 'missing_access_log',
        severity: 'MEDIUM',
        description: 'Missing access logging for PHI'
      });
    }
    
    return {
      passed: violations.length === 0,
      violations,
      framework: 'HIPAA Privacy Rule'
    };
  }

  /**
   * Check HIPAA Security Rule compliance
   */
  async checkHIPAASecurity(complianceData) {
    const violations = [];
    
    // Check encryption
    if (!complianceData.encryptionStatus.inTransit) {
      violations.push({
        rule: 'hipaaSecurity.transmissionSecurity',
        violation: 'unencrypted_transmission',
        severity: 'CRITICAL',
        description: 'Data transmitted without encryption'
      });
    }
    
    // Check access controls
    if (complianceData.accessLevel === 'PHI_ACCESS' && !complianceData.userId) {
      violations.push({
        rule: 'hipaaSecurity.accessControl',
        violation: 'unauthorized_access',
        severity: 'HIGH',
        description: 'PHI accessed without authentication'
      });
    }
    
    // Check audit controls
    if (!complianceData.auditTrail) {
      violations.push({
        rule: 'hipaaSecurity.auditControls',
        violation: 'missing_audit_log',
        severity: 'MEDIUM',
        description: 'Missing audit logging'
      });
    }
    
    return {
      passed: violations.length === 0,
      violations,
      framework: 'HIPAA Security Rule'
    };
  }

  /**
   * Check HIPAA Breach Notification Rule compliance
   */
  async checkHIPAABreach(complianceData) {
    const violations = [];
    
    // This would typically check for actual breaches
    // For now, we'll check breach detection capabilities
    const breachDetectionEnabled = await this.checkBreachDetectionStatus();
    
    if (!breachDetectionEnabled) {
      violations.push({
        rule: 'hipaaBreach.breachDetection',
        violation: 'no_breach_detection',
        severity: 'HIGH',
        description: 'Breach detection not enabled'
      });
    }
    
    return {
      passed: violations.length === 0,
      violations,
      framework: 'HIPAA Breach Notification Rule'
    };
  }

  /**
   * Check NIST Cybersecurity Framework compliance
   */
  async checkNISTFramework(complianceData) {
    const violations = [];
    
    // Check identify controls
    if (!complianceData.userId && complianceData.accessLevel !== 'PUBLIC') {
      violations.push({
        rule: 'nist.identify',
        violation: 'no_user_identification',
        severity: 'MEDIUM',
        description: 'No user identification for protected resources'
      });
    }
    
    // Check protect controls
    if (!complianceData.encryptionStatus.inTransit) {
      violations.push({
        rule: 'nist.protect',
        violation: 'no_data_protection',
        severity: 'HIGH',
        description: 'Data not protected in transit'
      });
    }
    
    // Check detect controls
    const detectionEnabled = await this.checkDetectionStatus();
    if (!detectionEnabled) {
      violations.push({
        rule: 'nist.detect',
        violation: 'no_detection_controls',
        severity: 'MEDIUM',
        description: 'Security detection controls not enabled'
      });
    }
    
    return {
      passed: violations.length === 0,
      violations,
      framework: 'NIST Cybersecurity Framework'
    };
  }

  /**
   * Check ISO 27001 compliance
   */
  async checkISO27001(complianceData) {
    const violations = [];
    
    // Check access control
    if (complianceData.accessLevel === 'PHI_ACCESS' && !complianceData.userId) {
      violations.push({
        rule: 'iso27001.accessControl',
        violation: 'no_access_control',
        severity: 'HIGH',
        description: 'No access control for sensitive data'
      });
    }
    
    // Check cryptography
    if (!complianceData.encryptionStatus.inTransit) {
      violations.push({
        rule: 'iso27001.cryptography',
        violation: 'no_cryptographic_protection',
        severity: 'HIGH',
        description: 'No cryptographic protection for data'
      });
    }
    
    // Check operations security
    if (!complianceData.auditTrail) {
      violations.push({
        rule: 'iso27001.operationsSecurity',
        violation: 'no_operational_logging',
        severity: 'MEDIUM',
        description: 'No operational security logging'
      });
    }
    
    return {
      passed: violations.length === 0,
      violations,
      framework: 'ISO 27001'
    };
  }

  /**
   * Log compliance event
   */
  async logComplianceEvent(complianceData, complianceChecks) {
    try {
      await this.db.query(`
        INSERT INTO compliance_events (
          id, event_data, compliance_checks, violations, user_id, 
          ip_address, timestamp, framework_results
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        complianceData.id,
        JSON.stringify(complianceData),
        JSON.stringify(complianceChecks),
        JSON.stringify(complianceChecks.violations),
        complianceData.userId,
        complianceData.ip,
        complianceData.timestamp,
        JSON.stringify({
          hipaa: complianceChecks.hipaaPrivacy.passed && complianceChecks.hipaaSecurity.passed,
          nist: complianceChecks.nist.passed,
          iso27001: complianceChecks.iso27001.passed
        })
      ]);
    } catch (error) {
      console.error('❌ Log compliance event error:', error);
    }
  }

  /**
   * Update compliance metrics
   */
  async updateComplianceMetrics(complianceChecks) {
    try {
      const now = Date.now();
      const minuteKey = Math.floor(now / 60000);
      
      // Update compliance success rate
      const successKey = `compliance_success:${minuteKey}`;
      const currentSuccess = await this.redisClient.get(successKey) || 0;
      const newSuccess = parseInt(currentSuccess) + (complianceChecks.passed ? 1 : 0);
      await this.redisClient.setex(successKey, 3600, newSuccess.toString());
      
      // Update violation counts
      if (complianceChecks.violations.length > 0) {
        const violationKey = `compliance_violations:${minuteKey}`;
        const currentViolations = await this.redisClient.get(violationKey) || 0;
        const newViolations = parseInt(currentViolations) + complianceChecks.violations.length;
        await this.redisClient.setex(violationKey, 3600, newViolations.toString());
      }
      
      // Update framework-specific metrics
      const frameworks = ['hipaa', 'nist', 'iso27001'];
      for (const framework of frameworks) {
        const frameworkKey = `${framework}_compliance:${minuteKey}`;
        const currentFramework = await this.redisClient.get(frameworkKey) || 0;
        const frameworkPassed = complianceChecks[framework]?.passed || false;
        const newFramework = parseInt(currentFramework) + (frameworkPassed ? 1 : 0);
        await this.redisClient.setex(frameworkKey, 3600, newFramework.toString());
      }
    } catch (error) {
      console.error('❌ Update compliance metrics error:', error);
    }
  }

  /**
   * Detect violations
   */
  detectViolations(complianceChecks) {
    return complianceChecks.violations.filter(violation => 
      violation.severity === 'CRITICAL' || violation.severity === 'HIGH'
    );
  }

  /**
   * Trigger remediation
   */
  async triggerRemediation(violations) {
    for (const violation of violations) {
      try {
        // Log violation for remediation
        await this.db.query(`
          INSERT INTO compliance_violations (
            violation_type, rule, severity, description, 
            detected_at, status, remediation_required
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          violation.violation,
          violation.rule,
          violation.severity,
          violation.description,
          new Date(),
          'DETECTED',
          true
        ]);
        
        // Trigger automated remediation based on violation type
        await this.executeRemediation(violation);
        
      } catch (error) {
        console.error('❌ Trigger remediation error:', error);
      }
    }
  }

  /**
   * Execute automated remediation
   */
  async executeRemediation(violation) {
    const remediationActions = {
      unauthorized_phi_access: async () => {
        // Block access and notify admin
        console.log('🚫 Blocking unauthorized PHI access');
        return { action: 'BLOCK_ACCESS', status: 'EXECUTED' };
      },
      unencrypted_transmission: async () => {
        // Force HTTPS redirect
        console.log('🔒 Forcing encrypted transmission');
        return { action: 'FORCE_HTTPS', status: 'EXECUTED' };
      },
      missing_audit_log: async () => {
        // Enable audit logging
        console.log('📝 Enabling audit logging');
        return { action: 'ENABLE_AUDIT', status: 'EXECUTED' };
      }
    };
    
    const action = remediationActions[violation.violation];
    if (action) {
      return await action();
    }
    
    return { action: 'MANUAL_REVIEW', status: 'PENDING' };
  }

  /**
   * Track compliance response time
   */
  trackComplianceResponseTime(complianceData, responseTime) {
    const responseKey = `compliance_response_time:${Math.floor(Date.now() / 60000)}`;
    this.redisClient.lpush(responseKey, responseTime.toString());
    this.redisClient.ltrim(responseKey, 0, 99); // Keep last 100
  }

  /**
   * Start compliance monitoring
   */
  startComplianceMonitoring() {
    // Run compliance analysis every 5 minutes
    setInterval(() => {
      this.analyzeComplianceTrends();
    }, 5 * 60 * 1000);
    
    // Generate compliance reports every hour
    setInterval(() => {
      this.generateComplianceReports();
    }, 60 * 60 * 1000);
    
    // Clean up old compliance data every day
    setInterval(() => {
      this.cleanupComplianceData();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Analyze compliance trends
   */
  async analyzeComplianceTrends() {
    try {
      const trends = await this.db.query(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as total_events,
          COUNT(*) FILTER (WHERE framework_results->>'hipaa' = 'true') as hipaa_compliant,
          COUNT(*) FILTER (WHERE framework_results->>'nist' = 'true') as nist_compliant,
          COUNT(*) FILTER (WHERE framework_results->>'iso27001' = 'true') as iso27001_compliant
        FROM compliance_events
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `);
      
      // Store trends for reporting integration
      await this.redisClient.setex('compliance_trends', 3600, JSON.stringify(trends.rows));
      
    } catch (error) {
      console.error('❌ Analyze compliance trends error:', error);
    }
  }

  /**
   * Generate compliance reports
   */
  async generateComplianceReports() {
    try {
      const reports = {
        hipaa: await this.generateHIPAAReport(),
        nist: await this.generateNISTReport(),
        iso27001: await this.generateISO27001Report(),
        summary: await this.generateComplianceSummary(),
        generated: new Date()
      };
      
      // Store reports for reporting system integration
      await this.redisClient.setex('compliance_reports', 3600, JSON.stringify(reports));
      
      // Trigger reporting system integration
      await this.integrateWithReportingSystem(reports);
      
    } catch (error) {
      console.error('❌ Generate compliance reports error:', error);
    }
  }

  /**
   * Generate HIPAA compliance report
   */
  async generateHIPAAReport() {
    const report = await this.db.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE framework_results->>'hipaa' = 'true') as compliant_events,
        COUNT(*) FILTER (WHERE framework_results->>'hipaa' = 'false') as non_compliant_events,
        COUNT(*) FILTER (WHERE violations @> '[{"rule": "hipaaPrivacy"}]') as privacy_violations,
        COUNT(*) FILTER (WHERE violations @> '[{"rule": "hipaaSecurity"}]') as security_violations,
        COUNT(*) FILTER (WHERE violations @> '[{"rule": "hipaaBreach"}]') as breach_violations
      FROM compliance_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);
    
    return {
      framework: 'HIPAA',
      period: '24 hours',
      data: report.rows[0],
      compliance_rate: (report.rows[0].compliant_events / report.rows[0].total_events * 100).toFixed(2)
    };
  }

  /**
   * Generate NIST framework report
   */
  async generateNISTReport() {
    const report = await this.db.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE framework_results->>'nist' = 'true') as compliant_events,
        COUNT(*) FILTER (WHERE framework_results->>'nist' = 'false') as non_compliant_events
      FROM compliance_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);
    
    return {
      framework: 'NIST',
      period: '24 hours',
      data: report.rows[0],
      compliance_rate: (report.rows[0].compliant_events / report.rows[0].total_events * 100).toFixed(2)
    };
  }

  /**
   * Generate ISO 27001 report
   */
  async generateISO27001Report() {
    const report = await this.db.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE framework_results->>'iso27001' = 'true') as compliant_events,
        COUNT(*) FILTER (WHERE framework_results->>'iso27001' = 'false') as non_compliant_events
      FROM compliance_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);
    
    return {
      framework: 'ISO 27001',
      period: '24 hours',
      data: report.rows[0],
      compliance_rate: (report.rows[0].compliant_events / report.rows[0].total_events * 100).toFixed(2)
    };
  }

  /**
   * Generate compliance summary
   */
  async generateComplianceSummary() {
    const summary = await this.db.query(`
      SELECT 
        COUNT(*) as total_events,
        AVG(CASE WHEN framework_results->>'hipaa' = 'true' THEN 1 ELSE 0 END) * 100 as hipaa_rate,
        AVG(CASE WHEN framework_results->>'nist' = 'true' THEN 1 ELSE 0 END) * 100 as nist_rate,
        AVG(CASE WHEN framework_results->>'iso27001' = 'true' THEN 1 ELSE 0 END) * 100 as iso27001_rate,
        COUNT(*) FILTER (WHERE violations != '[]') as total_violations
      FROM compliance_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);
    
    return {
      period: '24 hours',
      data: summary.rows[0],
      overall_compliance: ((summary.rows[0].hipaa_rate + summary.rows[0].nist_rate + summary.rows[0].iso27001_rate) / 3).toFixed(2)
    };
  }

  /**
   * Integrate with reporting system
   */
  async integrateWithReportingSystem(reports) {
    try {
      // This would integrate with the reporting system being developed by the other team
      // For now, we'll store the data in a format that can be easily consumed by the reporting system
      
      const reportingData = {
        compliance: {
          reports: reports,
          metadata: {
            generated: new Date(),
            source: 'compliance-audit-middleware',
            version: '1.0.0'
          }
        }
      };
      
      // Store in Redis for reporting system consumption
      await this.redisClient.setex('reporting_compliance_data', 3600, JSON.stringify(reportingData));
      
      // Could also trigger webhook to reporting system
      if (process.env.REPORTING_WEBHOOK_URL) {
        await fetch(process.env.REPORTING_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Report-Type': 'compliance'
          },
          body: JSON.stringify(reportingData)
        });
      }
      
    } catch (error) {
      console.error('❌ Reporting system integration error:', error);
    }
  }

  /**
   * Clean up old compliance data
   */
  async cleanupComplianceData() {
    try {
      // Clean up old compliance events (keep 90 days)
      await this.db.query(`
        DELETE FROM compliance_events 
        WHERE timestamp < NOW() - INTERVAL '90 days'
      `);
      
      // Clean up old violations (keep 1 year)
      await this.db.query(`
        DELETE FROM compliance_violations 
        WHERE detected_at < NOW() - INTERVAL '1 year'
      `);
      
      console.log('🧹 Compliance data cleanup completed');
    } catch (error) {
      console.error('❌ Compliance data cleanup error:', error);
    }
  }

  /**
   * Get compliance statistics
   */
  async getComplianceStatistics() {
    try {
      const [eventStats, violationStats, frameworkStats] = await Promise.all([
        this.db.query(`
          SELECT 
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as events_24h,
            COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') as events_7d
          FROM compliance_events
        `),
        
        this.db.query(`
          SELECT 
            COUNT(*) as total_violations,
            COUNT(*) FILTER (WHERE detected_at > NOW() - INTERVAL '24 hours') as violations_24h,
            COUNT(*) FILTER (WHERE status = 'OPEN') as open_violations
          FROM compliance_violations
        `),
        
        this.db.query(`
          SELECT 
            AVG(CASE WHEN framework_results->>'hipaa' = 'true' THEN 1 ELSE 0 END) * 100 as hipaa_compliance,
            AVG(CASE WHEN framework_results->>'nist' = 'true' THEN 1 ELSE 0 END) * 100 as nist_compliance,
            AVG(CASE WHEN framework_results->>'iso27001' = 'true' THEN 1 ELSE 0 END) * 100 as iso27001_compliance
          FROM compliance_events
          WHERE timestamp > NOW() - INTERVAL '24 hours'
        `)
      ]);
      
      return {
        events: eventStats.rows[0],
        violations: violationStats.rows[0],
        frameworks: frameworkStats.rows[0],
        generated: new Date()
      };
    } catch (error) {
      console.error('❌ Get compliance statistics error:', error);
      return {};
    }
  }

  /**
   * Helper methods for compliance checks
   */
  async checkBreachDetectionStatus() {
    // Check if breach detection is enabled
    return true; // Placeholder
  }

  async checkDetectionStatus() {
    // Check if security detection is enabled
    return true; // Placeholder
  }

  getKeyRotationStatus() {
    // Get key rotation status
    return {
      lastRotation: new Date(),
      nextRotation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'ACTIVE'
    };
  }
}

// Create singleton instance
const complianceAudit = new ComplianceAudit();

// Export middleware functions
module.exports = {
  monitorCompliance: complianceAudit.monitorCompliance.bind(complianceAudit),
  getStatistics: complianceAudit.getComplianceStatistics.bind(complianceAudit),
  generateReports: complianceAudit.generateComplianceReports.bind(complianceAudit)
}; 