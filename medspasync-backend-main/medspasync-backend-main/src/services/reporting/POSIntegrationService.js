const axios = require('axios');
const { EventEmitter } = require('events');
const { auditLogger } = require('../auditService');
const { encryptionService } = require('../encryptionService');

class POSIntegrationService extends EventEmitter {
  constructor() {
    super();
    
    this.integrations = {
      // Existing integrations (extend current 90% accuracy)
      alle: {
        name: 'Alle',
        type: 'REST_API',
        baseUrl: process.env.ALLE_API_URL,
        accuracy: 0.90,
        enabled: false,
        config: {
          apiKey: null,
          rateLimit: 100, // requests per minute
          timeout: 30000
        }
      },
      aspire: {
        name: 'Aspire',
        type: 'REST_API', 
        baseUrl: process.env.ASPIRE_API_URL,
        accuracy: 0.90,
        enabled: false,
        config: {
          apiKey: null,
          rateLimit: 100,
          timeout: 30000
        }
      },
      
      // New POS system integrations
      zenoti: {
        name: 'Zenoti',
        type: 'REST_API',
        baseUrl: 'https://api.zenoti.com/v1',
        accuracy: 0.85, // Estimated based on API quality
        enabled: false,
        config: {
          apiKey: null,
          clientId: null,
          clientSecret: null,
          rateLimit: 500, // 500 req/hour limit
          timeout: 30000,
          cost: 50 // $50/month API cost
        }
      },
      vagaro: {
        name: 'Vagaro',
        type: 'REST_API',
        baseUrl: 'https://api.vagaro.com/v1',
        accuracy: 0.80,
        enabled: false,
        config: {
          apiKey: null,
          rateLimit: 500, // 500 req/hour limit
          timeout: 30000
        }
      },
      mindbody: {
        name: 'Mindbody',
        type: 'REST_API',
        baseUrl: 'https://api.mindbodyonline.com/public/v6',
        accuracy: 0.85,
        enabled: false,
        config: {
          apiKey: null,
          siteId: null,
          rateLimit: 1000,
          timeout: 30000
        }
      },
      boulevard: {
        name: 'Boulevard',
        type: 'GRAPHQL_REST',
        baseUrl: 'https://api.boulevard.com/graphql',
        accuracy: 0.90,
        enabled: false,
        config: {
          apiKey: null,
          rateLimit: 2000,
          timeout: 30000
        }
      }
    };

    this.activeConnections = new Map();
    this.rateLimiters = new Map();
    this.webhookHandlers = new Map();
    
    this.initializeRateLimiters();
  }

  /**
   * Initialize rate limiters for each integration
   */
  initializeRateLimiters() {
    Object.keys(this.integrations).forEach(integrationId => {
      const integration = this.integrations[integrationId];
      this.rateLimiters.set(integrationId, {
        requests: 0,
        resetTime: Date.now() + (60 * 1000), // 1 minute window
        limit: integration.config.rateLimit
      });
    });
  }

  /**
   * Configure integration for a tenant
   */
  async configureIntegration(tenantId, integrationId, config) {
    const integration = this.integrations[integrationId];
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    // Validate configuration
    this.validateIntegrationConfig(integrationId, config);

    // Encrypt sensitive configuration
    const encryptedConfig = await this.encryptConfig(config);

    // Store configuration (in production, this would be in database)
    integration.config = { ...integration.config, ...encryptedConfig };
    integration.enabled = true;

    // Test connection
    await this.testConnection(integrationId, config);

    // Log configuration
    await auditLogger.log({
      action: 'POS_INTEGRATION_CONFIGURED',
      tenantId,
      details: {
        integrationId,
        enabled: true
      }
    });

    return {
      success: true,
      integrationId,
      status: 'configured'
    };
  }

  /**
   * Validate integration configuration
   */
  validateIntegrationConfig(integrationId, config) {
    const integration = this.integrations[integrationId];
    const requiredFields = this.getRequiredFields(integrationId);

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate API key format
    if (config.apiKey && !this.isValidApiKey(config.apiKey)) {
      throw new Error('Invalid API key format');
    }
  }

  /**
   * Get required fields for integration
   */
  getRequiredFields(integrationId) {
    const fieldMap = {
      alle: ['apiKey'],
      aspire: ['apiKey'],
      zenoti: ['apiKey', 'clientId', 'clientSecret'],
      vagaro: ['apiKey'],
      mindbody: ['apiKey', 'siteId'],
      boulevard: ['apiKey']
    };

    return fieldMap[integrationId] || ['apiKey'];
  }

  /**
   * Validate API key format
   */
  isValidApiKey(apiKey) {
    // Basic validation - in production, this would be more sophisticated
    return typeof apiKey === 'string' && apiKey.length >= 10;
  }

  /**
   * Encrypt sensitive configuration
   */
  async encryptConfig(config) {
    const encrypted = { ...config };
    
    if (config.apiKey) {
      encrypted.apiKey = await encryptionService.encrypt(config.apiKey);
    }
    
    if (config.clientSecret) {
      encrypted.clientSecret = await encryptionService.encrypt(config.clientSecret);
    }

    return encrypted;
  }

  /**
   * Test connection to POS system
   */
  async testConnection(integrationId, config) {
    const integration = this.integrations[integrationId];
    
    try {
      const testEndpoint = this.getTestEndpoint(integrationId);
      const response = await this.makeRequest(integrationId, 'GET', testEndpoint, null, config);
      
      return {
        success: true,
        status: 'connected',
        response: response.data
      };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Get test endpoint for integration
   */
  getTestEndpoint(integrationId) {
    const endpoints = {
      alle: '/health',
      aspire: '/status',
      zenoti: '/businesses',
      vagaro: '/business/info',
      mindbody: '/site/locations',
      boulevard: '/business'
    };

    return endpoints[integrationId] || '/health';
  }

  /**
   * Fetch data from POS system
   */
  async fetchData(integrationId, dataType, options = {}) {
    const integration = this.integrations[integrationId];
    if (!integration || !integration.enabled) {
      throw new Error(`Integration not available: ${integrationId}`);
    }

    // Check rate limit
    if (!this.checkRateLimit(integrationId)) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const endpoint = this.getDataEndpoint(integrationId, dataType);
      const response = await this.makeRequest(integrationId, 'GET', endpoint, null, options);

      // Transform data to standard format
      const transformedData = this.transformData(integrationId, dataType, response.data);

      // Log data fetch
      await auditLogger.log({
        action: 'POS_DATA_FETCHED',
        tenantId: options.tenantId,
        details: {
          integrationId,
          dataType,
          recordCount: transformedData.length
        }
      });

      return {
        success: true,
        data: transformedData,
        metadata: {
          integrationId,
          dataType,
          recordCount: transformedData.length,
          fetchedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      // Log error
      await auditLogger.log({
        action: 'POS_DATA_FETCH_FAILED',
        tenantId: options.tenantId,
        details: {
          integrationId,
          dataType,
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Get data endpoint for integration and data type
   */
  getDataEndpoint(integrationId, dataType) {
    const endpoints = {
      alle: {
        appointments: '/appointments',
        transactions: '/transactions',
        customers: '/customers',
        services: '/services'
      },
      aspire: {
        appointments: '/appointments',
        transactions: '/transactions',
        customers: '/customers',
        services: '/services'
      },
      zenoti: {
        appointments: '/appointments',
        transactions: '/transactions',
        customers: '/customers',
        services: '/services'
      },
      vagaro: {
        appointments: '/appointments',
        transactions: '/transactions',
        customers: '/customers',
        services: '/services'
      },
      mindbody: {
        appointments: '/appointments',
        transactions: '/transactions',
        customers: '/clients',
        services: '/services'
      },
      boulevard: {
        appointments: '/appointments',
        transactions: '/transactions',
        customers: '/customers',
        services: '/services'
      }
    };

    return endpoints[integrationId]?.[dataType] || `/${dataType}`;
  }

  /**
   * Make authenticated request to POS system
   */
  async makeRequest(integrationId, method, endpoint, data = null, options = {}) {
    const integration = this.integrations[integrationId];
    const config = integration.config;

    // Decrypt API key if needed
    let apiKey = config.apiKey;
    if (typeof apiKey === 'string' && apiKey.startsWith('encrypted:')) {
      apiKey = await encryptionService.decrypt(apiKey);
    }

    const requestConfig = {
      method,
      url: `${integration.baseUrl}${endpoint}`,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'MedSpaSync-Pro/1.0'
      }
    };

    if (data) {
      requestConfig.data = data;
    }

    // Add integration-specific headers
    this.addIntegrationHeaders(integrationId, requestConfig.headers, options);

    const response = await axios(requestConfig);
    return response;
  }

  /**
   * Add integration-specific headers
   */
  addIntegrationHeaders(integrationId, headers, options) {
    switch (integrationId) {
      case 'zenoti':
        headers['X-Zenoti-Client-ID'] = options.clientId;
        break;
      case 'mindbody':
        headers['SiteId'] = options.siteId;
        break;
      case 'boulevard':
        headers['X-Boulevard-Version'] = '2023-01-01';
        break;
    }
  }

  /**
   * Transform data to standard format
   */
  transformData(integrationId, dataType, rawData) {
    const transformers = {
      alle: this.transformAlleData,
      aspire: this.transformAspireData,
      zenoti: this.transformZenotiData,
      vagaro: this.transformVagaroData,
      mindbody: this.transformMindbodyData,
      boulevard: this.transformBoulevardData
    };

    const transformer = transformers[integrationId];
    if (!transformer) {
      throw new Error(`No transformer for integration: ${integrationId}`);
    }

    return transformer.call(this, dataType, rawData);
  }

  /**
   * Transform Alle data
   */
  transformAlleData(dataType, rawData) {
    // Extend existing 90% accuracy transformation
    const transformations = {
      appointments: (data) => data.map(item => ({
        id: item.id,
        patient: item.patient_name,
        service: item.service_name,
        provider: item.provider_name,
        date: item.appointment_date,
        time: item.appointment_time,
        status: item.status,
        amount: item.amount
      })),
      transactions: (data) => data.map(item => ({
        id: item.transaction_id,
        patient: item.customer_name,
        service: item.service_name,
        amount: item.total_amount,
        date: item.transaction_date,
        payment_method: item.payment_method,
        status: item.status
      }))
    };

    const transformer = transformations[dataType];
    return transformer ? transformer(rawData) : rawData;
  }

  /**
   * Transform Aspire data
   */
  transformAspireData(dataType, rawData) {
    // Extend existing 90% accuracy transformation
    const transformations = {
      appointments: (data) => data.map(item => ({
        id: item.appointment_id,
        patient: item.client_name,
        service: item.treatment_name,
        provider: item.therapist_name,
        date: item.date,
        time: item.time,
        status: item.appointment_status,
        amount: item.price
      })),
      transactions: (data) => data.map(item => ({
        id: item.sale_id,
        patient: item.client_name,
        service: item.treatment_name,
        amount: item.total,
        date: item.sale_date,
        payment_method: item.payment_type,
        status: item.status
      }))
    };

    const transformer = transformations[dataType];
    return transformer ? transformer(rawData) : rawData;
  }

  /**
   * Transform Zenoti data
   */
  transformZenotiData(dataType, rawData) {
    const transformations = {
      appointments: (data) => data.appointments?.map(item => ({
        id: item.id,
        patient: item.guest_name,
        service: item.service_name,
        provider: item.employee_name,
        date: item.start_time,
        time: item.start_time,
        status: item.status,
        amount: item.total_amount
      })) || [],
      transactions: (data) => data.transactions?.map(item => ({
        id: item.id,
        patient: item.guest_name,
        service: item.service_name,
        amount: item.total_amount,
        date: item.created_at,
        payment_method: item.payment_method,
        status: item.status
      })) || []
    };

    const transformer = transformations[dataType];
    return transformer ? transformer(rawData) : rawData;
  }

  /**
   * Transform Vagaro data
   */
  transformVagaroData(dataType, rawData) {
    const transformations = {
      appointments: (data) => data.map(item => ({
        id: item.appointmentId,
        patient: item.customerName,
        service: item.serviceName,
        provider: item.employeeName,
        date: item.appointmentDate,
        time: item.appointmentTime,
        status: item.status,
        amount: item.price
      })),
      transactions: (data) => data.map(item => ({
        id: item.transactionId,
        patient: item.customerName,
        service: item.serviceName,
        amount: item.totalAmount,
        date: item.transactionDate,
        payment_method: item.paymentMethod,
        status: item.status
      }))
    };

    const transformer = transformations[dataType];
    return transformer ? transformer(rawData) : rawData;
  }

  /**
   * Transform Mindbody data
   */
  transformMindbodyData(dataType, rawData) {
    const transformations = {
      appointments: (data) => data.Appointments?.map(item => ({
        id: item.Id,
        patient: item.ClientName,
        service: item.ServiceName,
        provider: item.StaffName,
        date: item.StartDateTime,
        time: item.StartDateTime,
        status: item.Status,
        amount: item.ServiceCost
      })) || [],
      transactions: (data) => data.Payments?.map(item => ({
        id: item.Id,
        patient: item.ClientName,
        service: item.ServiceName,
        amount: item.Amount,
        date: item.PaymentDate,
        payment_method: item.PaymentMethod,
        status: item.Status
      })) || []
    };

    const transformer = transformations[dataType];
    return transformer ? transformer(rawData) : rawData;
  }

  /**
   * Transform Boulevard data
   */
  transformBoulevardData(dataType, rawData) {
    const transformations = {
      appointments: (data) => data.data?.appointments?.map(item => ({
        id: item.id,
        patient: item.customer.name,
        service: item.service.name,
        provider: item.employee.name,
        date: item.startTime,
        time: item.startTime,
        status: item.status,
        amount: item.total
      })) || [],
      transactions: (data) => data.data?.transactions?.map(item => ({
        id: item.id,
        patient: item.customer.name,
        service: item.service.name,
        amount: item.total,
        date: item.createdAt,
        payment_method: item.paymentMethod,
        status: item.status
      })) || []
    };

    const transformer = transformations[dataType];
    return transformer ? transformer(rawData) : rawData;
  }

  /**
   * Check rate limit for integration
   */
  checkRateLimit(integrationId) {
    const limiter = this.rateLimiters.get(integrationId);
    if (!limiter) return true;

    const now = Date.now();
    
    // Reset counter if window has passed
    if (now > limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = now + (60 * 1000);
    }

    // Check if limit exceeded
    if (limiter.requests >= limiter.limit) {
      return false;
    }

    // Increment counter
    limiter.requests++;
    return true;
  }

  /**
   * Setup webhook handler for real-time data
   */
  async setupWebhook(integrationId, webhookUrl, events = []) {
    const integration = this.integrations[integrationId];
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    try {
      // Register webhook with POS system
      const webhookConfig = {
        url: webhookUrl,
        events: events,
        secret: this.generateWebhookSecret()
      };

      const response = await this.makeRequest(integrationId, 'POST', '/webhooks', webhookConfig);
      
      // Store webhook handler
      this.webhookHandlers.set(integrationId, {
        url: webhookUrl,
        secret: webhookConfig.secret,
        events: events,
        webhookId: response.data.id
      });

      return {
        success: true,
        webhookId: response.data.id,
        secret: webhookConfig.secret
      };

    } catch (error) {
      throw new Error(`Webhook setup failed: ${error.message}`);
    }
  }

  /**
   * Generate webhook secret for HMAC verification
   */
  generateWebhookSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(integrationId, payload, signature) {
    const handler = this.webhookHandlers.get(integrationId);
    if (!handler) {
      throw new Error('Webhook handler not found');
    }

    // Verify HMAC signature
    if (!this.verifyWebhookSignature(payload, signature, handler.secret)) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook data
    const processedData = this.processWebhookData(integrationId, payload);

    // Emit event for real-time processing
    this.emit('dataReceived', {
      integrationId,
      data: processedData,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      processedRecords: processedData.length
    };
  }

  /**
   * Verify webhook HMAC signature
   */
  verifyWebhookSignature(payload, signature, secret) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Process webhook data
   */
  processWebhookData(integrationId, payload) {
    // Transform webhook payload to standard format
    const transformers = {
      alle: this.processAlleWebhook,
      aspire: this.processAspireWebhook,
      zenoti: this.processZenotiWebhook,
      vagaro: this.processVagaroWebhook,
      mindbody: this.processMindbodyWebhook,
      boulevard: this.processBoulevardWebhook
    };

    const transformer = transformers[integrationId];
    return transformer ? transformer.call(this, payload) : payload;
  }

  /**
   * Process Alle webhook data
   */
  processAlleWebhook(payload) {
    return payload.events?.map(event => ({
      type: event.type,
      data: event.data,
      timestamp: event.timestamp
    })) || [];
  }

  /**
   * Process Aspire webhook data
   */
  processAspireWebhook(payload) {
    return payload.events?.map(event => ({
      type: event.event_type,
      data: event.data,
      timestamp: event.created_at
    })) || [];
  }

  /**
   * Process Zenoti webhook data
   */
  processZenotiWebhook(payload) {
    return payload.events?.map(event => ({
      type: event.event_type,
      data: event.data,
      timestamp: event.timestamp
    })) || [];
  }

  /**
   * Process Vagaro webhook data
   */
  processVagaroWebhook(payload) {
    return payload.events?.map(event => ({
      type: event.type,
      data: event.data,
      timestamp: event.timestamp
    })) || [];
  }

  /**
   * Process Mindbody webhook data
   */
  processMindbodyWebhook(payload) {
    return payload.events?.map(event => ({
      type: event.event_type,
      data: event.data,
      timestamp: event.timestamp
    })) || [];
  }

  /**
   * Process Boulevard webhook data
   */
  processBoulevardWebhook(payload) {
    return payload.events?.map(event => ({
      type: event.type,
      data: event.data,
      timestamp: event.timestamp
    })) || [];
  }

  /**
   * Get integration status
   */
  getIntegrationStatus(integrationId) {
    const integration = this.integrations[integrationId];
    if (!integration) {
      return { error: 'Integration not found' };
    }

    return {
      name: integration.name,
      enabled: integration.enabled,
      accuracy: integration.accuracy,
      rateLimit: integration.config.rateLimit,
      cost: integration.config.cost || 0
    };
  }

  /**
   * Get all available integrations
   */
  getAvailableIntegrations() {
    return Object.entries(this.integrations).map(([id, integration]) => ({
      id,
      name: integration.name,
      type: integration.type,
      accuracy: integration.accuracy,
      enabled: integration.enabled,
      cost: integration.config.cost || 0
    }));
  }
}

module.exports = POSIntegrationService; 