const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * MedSpaSync Pro Environment Management System
 * Centralized configuration management across all repositories
 */
class EnvironmentManager {
  constructor() {
    this.environments = ['development', 'staging', 'production'];
    this.repos = [
      'medspasync-frontend',
      'medspasync-pro-next', 
      'medspasync-backend',
      'medspasync-ai-api',
      'medspasync-marketing'
    ];
    this.configPath = path.join(__dirname, 'config');
  }

  /**
   * Initialize environment configuration
   */
  async initialize() {
    console.log('🔧 Initializing Environment Management System...');
    
    // Create config directory structure
    await this.createConfigStructure();
    
    // Generate environment-specific configurations
    await this.generateEnvironmentConfigs();
    
    // Validate all configurations
    await this.validateConfigurations();
    
    console.log('✅ Environment Management System initialized');
  }

  /**
   * Create configuration directory structure
   */
  async createConfigStructure() {
    const dirs = [
      this.configPath,
      path.join(this.configPath, 'environments'),
      path.join(this.configPath, 'secrets'),
      path.join(this.configPath, 'templates')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Generate environment-specific configurations
   */
  async generateEnvironmentConfigs() {
    for (const env of this.environments) {
      const config = this.getEnvironmentConfig(env);
      
      // Save environment config
      const envPath = path.join(this.configPath, 'environments', `${env}.json`);
      fs.writeFileSync(envPath, JSON.stringify(config, null, 2));
      
      // Generate .env files for each repo
      for (const repo of this.repos) {
        await this.generateRepoEnvFile(repo, env, config);
      }
    }
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(environment) {
    const baseConfig = {
      NODE_ENV: environment,
      LOG_LEVEL: environment === 'production' ? 'error' : 'debug',
      CORS_ORIGIN: this.getCorsOrigin(environment),
      DATABASE_URL: this.getDatabaseUrl(environment),
      REDIS_URL: this.getRedisUrl(environment),
      STRIPE_SECRET_KEY: process.env[`STRIPE_SECRET_KEY_${environment.toUpperCase()}`],
      STRIPE_WEBHOOK_SECRET: process.env[`STRIPE_WEBHOOK_SECRET_${environment.toUpperCase()}`],
      JWT_SECRET: this.generateJwtSecret(),
      ENCRYPTION_KEY: this.generateEncryptionKey(),
      HIPAA_AUDIT_ENABLED: environment === 'production',
      PERFORMANCE_MONITORING: environment === 'production',
      SECURITY_HEADERS: environment === 'production',
      RATE_LIMITING: environment === 'production',
      SSL_REQUIRED: environment === 'production',
      BACKUP_ENABLED: environment === 'production',
      MONITORING_ENABLED: environment === 'production'
    };

    // Add environment-specific overrides
    switch (environment) {
      case 'development':
        return {
          ...baseConfig,
          LOG_LEVEL: 'debug',
          HIPAA_AUDIT_ENABLED: false,
          PERFORMANCE_MONITORING: false,
          SECURITY_HEADERS: false,
          RATE_LIMITING: false,
          SSL_REQUIRED: false,
          BACKUP_ENABLED: false,
          MONITORING_ENABLED: false
        };
      
      case 'staging':
        return {
          ...baseConfig,
          LOG_LEVEL: 'info',
          HIPAA_AUDIT_ENABLED: true,
          PERFORMANCE_MONITORING: true,
          SECURITY_HEADERS: true,
          RATE_LIMITING: true,
          SSL_REQUIRED: true,
          BACKUP_ENABLED: true,
          MONITORING_ENABLED: true
        };
      
      case 'production':
        return {
          ...baseConfig,
          LOG_LEVEL: 'error',
          HIPAA_AUDIT_ENABLED: true,
          PERFORMANCE_MONITORING: true,
          SECURITY_HEADERS: true,
          RATE_LIMITING: true,
          SSL_REQUIRED: true,
          BACKUP_ENABLED: true,
          MONITORING_ENABLED: true
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Generate .env file for specific repository and environment
   */
  async generateRepoEnvFile(repo, environment, config) {
    const repoPath = path.join(__dirname, '..', repo);
    const envFilePath = path.join(repoPath, `.env.${environment}`);
    
    // Get repo-specific configuration
    const repoConfig = this.getRepoSpecificConfig(repo, config);
    
    // Generate .env content
    const envContent = Object.entries(repoConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Write .env file
    fs.writeFileSync(envFilePath, envContent);
    
    console.log(`📝 Generated ${envFilePath}`);
  }

  /**
   * Get repository-specific configuration
   */
  getRepoSpecificConfig(repo, baseConfig) {
    const repoConfigs = {
      'medspasync-frontend': {
        ...baseConfig,
        REACT_APP_API_URL: this.getApiUrl(baseConfig.NODE_ENV),
        REACT_APP_STRIPE_PUBLISHABLE_KEY: process.env[`STRIPE_PUBLISHABLE_KEY_${baseConfig.NODE_ENV.toUpperCase()}`],
        REACT_APP_ENVIRONMENT: baseConfig.NODE_ENV,
        REACT_APP_MONITORING_ENABLED: baseConfig.MONITORING_ENABLED
      },
      'medspasync-pro-next': {
        ...baseConfig,
        NEXT_PUBLIC_API_URL: this.getApiUrl(baseConfig.NODE_ENV),
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env[`STRIPE_PUBLISHABLE_KEY_${baseConfig.NODE_ENV.toUpperCase()}`],
        NEXT_PUBLIC_ENVIRONMENT: baseConfig.NODE_ENV
      },
      'medspasync-backend': {
        ...baseConfig,
        PORT: this.getPort(baseConfig.NODE_ENV, 'backend'),
        API_VERSION: 'v1',
        SESSION_SECRET: this.generateSessionSecret(),
        HIPAA_AUDIT_DATABASE_URL: this.getHipaaAuditDatabaseUrl(baseConfig.NODE_ENV)
      },
      'medspasync-ai-api': {
        ...baseConfig,
        PORT: this.getPort(baseConfig.NODE_ENV, 'ai-api'),
        API_VERSION: 'v1',
        AI_MODEL_ENDPOINT: this.getAiModelEndpoint(baseConfig.NODE_ENV),
        AI_API_KEY: process.env[`AI_API_KEY_${baseConfig.NODE_ENV.toUpperCase()}`]
      },
      'medspasync-marketing': {
        ...baseConfig,
        PORT: this.getPort(baseConfig.NODE_ENV, 'marketing'),
        API_VERSION: 'v1',
        CONTACT_FORM_ENDPOINT: this.getContactFormEndpoint(baseConfig.NODE_ENV)
      }
    };

    return repoConfigs[repo] || baseConfig;
  }

  /**
   * Validate all configurations
   */
  async validateConfigurations() {
    console.log('🔍 Validating configurations...');
    
    const errors = [];
    
    for (const env of this.environments) {
      const config = this.getEnvironmentConfig(env);
      
      // Validate required fields
      const requiredFields = [
        'DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'
      ];
      
      for (const field of requiredFields) {
        if (!config[field]) {
          errors.push(`Missing required field: ${field} in ${env} environment`);
        }
      }
      
      // Validate environment-specific requirements
      if (env === 'production') {
        const productionFields = [
          'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'
        ];
        
        for (const field of productionFields) {
          if (!config[field]) {
            errors.push(`Missing production field: ${field}`);
          }
        }
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Configuration validation failed');
    }
    
    console.log('✅ All configurations validated successfully');
  }

  /**
   * Helper methods for configuration values
   */
  getCorsOrigin(environment) {
    const origins = {
      development: 'http://localhost:3000',
      staging: 'https://staging.medspasync.com',
      production: 'https://medspasync.com'
    };
    return origins[environment];
  }

  getDatabaseUrl(environment) {
    return process.env[`DATABASE_URL_${environment.toUpperCase()}`] || 
           `postgresql://user:pass@localhost:5432/medspasync_${environment}`;
  }

  getRedisUrl(environment) {
    return process.env[`REDIS_URL_${environment.toUpperCase()}`] || 
           `redis://localhost:6379/${environment === 'production' ? '0' : '1'}`;
  }

  getApiUrl(environment) {
    const urls = {
      development: 'http://localhost:5000',
      staging: 'https://api-staging.medspasync.com',
      production: 'https://api.medspasync.com'
    };
    return urls[environment];
  }

  getPort(environment, service) {
    const ports = {
      development: { backend: 5000, 'ai-api': 5001, marketing: 5002 },
      staging: { backend: 5000, 'ai-api': 5001, marketing: 5002 },
      production: { backend: 5000, 'ai-api': 5001, marketing: 5002 }
    };
    return ports[environment][service];
  }

  getAiModelEndpoint(environment) {
    return process.env[`AI_MODEL_ENDPOINT_${environment.toUpperCase()}`] || 
           'https://api.openai.com/v1';
  }

  getHipaaAuditDatabaseUrl(environment) {
    return process.env[`HIPAA_AUDIT_DATABASE_URL_${environment.toUpperCase()}`] || 
           `postgresql://user:pass@localhost:5432/hipaa_audit_${environment}`;
  }

  getContactFormEndpoint(environment) {
    return `${this.getApiUrl(environment)}/api/v1/contact`;
  }

  /**
   * Generate secure secrets
   */
  generateJwtSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  generateSessionSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Deploy configuration to specific environment
   */
  async deployToEnvironment(environment) {
    console.log(`🚀 Deploying configuration to ${environment}...`);
    
    const config = this.getEnvironmentConfig(environment);
    
    // Validate environment-specific requirements
    await this.validateEnvironmentRequirements(environment, config);
    
    // Deploy to each repository
    for (const repo of this.repos) {
      await this.deployToRepo(repo, environment, config);
    }
    
    console.log(`✅ Configuration deployed to ${environment}`);
  }

  /**
   * Validate environment-specific requirements
   */
  async validateEnvironmentRequirements(environment, config) {
    if (environment === 'production') {
      // Validate production secrets
      const requiredSecrets = [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'JWT_SECRET',
        'ENCRYPTION_KEY'
      ];
      
      for (const secret of requiredSecrets) {
        if (!config[secret] || config[secret].includes('localhost')) {
          throw new Error(`Invalid production configuration: ${secret}`);
        }
      }
    }
  }

  /**
   * Deploy configuration to specific repository
   */
  async deployToRepo(repo, environment, config) {
    const repoPath = path.join(__dirname, '..', repo);
    
    if (!fs.existsSync(repoPath)) {
      console.warn(`⚠️ Repository not found: ${repo}`);
      return;
    }
    
    // Generate .env file
    await this.generateRepoEnvFile(repo, environment, config);
    
    // Copy environment-specific configuration files
    await this.copyConfigFiles(repo, environment);
    
    console.log(`📦 Deployed to ${repo}`);
  }

  /**
   * Copy environment-specific configuration files
   */
  async copyConfigFiles(repo, environment) {
    const sourcePath = path.join(this.configPath, 'environments', environment);
    const targetPath = path.join(__dirname, '..', repo, 'config');
    
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    // Copy configuration files if they exist
    if (fs.existsSync(sourcePath)) {
      const files = fs.readdirSync(sourcePath);
      for (const file of files) {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);
        fs.copyFileSync(sourceFile, targetFile);
      }
    }
  }
}

module.exports = EnvironmentManager;

// CLI interface
if (require.main === module) {
  const manager = new EnvironmentManager();
  
  const command = process.argv[2];
  const environment = process.argv[3];
  
  switch (command) {
    case 'init':
      manager.initialize();
      break;
    case 'deploy':
      if (!environment) {
        console.error('Usage: node environment-manager.js deploy <environment>');
        process.exit(1);
      }
      manager.deployToEnvironment(environment);
      break;
    case 'validate':
      manager.validateConfigurations();
      break;
    default:
      console.log('Usage: node environment-manager.js <init|deploy|validate> [environment]');
  }
} 