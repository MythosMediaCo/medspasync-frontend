const { getAIServiceConfig } = require('../config/environment');

class AIServiceHealthMonitor {
  constructor() {
    this.config = getAIServiceConfig();
    this.isHealthy = true;
    this.lastCheck = null;
    this.failureCount = 0;
    this.maxFailures = 3;
    this.circuitBreakerOpen = false;
    this.circuitBreakerTimeout = 60000; // 1 minute
    this.lastFailureTime = null;
  }

  /**
   * Check if AI service is healthy
   */
  async checkHealth() {
    if (!this.config.url) {
      this.isHealthy = false;
      return false;
    }

    try {
      const response = await fetch(`${this.config.url}/api/v1/health`, {
        method: 'GET',
        timeout: this.config.timeout || 5000
      });

      if (response.ok) {
        this.isHealthy = true;
        this.failureCount = 0;
        this.circuitBreakerOpen = false;
        this.lastCheck = new Date();
        return true;
      } else {
        this.recordFailure();
        return false;
      }
    } catch (error) {
      this.recordFailure();
      return false;
    }
  }

  /**
   * Record a failure and potentially open circuit breaker
   */
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.isHealthy = false;

    if (this.failureCount >= this.maxFailures) {
      this.circuitBreakerOpen = true;
      console.warn('AI service circuit breaker opened due to repeated failures');
    }
  }

  /**
   * Check if circuit breaker should be reset
   */
  shouldResetCircuitBreaker() {
    if (!this.circuitBreakerOpen || !this.lastFailureTime) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure > this.circuitBreakerTimeout;
  }

  /**
   * Get current health status
   */
  getStatus() {
    return {
      isHealthy: this.isHealthy,
      circuitBreakerOpen: this.circuitBreakerOpen,
      failureCount: this.failureCount,
      lastCheck: this.lastCheck,
      lastFailureTime: this.lastFailureTime,
      config: {
        url: this.config.url,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries
      }
    };
  }
}

// Create singleton instance
const aiHealthMonitor = new AIServiceHealthMonitor();

// Middleware function
function aiServiceHealthMiddleware(req, res, next) {
  // Skip health checks for certain endpoints
  if (req.path.includes('/health') || req.path.includes('/metrics')) {
    return next();
  }

  // Check if circuit breaker should be reset
  if (aiHealthMonitor.shouldResetCircuitBreaker()) {
    aiHealthMonitor.circuitBreakerOpen = false;
    aiHealthMonitor.failureCount = 0;
  }

  // If circuit breaker is open, return error
  if (aiHealthMonitor.circuitBreakerOpen) {
    return res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable',
      details: 'Circuit breaker is open due to repeated failures',
      retryAfter: Math.ceil(aiHealthMonitor.circuitBreakerTimeout / 1000)
    });
  }

  // If service is not healthy, allow request but log warning
  if (!aiHealthMonitor.isHealthy) {
    console.warn('AI service health check failed, but allowing request to proceed');
  }

  next();
}

// Health check endpoint
async function aiServiceHealthCheck(req, res) {
  try {
    const isHealthy = await aiHealthMonitor.checkHealth();
    const status = aiHealthMonitor.getStatus();

    res.json({
      success: true,
      healthy: isHealthy,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Periodic health check (can be called from a timer)
async function performPeriodicHealthCheck() {
  try {
    await aiHealthMonitor.checkHealth();
  } catch (error) {
    console.error('Periodic AI service health check failed:', error);
  }
}

module.exports = {
  aiServiceHealthMiddleware,
  aiServiceHealthCheck,
  performPeriodicHealthCheck,
  aiHealthMonitor
}; 