/**
 * Security Monitoring and Alerting System
 * Real-time security event monitoring for MedSpaSync Pro
 */

const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecurityMonitor {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.alertThresholds = {
      failedLogins: 5, // per hour
      suspiciousActivity: 3, // per hour
      unauthorizedAccess: 1, // per hour
      dataBreach: 1, // per hour
      rateLimitExceeded: 10 // per hour
    };
    
    this.monitoringInterval = 60000; // 1 minute
    this.isRunning = false;
  }

  /**
   * Start security monitoring
   */
  async start() {
    if (this.isRunning) {
      console.log('Security monitoring is already running');
      return;
    }

    console.log('🔒 Starting security monitoring...');
    this.isRunning = true;

    // Start monitoring loops
    this.monitorAuthEvents();
    this.monitorSecurityEvents();
    this.monitorPHIAccess();
    this.monitorSystemHealth();
    this.monitorRateLimiting();

    console.log('✅ Security monitoring started successfully');
  }

  /**
   * Stop security monitoring
   */
  stop() {
    console.log('🛑 Stopping security monitoring...');
    this.isRunning = false;
  }

  /**
   * Monitor authentication events
   */
  async monitorAuthEvents() {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Check for failed login attempts
        const failedLogins = await this.db.query(`
          SELECT COUNT(*) as count, user_email, ip_address
          FROM auth_logs 
          WHERE event_type LIKE '%FAILED%' 
          AND timestamp > $1
          GROUP BY user_email, ip_address
          HAVING COUNT(*) >= $2
        `, [oneHourAgo, this.alertThresholds.failedLogins]);

        if (failedLogins.rows.length > 0) {
          await this.sendSecurityAlert('FAILED_LOGIN_THRESHOLD', {
            count: failedLogins.rows.length,
            details: failedLogins.rows
          });
        }

        // Check for suspicious login patterns
        const suspiciousLogins = await this.db.query(`
          SELECT user_email, ip_address, COUNT(*) as count
          FROM auth_logs 
          WHERE timestamp > $1
          GROUP BY user_email, ip_address
          HAVING COUNT(*) > 20
        `, [oneHourAgo]);

        if (suspiciousLogins.rows.length > 0) {
          await this.sendSecurityAlert('SUSPICIOUS_LOGIN_PATTERN', {
            count: suspiciousLogins.rows.length,
            details: suspiciousLogins.rows
          });
        }

      } catch (error) {
        console.error('❌ Auth monitoring error:', error);
      }
    }, this.monitoringInterval);
  }

  /**
   * Monitor security events
   */
  async monitorSecurityEvents() {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Check for high severity security events
        const highSeverityEvents = await this.db.query(`
          SELECT event_type, event_data, ip_address, timestamp
          FROM security_logs 
          WHERE severity IN ('HIGH', 'CRITICAL')
          AND timestamp > $1
        `, [oneHourAgo]);

        if (highSeverityEvents.rows.length > 0) {
          await this.sendSecurityAlert('HIGH_SEVERITY_EVENTS', {
            count: highSeverityEvents.rows.length,
            events: highSeverityEvents.rows
          });
        }

        // Check for unauthorized access attempts
        const unauthorizedAccess = await this.db.query(`
          SELECT COUNT(*) as count
          FROM security_logs 
          WHERE event_type = 'UNAUTHORIZED_ACCESS'
          AND timestamp > $1
        `, [oneHourAgo]);

        if (unauthorizedAccess.rows[0].count >= this.alertThresholds.unauthorizedAccess) {
          await this.sendSecurityAlert('UNAUTHORIZED_ACCESS_THRESHOLD', {
            count: unauthorizedAccess.rows[0].count
          });
        }

      } catch (error) {
        console.error('❌ Security monitoring error:', error);
      }
    }, this.monitoringInterval);
  }

  /**
   * Monitor PHI access patterns
   */
  async monitorPHIAccess() {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Check for unusual PHI access patterns
        const unusualAccess = await this.db.query(`
          SELECT user_id, user_email, COUNT(*) as access_count
          FROM hipaa_audit_logs 
          WHERE timestamp > $1
          GROUP BY user_id, user_email
          HAVING COUNT(*) > 100
        `, [oneHourAgo]);

        if (unusualAccess.rows.length > 0) {
          await this.sendSecurityAlert('UNUSUAL_PHI_ACCESS', {
            count: unusualAccess.rows.length,
            users: unusualAccess.rows
          });
        }

        // Check for access outside business hours
        const afterHoursAccess = await this.db.query(`
          SELECT user_id, user_email, action, timestamp
          FROM hipaa_audit_logs 
          WHERE timestamp > $1
          AND EXTRACT(HOUR FROM timestamp) NOT BETWEEN 6 AND 22
        `, [oneHourAgo]);

        if (afterHoursAccess.rows.length > 10) {
          await this.sendSecurityAlert('AFTER_HOURS_ACCESS', {
            count: afterHoursAccess.rows.length,
            accesses: afterHoursAccess.rows
          });
        }

      } catch (error) {
        console.error('❌ PHI monitoring error:', error);
      }
    }, this.monitoringInterval);
  }

  /**
   * Monitor system health and performance
   */
  async monitorSystemHealth() {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Check database connection
        const dbHealth = await this.db.query('SELECT 1 as health');
        if (!dbHealth.rows[0]) {
          await this.sendSecurityAlert('DATABASE_CONNECTION_FAILURE', {
            error: 'Database connection lost'
          });
        }

        // Check disk space (if on Linux/Unix)
        if (process.platform !== 'win32') {
          const diskUsage = await this.checkDiskSpace();
          if (diskUsage > 90) {
            await this.sendSecurityAlert('DISK_SPACE_CRITICAL', {
              usage: `${diskUsage}%`
            });
          }
        }

        // Check memory usage
        const memoryUsage = process.memoryUsage();
        const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        if (memoryPercent > 90) {
          await this.sendSecurityAlert('MEMORY_USAGE_CRITICAL', {
            usage: `${memoryPercent.toFixed(2)}%`
          });
        }

      } catch (error) {
        console.error('❌ System health monitoring error:', error);
        await this.sendSecurityAlert('SYSTEM_MONITORING_FAILURE', {
          error: error.message
        });
      }
    }, this.monitoringInterval * 5); // Check every 5 minutes
  }

  /**
   * Monitor rate limiting violations
   */
  async monitorRateLimiting() {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Check for rate limit violations
        const rateLimitViolations = await this.db.query(`
          SELECT COUNT(*) as count
          FROM security_logs 
          WHERE event_type = 'RATE_LIMIT_EXCEEDED'
          AND timestamp > $1
        `, [oneHourAgo]);

        if (rateLimitViolations.rows[0].count >= this.alertThresholds.rateLimitExceeded) {
          await this.sendSecurityAlert('RATE_LIMIT_VIOLATIONS', {
            count: rateLimitViolations.rows[0].count
          });
        }

      } catch (error) {
        console.error('❌ Rate limiting monitoring error:', error);
      }
    }, this.monitoringInterval);
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(alertType, data) {
    try {
      const alert = {
        id: crypto.randomUUID(),
        type: alertType,
        severity: this.getAlertSeverity(alertType),
        timestamp: new Date(),
        data: data,
        environment: process.env.NODE_ENV || 'development'
      };

      // Log alert to database
      await this.db.query(`
        INSERT INTO security_logs (id, event_type, event_data, timestamp, severity)
        VALUES ($1, $2, $3, $4, $5)
      `, [alert.id, alertType, JSON.stringify(alert), alert.timestamp, alert.severity]);

      // Send email alert for high/critical severity
      if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
        await this.sendEmailAlert(alert);
      }

      // Log to console
      console.log(`🚨 Security Alert: ${alertType}`, alert);

      // Send to external monitoring service if configured
      if (process.env.MONITORING_WEBHOOK_URL) {
        await this.sendWebhookAlert(alert);
      }

    } catch (error) {
      console.error('❌ Failed to send security alert:', error);
    }
  }

  /**
   * Get alert severity level
   */
  getAlertSeverity(alertType) {
    const criticalAlerts = [
      'DATA_BREACH',
      'UNAUTHORIZED_ACCESS_THRESHOLD',
      'DATABASE_CONNECTION_FAILURE'
    ];
    
    const highAlerts = [
      'FAILED_LOGIN_THRESHOLD',
      'SUSPICIOUS_LOGIN_PATTERN',
      'UNUSUAL_PHI_ACCESS',
      'AFTER_HOURS_ACCESS'
    ];

    if (criticalAlerts.includes(alertType)) return 'CRITICAL';
    if (highAlerts.includes(alertType)) return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert) {
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'security@medspasyncpro.com',
        to: process.env.SECURITY_ALERT_EMAIL || 'admin@medspasyncpro.com',
        subject: `🚨 Security Alert: ${alert.type}`,
        html: this.generateAlertEmail(alert)
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Security alert email sent: ${alert.type}`);

    } catch (error) {
      console.error('❌ Failed to send email alert:', error);
    }
  }

  /**
   * Generate alert email HTML
   */
  generateAlertEmail(alert) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">🚨 Security Alert</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <h3>Alert Type: ${alert.type}</h3>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
          <p><strong>Environment:</strong> ${alert.environment}</p>
          
          <h4>Details:</h4>
          <pre style="background-color: white; padding: 10px; border-radius: 3px; overflow-x: auto;">
${JSON.stringify(alert.data, null, 2)}
          </pre>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This is an automated security alert from MedSpaSync Pro.
          Please investigate this issue immediately.
        </p>
      </div>
    `;
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert) {
    try {
      const response = await fetch(process.env.MONITORING_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_WEBHOOK_TOKEN}`
        },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log(`🌐 Webhook alert sent: ${alert.type}`);

    } catch (error) {
      console.error('❌ Failed to send webhook alert:', error);
    }
  }

  /**
   * Check disk space (Unix/Linux only)
   */
  async checkDiskSpace() {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        resolve(0); // Skip on Windows
        return;
      }

      const { exec } = require('child_process');
      exec('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'', (error, stdout) => {
        if (error) {
          resolve(0);
        } else {
          resolve(parseInt(stdout.trim()) || 0);
        }
      });
    });
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(startDate, endDate) {
    try {
      const report = {
        period: { start: startDate, end: endDate },
        generated: new Date(),
        summary: {},
        details: {}
      };

      // Authentication events summary
      const authSummary = await this.db.query(`
        SELECT 
          event_type,
          COUNT(*) as count,
          COUNT(CASE WHEN success = false THEN 1 END) as failures
        FROM auth_logs 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY event_type
      `, [startDate, endDate]);

      report.summary.authentication = authSummary.rows;

      // Security events summary
      const securitySummary = await this.db.query(`
        SELECT 
          event_type,
          severity,
          COUNT(*) as count
        FROM security_logs 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY event_type, severity
        ORDER BY severity DESC, count DESC
      `, [startDate, endDate]);

      report.summary.security = securitySummary.rows;

      // PHI access summary
      const phiSummary = await this.db.query(`
        SELECT 
          action,
          resource_type,
          COUNT(*) as count
        FROM hipaa_audit_logs 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY action, resource_type
        ORDER BY count DESC
      `, [startDate, endDate]);

      report.summary.phiAccess = phiSummary.rows;

      // Top users by activity
      const topUsers = await this.db.query(`
        SELECT 
          user_email,
          COUNT(*) as activity_count
        FROM hipaa_audit_logs 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY user_email
        ORDER BY activity_count DESC
        LIMIT 10
      `, [startDate, endDate]);

      report.details.topUsers = topUsers.rows;

      // Suspicious IP addresses
      const suspiciousIPs = await this.db.query(`
        SELECT 
          ip_address,
          COUNT(*) as event_count
        FROM security_logs 
        WHERE timestamp BETWEEN $1 AND $2
        AND severity IN ('HIGH', 'CRITICAL')
        GROUP BY ip_address
        ORDER BY event_count DESC
        LIMIT 10
      `, [startDate, endDate]);

      report.details.suspiciousIPs = suspiciousIPs.rows;

      return report;

    } catch (error) {
      console.error('❌ Failed to generate security report:', error);
      throw error;
    }
  }

  /**
   * Export security logs
   */
  async exportSecurityLogs(startDate, endDate, format = 'json') {
    try {
      const logs = await this.db.query(`
        SELECT * FROM security_logs 
        WHERE timestamp BETWEEN $1 AND $2
        ORDER BY timestamp DESC
      `, [startDate, endDate]);

      if (format === 'csv') {
        return this.convertToCSV(logs.rows);
      }

      return logs.rows;

    } catch (error) {
      console.error('❌ Failed to export security logs:', error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

module.exports = SecurityMonitor; 