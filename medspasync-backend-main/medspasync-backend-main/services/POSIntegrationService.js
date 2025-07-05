/**
 * POS Integration Service
 * Extends existing POS integrations and adds new connectors for MedSpaSync Pro
 * Supports Zenoti, Vagaro, Mindbody, Boulevard with rate limiting and webhooks
 */

const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { performanceLogger } = require('../utils/logger');

class POSIntegrationService {
  constructor() {
    this.prisma = new PrismaClient();
    this.rateLimiters = new Map();
    this.webhookHandlers = new Map();
    
    // Initialize rate limiters for each POS system
    this.initializeRateLimiters();
    
    // Initialize webhook handlers
    this.initializeWebhookHandlers();
  }

  /**
   * Initialize rate limiters for each POS system
   */
  initializeRateLimiters() {
    const rateLimits = {
      'ZENOTI': { requests: 100, window: 60000 }, // 100 requests per minute
      'VAGARO': { requests: 60, window: 60000 },  // 60 requests per minute
      'MINDBODY': { requests: 200, window: 60000 }, // 200 requests per minute
      'BOULEVARD': { requests: 150, window: 60000 }, // 150 requests per minute
      'ALLE': { requests: 50, window: 60000 },     // 50 requests per minute
      'ASPIRE': { requests: 50, window: 60000 }    // 50 requests per minute
    };

    for (const [system, limits] of Object.entries(rateLimits)) {
      this.rateLimiters.set(system, {
        requests: [],
        limits
      });
    }
  }

  /**
   * Initialize webhook handlers
   */
  initializeWebhookHandlers() {
    this.webhookHandlers.set('ZENOTI', this.handleZenotiWebhook.bind(this));
    this.webhookHandlers.set('VAGARO', this.handleVagaroWebhook.bind(this));
    this.webhookHandlers.set('MINDBODY', this.handleMindbodyWebhook.bind(this));
    this.webhookHandlers.set('BOULEVARD', this.handleBoulevardWebhook.bind(this));
  }

  /**
   * Configure POS integration
   */
  async configureIntegration(tenantId, userId, integrationData) {
    try {
      // Validate integration data
      await this.validateIntegrationData(integrationData);

      // Encrypt sensitive configuration
      const encryptedConfig = this.encryptConfig(integrationData.config);

      // Check integration limits
      await this.checkIntegrationLimits(tenantId, integrationData.type);

      // Create or update integration
      const integration = await this.prisma.pOSIntegration.upsert({
        where: {
          tenantId_type: {
            tenantId,
            type: integrationData.type
          }
        },
        update: {
          name: integrationData.name,
          config: encryptedConfig,
          status: 'CONFIGURED'
        },
        create: {
          tenantId,
          userId,
          type: integrationData.type,
          name: integrationData.name,
          config: encryptedConfig,
          status: 'CONFIGURED'
        }
      });

      // Test connection
      const testResult = await this.testConnection(integrationData.type, integrationData.config);
      
      if (testResult.success) {
        await this.updateIntegrationStatus(integration.id, 'ACTIVE');
      } else {
        await this.updateIntegrationStatus(integration.id, 'ERROR', testResult.error);
      }

      return {
        success: true,
        integrationId: integration.id,
        status: testResult.success ? 'ACTIVE' : 'ERROR',
        message: testResult.success ? 'Integration configured successfully' : testResult.error
      };

    } catch (error) {
      performanceLogger.error('POS integration configuration failed', {
        tenantId,
        userId,
        type: integrationData.type,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Validate integration data
   */
  async validateIntegrationData(integrationData) {
    const requiredFields = {
      'ZENOTI': ['apiKey', 'locationId'],
      'VAGARO': ['apiKey', 'businessId'],
      'MINDBODY': ['apiKey', 'siteId'],
      'BOULEVARD': ['apiKey', 'locationId'],
      'ALLE': ['apiKey'],
      'ASPIRE': ['apiKey']
    };

    const required = requiredFields[integrationData.type];
    if (!required) {
      throw new Error(`Unsupported POS system: ${integrationData.type}`);
    }

    for (const field of required) {
      if (!integrationData.config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Encrypt configuration data
   */
  encryptConfig(config) {
    const encryptionKey = process.env.POS_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('POS encryption key not configured');
    }

    const configString = JSON.stringify(config);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    
    let encrypted = cipher.update(configString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      encrypted: encrypted
    };
  }

  /**
   * Decrypt configuration data
   */
  decryptConfig(encryptedConfig) {
    const encryptionKey = process.env.POS_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('POS encryption key not configured');
    }

    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encryptedConfig.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Check integration limits
   */
  async checkIntegrationLimits(tenantId, type) {
    const existingIntegrations = await this.prisma.pOSIntegration.count({
      where: { tenantId }
    });

    // Get subscription tier limits
    const practice = await this.prisma.practice.findFirst({
      where: { id: tenantId }
    });

    const tierLimits = {
      'core': 1,
      'professional': 3,
      'enterprise': 10
    };

    const limit = tierLimits[practice?.subscriptionTier || 'core'];
    
    if (existingIntegrations >= limit) {
      throw new Error(`Integration limit reached for current subscription tier. Maximum: ${limit}`);
    }
  }

  /**
   * Test POS connection
   */
  async testConnection(type, config) {
    try {
      switch (type) {
        case 'ZENOTI':
          return await this.testZenotiConnection(config);
        case 'VAGARO':
          return await this.testVagaroConnection(config);
        case 'MINDBODY':
          return await this.testMindbodyConnection(config);
        case 'BOULEVARD':
          return await this.testBoulevardConnection(config);
        case 'ALLE':
          return await this.testAlleConnection(config);
        case 'ASPIRE':
          return await this.testAspireConnection(config);
        default:
          throw new Error(`Unsupported POS system: ${type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test Zenoti connection
   */
  async testZenotiConnection(config) {
    const response = await axios.get('https://api.zenoti.com/v1/locations', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: response.status === 200,
      data: response.data
    };
  }

  /**
   * Test Vagaro connection
   */
  async testVagaroConnection(config) {
    const response = await axios.get(`https://api.vagaro.com/v1/businesses/${config.businessId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: response.status === 200,
      data: response.data
    };
  }

  /**
   * Test Mindbody connection
   */
  async testMindbodyConnection(config) {
    const response = await axios.get(`https://api.mindbodyonline.com/public/v6/site/sites`, {
      headers: {
        'Api-Key': config.apiKey,
        'SiteId': config.siteId,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: response.status === 200,
      data: response.data
    };
  }

  /**
   * Test Boulevard connection
   */
  async testBoulevardConnection(config) {
    const response = await axios.get(`https://api.boulevard.io/v1/locations/${config.locationId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: response.status === 200,
      data: response.data
    };
  }

  /**
   * Test Alle connection
   */
  async testAlleConnection(config) {
    // Alle uses a different API structure
    const response = await axios.get('https://api.alle.com/v1/health', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: response.status === 200,
      data: response.data
    };
  }

  /**
   * Test Aspire connection
   */
  async testAspireConnection(config) {
    // Aspire uses a different API structure
    const response = await axios.get('https://api.aspire.com/v1/status', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: response.status === 200,
      data: response.data
    };
  }

  /**
   * Fetch data from POS system
   */
  async fetchPOSData(integrationId, dataType, parameters = {}) {
    const integration = await this.prisma.pOSIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    if (integration.status !== 'ACTIVE') {
      throw new Error('Integration is not active');
    }

    // Check rate limits
    await this.checkRateLimit(integration.type);

    // Decrypt configuration
    const config = this.decryptConfig(integration.config);

    // Fetch data based on type
    switch (dataType) {
      case 'appointments':
        return await this.fetchAppointments(integration.type, config, parameters);
      case 'clients':
        return await this.fetchClients(integration.type, config, parameters);
      case 'services':
        return await this.fetchServices(integration.type, config, parameters);
      case 'transactions':
        return await this.fetchTransactions(integration.type, config, parameters);
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  /**
   * Check rate limit for POS system
   */
  async checkRateLimit(system) {
    const rateLimiter = this.rateLimiters.get(system);
    if (!rateLimiter) {
      return;
    }

    const now = Date.now();
    const window = rateLimiter.limits.window;
    
    // Remove old requests outside the window
    rateLimiter.requests = rateLimiter.requests.filter(
      timestamp => now - timestamp < window
    );

    // Check if limit exceeded
    if (rateLimiter.requests.length >= rateLimiter.limits.requests) {
      throw new Error(`Rate limit exceeded for ${system}. Please try again later.`);
    }

    // Add current request
    rateLimiter.requests.push(now);
  }

  /**
   * Fetch appointments from POS system
   */
  async fetchAppointments(type, config, parameters) {
    switch (type) {
      case 'ZENOTI':
        return await this.fetchZenotiAppointments(config, parameters);
      case 'VAGARO':
        return await this.fetchVagaroAppointments(config, parameters);
      case 'MINDBODY':
        return await this.fetchMindbodyAppointments(config, parameters);
      case 'BOULEVARD':
        return await this.fetchBoulevardAppointments(config, parameters);
      default:
        throw new Error(`Appointment fetching not supported for ${type}`);
    }
  }

  /**
   * Fetch Zenoti appointments
   */
  async fetchZenotiAppointments(config, parameters) {
    const response = await axios.get('https://api.zenoti.com/v1/appointments', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        location_id: config.locationId,
        from_date: parameters.startDate,
        to_date: parameters.endDate,
        limit: parameters.limit || 100
      }
    });

    return this.transformZenotiAppointments(response.data);
  }

  /**
   * Transform Zenoti appointments to standard format
   */
  transformZenotiAppointments(data) {
    return data.appointments?.map(apt => ({
      id: apt.appointment_id,
      clientName: `${apt.customer.first_name} ${apt.customer.last_name}`,
      clientEmail: apt.customer.email,
      serviceName: apt.service.name,
      amount: apt.service.price,
      date: apt.start_time,
      status: apt.status,
      provider: apt.employee?.name,
      duration: apt.duration
    })) || [];
  }

  /**
   * Fetch Vagaro appointments
   */
  async fetchVagaroAppointments(config, parameters) {
    const response = await axios.get(`https://api.vagaro.com/v1/businesses/${config.businessId}/appointments`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        start_date: parameters.startDate,
        end_date: parameters.endDate,
        limit: parameters.limit || 100
      }
    });

    return this.transformVagaroAppointments(response.data);
  }

  /**
   * Transform Vagaro appointments to standard format
   */
  transformVagaroAppointments(data) {
    return data.appointments?.map(apt => ({
      id: apt.id,
      clientName: `${apt.customer.first_name} ${apt.customer.last_name}`,
      clientEmail: apt.customer.email,
      serviceName: apt.service.name,
      amount: apt.service.price,
      date: apt.start_time,
      status: apt.status,
      provider: apt.provider?.name,
      duration: apt.duration
    })) || [];
  }

  /**
   * Fetch Mindbody appointments
   */
  async fetchMindbodyAppointments(config, parameters) {
    const response = await axios.get('https://api.mindbodyonline.com/public/v6/appointment/appointments', {
      headers: {
        'Api-Key': config.apiKey,
        'SiteId': config.siteId,
        'Content-Type': 'application/json'
      },
      params: {
        StartDate: parameters.startDate,
        EndDate: parameters.endDate,
        Limit: parameters.limit || 100
      }
    });

    return this.transformMindbodyAppointments(response.data);
  }

  /**
   * Transform Mindbody appointments to standard format
   */
  transformMindbodyAppointments(data) {
    return data.appointments?.map(apt => ({
      id: apt.id,
      clientName: `${apt.client.first_name} ${apt.client.last_name}`,
      clientEmail: apt.client.email,
      serviceName: apt.session_type.name,
      amount: apt.session_type.price,
      date: apt.start_date_time,
      status: apt.status,
      provider: apt.staff.first_name + ' ' + apt.staff.last_name,
      duration: apt.session_type.length
    })) || [];
  }

  /**
   * Fetch Boulevard appointments
   */
  async fetchBoulevardAppointments(config, parameters) {
    const response = await axios.get(`https://api.boulevard.io/v1/locations/${config.locationId}/appointments`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        start_date: parameters.startDate,
        end_date: parameters.endDate,
        limit: parameters.limit || 100
      }
    });

    return this.transformBoulevardAppointments(response.data);
  }

  /**
   * Transform Boulevard appointments to standard format
   */
  transformBoulevardAppointments(data) {
    return data.appointments?.map(apt => ({
      id: apt.id,
      clientName: `${apt.client.first_name} ${apt.client.last_name}`,
      clientEmail: apt.client.email,
      serviceName: apt.service.name,
      amount: apt.service.price,
      date: apt.start_time,
      status: apt.status,
      provider: apt.provider?.name,
      duration: apt.duration
    })) || [];
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(type, payload, signature) {
    const handler = this.webhookHandlers.get(type);
    if (!handler) {
      throw new Error(`Webhook handler not found for ${type}`);
    }

    // Verify webhook signature
    if (!this.verifyWebhookSignature(type, payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    return await handler(payload);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(type, payload, signature) {
    const webhookSecret = process.env[`${type}_WEBHOOK_SECRET`];
    if (!webhookSecret) {
      return true; // Skip verification if no secret configured
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Handle Zenoti webhook
   */
  async handleZenotiWebhook(payload) {
    const { event_type, data } = payload;

    switch (event_type) {
      case 'appointment.created':
        await this.processAppointmentCreated(data);
        break;
      case 'appointment.updated':
        await this.processAppointmentUpdated(data);
        break;
      case 'appointment.cancelled':
        await this.processAppointmentCancelled(data);
        break;
      default:
        console.log(`Unhandled Zenoti webhook event: ${event_type}`);
    }

    return { success: true };
  }

  /**
   * Handle Vagaro webhook
   */
  async handleVagaroWebhook(payload) {
    const { event, data } = payload;

    switch (event) {
      case 'appointment_created':
        await this.processAppointmentCreated(data);
        break;
      case 'appointment_updated':
        await this.processAppointmentUpdated(data);
        break;
      case 'appointment_cancelled':
        await this.processAppointmentCancelled(data);
        break;
      default:
        console.log(`Unhandled Vagaro webhook event: ${event}`);
    }

    return { success: true };
  }

  /**
   * Handle Mindbody webhook
   */
  async handleMindbodyWebhook(payload) {
    const { eventType, data } = payload;

    switch (eventType) {
      case 'AppointmentCreated':
        await this.processAppointmentCreated(data);
        break;
      case 'AppointmentUpdated':
        await this.processAppointmentUpdated(data);
        break;
      case 'AppointmentCancelled':
        await this.processAppointmentCancelled(data);
        break;
      default:
        console.log(`Unhandled Mindbody webhook event: ${eventType}`);
    }

    return { success: true };
  }

  /**
   * Handle Boulevard webhook
   */
  async handleBoulevardWebhook(payload) {
    const { event, data } = payload;

    switch (event) {
      case 'appointment.created':
        await this.processAppointmentCreated(data);
        break;
      case 'appointment.updated':
        await this.processAppointmentUpdated(data);
        break;
      case 'appointment.cancelled':
        await this.processAppointmentCancelled(data);
        break;
      default:
        console.log(`Unhandled Boulevard webhook event: ${event}`);
    }

    return { success: true };
  }

  /**
   * Process appointment created event
   */
  async processAppointmentCreated(data) {
    // Update local database with new appointment
    // This would integrate with the existing appointment system
    console.log('Processing appointment created:', data);
  }

  /**
   * Process appointment updated event
   */
  async processAppointmentUpdated(data) {
    // Update local database with appointment changes
    console.log('Processing appointment updated:', data);
  }

  /**
   * Process appointment cancelled event
   */
  async processAppointmentCancelled(data) {
    // Update local database with appointment cancellation
    console.log('Processing appointment cancelled:', data);
  }

  /**
   * Update integration status
   */
  async updateIntegrationStatus(integrationId, status, error = null) {
    await this.prisma.pOSIntegration.update({
      where: { id: integrationId },
      data: {
        status,
        error,
        lastSync: status === 'ACTIVE' ? new Date() : undefined
      }
    });
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(integrationId) {
    const integration = await this.prisma.pOSIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    return {
      id: integration.id,
      type: integration.type,
      name: integration.name,
      status: integration.status,
      lastSync: integration.lastSync,
      error: integration.error
    };
  }

  /**
   * List tenant integrations
   */
  async listIntegrations(tenantId) {
    const integrations = await this.prisma.pOSIntegration.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    return integrations.map(integration => ({
      id: integration.id,
      type: integration.type,
      name: integration.name,
      status: integration.status,
      lastSync: integration.lastSync,
      createdAt: integration.createdAt
    }));
  }

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId, tenantId) {
    const integration = await this.prisma.pOSIntegration.findFirst({
      where: {
        id: integrationId,
        tenantId
      }
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    await this.prisma.pOSIntegration.delete({
      where: { id: integrationId }
    });

    return { success: true, message: 'Integration deleted successfully' };
  }
}

module.exports = POSIntegrationService; 