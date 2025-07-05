const { Sequelize } = require('sequelize');
const databaseConfig = require('../config/database');

class DatabaseShardManager {
  constructor() {
    this.shards = {
      shard_1: {
        host: process.env.DB_SHARD_1_HOST || process.env.DATABASE_HOST,
        database: process.env.DB_SHARD_1_NAME || process.env.DATABASE_NAME,
        username: process.env.DB_SHARD_1_USERNAME || process.env.DATABASE_USERNAME,
        password: process.env.DB_SHARD_1_PASSWORD || process.env.DATABASE_PASSWORD,
        port: process.env.DB_SHARD_1_PORT || process.env.DATABASE_PORT,
        tenantRange: { min: 0, max: 999 }
      },
      shard_2: {
        host: process.env.DB_SHARD_2_HOST || process.env.DATABASE_HOST,
        database: process.env.DB_SHARD_2_NAME || process.env.DATABASE_NAME,
        username: process.env.DB_SHARD_2_USERNAME || process.env.DATABASE_USERNAME,
        password: process.env.DB_SHARD_2_PASSWORD || process.env.DATABASE_PASSWORD,
        port: process.env.DB_SHARD_2_PORT || process.env.DATABASE_PORT,
        tenantRange: { min: 1000, max: 1999 }
      },
      shard_3: {
        host: process.env.DB_SHARD_3_HOST || process.env.DATABASE_HOST,
        database: process.env.DB_SHARD_3_NAME || process.env.DATABASE_NAME,
        username: process.env.DB_SHARD_3_USERNAME || process.env.DATABASE_USERNAME,
        password: process.env.DB_SHARD_3_PASSWORD || process.env.DATABASE_PASSWORD,
        port: process.env.DB_SHARD_3_PORT || process.env.DATABASE_PORT,
        tenantRange: { min: 2000, max: 2999 }
      }
      // Add more shards as needed
    };
    
    this.readReplicas = {
      shard_1_read: process.env.DB_SHARD_1_READ_HOST,
      shard_2_read: process.env.DB_SHARD_2_READ_HOST,
      shard_3_read: process.env.DB_SHARD_3_READ_HOST
    };
    
    this.connections = new Map();
    this.healthMonitors = new Map();
  }
  
  getShardForTenant(tenantId) {
    const tenantHash = this.hashTenantId(tenantId);
    
    for (const [shardName, config] of Object.entries(this.shards)) {
      if (tenantHash >= config.tenantRange.min && tenantHash <= config.tenantRange.max) {
        return shardName;
      }
    }
    
    // Default to first shard if no match
    return 'shard_1';
  }
  
  hashTenantId(tenantId) {
    // Simple hash function for tenant distribution
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      const char = tenantId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 3000; // Distribute across 3000 buckets
  }
  
  getConnectionForTenant(tenantId, operation = 'read') {
    const shard = this.getShardForTenant(tenantId);
    
    if (operation === 'read' && this.readReplicas[`${shard}_read`]) {
      return this.createConnection(this.readReplicas[`${shard}_read`], `${shard}_read`);
    }
    
    return this.createConnection(this.shards[shard], shard);
  }
  
  createConnection(config, connectionName) {
    // Check if connection already exists
    if (this.connections.has(connectionName)) {
      return this.connections.get(connectionName);
    }
    
    const connection = new Sequelize({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      dialect: 'postgres',
      pool: databaseConfig.production.pool,
      dialectOptions: databaseConfig.production.dialectOptions,
      logging: false,
      benchmark: true
    });
    
    // Store connection
    this.connections.set(connectionName, connection);
    
    // Initialize health monitor
    const DatabaseHealthMonitor = require('./DatabaseHealthMonitor');
    const healthMonitor = new DatabaseHealthMonitor(connection);
    this.healthMonitors.set(connectionName, healthMonitor);
    
    return connection;
  }
  
  async testConnection(connectionName) {
    const connection = this.connections.get(connectionName);
    if (!connection) {
      throw new Error(`Connection ${connectionName} not found`);
    }
    
    try {
      await connection.authenticate();
      return { status: 'connected', connectionName };
    } catch (error) {
      return { status: 'error', connectionName, error: error.message };
    }
  }
  
  async testAllConnections() {
    const results = [];
    
    for (const [connectionName, connection] of this.connections) {
      const result = await this.testConnection(connectionName);
      results.push(result);
    }
    
    return results;
  }
  
  async distributeTenantData(tenantId, fromShard, toShard) {
    // Data migration logic for rebalancing
    console.log(`Migrating tenant ${tenantId} from ${fromShard} to ${toShard}`);
    
    const sourceConn = this.createConnection(this.shards[fromShard], `${fromShard}_migration`);
    const targetConn = this.createConnection(this.shards[toShard], `${toShard}_migration`);
    
    try {
      // Begin transaction on both connections
      const sourceTransaction = await sourceConn.transaction();
      const targetTransaction = await targetConn.transaction();
      
      // Get tenant data from source
      const tenantData = await sourceConn.query(
        'SELECT * FROM users WHERE tenant_id = :tenantId',
        {
          replacements: { tenantId },
          transaction: sourceTransaction
        }
      );
      
      // Insert tenant data into target
      if (tenantData[0].length > 0) {
        await targetConn.query(
          'INSERT INTO users (tenant_id, data) VALUES (:tenantId, :data) ON CONFLICT (tenant_id) DO UPDATE SET data = EXCLUDED.data',
          {
            replacements: { 
              tenantId, 
              data: JSON.stringify(tenantData[0][0]) 
            },
            transaction: targetTransaction
          }
        );
      }
      
      await sourceTransaction.commit();
      await targetTransaction.commit();
      
      console.log(`Successfully migrated tenant ${tenantId}`);
      return { success: true, tenantId, fromShard, toShard };
    } catch (error) {
      console.error(`Failed to migrate tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  async getShardStatistics() {
    const stats = {};
    
    for (const [shardName, config] of Object.entries(this.shards)) {
      const connection = this.connections.get(shardName);
      if (connection) {
        try {
          const [result] = await connection.query('SELECT COUNT(*) as tenant_count FROM users');
          stats[shardName] = {
            tenantCount: result[0].tenant_count,
            range: config.tenantRange,
            status: 'active'
          };
        } catch (error) {
          stats[shardName] = {
            tenantCount: 0,
            range: config.tenantRange,
            status: 'error',
            error: error.message
          };
        }
      }
    }
    
    return stats;
  }
  
  async rebalanceShards() {
    console.log('Starting shard rebalancing...');
    
    const stats = await this.getShardStatistics();
    const totalTenants = Object.values(stats).reduce((sum, stat) => sum + stat.tenantCount, 0);
    const targetTenantsPerShard = Math.ceil(totalTenants / Object.keys(this.shards).length);
    
    const migrations = [];
    
    for (const [shardName, stat] of Object.entries(stats)) {
      if (stat.tenantCount > targetTenantsPerShard * 1.2) { // 20% over target
        // Find shard with fewer tenants
        const targetShard = Object.entries(stats).find(([name, s]) => 
          s.tenantCount < targetTenantsPerShard * 0.8 && name !== shardName
        );
        
        if (targetShard) {
          const migrationCount = Math.ceil((stat.tenantCount - targetTenantsPerShard) / 2);
          migrations.push({
            fromShard: shardName,
            toShard: targetShard[0],
            count: migrationCount
          });
        }
      }
    }
    
    console.log(`Planned migrations: ${migrations.length}`);
    return migrations;
  }
  
  getHealthMetrics() {
    const metrics = {};
    
    for (const [connectionName, monitor] of this.healthMonitors) {
      metrics[connectionName] = monitor.getMetrics();
    }
    
    return metrics;
  }
}

module.exports = DatabaseShardManager; 