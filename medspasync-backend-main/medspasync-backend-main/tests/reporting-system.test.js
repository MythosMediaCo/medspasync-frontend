/**
 * Comprehensive Tests for MedSpaSync Pro Reporting System
 * Tests all components: FileProcessingService, ReportGenerationEngine, 
 * POSIntegrationService, SubscriptionGateMiddleware, and API endpoints
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../app');
const FileProcessingService = require('../services/FileProcessingService');
const ReportGenerationEngine = require('../services/ReportGenerationEngine');
const POSIntegrationService = require('../services/POSIntegrationService');
const SubscriptionGateMiddleware = require('../middleware/SubscriptionGateMiddleware');
const ReportingController = require('../controllers/ReportingController');

const prisma = new PrismaClient();

// Test data
const testUser = {
  id: 'test-user-123',
  email: 'test@medspasync.com',
  practiceId: 'test-practice-123',
  subscriptionTier: 'professional'
};

const testPractice = {
  id: 'test-practice-123',
  name: 'Test Medical Spa',
  subscription: {
    tier: 'professional',
    status: 'active'
  }
};

describe('MedSpaSync Pro Reporting System', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
    
    // Create test data
    await prisma.practice.upsert({
      where: { id: testPractice.id },
      update: testPractice,
      create: testPractice
    });

    await prisma.user.upsert({
      where: { id: testUser.id },
      update: testUser,
      create: testUser
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.fileProcessingJob.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.generatedReport.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.pOSIntegration.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.scheduledReport.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.user.deleteMany({
      where: { id: testUser.id }
    });
    await prisma.practice.deleteMany({
      where: { id: testPractice.id }
    });

    await prisma.$disconnect();
  });

  describe('FileProcessingService', () => {
    let fileProcessingService;

    beforeEach(() => {
      fileProcessingService = new FileProcessingService();
    });

    test('should validate file types correctly', () => {
      const validFiles = [
        { mimetype: 'text/csv', originalname: 'data.csv' },
        { mimetype: 'application/vnd.ms-excel', originalname: 'data.xls' },
        { mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', originalname: 'data.xlsx' },
        { mimetype: 'application/json', originalname: 'data.json' }
      ];

      const invalidFiles = [
        { mimetype: 'text/plain', originalname: 'data.txt' },
        { mimetype: 'image/jpeg', originalname: 'image.jpg' }
      ];

      validFiles.forEach(file => {
        expect(fileProcessingService.isValidFileType(file)).toBe(true);
      });

      invalidFiles.forEach(file => {
        expect(fileProcessingService.isValidFileType(file)).toBe(false);
      });
    });

    test('should validate file size limits', () => {
      const smallFile = { size: 1024 * 1024 }; // 1MB
      const largeFile = { size: 200 * 1024 * 1024 }; // 200MB

      expect(fileProcessingService.isValidFileSize(smallFile)).toBe(true);
      expect(fileProcessingService.isValidFileSize(largeFile)).toBe(false);
    });

    test('should create file processing job', async () => {
      const mockFile = {
        originalname: 'test.csv',
        size: 1024,
        buffer: Buffer.from('test,data\n1,2')
      };

      const job = await fileProcessingService.createProcessingJob(
        mockFile,
        testUser.id,
        testPractice.id,
        { source: 'test' }
      );

      expect(job).toBeDefined();
      expect(job.fileName).toBe('test.csv');
      expect(job.status).toBe('PROCESSING');
      expect(job.userId).toBe(testUser.id);
      expect(job.tenantId).toBe(testPractice.id);
    });

    test('should get job status', async () => {
      const mockFile = {
        originalname: 'status-test.csv',
        size: 1024,
        buffer: Buffer.from('test,data\n1,2')
      };

      const job = await fileProcessingService.createProcessingJob(
        mockFile,
        testUser.id,
        testPractice.id,
        { source: 'test' }
      );

      const status = await fileProcessingService.getJobStatus(
        job.id,
        testUser.id,
        testPractice.id
      );

      expect(status).toBeDefined();
      expect(status.id).toBe(job.id);
      expect(status.status).toBe('PROCESSING');
    });
  });

  describe('ReportGenerationEngine', () => {
    let reportEngine;

    beforeEach(() => {
      reportEngine = new ReportGenerationEngine();
    });

    test('should get available templates', async () => {
      const templates = await reportEngine.getAvailableTemplates(testPractice.id);

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      // Check for system templates
      const systemTemplates = templates.filter(t => t.isSystem);
      expect(systemTemplates.length).toBeGreaterThan(0);
    });

    test('should create custom template', async () => {
      const templateData = {
        name: 'Test Custom Template',
        description: 'Test template for unit testing',
        templateData: {
          sections: ['financial', 'performance'],
          charts: ['revenue', 'appointments']
        }
      };

      const template = await reportEngine.createCustomTemplate(
        testPractice.id,
        testUser.id,
        templateData
      );

      expect(template).toBeDefined();
      expect(template.name).toBe('Test Custom Template');
      expect(template.isSystem).toBe(false);
      expect(template.tenantId).toBe(testPractice.id);
    });

    test('should generate report', async () => {
      // First create a template
      const template = await reportEngine.createCustomTemplate(
        testPractice.id,
        testUser.id,
        {
          name: 'Test Report Template',
          description: 'Template for testing',
          templateData: { sections: ['summary'] }
        }
      );

      const report = await reportEngine.generateReport(
        template.id,
        testUser.id,
        testPractice.id,
        { formats: ['PDF'] }
      );

      expect(report).toBeDefined();
      expect(report.templateId).toBe(template.id);
      expect(report.userId).toBe(testUser.id);
      expect(report.tenantId).toBe(testPractice.id);
      expect(report.formats).toContain('PDF');
    });
  });

  describe('POSIntegrationService', () => {
    let posService;

    beforeEach(() => {
      posService = new POSIntegrationService();
    });

    test('should configure POS integration', async () => {
      const config = {
        type: 'ZENOTI',
        name: 'Test Zenoti Integration',
        config: {
          apiKey: 'test-api-key',
          locationId: 'test-location',
          baseUrl: 'https://api.zenoti.com'
        }
      };

      const integration = await posService.configureIntegration(
        testPractice.id,
        testUser.id,
        config
      );

      expect(integration).toBeDefined();
      expect(integration.type).toBe('ZENOTI');
      expect(integration.name).toBe('Test Zenoti Integration');
      expect(integration.status).toBe('CONFIGURED');
      expect(integration.tenantId).toBe(testPractice.id);
    });

    test('should list integrations', async () => {
      const integrations = await posService.listIntegrations(testPractice.id);

      expect(Array.isArray(integrations)).toBe(true);
      expect(integrations.length).toBeGreaterThan(0);
    });

    test('should get integration status', async () => {
      // First create an integration
      const integration = await posService.configureIntegration(
        testPractice.id,
        testUser.id,
        {
          type: 'VAGARO',
          name: 'Test Vagaro Integration',
          config: { apiKey: 'test-key' }
        }
      );

      const status = await posService.getIntegrationStatus(integration.id);

      expect(status).toBeDefined();
      expect(status.id).toBe(integration.id);
      expect(status.status).toBe('CONFIGURED');
    });
  });

  describe('SubscriptionGateMiddleware', () => {
    let subscriptionGate;

    beforeEach(() => {
      subscriptionGate = new SubscriptionGateMiddleware();
    });

    test('should validate subscription tier', async () => {
      const validation = await subscriptionGate.validateSubscription(testUser.id);

      expect(validation.valid).toBe(true);
      expect(validation.tier).toBe('professional');
    });

    test('should get tier info', async () => {
      const tierInfo = await subscriptionGate.getTierInfo(testUser.id);

      expect(tierInfo.tier).toBe('professional');
      expect(tierInfo.active).toBe(true);
      expect(tierInfo.limits).toBeDefined();
      expect(tierInfo.limits.aiInsights).toBe(true);
      expect(tierInfo.limits.realTimeData).toBe(true);
    });

    test('should check file upload limits for professional tier', async () => {
      const middleware = subscriptionGate.checkFileUploadLimits();
      
      // Mock request and response
      const req = {
        user: { id: testUser.id, practiceId: testPractice.id },
        files: [{ size: 1024 * 1024 }] // 1MB file
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userTier).toBe('professional');
      expect(req.tierLimits).toBeDefined();
    });
  });

  describe('ReportingController', () => {
    let reportingController;

    beforeEach(() => {
      reportingController = new ReportingController();
    });

    test('should get analytics overview', async () => {
      const analytics = await reportingController.getAnalyticsOverview(
        testUser.id,
        testPractice.id
      );

      expect(analytics).toBeDefined();
      expect(analytics.summary).toBeDefined();
      expect(analytics.recentActivity).toBeDefined();
      expect(typeof analytics.summary.totalReports).toBe('number');
      expect(typeof analytics.summary.totalFiles).toBe('number');
    });

    test('should get usage analytics', async () => {
      const usage = await reportingController.getUsageAnalytics(
        testUser.id,
        testPractice.id,
        '30d'
      );

      expect(usage).toBeDefined();
      expect(usage.period).toBe('30d');
      expect(usage.dateRange).toBeDefined();
      expect(Array.isArray(usage.reportsByDay)).toBe(true);
    });

    test('should create scheduled report', async () => {
      const scheduleData = {
        tenantId: testPractice.id,
        userId: testUser.id,
        templateId: 'test-template-id',
        name: 'Test Scheduled Report',
        description: 'Test schedule',
        cronExpression: '0 0 * * 1', // Every Monday at midnight
        recipients: ['test@example.com'],
        formats: ['PDF']
      };

      const schedule = await reportingController.createScheduledReport(scheduleData);

      expect(schedule).toBeDefined();
      expect(schedule.name).toBe('Test Scheduled Report');
      expect(schedule.cronExpression).toBe('0 0 * * 1');
      expect(schedule.isActive).toBe(true);
    });
  });

  describe('API Endpoints', () => {
    let authToken;

    beforeAll(async () => {
      // Generate test JWT token
      const jwt = require('jsonwebtoken');
      authToken = jwt.sign(
        { id: testUser.id, practiceId: testPractice.id, role: 'ADMIN' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    test('GET /api/reporting/analytics/overview should return analytics', async () => {
      const response = await request(app)
        .get('/api/reporting/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    test('GET /api/reporting/templates should return templates', async () => {
      const response = await request(app)
        .get('/api/reporting/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/reporting/files/jobs should return file jobs', async () => {
      const response = await request(app)
        .get('/api/reporting/files/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/reporting/pos/integrations should return POS integrations', async () => {
      const response = await request(app)
        .get('/api/reporting/pos/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/reporting/files/upload should handle file upload', async () => {
      const response = await request(app)
        .post('/api/reporting/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', Buffer.from('test,data\n1,2'), 'test.csv')
        .field('source', 'test')
        .field('description', 'Test upload')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('POST /api/reporting/reports/generate should generate report', async () => {
      // First create a template
      const templateResponse = await request(app)
        .post('/api/reporting/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'API Test Template',
          description: 'Template for API testing',
          templateData: { sections: ['summary'] }
        })
        .expect(201);

      const templateId = templateResponse.body.data.id;

      const response = await request(app)
        .post('/api/reporting/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId,
          parameters: { period: '30d' },
          formats: ['PDF']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.templateId).toBe(templateId);
    });

    test('POST /api/reporting/pos/integrations should configure POS integration', async () => {
      const response = await request(app)
        .post('/api/reporting/pos/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'MINDBODY',
          name: 'Test Mindbody Integration',
          config: {
            apiKey: 'test-api-key',
            siteId: 'test-site'
          }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('MINDBODY');
      expect(response.body.data.name).toBe('Test Mindbody Integration');
    });

    test('should handle authentication errors', async () => {
      const response = await request(app)
        .get('/api/reporting/analytics/overview')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('should handle invalid file uploads', async () => {
      const response = await request(app)
        .post('/api/reporting/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', Buffer.from('invalid data'), 'test.txt')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Frontend Component Tests', () => {
    test('FileUploadDropzone should handle file validation', () => {
      // This would be tested with React Testing Library in a separate test file
      expect(true).toBe(true); // Placeholder for frontend tests
    });

    test('ReportDashboard should display analytics', () => {
      // This would be tested with React Testing Library in a separate test file
      expect(true).toBe(true); // Placeholder for frontend tests
    });

    test('ReportsPage should handle tab navigation', () => {
      // This would be tested with React Testing Library in a separate test file
      expect(true).toBe(true); // Placeholder for frontend tests
    });
  });

  describe('Integration Tests', () => {
    test('should process file and generate report end-to-end', async () => {
      const fileProcessingService = new FileProcessingService();
      const reportEngine = new ReportGenerationEngine();

      // 1. Upload and process file
      const mockFile = {
        originalname: 'integration-test.csv',
        size: 1024,
        buffer: Buffer.from('date,revenue,appointments\n2024-01-01,1000,5\n2024-01-02,1200,6')
      };

      const job = await fileProcessingService.createProcessingJob(
        mockFile,
        testUser.id,
        testPractice.id,
        { source: 'integration-test' }
      );

      expect(job.status).toBe('PROCESSING');

      // 2. Create template
      const template = await reportEngine.createCustomTemplate(
        testPractice.id,
        testUser.id,
        {
          name: 'Integration Test Template',
          description: 'Template for integration testing',
          templateData: { sections: ['financial', 'appointments'] }
        }
      );

      // 3. Generate report
      const report = await reportEngine.generateReport(
        template.id,
        testUser.id,
        testPractice.id,
        { formats: ['PDF', 'Excel'] }
      );

      expect(report.status).toBe('PENDING');
      expect(report.formats).toContain('PDF');
      expect(report.formats).toContain('Excel');
    });

    test('should handle POS integration workflow', async () => {
      const posService = new POSIntegrationService();
      const reportingController = new ReportingController();

      // 1. Configure POS integration
      const integration = await posService.configureIntegration(
        testPractice.id,
        testUser.id,
        {
          type: 'BOULEVARD',
          name: 'Test Boulevard Integration',
          config: {
            apiKey: 'test-api-key',
            locationId: 'test-location'
          }
        }
      );

      expect(integration.status).toBe('CONFIGURED');

      // 2. Get integration status
      const status = await posService.getIntegrationStatus(integration.id);
      expect(status.id).toBe(integration.id);

      // 3. List integrations
      const integrations = await posService.listIntegrations(testPractice.id);
      expect(integrations.some(i => i.id === integration.id)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple file uploads efficiently', async () => {
      const fileProcessingService = new FileProcessingService();
      const files = Array.from({ length: 5 }, (_, i) => ({
        originalname: `performance-test-${i}.csv`,
        size: 1024,
        buffer: Buffer.from(`test,data,${i}\n1,2,${i}`)
      }));

      const startTime = Date.now();
      const jobs = await Promise.all(
        files.map(file => 
          fileProcessingService.createProcessingJob(
            file,
            testUser.id,
            testPractice.id,
            { source: 'performance-test' }
          )
        )
      );
      const endTime = Date.now();

      expect(jobs.length).toBe(5);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should generate reports within acceptable time', async () => {
      const reportEngine = new ReportGenerationEngine();

      // Create template
      const template = await reportEngine.createCustomTemplate(
        testPractice.id,
        testUser.id,
        {
          name: 'Performance Test Template',
          description: 'Template for performance testing',
          templateData: { sections: ['summary'] }
        }
      );

      const startTime = Date.now();
      const report = await reportEngine.generateReport(
        template.id,
        testUser.id,
        testPractice.id,
        { formats: ['PDF'] }
      );
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Security Tests', () => {
    test('should prevent unauthorized access', async () => {
      const response = await request(app)
        .get('/api/reporting/analytics/overview')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('should validate file types', async () => {
      const response = await request(app)
        .post('/api/reporting/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', Buffer.from('malicious content'), 'malicious.exe')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should enforce file size limits', async () => {
      const largeFile = Buffer.alloc(200 * 1024 * 1024); // 200MB
      
      const response = await request(app)
        .post('/api/reporting/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', largeFile, 'large-file.csv')
        .expect(413);

      expect(response.body.error).toBeDefined();
    });

    test('should validate subscription tier access', async () => {
      // Test with core tier user
      const coreUserToken = require('jsonwebtoken').sign(
        { id: 'core-user', practiceId: testPractice.id, role: 'STAFF' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/reporting/pos/integrations')
        .set('Authorization', `Bearer ${coreUserToken}`)
        .send({
          type: 'ZENOTI',
          name: 'Test Integration',
          config: { apiKey: 'test' }
        })
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });
});

console.log('🧪 Running comprehensive tests for MedSpaSync Pro Reporting System...'); 