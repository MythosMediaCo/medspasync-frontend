// services/DatabaseHealthMonitor.js
class DatabaseHealthMonitor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.healthMetrics = {
      activeConnections: 0,
      idleConnections: 0,
      connectionErrors: 0,
      queryLatency: [],
      lastHealthCheck: null
    };
    
    this.startMonitoring();
  }
  
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      
      // Test connection with simple query
      await this.sequelize.query('SELECT 1 as health_check');
      
      const latency = Date.now() - startTime;
      this.healthMetrics.queryLatency.push(latency);
      
      // Keep only last 100 latency measurements
      if (this.healthMetrics.queryLatency.length > 100) {
        this.healthMetrics.queryLatency.shift();
      }
      
      // Get connection pool status
      const pool = this.sequelize.connectionManager.pool;
      this.healthMetrics.activeConnections = pool.used;
      this.healthMetrics.idleConnections = pool.available;
      this.healthMetrics.lastHealthCheck = new Date();
      
      // Performance alerting
      if (latency > 1000) {
        console.warn(`High database latency detected: ${latency}ms`);
        this.alertHighLatency(latency);
      }
      
      if (pool.used / pool.max > 0.8) {
        console.warn(`High connection pool utilization: ${pool.used}/${pool.max}`);
        this.alertHighConnectionUsage(pool.used, pool.max);
      }
      
      return {
        status: 'healthy',
        latency,
        connections: {
          active: this.healthMetrics.activeConnections,
          idle: this.healthMetrics.idleConnections,
          max: pool.max
        },
        avgLatency: this.getAverageLatency()
      };
      
    } catch (error) {
      this.healthMetrics.connectionErrors++;
      console.error('Database health check failed:', error);
      
      return {
        status: 'unhealthy',
        error: error.message,
        errorCount: this.healthMetrics.connectionErrors
      };
    }
  }
  
  getAverageLatency() {
    if (this.healthMetrics.queryLatency.length === 0) return 0;
    const sum = this.healthMetrics.queryLatency.reduce((a, b) => a + b, 0);
    return sum / this.healthMetrics.queryLatency.length;
  }
  
  startMonitoring() {
    // Health check every 30 seconds
    setInterval(() => {
      this.checkDatabaseHealth();
    }, 30000);
    
    // Detailed metrics every 5 minutes
    setInterval(() => {
      this.logDetailedMetrics();
    }, 300000);
  }
  
  async alertHighLatency(latency) {
    // Implement alerting logic (email, Slack, etc.)
    console.log(`ALERT: Database latency ${latency}ms exceeds threshold`);
    
    // Send to monitoring service
    if (process.env.MONITORING_WEBHOOK) {
      try {
        await fetch(process.env.MONITORING_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert: 'high_database_latency',
            latency,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to send monitoring alert:', error);
      }
    }
  }
  
  async alertHighConnectionUsage(used, max) {
    // Implement alerting logic
    console.log(`ALERT: Connection usage ${used}/${max} exceeds 80% threshold`);
    
    // Send to monitoring service
    if (process.env.MONITORING_WEBHOOK) {
      try {
        await fetch(process.env.MONITORING_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert: 'high_connection_usage',
            used,
            max,
            utilization: (used / max) * 100,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to send monitoring alert:', error);
      }
    }
  }
  
  logDetailedMetrics() {
    console.log('Database Performance Metrics:', {
      activeConnections: this.healthMetrics.activeConnections,
      idleConnections: this.healthMetrics.idleConnections,
      avgLatency: this.getAverageLatency(),
      errorCount: this.healthMetrics.connectionErrors,
      lastHealthCheck: this.healthMetrics.lastHealthCheck
    });
  }
  
  getMetrics() {
    return {
      ...this.healthMetrics,
      avgLatency: this.getAverageLatency(),
      errorRate: this.healthMetrics.connectionErrors / Math.max(this.healthMetrics.queryLatency.length, 1)
    };
  }
}

module.exports = DatabaseHealthMonitor; 