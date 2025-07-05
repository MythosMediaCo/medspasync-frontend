/**
 * Security Monitoring & Alerting Middleware
 * Real-time security monitoring, alerting, and incident response for MedSpaSync Pro
 */

const crypto = require('crypto');
const { Pool } = require('pg');
const redis = require('redis');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');

class SecurityMonitoring {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 2
    });

    this.websocketServer = null;
    this.connectedClients = new Map();
    this.alertChannels = this.initializeAlertChannels();
    this.monitoringMetrics = new Map();
    this.incidentResponse = this.initializeIncidentResponse();
    
    this.startRealTimeMonitoring();
    this.initializeWebSocketServer();
  }

  /**
   * Initialize alert channels
   */
  initializeAlertChannels() {
    return {
      email: {
        enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
        transporter: nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }),
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
      },
      webhook: {
        enabled: process.env.WEBHOOK_ALERTS_ENABLED === 'true',
        endpoints: process.env.WEBHOOK_ENDPOINTS?.split(',') || []
      },
      slack: {
        enabled: process.env.SLACK_ALERTS_ENABLED === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#security-alerts'
      },
      sms: {
        enabled: process.env.SMS_ALERTS_ENABLED === 'true',
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
        recipients: process.env.SMS_RECIPIENTS?.split(',') || []
      }
    };
  }

  /**
   * Initialize incident response automation
   */
  initializeIncidentResponse() {
    return {
      // Automated response actions
      actions: {
        BLOCK_IP: {
          description: 'Block IP address',
          execute: async (incident) => {
            await this.blockIP(incident.ipAddress);
            return { success: true, action: 'IP blocked' };
          }
        },
        SUSPEND_USER: {
          description: 'Suspend user account',
          execute: async (incident) => {
            await this.suspendUser(incident.userId);
            return { success: true, action: 'User suspended' };
          }
        },
        INCREASE_MONITORING: {
          description: 'Increase monitoring level',
          execute: async (incident) => {
            await this.increaseMonitoring(incident.userId);
            return { success: true, action: 'Monitoring increased' };
          }
        },
        FORCE_MFA: {
          description: 'Force MFA verification',
          execute: async (incident) => {
            await this.forceMFA(incident.userId);
            return { success: true, action: 'MFA forced' };
          }
        },
        NOTIFY_ADMIN: {
          description: 'Notify administrators',
          execute: async (incident) => {
            await this.notifyAdmins(incident);
            return { success: true, action: 'Admins notified' };
          }
        }
      },

      // Response rules based on incident type and severity
      rules: [
        {
          name: 'Critical Threat Response',
          conditions: {
            severity: 'CRITICAL',
            threatScore: { min: 0.9 }
          },
          actions: ['BLOCK_IP', 'SUSPEND_USER', 'NOTIFY_ADMIN'],
          priority: 1
        },
        {
          name: 'High Threat Response',
          conditions: {
            severity: 'HIGH',
            threatScore: { min: 0.7, max: 0.89 }
          },
          actions: ['INCREASE_MONITORING', 'FORCE_MFA', 'NOTIFY_ADMIN'],
          priority: 2
        },
        {
          name: 'Medium Threat Response',
          conditions: {
            severity: 'MEDIUM',
            threatScore: { min: 0.5, max: 0.69 }
          },
          actions: ['INCREASE_MONITORING'],
          priority: 3
        },
        {
          name: 'Geographic Anomaly Response',
          conditions: {
            incidentType: 'GEOGRAPHIC_ANOMALY',
            distance: { min: 1000 }
          },
          actions: ['FORCE_MFA', 'NOTIFY_ADMIN'],
          priority: 2
        },
        {
          name: 'Authentication Failure Response',
          conditions: {
            incidentType: 'AUTH_FAILURE',
            failureCount: { min: 5 }
          },
          actions: ['BLOCK_IP', 'NOTIFY_ADMIN'],
          priority: 2
        }
      ]
    };
  }

  /**
   * Initialize WebSocket server for real-time updates
   */
  initializeWebSocketServer() {
    if (process.env.WEBSOCKET_ENABLED === 'true') {
      this.websocketServer = new WebSocket.Server({ 
        port: process.env.WEBSOCKET_PORT || 8080 
      });

      this.websocketServer.on('connection', (ws, req) => {
        const clientId = crypto.randomUUID();
        this.connectedClients.set(clientId, {
          ws,
          connectedAt: new Date(),
          subscriptions: new Set()
        });

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleWebSocketMessage(clientId, data);
          } catch (error) {
            console.error('❌ WebSocket message error:', error);
          }
        });

        ws.on('close', () => {
          this.connectedClients.delete(clientId);
        });

        // Send initial connection confirmation
        ws.send(JSON.stringify({
          type: 'CONNECTION_ESTABLISHED',
          clientId,
          timestamp: new Date()
        }));
      });
    }
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(clientId, data) {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'SUBSCRIBE':
        data.channels?.forEach(channel => {
          client.subscriptions.add(channel);
        });
        break;

      case 'UNSUBSCRIBE':
        data.channels?.forEach(channel => {
          client.subscriptions.delete(channel);
        });
        break;

      case 'GET_METRICS':
        this.sendMetricsToClient(clientId);
        break;
    }
  }

  /**
   * Send metrics to specific client
   */
  async sendMetricsToClient(clientId) {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    const metrics = await this.getRealTimeMetrics();
    client.ws.send(JSON.stringify({
      type: 'METRICS_UPDATE',
      data: metrics,
      timestamp: new Date()
    }));
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToClients(message) {
    this.connectedClients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Security monitoring middleware
   */
  monitorSecurity() {
    return async (req, res, next) => {
      try {
        const startTime = Date.now();
        
        // Collect security metrics
        const securityData = this.collectSecurityData(req);
        
        // Update real-time metrics
        this.updateRealTimeMetrics(securityData);
        
        // Check for security incidents
        const incidents = await this.detectSecurityIncidents(securityData);
        
        // Execute automated responses
        if (incidents.length > 0) {
          await this.executeIncidentResponse(incidents);
        }
        
        // Send real-time updates
        this.broadcastSecurityUpdate(securityData, incidents);
        
        // Track response time
        res.on('finish', () => {
          const responseTime = Date.now() - startTime;
          this.trackResponseTime(securityData, responseTime);
        });
        
        next();
      } catch (error) {
        console.error('❌ Security monitoring error:', error);
        next();
      }
    };
  }

  /**
   * Collect security data from request
   */
  collectSecurityData(req) {
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
      xForwardedFor: req.get('X-Forwarded-For'),
      xRealIp: req.get('X-Real-IP'),
      // Security-specific data
      threatScore: req.headers['x-threat-score'] || 0,
      securityChallenge: req.headers['x-security-challenge'] || false,
      securityMonitor: req.headers['x-security-monitor'] || false,
      mfaRequired: req.headers['x-mfa-required'] || false,
      rateLimited: req.headers['x-rate-limited'] || false
    };
  }

  /**
   * Update real-time metrics
   */
  updateRealTimeMetrics(securityData) {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);
    
    // Update request metrics
    this.updateMetric('requests_per_minute', minuteKey, 1);
    this.updateMetric('requests_by_method', securityData.method, 1);
    this.updateMetric('requests_by_path', securityData.path, 1);
    this.updateMetric('requests_by_user', securityData.userId || 'anonymous', 1);
    
    // Update security metrics
    if (securityData.threatScore > 0) {
      this.updateMetric('threats_per_minute', minuteKey, 1);
      this.updateMetric('avg_threat_score', minuteKey, securityData.threatScore);
    }
    
    if (securityData.securityChallenge) {
      this.updateMetric('security_challenges_per_minute', minuteKey, 1);
    }
    
    if (securityData.rateLimited) {
      this.updateMetric('rate_limited_requests_per_minute', minuteKey, 1);
    }
    
    // Update user activity
    if (securityData.userId) {
      this.updateMetric('active_users', minuteKey, securityData.userId);
    }
  }

  /**
   * Update metric with aggregation
   */
  updateMetric(metricName, key, value) {
    const metricKey = `${metricName}:${key}`;
    const current = this.monitoringMetrics.get(metricKey) || 0;
    
    if (typeof value === 'number') {
      this.monitoringMetrics.set(metricKey, current + value);
    } else {
      this.monitoringMetrics.set(metricKey, value);
    }
    
    // Store in Redis for persistence
    this.redisClient.setex(metricKey, 3600, JSON.stringify(this.monitoringMetrics.get(metricKey)));
  }

  /**
   * Detect security incidents
   */
  async detectSecurityIncidents(securityData) {
    const incidents = [];
    
    // Check threat score
    if (securityData.threatScore > 0.7) {
      incidents.push({
        id: crypto.randomUUID(),
        type: 'HIGH_THREAT_SCORE',
        severity: securityData.threatScore > 0.9 ? 'CRITICAL' : 'HIGH',
        threatScore: securityData.threatScore,
        ipAddress: securityData.ip,
        userId: securityData.userId,
        timestamp: securityData.timestamp,
        details: {
          method: securityData.method,
          path: securityData.path,
          userAgent: securityData.userAgent
        }
      });
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(securityData);
    if (suspiciousPatterns.length > 0) {
      incidents.push({
        id: crypto.randomUUID(),
        type: 'SUSPICIOUS_PATTERN',
        severity: 'MEDIUM',
        ipAddress: securityData.ip,
        userId: securityData.userId,
        timestamp: securityData.timestamp,
        details: {
          patterns: suspiciousPatterns,
          method: securityData.method,
          path: securityData.path
        }
      });
    }
    
    // Check for authentication anomalies
    const authAnomalies = await this.detectAuthAnomalies(securityData);
    if (authAnomalies.length > 0) {
      incidents.push({
        id: crypto.randomUUID(),
        type: 'AUTH_ANOMALY',
        severity: 'HIGH',
        ipAddress: securityData.ip,
        userId: securityData.userId,
        timestamp: securityData.timestamp,
        details: {
          anomalies: authAnomalies
        }
      });
    }
    
    // Check for geographic anomalies
    const geoAnomalies = await this.detectGeographicAnomalies(securityData);
    if (geoAnomalies.length > 0) {
      incidents.push({
        id: crypto.randomUUID(),
        type: 'GEOGRAPHIC_ANOMALY',
        severity: 'MEDIUM',
        ipAddress: securityData.ip,
        userId: securityData.userId,
        timestamp: securityData.timestamp,
        details: {
          anomalies: geoAnomalies
        }
      });
    }
    
    return incidents;
  }

  /**
   * Detect suspicious patterns
   */
  detectSuspiciousPatterns(securityData) {
    const patterns = [];
    
    // Check for rapid requests
    const requestKey = `requests:${securityData.ip}:${Math.floor(Date.now() / 1000)}`;
    const currentRequests = this.monitoringMetrics.get(requestKey) || 0;
    if (currentRequests > 100) {
      patterns.push('RAPID_REQUESTS');
    }
    
    // Check for suspicious user agent
    if (securityData.userAgent && (
      securityData.userAgent.includes('bot') ||
      securityData.userAgent.includes('crawler') ||
      securityData.userAgent.includes('scanner')
    )) {
      patterns.push('SUSPICIOUS_USER_AGENT');
    }
    
    // Check for missing referer on sensitive endpoints
    if (securityData.path.includes('/api/') && !securityData.referer) {
      patterns.push('MISSING_REFERER');
    }
    
    // Check for large content length
    if (securityData.contentLength > 1000000) {
      patterns.push('LARGE_CONTENT');
    }
    
    return patterns;
  }

  /**
   * Detect authentication anomalies
   */
  async detectAuthAnomalies(securityData) {
    const anomalies = [];
    
    if (!securityData.userId) return anomalies;
    
    try {
      // Check for multiple failed logins
      const failedLogins = await this.redisClient.get(`failed_logins:${securityData.ip}`) || 0;
      if (parseInt(failedLogins) > 5) {
        anomalies.push('MULTIPLE_FAILED_LOGINS');
      }
      
      // Check for unusual login time
      const hour = securityData.timestamp.getHours();
      if (hour < 6 || hour > 23) {
        anomalies.push('UNUSUAL_LOGIN_TIME');
      }
      
      // Check for concurrent sessions
      const activeSessions = await this.redisClient.get(`active_sessions:${securityData.userId}`) || 0;
      if (parseInt(activeSessions) > 3) {
        anomalies.push('CONCURRENT_SESSIONS');
      }
    } catch (error) {
      console.error('❌ Auth anomaly detection error:', error);
    }
    
    return anomalies;
  }

  /**
   * Detect geographic anomalies
   */
  async detectGeographicAnomalies(securityData) {
    const anomalies = [];
    
    if (!securityData.userId) return anomalies;
    
    try {
      // Get user's last known location
      const lastLocation = await this.redisClient.get(`user_location:${securityData.userId}`);
      
      if (lastLocation) {
        const location = JSON.parse(lastLocation);
        const timeDiff = Date.now() - location.timestamp;
        
        // If location changed significantly in short time
        if (location.distance > 1000 && timeDiff < 3600000) {
          anomalies.push('RAPID_LOCATION_CHANGE');
        }
      }
    } catch (error) {
      console.error('❌ Geographic anomaly detection error:', error);
    }
    
    return anomalies;
  }

  /**
   * Execute incident response
   */
  async executeIncidentResponse(incidents) {
    for (const incident of incidents) {
      try {
        // Log incident
        await this.logIncident(incident);
        
        // Find matching response rules
        const matchingRules = this.findMatchingRules(incident);
        
        // Execute actions
        for (const rule of matchingRules) {
          for (const actionName of rule.actions) {
            const action = this.incidentResponse.actions[actionName];
            if (action) {
              try {
                const result = await action.execute(incident);
                await this.logIncidentAction(incident.id, actionName, result);
              } catch (error) {
                console.error(`❌ Incident response action failed: ${actionName}`, error);
                await this.logIncidentAction(incident.id, actionName, { success: false, error: error.message });
              }
            }
          }
        }
        
        // Send alerts
        await this.sendSecurityAlert(incident);
        
      } catch (error) {
        console.error('❌ Incident response execution error:', error);
      }
    }
  }

  /**
   * Find matching response rules
   */
  findMatchingRules(incident) {
    return this.incidentResponse.rules
      .filter(rule => {
        const conditions = rule.conditions;
        
        // Check severity
        if (conditions.severity && incident.severity !== conditions.severity) {
          return false;
        }
        
        // Check threat score
        if (conditions.threatScore) {
          const score = incident.threatScore || 0;
          if (conditions.threatScore.min && score < conditions.threatScore.min) {
            return false;
          }
          if (conditions.threatScore.max && score > conditions.threatScore.max) {
            return false;
          }
        }
        
        // Check incident type
        if (conditions.incidentType && incident.type !== conditions.incidentType) {
          return false;
        }
        
        // Check distance for geographic anomalies
        if (conditions.distance && incident.details?.anomalies?.includes('RAPID_LOCATION_CHANGE')) {
          const distance = incident.details.anomalies.find(a => a.distance)?.distance || 0;
          if (distance < conditions.distance.min) {
            return false;
          }
        }
        
        // Check failure count for auth failures
        if (conditions.failureCount && incident.type === 'AUTH_ANOMALY') {
          const failureCount = incident.details?.anomalies?.filter(a => a === 'MULTIPLE_FAILED_LOGINS').length || 0;
          if (failureCount < conditions.failureCount.min) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(incident) {
    const alert = {
      id: crypto.randomUUID(),
      incidentId: incident.id,
      type: incident.type,
      severity: incident.severity,
      timestamp: incident.timestamp,
      message: this.generateAlertMessage(incident),
      details: incident.details
    };
    
    // Send to all enabled channels
    const promises = [];
    
    if (this.alertChannels.email.enabled) {
      promises.push(this.sendEmailAlert(alert));
    }
    
    if (this.alertChannels.webhook.enabled) {
      promises.push(this.sendWebhookAlert(alert));
    }
    
    if (this.alertChannels.slack.enabled) {
      promises.push(this.sendSlackAlert(alert));
    }
    
    if (this.alertChannels.sms.enabled) {
      promises.push(this.sendSMSAlert(alert));
    }
    
    // Broadcast to WebSocket clients
    this.broadcastToClients({
      type: 'SECURITY_ALERT',
      data: alert,
      timestamp: new Date()
    });
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('❌ Alert sending error:', error);
    }
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(incident) {
    const baseMessage = `Security ${incident.severity} Alert: ${incident.type}`;
    
    switch (incident.type) {
      case 'HIGH_THREAT_SCORE':
        return `${baseMessage} - Threat score: ${incident.threatScore} from IP: ${incident.ipAddress}`;
      
      case 'SUSPICIOUS_PATTERN':
        return `${baseMessage} - Patterns: ${incident.details.patterns.join(', ')} from IP: ${incident.ipAddress}`;
      
      case 'AUTH_ANOMALY':
        return `${baseMessage} - Anomalies: ${incident.details.anomalies.join(', ')} for user: ${incident.userId}`;
      
      case 'GEOGRAPHIC_ANOMALY':
        return `${baseMessage} - Location anomaly detected for user: ${incident.userId}`;
      
      default:
        return baseMessage;
    }
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert) {
    if (!this.alertChannels.email.transporter || this.alertChannels.email.recipients.length === 0) {
      return;
    }
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'security@medspasync.com',
      to: this.alertChannels.email.recipients.join(', '),
      subject: `Security Alert: ${alert.severity} - ${alert.type}`,
      html: `
        <h2>Security Alert</h2>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Time:</strong> ${alert.timestamp}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Details:</strong></p>
        <pre>${JSON.stringify(alert.details, null, 2)}</pre>
      `
    };
    
    await this.alertChannels.email.transporter.sendMail(mailOptions);
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert) {
    if (this.alertChannels.webhook.endpoints.length === 0) {
      return;
    }
    
    const payload = {
      alert: alert,
      timestamp: new Date(),
      source: 'MedSpaSync Security Monitoring'
    };
    
    const promises = this.alertChannels.webhook.endpoints.map(endpoint =>
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Security-Alert': 'true'
        },
        body: JSON.stringify(payload)
      }).catch(error => {
        console.error(`❌ Webhook alert failed for ${endpoint}:`, error);
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alert) {
    if (!this.alertChannels.slack.webhookUrl) {
      return;
    }
    
    const payload = {
      channel: this.alertChannels.slack.channel,
      text: `🚨 *Security Alert*`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          {
            title: 'Severity',
            value: alert.severity,
            short: true
          },
          {
            title: 'Type',
            value: alert.type,
            short: true
          },
          {
            title: 'Message',
            value: alert.message,
            short: false
          },
          {
            title: 'Time',
            value: alert.timestamp.toISOString(),
            short: true
          }
        ]
      }]
    };
    
    await fetch(this.alertChannels.slack.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send SMS alert
   */
  async sendSMSAlert(alert) {
    if (!this.alertChannels.sms.twilioAccountSid || 
        !this.alertChannels.sms.twilioAuthToken || 
        !this.alertChannels.sms.twilioPhoneNumber ||
        this.alertChannels.sms.recipients.length === 0) {
      return;
    }
    
    const twilio = require('twilio')(
      this.alertChannels.sms.twilioAccountSid,
      this.alertChannels.sms.twilioAuthToken
    );
    
    const message = `SECURITY ALERT: ${alert.severity} - ${alert.type} - ${alert.message}`;
    
    const promises = this.alertChannels.sms.recipients.map(recipient =>
      twilio.messages.create({
        body: message,
        from: this.alertChannels.sms.twilioPhoneNumber,
        to: recipient
      }).catch(error => {
        console.error(`❌ SMS alert failed for ${recipient}:`, error);
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Get severity color for Slack
   */
  getSeverityColor(severity) {
    switch (severity) {
      case 'CRITICAL': return '#ff0000';
      case 'HIGH': return '#ff6600';
      case 'MEDIUM': return '#ffcc00';
      case 'LOW': return '#00cc00';
      default: return '#cccccc';
    }
  }

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring() {
    // Update metrics every minute
    setInterval(() => {
      this.updateSystemMetrics();
    }, 60000);
    
    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
    
    // Broadcast metrics to WebSocket clients every 30 seconds
    setInterval(() => {
      this.broadcastMetrics();
    }, 30000);
  }

  /**
   * Update system metrics
   */
  async updateSystemMetrics() {
    try {
      const metrics = await this.getSystemMetrics();
      
      // Store in Redis for persistence
      await this.redisClient.setex('system_metrics', 3600, JSON.stringify(metrics));
      
      // Update monitoring metrics
      this.monitoringMetrics.set('system_metrics', metrics);
      
    } catch (error) {
      console.error('❌ Update system metrics error:', error);
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    
    const [threatStats, userStats, systemStats] = await Promise.all([
      this.db.query(`
        SELECT 
          COUNT(*) as total_threats,
          COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_threats,
          COUNT(*) FILTER (WHERE severity = 'HIGH') as high_threats,
          AVG(threat_score) as avg_threat_score
        FROM threat_detection_logs 
        WHERE timestamp > $1
      `, [hourAgo]),
      
      this.db.query(`
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM threat_detection_logs 
        WHERE timestamp > $1
      `, [hourAgo]),
      
      this.db.query(`
        SELECT 
          COUNT(*) as total_requests,
          AVG(response_time) as avg_response_time
        FROM network_traffic 
        WHERE timestamp > $1
      `, [hourAgo])
    ]);
    
    return {
      timestamp: now,
      threats: threatStats.rows[0],
      users: userStats.rows[0],
      system: systemStats.rows[0],
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics() {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);
    
    const metrics = {
      timestamp: new Date(),
      requests: {
        perMinute: this.monitoringMetrics.get(`requests_per_minute:${minuteKey}`) || 0,
        byMethod: {},
        byPath: {},
        byUser: {}
      },
      threats: {
        perMinute: this.monitoringMetrics.get(`threats_per_minute:${minuteKey}`) || 0,
        avgScore: this.monitoringMetrics.get(`avg_threat_score:${minuteKey}`) || 0
      },
      security: {
        challenges: this.monitoringMetrics.get(`security_challenges_per_minute:${minuteKey}`) || 0,
        rateLimited: this.monitoringMetrics.get(`rate_limited_requests_per_minute:${minuteKey}`) || 0
      },
      users: {
        active: new Set()
      },
      system: this.monitoringMetrics.get('system_metrics') || {}
    };
    
    // Get method breakdown
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
      metrics.requests.byMethod[method] = this.monitoringMetrics.get(`requests_by_method:${method}`) || 0;
    });
    
    // Get path breakdown (top 10)
    const pathEntries = Array.from(this.monitoringMetrics.entries())
      .filter(([key]) => key.startsWith('requests_by_path:'))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    pathEntries.forEach(([key, count]) => {
      const path = key.replace('requests_by_path:', '');
      metrics.requests.byPath[path] = count;
    });
    
    return metrics;
  }

  /**
   * Broadcast metrics to WebSocket clients
   */
  async broadcastMetrics() {
    const metrics = await this.getRealTimeMetrics();
    
    this.broadcastToClients({
      type: 'METRICS_UPDATE',
      data: metrics,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast security update
   */
  broadcastSecurityUpdate(securityData, incidents) {
    if (incidents.length > 0) {
      this.broadcastToClients({
        type: 'SECURITY_INCIDENT',
        data: {
          incidents,
          securityData
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Track response time
   */
  trackResponseTime(securityData, responseTime) {
    const responseKey = `response_time:${securityData.path}`;
    const currentAvg = this.monitoringMetrics.get(responseKey) || 0;
    const newAvg = (currentAvg + responseTime) / 2;
    
    this.monitoringMetrics.set(responseKey, newAvg);
    this.redisClient.setex(responseKey, 3600, newAvg.toString());
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    for (const [key, value] of this.monitoringMetrics.entries()) {
      if (key.includes(':') && key.split(':')[1] < oneHourAgo) {
        this.monitoringMetrics.delete(key);
      }
    }
  }

  /**
   * Log incident
   */
  async logIncident(incident) {
    try {
      await this.db.query(`
        INSERT INTO security_incidents (
          id, incident_type, severity, threat_score, ip_address, user_id, 
          timestamp, details, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        incident.id,
        incident.type,
        incident.severity,
        incident.threatScore || 0,
        incident.ipAddress,
        incident.userId,
        incident.timestamp,
        JSON.stringify(incident.details),
        'DETECTED'
      ]);
    } catch (error) {
      console.error('❌ Log incident error:', error);
    }
  }

  /**
   * Log incident action
   */
  async logIncidentAction(incidentId, actionName, result) {
    try {
      await this.db.query(`
        INSERT INTO incident_actions (
          incident_id, action_name, result, timestamp
        ) VALUES ($1, $2, $3, $4)
      `, [
        incidentId,
        actionName,
        JSON.stringify(result),
        new Date()
      ]);
    } catch (error) {
      console.error('❌ Log incident action error:', error);
    }
  }

  /**
   * Block IP address
   */
  async blockIP(ipAddress) {
    try {
      await this.redisClient.setex(`blocked_ip:${ipAddress}`, 3600, 'true');
      console.log(`🚫 IP blocked: ${ipAddress}`);
    } catch (error) {
      console.error('❌ Block IP error:', error);
    }
  }

  /**
   * Suspend user account
   */
  async suspendUser(userId) {
    try {
      await this.db.query(`
        UPDATE users SET is_active = false, suspended_at = NOW()
        WHERE id = $1
      `, [userId]);
      console.log(`🚫 User suspended: ${userId}`);
    } catch (error) {
      console.error('❌ Suspend user error:', error);
    }
  }

  /**
   * Increase monitoring level
   */
  async increaseMonitoring(userId) {
    try {
      await this.redisClient.setex(`high_monitoring:${userId}`, 3600, 'true');
      console.log(`👁️ Increased monitoring for user: ${userId}`);
    } catch (error) {
      console.error('❌ Increase monitoring error:', error);
    }
  }

  /**
   * Force MFA verification
   */
  async forceMFA(userId) {
    try {
      await this.redisClient.setex(`force_mfa:${userId}`, 1800, 'true');
      console.log(`🔐 MFA forced for user: ${userId}`);
    } catch (error) {
      console.error('❌ Force MFA error:', error);
    }
  }

  /**
   * Notify administrators
   */
  async notifyAdmins(incident) {
    try {
      const admins = await this.db.query(`
        SELECT email FROM users WHERE role = 'ADMIN' AND is_active = true
      `);
      
      const adminEmails = admins.rows.map(row => row.email);
      
      if (adminEmails.length > 0 && this.alertChannels.email.enabled) {
        await this.alertChannels.email.transporter.sendMail({
          from: process.env.SMTP_FROM || 'security@medspasync.com',
          to: adminEmails.join(', '),
          subject: `URGENT: Security Incident - ${incident.severity}`,
          html: `
            <h2>Security Incident Alert</h2>
            <p><strong>Severity:</strong> ${incident.severity}</p>
            <p><strong>Type:</strong> ${incident.type}</p>
            <p><strong>Time:</strong> ${incident.timestamp}</p>
            <p><strong>Details:</strong></p>
            <pre>${JSON.stringify(incident.details, null, 2)}</pre>
            <p>Please review and take appropriate action.</p>
          `
        });
      }
    } catch (error) {
      console.error('❌ Notify admins error:', error);
    }
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStatistics() {
    try {
      const [incidentStats, alertStats, systemStats] = await Promise.all([
        this.db.query(`
          SELECT 
            COUNT(*) as total_incidents,
            COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_incidents,
            COUNT(*) FILTER (WHERE severity = 'HIGH') as high_incidents,
            COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_incidents
          FROM security_incidents 
          WHERE timestamp > NOW() - INTERVAL '24 hours'
        `),
        
        this.db.query(`
          SELECT 
            COUNT(*) as total_alerts,
            COUNT(*) FILTER (WHERE channel = 'email') as email_alerts,
            COUNT(*) FILTER (WHERE channel = 'webhook') as webhook_alerts,
            COUNT(*) FILTER (WHERE channel = 'slack') as slack_alerts
          FROM security_alerts 
          WHERE timestamp > NOW() - INTERVAL '24 hours'
        `),
        
        this.getSystemMetrics()
      ]);
      
      return {
        incidents: incidentStats.rows[0],
        alerts: alertStats.rows[0],
        system: systemStats,
        generated: new Date()
      };
    } catch (error) {
      console.error('❌ Get monitoring statistics error:', error);
      return {};
    }
  }
}

// Create singleton instance
const securityMonitoring = new SecurityMonitoring();

// Export middleware functions
module.exports = {
  monitorSecurity: securityMonitoring.monitorSecurity.bind(securityMonitoring),
  getStatistics: securityMonitoring.getMonitoringStatistics.bind(securityMonitoring),
  broadcastToClients: securityMonitoring.broadcastToClients.bind(securityMonitoring)
}; 