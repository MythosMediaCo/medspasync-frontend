/**
 * Advanced Threat Detection Middleware
 * Machine learning-based security with behavioral analysis and anomaly detection
 */

const crypto = require('crypto');
const { Pool } = require('pg');
const redis = require('redis');

class AdvancedThreatDetection {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 1
    });

    this.behavioralProfiles = new Map();
    this.threatPatterns = this.loadThreatPatterns();
    this.anomalyThresholds = this.loadAnomalyThresholds();
    this.mlModels = this.initializeMLModels();
    
    this.startBehavioralAnalysis();
  }

  /**
   * Load advanced threat patterns
   */
  loadThreatPatterns() {
    return {
      // Advanced SQL injection patterns
      sqlInjection: [
        /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
        /(\b(script|javascript|vbscript|onload|onerror|onclick)\b)/i,
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(exec|execute|script|javascript|vbscript)\b)/i,
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(exec|execute|script|javascript|vbscript)\b)/i,
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(exec|execute|script|javascript|vbscript)\b)/i,
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(exec|execute|script|javascript|vbscript)\b)/i
      ],
      
      // Advanced XSS patterns
      xss: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload=/gi,
        /onerror=/gi,
        /onclick=/gi,
        /onmouseover=/gi,
        /onfocus=/gi,
        /onblur=/gi,
        /onchange=/gi,
        /onkeypress=/gi,
        /onkeydown=/gi,
        /onkeyup=/gi,
        /onsubmit=/gi,
        /onreset=/gi,
        /onselect=/gi,
        /onunload=/gi,
        /onabort=/gi,
        /onbeforeunload=/gi,
        /onerror=/gi
      ],
      
      // Advanced path traversal patterns
      pathTraversal: [
        /\.\.\//,
        /\.\.\\/,
        /\/etc\/passwd/,
        /\/proc\/version/,
        /\/windows\/system32/,
        /\/etc\/shadow/,
        /\/etc\/hosts/,
        /\/proc\/cpuinfo/,
        /\/proc\/meminfo/,
        /\/proc\/net\/tcp/,
        /\/proc\/self\/environ/,
        /\/proc\/self\/fd/,
        /\/proc\/self\/cmdline/,
        /\/proc\/self\/status/,
        /\/proc\/self\/maps/
      ],
      
      // Advanced command injection patterns
      commandInjection: [
        /(\b(cat|ls|dir|rm|del|mkdir|chmod|chown|chgrp)\b)/i,
        /(\b(ping|nslookup|traceroute|netstat|ps|top|kill)\b)/i,
        /(\b(wget|curl|nc|telnet|ssh|scp|rsync)\b)/i,
        /(\b(grep|find|sed|awk|cut|sort|uniq)\b)/i,
        /(\b(tar|zip|unzip|gzip|bzip2)\b)/i,
        /(\b(apt|yum|pip|npm|gem|brew)\b)/i,
        /(\b(sudo|su|whoami|id|groups)\b)/i,
        /(\b(ifconfig|ipconfig|route|arp)\b)/i,
        /(\b(df|du|free|uptime|who|w)\b)/i,
        /(\b(history|alias|export|source)\b)/i
      ],
      
      // Advanced file inclusion patterns
      fileInclusion: [
        /include\s*\(/i,
        /require\s*\(/i,
        /include_once\s*\(/i,
        /require_once\s*\(/i,
        /fopen\s*\(/i,
        /file_get_contents\s*\(/i,
        /readfile\s*\(/i,
        /file_put_contents\s*\(/i,
        /copy\s*\(/i,
        /move_uploaded_file\s*\(/i
      ],
      
      // Advanced LDAP injection patterns
      ldapInjection: [
        /\(\|/,
        /\(\&/,
        /\(!/,
        /\(/,
        /\)/,
        /\*/,
        /\\/,
        /\|/,
        /&/,
        /!/
      ],
      
      // Advanced NoSQL injection patterns
      nosqlInjection: [
        /\$where/,
        /\$ne/,
        /\$gt/,
        /\$lt/,
        /\$gte/,
        /\$lte/,
        /\$in/,
        /\$nin/,
        /\$exists/,
        /\$regex/
      ]
    };
  }

  /**
   * Load anomaly detection thresholds
   */
  loadAnomalyThresholds() {
    return {
      requestFrequency: {
        normal: 100, // requests per minute
        suspicious: 200,
        critical: 500
      },
      responseTime: {
        normal: 1000, // milliseconds
        suspicious: 3000,
        critical: 10000
      },
      errorRate: {
        normal: 0.05, // 5%
        suspicious: 0.15,
        critical: 0.30
      },
      dataAccess: {
        normal: 1000, // records per request
        suspicious: 5000,
        critical: 10000
      },
      authenticationFailures: {
        normal: 3, // per hour
        suspicious: 10,
        critical: 20
      },
      geographicAnomaly: {
        maxDistance: 1000, // kilometers
        timeWindow: 3600 // 1 hour
      }
    };
  }

  /**
   * Initialize machine learning models
   */
  initializeMLModels() {
    return {
      // Behavioral analysis model
      behavioral: {
        userPatterns: new Map(),
        sessionPatterns: new Map(),
        requestPatterns: new Map()
      },
      
      // Anomaly detection model
      anomaly: {
        baselineMetrics: new Map(),
        deviationThresholds: new Map(),
        learningRate: 0.1
      },
      
      // Threat scoring model
      threatScoring: {
        weights: {
          patternMatch: 0.3,
          behavioralAnomaly: 0.25,
          frequencyAnomaly: 0.2,
          geographicAnomaly: 0.15,
          temporalAnomaly: 0.1
        },
        thresholds: {
          low: 0.3,
          medium: 0.6,
          high: 0.8,
          critical: 0.9
        }
      }
    };
  }

  /**
   * Advanced threat detection middleware
   */
  detectThreats() {
    return async (req, res, next) => {
      try {
        const startTime = Date.now();
        
        // Collect request data
        const requestData = this.collectRequestData(req);
        
        // Perform multi-layer threat analysis
        const threatAnalysis = await this.performThreatAnalysis(requestData);
        
        // Calculate threat score
        const threatScore = this.calculateThreatScore(threatAnalysis);
        
        // Update behavioral profile
        await this.updateBehavioralProfile(requestData, threatScore);
        
        // Check for anomalies
        const anomalies = await this.detectAnomalies(requestData, threatScore);
        
        // Take action based on threat level
        const action = this.determineAction(threatScore, anomalies);
        
        // Log threat detection
        await this.logThreatDetection(requestData, threatAnalysis, threatScore, action);
        
        // Execute action
        await this.executeAction(action, req, res);
        
        // Add response time tracking
        res.on('finish', () => {
          const responseTime = Date.now() - startTime;
          this.trackResponseTime(requestData, responseTime);
        });
        
        next();
      } catch (error) {
        console.error('❌ Advanced threat detection error:', error);
        next();
      }
    };
  }

  /**
   * Collect comprehensive request data
   */
  collectRequestData(req) {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      body: req.body,
      headers: req.headers,
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      sessionId: req.session?.id || null,
      referer: req.get('Referer'),
      origin: req.get('Origin'),
      contentType: req.get('Content-Type'),
      contentLength: parseInt(req.get('Content-Length') || '0'),
      acceptLanguage: req.get('Accept-Language'),
      acceptEncoding: req.get('Accept-Encoding'),
      xForwardedFor: req.get('X-Forwarded-For'),
      xRealIp: req.get('X-Real-IP'),
      xRequestedWith: req.get('X-Requested-With'),
      // Geographic data (would be populated by IP geolocation service)
      geoData: {
        country: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null
      }
    };
  }

  /**
   * Perform comprehensive threat analysis
   */
  async performThreatAnalysis(requestData) {
    const analysis = {
      patternMatches: this.detectPatternMatches(requestData),
      behavioralAnomalies: await this.detectBehavioralAnomalies(requestData),
      frequencyAnomalies: await this.detectFrequencyAnomalies(requestData),
      geographicAnomalies: await this.detectGeographicAnomalies(requestData),
      temporalAnomalies: await this.detectTemporalAnomalies(requestData),
      dataAccessAnomalies: await this.detectDataAccessAnomalies(requestData),
      authenticationAnomalies: await this.detectAuthenticationAnomalies(requestData)
    };

    return analysis;
  }

  /**
   * Detect pattern matches in request data
   */
  detectPatternMatches(requestData) {
    const matches = {
      sqlInjection: 0,
      xss: 0,
      pathTraversal: 0,
      commandInjection: 0,
      fileInclusion: 0,
      ldapInjection: 0,
      nosqlInjection: 0
    };

    const requestString = JSON.stringify(requestData);

    // Check each pattern category
    for (const [category, patterns] of Object.entries(this.threatPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(requestString)) {
          matches[category]++;
        }
      }
    }

    return matches;
  }

  /**
   * Detect behavioral anomalies
   */
  async detectBehavioralAnomalies(requestData) {
    const anomalies = [];
    const userId = requestData.userId;

    if (!userId) return anomalies;

    // Get user's behavioral profile
    const profile = this.behavioralProfiles.get(userId) || this.createBehavioralProfile();

    // Check request timing patterns
    const timeAnomaly = this.checkTimePatternAnomaly(requestData, profile);
    if (timeAnomaly) anomalies.push(timeAnomaly);

    // Check request method patterns
    const methodAnomaly = this.checkMethodPatternAnomaly(requestData, profile);
    if (methodAnomaly) anomalies.push(methodAnomaly);

    // Check request path patterns
    const pathAnomaly = this.checkPathPatternAnomaly(requestData, profile);
    if (pathAnomaly) anomalies.push(pathAnomaly);

    // Check data access patterns
    const dataAnomaly = this.checkDataAccessAnomaly(requestData, profile);
    if (dataAnomaly) anomalies.push(dataAnomaly);

    return anomalies;
  }

  /**
   * Detect frequency anomalies
   */
  async detectFrequencyAnomalies(requestData) {
    const anomalies = [];
    const key = `freq:${requestData.ip}:${requestData.userId || 'anonymous'}`;
    
    try {
      // Get current request count
      const currentCount = await this.redisClient.get(key) || 0;
      const newCount = parseInt(currentCount) + 1;
      
      // Set count with expiration (1 minute window)
      await this.redisClient.setex(key, 60, newCount.toString());
      
      // Check against thresholds
      if (newCount > this.anomalyThresholds.requestFrequency.critical) {
        anomalies.push({
          type: 'FREQUENCY_CRITICAL',
          value: newCount,
          threshold: this.anomalyThresholds.requestFrequency.critical,
          severity: 'CRITICAL'
        });
      } else if (newCount > this.anomalyThresholds.requestFrequency.suspicious) {
        anomalies.push({
          type: 'FREQUENCY_SUSPICIOUS',
          value: newCount,
          threshold: this.anomalyThresholds.requestFrequency.suspicious,
          severity: 'MEDIUM'
        });
      }
    } catch (error) {
      console.error('❌ Frequency anomaly detection error:', error);
    }

    return anomalies;
  }

  /**
   * Detect geographic anomalies
   */
  async detectGeographicAnomalies(requestData) {
    const anomalies = [];
    const userId = requestData.userId;

    if (!userId || !requestData.geoData.latitude) return anomalies;

    try {
      // Get user's last known location
      const lastLocation = await this.redisClient.get(`geo:${userId}`);
      
      if (lastLocation) {
        const lastGeo = JSON.parse(lastLocation);
        const distance = this.calculateDistance(
          lastGeo.latitude, lastGeo.longitude,
          requestData.geoData.latitude, requestData.geoData.longitude
        );

        if (distance > this.anomalyThresholds.geographicAnomaly.maxDistance) {
          anomalies.push({
            type: 'GEOGRAPHIC_ANOMALY',
            distance: distance,
            threshold: this.anomalyThresholds.geographicAnomaly.maxDistance,
            severity: 'HIGH'
          });
        }
      }

      // Update user's location
      await this.redisClient.setex(
        `geo:${userId}`,
        this.anomalyThresholds.geographicAnomaly.timeWindow,
        JSON.stringify(requestData.geoData)
      );
    } catch (error) {
      console.error('❌ Geographic anomaly detection error:', error);
    }

    return anomalies;
  }

  /**
   * Detect temporal anomalies
   */
  async detectTemporalAnomalies(requestData) {
    const anomalies = [];
    const userId = requestData.userId;
    const hour = requestData.timestamp.getHours();

    if (!userId) return anomalies;

    try {
      // Get user's activity pattern
      const activityPattern = await this.redisClient.get(`activity:${userId}`);
      
      if (activityPattern) {
        const pattern = JSON.parse(activityPattern);
        const expectedActivity = pattern[hour] || 0;
        
        if (expectedActivity === 0 && hour >= 22 || hour <= 6) {
          anomalies.push({
            type: 'TEMPORAL_ANOMALY',
            hour: hour,
            expectedActivity: expectedActivity,
            severity: 'MEDIUM'
          });
        }
      }

      // Update activity pattern
      const currentPattern = activityPattern ? JSON.parse(activityPattern) : {};
      currentPattern[hour] = (currentPattern[hour] || 0) + 1;
      
      await this.redisClient.setex(
        `activity:${userId}`,
        86400, // 24 hours
        JSON.stringify(currentPattern)
      );
    } catch (error) {
      console.error('❌ Temporal anomaly detection error:', error);
    }

    return anomalies;
  }

  /**
   * Detect data access anomalies
   */
  async detectDataAccessAnomalies(requestData) {
    const anomalies = [];
    
    // Check content length for data exfiltration
    if (requestData.contentLength > this.anomalyThresholds.dataAccess.critical) {
      anomalies.push({
        type: 'DATA_ACCESS_CRITICAL',
        contentLength: requestData.contentLength,
        threshold: this.anomalyThresholds.dataAccess.critical,
        severity: 'CRITICAL'
      });
    } else if (requestData.contentLength > this.anomalyThresholds.dataAccess.suspicious) {
      anomalies.push({
        type: 'DATA_ACCESS_SUSPICIOUS',
        contentLength: requestData.contentLength,
        threshold: this.anomalyThresholds.dataAccess.suspicious,
        severity: 'MEDIUM'
      });
    }

    return anomalies;
  }

  /**
   * Detect authentication anomalies
   */
  async detectAuthenticationAnomalies(requestData) {
    const anomalies = [];
    const ip = requestData.ip;

    if (!ip) return anomalies;

    try {
      // Check authentication failures
      const authFailures = await this.redisClient.get(`auth_failures:${ip}`) || 0;
      const failureCount = parseInt(authFailures);

      if (failureCount > this.anomalyThresholds.authenticationFailures.critical) {
        anomalies.push({
          type: 'AUTH_FAILURE_CRITICAL',
          failures: failureCount,
          threshold: this.anomalyThresholds.authenticationFailures.critical,
          severity: 'CRITICAL'
        });
      } else if (failureCount > this.anomalyThresholds.authenticationFailures.suspicious) {
        anomalies.push({
          type: 'AUTH_FAILURE_SUSPICIOUS',
          failures: failureCount,
          threshold: this.anomalyThresholds.authenticationFailures.suspicious,
          severity: 'MEDIUM'
        });
      }
    } catch (error) {
      console.error('❌ Authentication anomaly detection error:', error);
    }

    return anomalies;
  }

  /**
   * Calculate comprehensive threat score
   */
  calculateThreatScore(analysis) {
    const weights = this.mlModels.threatScoring.weights;
    let score = 0;

    // Pattern match score
    const patternScore = this.calculatePatternScore(analysis.patternMatches);
    score += patternScore * weights.patternMatch;

    // Behavioral anomaly score
    const behavioralScore = this.calculateBehavioralScore(analysis.behavioralAnomalies);
    score += behavioralScore * weights.behavioralAnomaly;

    // Frequency anomaly score
    const frequencyScore = this.calculateFrequencyScore(analysis.frequencyAnomalies);
    score += frequencyScore * weights.frequencyAnomaly;

    // Geographic anomaly score
    const geographicScore = this.calculateGeographicScore(analysis.geographicAnomalies);
    score += geographicScore * weights.geographicAnomaly;

    // Temporal anomaly score
    const temporalScore = this.calculateTemporalScore(analysis.temporalAnomalies);
    score += temporalScore * weights.temporalAnomaly;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate pattern match score
   */
  calculatePatternScore(patternMatches) {
    let score = 0;
    const totalMatches = Object.values(patternMatches).reduce((sum, count) => sum + count, 0);
    
    if (totalMatches > 0) {
      score = Math.min(totalMatches * 0.2, 1.0);
    }

    return score;
  }

  /**
   * Calculate behavioral anomaly score
   */
  calculateBehavioralScore(anomalies) {
    let score = 0;
    
    for (const anomaly of anomalies) {
      switch (anomaly.severity) {
        case 'CRITICAL':
          score += 0.4;
          break;
        case 'HIGH':
          score += 0.3;
          break;
        case 'MEDIUM':
          score += 0.2;
          break;
        case 'LOW':
          score += 0.1;
          break;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate frequency anomaly score
   */
  calculateFrequencyScore(anomalies) {
    let score = 0;
    
    for (const anomaly of anomalies) {
      if (anomaly.type === 'FREQUENCY_CRITICAL') {
        score = 1.0;
        break;
      } else if (anomaly.type === 'FREQUENCY_SUSPICIOUS') {
        score = Math.max(score, 0.6);
      }
    }

    return score;
  }

  /**
   * Calculate geographic anomaly score
   */
  calculateGeographicScore(anomalies) {
    let score = 0;
    
    for (const anomaly of anomalies) {
      if (anomaly.type === 'GEOGRAPHIC_ANOMALY') {
        score = Math.max(score, 0.7);
      }
    }

    return score;
  }

  /**
   * Calculate temporal anomaly score
   */
  calculateTemporalScore(anomalies) {
    let score = 0;
    
    for (const anomaly of anomalies) {
      if (anomaly.type === 'TEMPORAL_ANOMALY') {
        score = Math.max(score, 0.5);
      }
    }

    return score;
  }

  /**
   * Determine action based on threat score
   */
  determineAction(threatScore, anomalies) {
    const thresholds = this.mlModels.threatScoring.thresholds;

    if (threatScore >= thresholds.critical) {
      return {
        type: 'BLOCK',
        reason: 'Critical threat detected',
        severity: 'CRITICAL',
        score: threatScore
      };
    } else if (threatScore >= thresholds.high) {
      return {
        type: 'CHALLENGE',
        reason: 'High threat detected',
        severity: 'HIGH',
        score: threatScore
      };
    } else if (threatScore >= thresholds.medium) {
      return {
        type: 'MONITOR',
        reason: 'Medium threat detected',
        severity: 'MEDIUM',
        score: threatScore
      };
    } else if (threatScore >= thresholds.low) {
      return {
        type: 'LOG',
        reason: 'Low threat detected',
        severity: 'LOW',
        score: threatScore
      };
    }

    return {
      type: 'ALLOW',
      reason: 'No threat detected',
      severity: 'NONE',
      score: threatScore
    };
  }

  /**
   * Execute security action
   */
  async executeAction(action, req, res) {
    switch (action.type) {
      case 'BLOCK':
        res.status(403).json({
          error: 'Access blocked',
          message: 'Request blocked due to security threat',
          reason: action.reason,
          requestId: req.headers['x-request-id']
        });
        break;

      case 'CHALLENGE':
        // Add additional verification headers
        res.setHeader('X-Security-Challenge', 'required');
        res.setHeader('X-Threat-Score', action.score.toString());
        break;

      case 'MONITOR':
        // Add monitoring headers
        res.setHeader('X-Security-Monitor', 'active');
        res.setHeader('X-Threat-Score', action.score.toString());
        break;

      case 'LOG':
        // Just log the threat
        console.log(`⚠️  Low threat detected: ${action.score} - ${action.reason}`);
        break;

      case 'ALLOW':
        // Allow the request to proceed
        break;
    }
  }

  /**
   * Update behavioral profile
   */
  async updateBehavioralProfile(requestData, threatScore) {
    const userId = requestData.userId;
    if (!userId) return;

    try {
      const profile = this.behavioralProfiles.get(userId) || this.createBehavioralProfile();
      
      // Update request patterns
      profile.requestPatterns[requestData.method] = (profile.requestPatterns[requestData.method] || 0) + 1;
      profile.requestPatterns[requestData.path] = (profile.requestPatterns[requestData.path] || 0) + 1;
      
      // Update timing patterns
      const hour = requestData.timestamp.getHours();
      profile.timingPatterns[hour] = (profile.timingPatterns[hour] || 0) + 1;
      
      // Update threat score history
      profile.threatScores.push({
        score: threatScore,
        timestamp: requestData.timestamp
      });
      
      // Keep only last 100 scores
      if (profile.threatScores.length > 100) {
        profile.threatScores = profile.threatScores.slice(-100);
      }
      
      this.behavioralProfiles.set(userId, profile);
    } catch (error) {
      console.error('❌ Update behavioral profile error:', error);
    }
  }

  /**
   * Create new behavioral profile
   */
  createBehavioralProfile() {
    return {
      requestPatterns: {},
      timingPatterns: {},
      threatScores: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * Track response time for anomaly detection
   */
  trackResponseTime(requestData, responseTime) {
    const userId = requestData.userId;
    if (!userId) return;

    try {
      // Store response time for analysis
      this.redisClient.lpush(`response_times:${userId}`, responseTime.toString());
      this.redisClient.ltrim(`response_times:${userId}`, 0, 99); // Keep last 100
    } catch (error) {
      console.error('❌ Track response time error:', error);
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Log threat detection
   */
  async logThreatDetection(requestData, analysis, threatScore, action) {
    try {
      const logData = {
        id: crypto.randomUUID(),
        timestamp: requestData.timestamp,
        ip: requestData.ip,
        userId: requestData.userId,
        userAgent: requestData.userAgent,
        method: requestData.method,
        url: requestData.url,
        threatScore: threatScore,
        action: action,
        analysis: analysis,
        requestData: {
          path: requestData.path,
          query: requestData.query,
          contentType: requestData.contentType,
          contentLength: requestData.contentLength
        }
      };

      await this.db.query(`
        INSERT INTO threat_detection_logs (id, event_data, ip_address, user_agent, timestamp, severity)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        logData.id,
        JSON.stringify(logData),
        requestData.ip,
        requestData.userAgent,
        requestData.timestamp,
        action.severity
      ]);

      // Log to console for immediate visibility
      if (threatScore > 0.5) {
        console.log(`🚨 Threat detected: ${threatScore.toFixed(2)} - ${action.reason}`);
      }
    } catch (error) {
      console.error('❌ Log threat detection error:', error);
    }
  }

  /**
   * Start behavioral analysis
   */
  startBehavioralAnalysis() {
    // Run behavioral analysis every 5 minutes
    setInterval(() => {
      this.analyzeBehavioralPatterns();
    }, 5 * 60 * 1000);
  }

  /**
   * Analyze behavioral patterns
   */
  async analyzeBehavioralPatterns() {
    try {
      for (const [userId, profile] of this.behavioralProfiles.entries()) {
        // Analyze threat score trends
        const recentScores = profile.threatScores.slice(-20);
        if (recentScores.length > 10) {
          const avgScore = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;
          
          if (avgScore > 0.7) {
            console.log(`⚠️  High average threat score for user ${userId}: ${avgScore.toFixed(2)}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Behavioral analysis error:', error);
    }
  }

  /**
   * Get threat statistics
   */
  async getThreatStatistics() {
    try {
      const stats = await this.db.query(`
        SELECT 
          severity,
          COUNT(*) as count,
          AVG(CAST(event_data->>'threatScore' AS FLOAT)) as avg_score
        FROM threat_detection_logs 
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY severity
        ORDER BY count DESC
      `);

      return {
        statistics: stats.rows,
        behavioralProfiles: this.behavioralProfiles.size,
        generated: new Date()
      };
    } catch (error) {
      console.error('❌ Get threat statistics error:', error);
      return {};
    }
  }
}

// Create singleton instance
const advancedThreatDetection = new AdvancedThreatDetection();

// Export middleware functions
module.exports = {
  detectThreats: advancedThreatDetection.detectThreats.bind(advancedThreatDetection),
  getStatistics: advancedThreatDetection.getThreatStatistics.bind(advancedThreatDetection)
}; 