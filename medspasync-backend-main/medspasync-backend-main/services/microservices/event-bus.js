const { Client, AuthenticationTls } = require('pulsar-client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

/**
 * Enhanced Microservices Architecture with Apache Pulsar Integration
 * 
 * This module provides:
 * - Event streaming with Apache Pulsar
 * - Service registry and discovery
 * - Health checks and monitoring
 * - Circuit breaker patterns
 * - Event sourcing capabilities
 * - Distributed tracing
 */

class EventBus {
  constructor() {
    this.client = null;
    this.producers = new Map();
    this.consumers = new Map();
    this.serviceRegistry = new Map();
    this.healthChecks = new Map();
    this.circuitBreakers = new Map();
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 5;
  }

  /**
   * Initialize Pulsar client with configuration
   */
  async initialize(config = {}) {
    try {
      const {
        serviceUrl = process.env.PULSAR_SERVICE_URL || 'pulsar://localhost:6650',
        authentication = process.env.PULSAR_AUTHENTICATION,
        operationTimeoutMs = 30000,
        connectionTimeoutMs = 10000,
        keepAliveIntervalMs = 30000,
        maxConnsPerHost = 1
      } = config;

      const clientConfig = {
        serviceUrl,
        operationTimeoutMs,
        connectionTimeoutMs,
        keepAliveIntervalMs,
        maxConnsPerHost
      };

      // Add authentication if provided
      if (authentication) {
        clientConfig.authentication = new AuthenticationTls({
          certificatePath: authentication.certificatePath,
          privateKeyPath: authentication.privateKeyPath
        });
      }

      this.client = new Client(clientConfig);
      await this.client.connect();
      this.isConnected = true;
      this.retryAttempts = 0;

      logger.info('EventBus: Successfully connected to Apache Pulsar');
      return true;
    } catch (error) {
      logger.error('EventBus: Failed to initialize Pulsar client', error);
      throw error;
    }
  }

  /**
   * Register a service in the service registry
   */
  registerService(serviceName, serviceInfo) {
    const serviceId = uuidv4();
    const service = {
      id: serviceId,
      name: serviceName,
      ...serviceInfo,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      status: 'healthy'
    };

    this.serviceRegistry.set(serviceId, service);
    logger.info(`EventBus: Registered service ${serviceName} with ID ${serviceId}`);
    return serviceId;
  }

  /**
   * Deregister a service from the service registry
   */
  deregisterService(serviceId) {
    if (this.serviceRegistry.has(serviceId)) {
      const service = this.serviceRegistry.get(serviceId);
      this.serviceRegistry.delete(serviceId);
      logger.info(`EventBus: Deregistered service ${service.name} with ID ${serviceId}`);
      return true;
    }
    return false;
  }

  /**
   * Discover services by name or type
   */
  discoverServices(criteria) {
    const services = Array.from(this.serviceRegistry.values());
    
    if (typeof criteria === 'string') {
      return services.filter(service => service.name === criteria);
    }
    
    if (typeof criteria === 'object') {
      return services.filter(service => {
        return Object.keys(criteria).every(key => 
          service[key] === criteria[key]
        );
      });
    }
    
    return services;
  }

  /**
   * Create a producer for a specific topic
   */
  async createProducer(topic, options = {}) {
    try {
      const producerConfig = {
        topic,
        producerName: options.producerName || `producer-${uuidv4()}`,
        sendTimeoutMs: options.sendTimeoutMs || 30000,
        batchingEnabled: options.batchingEnabled !== false,
        batchingMaxPublishDelayMs: options.batchingMaxPublishDelayMs || 10,
        batchingMaxMessages: options.batchingMaxMessages || 1000,
        compressionType: options.compressionType || 'NONE'
      };

      const producer = await this.client.createProducer(producerConfig);
      this.producers.set(topic, producer);
      
      logger.info(`EventBus: Created producer for topic ${topic}`);
      return producer;
    } catch (error) {
      logger.error(`EventBus: Failed to create producer for topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Create a consumer for a specific topic
   */
  async createConsumer(topic, subscriptionName, options = {}) {
    try {
      const consumerConfig = {
        topic,
        subscription: subscriptionName,
        subscriptionType: options.subscriptionType || 'Exclusive',
        consumerName: options.consumerName || `consumer-${uuidv4()}`,
        receiverQueueSize: options.receiverQueueSize || 1000,
        ackTimeoutMs: options.ackTimeoutMs || 0,
        maxTotalReceiverQueueSizeAcrossPartitions: options.maxTotalReceiverQueueSizeAcrossPartitions || 50000
      };

      const consumer = await this.client.subscribe(consumerConfig);
      this.consumers.set(`${topic}-${subscriptionName}`, consumer);
      
      logger.info(`EventBus: Created consumer for topic ${topic} with subscription ${subscriptionName}`);
      return consumer;
    } catch (error) {
      logger.error(`EventBus: Failed to create consumer for topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Publish an event to a topic
   */
  async publishEvent(topic, event, options = {}) {
    try {
      const circuitBreaker = this.getCircuitBreaker(topic);
      
      if (circuitBreaker.isOpen()) {
        throw new Error(`Circuit breaker is open for topic ${topic}`);
      }

      let producer = this.producers.get(topic);
      if (!producer) {
        producer = await this.createProducer(topic, options.producerOptions);
      }

      const message = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        source: options.source || 'medspasync',
        version: options.version || '1.0',
        data: event,
        metadata: options.metadata || {}
      };

      const buffer = Buffer.from(JSON.stringify(message));
      const result = await producer.send({
        data: buffer,
        properties: options.properties || {}
      });

      circuitBreaker.recordSuccess();
      logger.debug(`EventBus: Published event to topic ${topic}`, { messageId: result.messageId });
      
      return result;
    } catch (error) {
      const circuitBreaker = this.getCircuitBreaker(topic);
      circuitBreaker.recordFailure();
      
      logger.error(`EventBus: Failed to publish event to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to events from a topic
   */
  async subscribeToEvents(topic, subscriptionName, handler, options = {}) {
    try {
      const consumer = await this.createConsumer(topic, subscriptionName, options.consumerOptions);
      
      const messageHandler = async (message, consumer) => {
        try {
          const eventData = JSON.parse(message.getData().toString());
          
          // Add distributed tracing
          const traceId = message.getProperties()['trace-id'] || uuidv4();
          const spanId = message.getProperties()['span-id'] || uuidv4();
          
          const context = {
            traceId,
            spanId,
            messageId: message.getMessageId(),
            topic,
            subscriptionName,
            timestamp: new Date().toISOString()
          };

          logger.debug(`EventBus: Processing message from topic ${topic}`, context);
          
          await handler(eventData, context);
          
          await consumer.acknowledge(message);
          logger.debug(`EventBus: Successfully processed message from topic ${topic}`, context);
        } catch (error) {
          logger.error(`EventBus: Error processing message from topic ${topic}`, error);
          
          // Handle message based on error handling strategy
          if (options.errorStrategy === 'retry') {
            await consumer.negativeAcknowledge(message);
          } else {
            await consumer.acknowledge(message);
          }
        }
      };

      consumer.on('message', messageHandler);
      
      logger.info(`EventBus: Subscribed to events from topic ${topic} with subscription ${subscriptionName}`);
      return consumer;
    } catch (error) {
      logger.error(`EventBus: Failed to subscribe to events from topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Circuit breaker implementation
   */
  getCircuitBreaker(topic) {
    if (!this.circuitBreakers.has(topic)) {
      this.circuitBreakers.set(topic, new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        expectedException: Error
      }));
    }
    return this.circuitBreakers.get(topic);
  }

  /**
   * Health check for the event bus
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', reason: 'Not connected to Pulsar' };
      }

      // Check service registry health
      const now = new Date();
      const staleServices = Array.from(this.serviceRegistry.values())
        .filter(service => now - service.lastHeartbeat > 300000); // 5 minutes

      if (staleServices.length > 0) {
        logger.warn('EventBus: Found stale services', staleServices.map(s => s.name));
      }

      return {
        status: 'healthy',
        connected: this.isConnected,
        producers: this.producers.size,
        consumers: this.consumers.size,
        registeredServices: this.serviceRegistry.size,
        staleServices: staleServices.length
      };
    } catch (error) {
      logger.error('EventBus: Health check failed', error);
      return { status: 'unhealthy', reason: error.message };
    }
  }

  /**
   * Update service heartbeat
   */
  updateHeartbeat(serviceId) {
    if (this.serviceRegistry.has(serviceId)) {
      const service = this.serviceRegistry.get(serviceId);
      service.lastHeartbeat = new Date();
      this.serviceRegistry.set(serviceId, service);
    }
  }

  /**
   * Close all connections
   */
  async close() {
    try {
      // Close all producers
      for (const [topic, producer] of this.producers) {
        await producer.close();
        logger.debug(`EventBus: Closed producer for topic ${topic}`);
      }
      this.producers.clear();

      // Close all consumers
      for (const [key, consumer] of this.consumers) {
        await consumer.close();
        logger.debug(`EventBus: Closed consumer ${key}`);
      }
      this.consumers.clear();

      // Close client
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        logger.info('EventBus: Closed Pulsar client');
      }
    } catch (error) {
      logger.error('EventBus: Error during cleanup', error);
      throw error;
    }
  }
}

/**
 * Circuit Breaker Pattern Implementation
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000;
    this.expectedException = options.expectedException || Error;
    
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  isOpen() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Service Registry Implementation
 */
class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.healthChecks = new Map();
  }

  register(serviceName, serviceInfo) {
    const serviceId = uuidv4();
    const service = {
      id: serviceId,
      name: serviceName,
      ...serviceInfo,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      status: 'healthy'
    };

    this.services.set(serviceId, service);
    return serviceId;
  }

  deregister(serviceId) {
    return this.services.delete(serviceId);
  }

  find(criteria) {
    const services = Array.from(this.services.values());
    
    if (typeof criteria === 'string') {
      return services.filter(service => service.name === criteria);
    }
    
    if (typeof criteria === 'object') {
      return services.filter(service => {
        return Object.keys(criteria).every(key => 
          service[key] === criteria[key]
        );
      });
    }
    
    return services;
  }

  updateHeartbeat(serviceId) {
    if (this.services.has(serviceId)) {
      const service = this.services.get(serviceId);
      service.lastHeartbeat = new Date();
      this.services.set(serviceId, service);
    }
  }

  getStaleServices(timeoutMs = 300000) {
    const now = new Date();
    return Array.from(this.services.values())
      .filter(service => now - service.lastHeartbeat > timeoutMs);
  }
}

// Export singleton instance
const eventBus = new EventBus();

module.exports = {
  EventBus,
  CircuitBreaker,
  ServiceRegistry,
  eventBus
}; 