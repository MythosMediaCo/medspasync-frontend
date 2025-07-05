// config/database.js - Production Connection Pool Configuration
const databaseConfig = {
  production: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    
    // High-Performance Connection Pool Settings
    pool: {
      min: 50,                    // Minimum connections
      max: 5000,                  // Maximum connections (scaled from 100)
      acquire: 30000,             // Connection acquisition timeout (30s)
      idle: 10000,                // Connection idle timeout (10s)
      evict: 5000,                // Connection eviction interval (5s)
      handleDisconnects: true,    // Auto-reconnect on disconnect
      
      // Advanced Pool Configuration
      acquireConnectionTimeout: 60000,
      createRetryIntervalMillis: 200,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      
      // Performance Optimization
      propagateCreateError: false,
      
      // Monitoring and Health Checks
      testOnBorrow: true,
      testOnReturn: false,
      testWhileIdle: true,
      validationQuery: 'SELECT 1',
      
      // Connection Multiplexing
      allowExitOnIdle: true,
      acquireTimeoutMillis: 30000,
    },
    
    // Query Optimization
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
      typeCast: true,
      timezone: 'Z',
      charset: 'utf8mb4',
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    
    // High-Performance Settings
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    benchmark: true,
    isolationLevel: 'READ_COMMITTED',
    retry: {
      max: 3,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /ER_LOCK_WAIT_TIMEOUT/,
        /ER_LOCK_DEADLOCK/
      ]
    }
  },
  
  // Development configuration
  development: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'medspasync_dev',
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    
    pool: {
      min: 5,
      max: 20,
      acquire: 30000,
      idle: 10000,
      evict: 5000,
      handleDisconnects: true,
    },
    
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
      typeCast: true,
      timezone: 'Z',
      charset: 'utf8mb4'
    },
    
    logging: console.log,
    benchmark: true,
    isolationLevel: 'READ_COMMITTED'
  }
};

module.exports = databaseConfig; 