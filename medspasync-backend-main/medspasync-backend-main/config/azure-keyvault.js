const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

class AzureKeyVaultManager {
  constructor() {
    this.vaultUrl = `https://medspasync-backend.vault.azure.net/`;
    this.credential = new DefaultAzureCredential();
    this.client = new SecretClient(this.vaultUrl, this.credential);
    this.secretsCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async getSecret(secretName) {
    try {
      // Check cache first
      const cached = this.secretsCache.get(secretName);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.value;
      }

      // Fetch from Azure Key Vault
      const secret = await this.client.getSecret(secretName);
      const value = secret.value;

      // Cache the result
      this.secretsCache.set(secretName, {
        value,
        timestamp: Date.now()
      });

      return value;
    } catch (error) {
      console.error(`Error fetching secret ${secretName}:`, error.message);
      throw new Error(`Failed to retrieve secret ${secretName} from Azure Key Vault`);
    }
  }

  async loadAllSecrets() {
    const requiredSecrets = [
      'STRIPE-SECRET-KEY',
      'STRIPE-WEBHOOK-SECRET',
      'STRIPE-PRODUCT-PRO',
      'STRIPE-PRODUCT-CORE',
      'JWT-SECRET',
      'EMAIL-USER',
      'EMAIL-PASS',
      'SMTP-HOST',
      'SMTP-PORT',
      'LOGIN',
      'EMAIL-FROM',
      'SALES-EMAIL',
      'SUPPORT-EMAIL',
      'INTERNAL-API-KEY',
      'NODE-ENV',
      'MONGO-URI'
    ];

    const secrets = {};
    
    for (const secretName of requiredSecrets) {
      try {
        secrets[secretName] = await this.getSecret(secretName);
      } catch (error) {
        console.warn(`Warning: Could not load secret ${secretName}:`, error.message);
        // Use environment variable as fallback
        secrets[secretName] = process.env[secretName];
      }
    }

    return secrets;
  }

  async initialize() {
    try {
      console.log('🔐 Initializing Azure Key Vault connection...');
      const secrets = await this.loadAllSecrets();
      
      // Set environment variables from Key Vault
      Object.entries(secrets).forEach(([key, value]) => {
        if (value) {
          process.env[key] = value;
        }
      });

      console.log('✅ Azure Key Vault secrets loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Azure Key Vault:', error.message);
      console.log('⚠️  Falling back to environment variables');
      return false;
    }
  }

  // Helper method to get specific secret types
  async getStripeConfig() {
    return {
      secretKey: await this.getSecret('STRIPE-SECRET-KEY'),
      webhookSecret: await this.getSecret('STRIPE-WEBHOOK-SECRET'),
      productPro: await this.getSecret('STRIPE-PRODUCT-PRO'),
      productCore: await this.getSecret('STRIPE-PRODUCT-CORE')
    };
  }

  async getEmailConfig() {
    return {
      user: await this.getSecret('EMAIL-USER'),
      pass: await this.getSecret('EMAIL-PASS'),
      host: await this.getSecret('SMTP-HOST'),
      port: parseInt(await this.getSecret('SMTP-PORT')),
      login: await this.getSecret('LOGIN'),
      from: await this.getSecret('EMAIL-FROM'),
      salesEmail: await this.getSecret('SALES-EMAIL'),
      supportEmail: await this.getSecret('SUPPORT-EMAIL')
    };
  }

  async getDatabaseConfig() {
    return {
      uri: await this.getSecret('MONGO-URI')
    };
  }

  async getAuthConfig() {
    return {
      jwtSecret: await this.getSecret('JWT-SECRET'),
      internalApiKey: await this.getSecret('INTERNAL-API-KEY')
    };
  }
}

// Create singleton instance
const keyVaultManager = new AzureKeyVaultManager();

module.exports = keyVaultManager; 