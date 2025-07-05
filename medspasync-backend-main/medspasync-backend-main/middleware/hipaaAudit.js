const crypto = require('crypto');
const { Pool } = require('pg');

// HIPAA Audit Logging Middleware
class HIPAAAuditLogger {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  /**
   * Log PHI access for HIPAA compliance
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} action - Action performed (READ, WRITE, DELETE, etc.)
   * @param {string} resourceType - Type of resource accessed
   * @param {string} resourceId - ID of the resource accessed
   * @param {Object} additionalData - Any additional data to log
   */
  async logPHIAccess(req, res, action, resourceType, resourceId, additionalData = {}) {
    try {
      const userId = req.user?.id || 'anonymous';
      const userEmail = req.user?.email || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || 'unknown';
      const timestamp = new Date();
      
      // Hash sensitive data for audit trail
      const hashedUserId = this.hashData(userId);
      const hashedResourceId = this.hashData(resourceId);
      
      const auditLog = {
        id: crypto.randomUUID(),
        user_id: hashedUserId,
        user_email: userEmail,
        action: action,
        resource_type: resourceType,
        resource_id: hashedResourceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: timestamp,
        session_id: req.session?.id || null,
        additional_data: JSON.stringify(additionalData),
        request_method: req.method,
        request_url: req.originalUrl,
        response_status: res.statusCode
      };

      await this.insertAuditLog(auditLog);
      
      // Log to console for development
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 HIPAA Audit Log:', {
          action,
          resourceType,
          userId: hashedUserId,
          timestamp: timestamp.toISOString()
        });
      }
    } catch (error) {
      console.error('❌ HIPAA Audit Logging Error:', error);
      // Don't throw error to avoid breaking application flow
    }
  }

  /**
   * Log security events for monitoring
   * @param {string} eventType - Type of security event
   * @param {Object} eventData - Event details
   * @param {Object} req - Express request object
   */
  async logSecurityEvent(eventType, eventData, req = null) {
    try {
      const securityLog = {
        id: crypto.randomUUID(),
        event_type: eventType,
        event_data: JSON.stringify(eventData),
        ip_address: req?.ip || 'unknown',
        user_agent: req?.get('User-Agent') || 'unknown',
        timestamp: new Date(),
        severity: this.getEventSeverity(eventType)
      };

      await this.insertSecurityLog(securityLog);
      
      // Alert on high severity events
      if (securityLog.severity === 'HIGH') {
        await this.sendSecurityAlert(eventType, eventData);
      }
    } catch (error) {
      console.error('❌ Security Event Logging Error:', error);
    }
  }

  /**
   * Log authentication events
   * @param {string} eventType - Login, logout, failed login, etc.
   * @param {Object} userData - User information
   * @param {Object} req - Express request object
   */
  async logAuthEvent(eventType, userData, req) {
    try {
      const authLog = {
        id: crypto.randomUUID(),
        event_type: eventType,
        user_id: userData?.id ? this.hashData(userData.id) : null,
        user_email: userData?.email || 'unknown',
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
        success: eventType.includes('SUCCESS'),
        failure_reason: eventType.includes('FAILED') ? userData.failureReason : null
      };

      await this.insertAuthLog(authLog);
    } catch (error) {
      console.error('❌ Auth Event Logging Error:', error);
    }
  }

  /**
   * Hash sensitive data for audit trail
   * @param {string} data - Data to hash
   * @returns {string} - Hashed data
   */
  hashData(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(data.toString()).digest('hex');
  }

  /**
   * Get event severity level
   * @param {string} eventType - Type of event
   * @returns {string} - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
   */
  getEventSeverity(eventType) {
    const criticalEvents = ['UNAUTHORIZED_ACCESS', 'DATA_BREACH', 'MALWARE_DETECTED'];
    const highEvents = ['FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED'];
    const mediumEvents = ['LOGIN_ATTEMPT', 'PASSWORD_CHANGE', 'PERMISSION_DENIED'];
    
    if (criticalEvents.includes(eventType)) return 'CRITICAL';
    if (highEvents.includes(eventType)) return 'HIGH';
    if (mediumEvents.includes(eventType)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Insert audit log into database
   * @param {Object} auditLog - Audit log data
   */
  async insertAuditLog(auditLog) {
    const query = `
      INSERT INTO hipaa_audit_logs (
        id, user_id, user_email, action, resource_type, resource_id,
        ip_address, user_agent, timestamp, session_id, additional_data,
        request_method, request_url, response_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    
    const values = [
      auditLog.id, auditLog.user_id, auditLog.user_email, auditLog.action,
      auditLog.resource_type, auditLog.resource_id, auditLog.ip_address,
      auditLog.user_agent, auditLog.timestamp, auditLog.session_id,
      auditLog.additional_data, auditLog.request_method, auditLog.request_url,
      auditLog.response_status
    ];

    await this.pool.query(query, values);
  }

  /**
   * Insert security log into database
   * @param {Object} securityLog - Security log data
   */
  async insertSecurityLog(securityLog) {
    const query = `
      INSERT INTO security_logs (
        id, event_type, event_data, ip_address, user_agent, timestamp, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    const values = [
      securityLog.id, securityLog.event_type, securityLog.event_data,
      securityLog.ip_address, securityLog.user_agent, securityLog.timestamp,
      securityLog.severity
    ];

    await this.pool.query(query, values);
  }

  /**
   * Insert authentication log into database
   * @param {Object} authLog - Authentication log data
   */
  async insertAuthLog(authLog) {
    const query = `
      INSERT INTO auth_logs (
        id, event_type, user_id, user_email, ip_address, user_agent,
        timestamp, success, failure_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    const values = [
      authLog.id, authLog.event_type, authLog.user_id, authLog.user_email,
      authLog.ip_address, authLog.user_agent, authLog.timestamp,
      authLog.success, authLog.failure_reason
    ];

    await this.pool.query(query, values);
  }

  /**
   * Send security alert for critical events
   * @param {string} eventType - Type of security event
   * @param {Object} eventData - Event details
   */
  async sendSecurityAlert(eventType, eventData) {
    // Implementation for sending alerts (email, Slack, etc.)
    console.warn('🚨 SECURITY ALERT:', {
      eventType,
      eventData,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Implement actual alert sending
    // await emailService.sendSecurityAlert(eventType, eventData);
    // await slackService.sendSecurityAlert(eventType, eventData);
  }

  /**
   * Generate compliance report
   * @param {Date} startDate - Report start date
   * @param {Date} endDate - Report end date
   * @returns {Object} - Compliance report data
   */
  async generateComplianceReport(startDate, endDate) {
    try {
      const auditQuery = `
        SELECT 
          action,
          resource_type,
          COUNT(*) as access_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM hipaa_audit_logs 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY action, resource_type
        ORDER BY access_count DESC
      `;
      
      const securityQuery = `
        SELECT 
          event_type,
          severity,
          COUNT(*) as event_count
        FROM security_logs 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY event_type, severity
        ORDER BY event_count DESC
      `;
      
      const authQuery = `
        SELECT 
          event_type,
          COUNT(*) as event_count,
          COUNT(CASE WHEN success = true THEN 1 END) as success_count,
          COUNT(CASE WHEN success = false THEN 1 END) as failure_count
        FROM auth_logs 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY event_type
        ORDER BY event_count DESC
      `;
      
      const [auditResult, securityResult, authResult] = await Promise.all([
        this.pool.query(auditQuery, [startDate, endDate]),
        this.pool.query(securityQuery, [startDate, endDate]),
        this.pool.query(authQuery, [startDate, endDate])
      ]);
      
      return {
        period: { startDate, endDate },
        auditSummary: auditResult.rows,
        securitySummary: securityResult.rows,
        authSummary: authResult.rows,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Compliance Report Generation Error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const hipaaAuditLogger = new HIPAAAuditLogger();

// Express middleware for automatic PHI access logging
const hipaaAuditMiddleware = (action, resourceType, resourceIdExtractor) => {
  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response
    res.send = function(data) {
      // Restore original send
      res.send = originalSend;
      
      // Log PHI access after response is sent
      const resourceId = resourceIdExtractor ? resourceIdExtractor(req) : null;
      hipaaAuditLogger.logPHIAccess(req, res, action, resourceType, resourceId);
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware for logging all requests (for development)
const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('📝 Request Log:', logData);
    }
    
    // Log to database in production
    if (process.env.NODE_ENV === 'production') {
      hipaaAuditLogger.logPHIAccess(req, res, 'REQUEST', 'API', null, logData);
    }
  });
  
  next();
};

module.exports = {
  hipaaAuditLogger,
  hipaaAuditMiddleware,
  requestLoggingMiddleware
}; 