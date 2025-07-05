// Jest setup file for global test configuration
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/medspa_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.REDIS_URL = 'redis://localhost:6379/1'; 