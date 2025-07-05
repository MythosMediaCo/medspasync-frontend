// Azure Key Vault integration for Marketing Site
// Server-side utility for API routes and build-time configuration

import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

class MarketingKeyVaultManager {
  constructor() {
    this.vaultUrl = `https://medspasync-marketing.vault.azure.net/`;
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
      'MARKETING-URL',
      'CONTACT-EMAIL',
      'ANALYTICS-ID',
      'GOOGLE-TAG-MANAGER-ID',
      'SOCIAL-MEDIA-LINKS',
      'API-ENDPOINTS'
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
      console.log('🔐 Initializing Marketing Azure Key Vault connection...');
      const secrets = await this.loadAllSecrets();
      
      // Set environment variables from Key Vault
      Object.entries(secrets).forEach(([key, value]) => {
        if (value) {
          process.env[key] = value;
        }
      });

      console.log('✅ Marketing Azure Key Vault secrets loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Marketing Azure Key Vault:', error.message);
      console.log('⚠️  Falling back to environment variables');
      return false;
    }
  }

  // Helper method to get marketing configuration
  async getMarketingConfig() {
    return {
      marketingUrl: await this.getSecret('MARKETING-URL'),
      contactEmail: await this.getSecret('CONTACT-EMAIL'),
      analyticsId: await this.getSecret('ANALYTICS-ID'),
      gtmId: await this.getSecret('GOOGLE-TAG-MANAGER-ID'),
      socialMediaLinks: await this.getSecret('SOCIAL-MEDIA-LINKS'),
      apiEndpoints: await this.getSecret('API-ENDPOINTS')
    };
  }

  // Helper method to get contact information
  async getContactConfig() {
    return {
      contactEmail: await this.getSecret('CONTACT-EMAIL'),
      salesEmail: await this.getSecret('SALES-EMAIL'),
      supportEmail: await this.getSecret('SUPPORT-EMAIL')
    };
  }
}

// Create singleton instance
const marketingKeyVaultManager = new MarketingKeyVaultManager();

export default marketingKeyVaultManager; 