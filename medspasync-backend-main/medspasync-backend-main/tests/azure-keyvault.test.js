const keyVaultManager = require('../config/azure-keyvault');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Mock Azure SDK for testing
jest.mock('@azure/identity');
jest.mock('@azure/keyvault-secrets');

describe('Azure Key Vault Integration Tests', () => {
  let mockSecretClient;
  let mockCredential;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mock credential
    mockCredential = {
      getToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
    };
    DefaultAzureCredential.mockImplementation(() => mockCredential);

    // Setup mock secret client
    mockSecretClient = {
      getSecret: jest.fn()
    };
    SecretClient.mockImplementation(() => mockSecretClient);
  });

  describe('Initialization', () => {
    test('should create Key Vault manager with correct configuration', () => {
      expect(keyVaultManager.vaultUrl).toBe('https://medspasync-backend.vault.azure.net/');
      expect(keyVaultManager.secretsCache).toBeInstanceOf(Map);
      expect(keyVaultManager.cacheExpiry).toBe(5 * 60 * 1000); // 5 minutes
    });

    test('should initialize Azure credential and secret client', () => {
      expect(DefaultAzureCredential).toHaveBeenCalled();
      expect(SecretClient).toHaveBeenCalledWith(
        'https://medspasync-backend.vault.azure.net/',
        mockCredential
      );
    });
  });

  describe('Secret Retrieval', () => {
    test('should successfully retrieve a secret from Key Vault', async () => {
      const mockSecret = { value: 'test-secret-value' };
      mockSecretClient.getSecret.mockResolvedValue(mockSecret);

      const result = await keyVaultManager.getSecret('TEST-SECRET');
      
      expect(result).toBe('test-secret-value');
      expect(mockSecretClient.getSecret).toHaveBeenCalledWith('TEST-SECRET');
    });

    test('should cache retrieved secrets', async () => {
      const mockSecret = { value: 'cached-secret' };
      mockSecretClient.getSecret.mockResolvedValue(mockSecret);

      // First call should hit Key Vault
      await keyVaultManager.getSecret('CACHED-SECRET');
      expect(mockSecretClient.getSecret).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await keyVaultManager.getSecret('CACHED-SECRET');
      expect(mockSecretClient.getSecret).toHaveBeenCalledTimes(1);
    });

    test('should handle Key Vault errors gracefully', async () => {
      const error = new Error('Key Vault access denied');
      mockSecretClient.getSecret.mockRejectedValue(error);

      await expect(keyVaultManager.getSecret('INVALID-SECRET'))
        .rejects
        .toThrow('Failed to retrieve secret INVALID-SECRET from Azure Key Vault');
    });

    test('should refresh cache after expiry', async () => {
      const mockSecret = { value: 'expired-secret' };
      mockSecretClient.getSecret.mockResolvedValue(mockSecret);

      // Set cache expiry to 0 for testing
      keyVaultManager.cacheExpiry = 0;

      // First call
      await keyVaultManager.getSecret('EXPIRED-SECRET');
      expect(mockSecretClient.getSecret).toHaveBeenCalledTimes(1);

      // Second call should refresh cache
      await keyVaultManager.getSecret('EXPIRED-SECRET');
      expect(mockSecretClient.getSecret).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration Loading', () => {
    test('should load all required secrets', async () => {
      const mockSecrets = {
        'STRIPE-SECRET-KEY': 'sk_test_123',
        'JWT-SECRET': 'jwt-secret-123',
        'EMAIL-USER': 'test@example.com',
        'MONGO-URI': 'mongodb://localhost:27017/test'
      };

      mockSecretClient.getSecret.mockImplementation((secretName) => {
        return Promise.resolve({ value: mockSecrets[secretName] || 'default-value' });
      });

      const secrets = await keyVaultManager.loadAllSecrets();

      expect(secrets['STRIPE-SECRET-KEY']).toBe('sk_test_123');
      expect(secrets['JWT-SECRET']).toBe('jwt-secret-123');
      expect(secrets['EMAIL-USER']).toBe('test@example.com');
      expect(secrets['MONGO-URI']).toBe('mongodb://localhost:27017/test');
    });

    test('should fallback to environment variables when secrets fail', async () => {
      const originalEnv = process.env['STRIPE-SECRET-KEY'];
      process.env['STRIPE-SECRET-KEY'] = 'env-fallback-value';

      mockSecretClient.getSecret.mockRejectedValue(new Error('Access denied'));

      const secrets = await keyVaultManager.loadAllSecrets();

      expect(secrets['STRIPE-SECRET-KEY']).toBe('env-fallback-value');

      // Restore original environment
      if (originalEnv) {
        process.env['STRIPE-SECRET-KEY'] = originalEnv;
      } else {
        delete process.env['STRIPE-SECRET-KEY'];
      }
    });
  });

  describe('Initialization Process', () => {
    test('should successfully initialize and set environment variables', async () => {
      const mockSecrets = {
        'STRIPE-SECRET-KEY': 'sk_test_123',
        'JWT-SECRET': 'jwt-secret-123'
      };

      mockSecretClient.getSecret.mockImplementation((secretName) => {
        return Promise.resolve({ value: mockSecrets[secretName] || 'default-value' });
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await keyVaultManager.initialize();

      expect(result).toBe(true);
      expect(process.env['STRIPE-SECRET-KEY']).toBe('sk_test_123');
      expect(process.env['JWT-SECRET']).toBe('jwt-secret-123');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Azure Key Vault secrets loaded successfully');

      consoleSpy.mockRestore();
    });

    test('should handle initialization failure gracefully', async () => {
      mockSecretClient.getSecret.mockRejectedValue(new Error('Initialization failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await keyVaultManager.initialize();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to initialize Azure Key Vault:', 'Initialization failed');
      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  Falling back to environment variables');

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Configuration Helpers', () => {
    test('should return Stripe configuration', async () => {
      const mockStripeSecrets = {
        'STRIPE-SECRET-KEY': 'sk_test_123',
        'STRIPE-WEBHOOK-SECRET': 'whsec_123',
        'STRIPE-PRODUCT-PRO': 'prod_pro_123',
        'STRIPE-PRODUCT-CORE': 'prod_core_123'
      };

      mockSecretClient.getSecret.mockImplementation((secretName) => {
        return Promise.resolve({ value: mockStripeSecrets[secretName] });
      });

      const stripeConfig = await keyVaultManager.getStripeConfig();

      expect(stripeConfig).toEqual({
        secretKey: 'sk_test_123',
        webhookSecret: 'whsec_123',
        productPro: 'prod_pro_123',
        productCore: 'prod_core_123'
      });
    });

    test('should return email configuration', async () => {
      const mockEmailSecrets = {
        'EMAIL-USER': 'test@example.com',
        'EMAIL-PASS': 'password123',
        'SMTP-HOST': 'smtp.example.com',
        'SMTP-PORT': '587',
        'LOGIN': 'login123',
        'EMAIL-FROM': 'noreply@example.com',
        'SALES-EMAIL': 'sales@example.com',
        'SUPPORT-EMAIL': 'support@example.com'
      };

      mockSecretClient.getSecret.mockImplementation((secretName) => {
        return Promise.resolve({ value: mockEmailSecrets[secretName] });
      });

      const emailConfig = await keyVaultManager.getEmailConfig();

      expect(emailConfig).toEqual({
        user: 'test@example.com',
        pass: 'password123',
        host: 'smtp.example.com',
        port: 587,
        login: 'login123',
        from: 'noreply@example.com',
        salesEmail: 'sales@example.com',
        supportEmail: 'support@example.com'
      });
    });

    test('should return database configuration', async () => {
      mockSecretClient.getSecret.mockResolvedValue({ value: 'mongodb://localhost:27017/test' });

      const dbConfig = await keyVaultManager.getDatabaseConfig();

      expect(dbConfig).toEqual({
        uri: 'mongodb://localhost:27017/test'
      });
    });

    test('should return auth configuration', async () => {
      const mockAuthSecrets = {
        'JWT-SECRET': 'jwt-secret-123',
        'INTERNAL-API-KEY': 'internal-key-123'
      };

      mockSecretClient.getSecret.mockImplementation((secretName) => {
        return Promise.resolve({ value: mockAuthSecrets[secretName] });
      });

      const authConfig = await keyVaultManager.getAuthConfig();

      expect(authConfig).toEqual({
        jwtSecret: 'jwt-secret-123',
        internalApiKey: 'internal-key-123'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      networkError.code = 'NETWORK_ERROR';
      mockSecretClient.getSecret.mockRejectedValue(networkError);

      await expect(keyVaultManager.getSecret('NETWORK-SECRET'))
        .rejects
        .toThrow('Failed to retrieve secret NETWORK-SECRET from Azure Key Vault');
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      authError.code = 'UNAUTHORIZED';
      mockSecretClient.getSecret.mockRejectedValue(authError);

      await expect(keyVaultManager.getSecret('AUTH-SECRET'))
        .rejects
        .toThrow('Failed to retrieve secret AUTH-SECRET from Azure Key Vault');
    });

    test('should handle missing secrets', async () => {
      const notFoundError = new Error('Secret not found');
      notFoundError.code = 'NOT_FOUND';
      mockSecretClient.getSecret.mockRejectedValue(notFoundError);

      await expect(keyVaultManager.getSecret('MISSING-SECRET'))
        .rejects
        .toThrow('Failed to retrieve secret MISSING-SECRET from Azure Key Vault');
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent secret requests efficiently', async () => {
      const mockSecret = { value: 'concurrent-secret' };
      mockSecretClient.getSecret.mockResolvedValue(mockSecret);

      const promises = Array(10).fill().map(() => 
        keyVaultManager.getSecret('CONCURRENT-SECRET')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every(result => result === 'concurrent-secret')).toBe(true);
      // Should only call Key Vault once due to caching
      expect(mockSecretClient.getSecret).toHaveBeenCalledTimes(1);
    });

    test('should handle large number of different secrets', async () => {
      const secretCount = 50;
      const mockSecrets = {};

      for (let i = 0; i < secretCount; i++) {
        mockSecrets[`SECRET-${i}`] = `value-${i}`;
      }

      mockSecretClient.getSecret.mockImplementation((secretName) => {
        return Promise.resolve({ value: mockSecrets[secretName] });
      });

      const promises = Object.keys(mockSecrets).map(secretName =>
        keyVaultManager.getSecret(secretName)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(secretCount);
      expect(mockSecretClient.getSecret).toHaveBeenCalledTimes(secretCount);
    });
  });
}); 