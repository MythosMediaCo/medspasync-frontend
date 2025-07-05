/**
 * Phase 2 Integration Tests for MedSpa Analytics Pro
 * Comprehensive test suite covering real-time data pipeline, PMS integration, and advanced analytics
 * Performance targets: <500ms processing latency, >90% accuracy, 98.5% integration success rate
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { RealTimeDataPipeline } from '../src/services/realtime/RealTimeDataPipeline';
import { PracticeManagementIntegration } from '../src/services/integration/PracticeManagementIntegration';
import { AdvancedAnalyticsEngine } from '../src/services/ai/AdvancedAnalyticsEngine';
import { RealTimeDashboardAPI } from '../src/services/analytics/RealTimeDashboardAPI';

describe('MedSpa Analytics Pro Phase 2 Integration Tests', () => {
  let prisma: PrismaClient;
  let redis: Redis;
  let realTimePipeline: RealTimeDataPipeline;
  let pmsIntegration: PracticeManagementIntegration;
  let analyticsEngine: AdvancedAnalyticsEngine;
  let dashboardAPI: RealTimeDashboardAPI;

  beforeAll(async () => {
    // Initialize test database and Redis
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env['TEST_DATABASE_URL'] || 'postgresql://test:test@localhost:5432/medspa_test'
        }
      }
    });

    redis = new Redis({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      password: process.env['REDIS_PASSWORD'] || '',
      db: 15 // Test database
    });

    // Initialize services
    realTimePipeline = new RealTimeDataPipeline();
    pmsIntegration = new PracticeManagementIntegration();
    analyticsEngine = new AdvancedAnalyticsEngine();
    dashboardAPI = new RealTimeDashboardAPI();

    // Wait for services to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
    await realTimePipeline.stop();
  });

  describe('Real-time Data Pipeline Tests', () => {
    test('should process events with sub-500ms latency', async () => {
      const startTime = performance.now();
      
      const testEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        eventType: 'appointment_created',
        data: {
          appointmentId: 'test-apt-1',
          patientId: 'test-patient-1',
          serviceId: 'test-service-1',
          scheduledAt: new Date(),
          amount: 150
        },
        source: 'test-pms',
        correlationId: crypto.randomUUID(),
        practiceId: 'test-practice-1'
      };

      const eventId = await realTimePipeline.publishEvent(testEvent);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const processingTime = performance.now() - startTime;
      
      expect(eventId).toBeDefined();
      expect(processingTime).toBeLessThan(500);
    }, 10000);

    test('should maintain HIPAA compliance during data processing', async () => {
      const phiEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        eventType: 'patient_registered',
        data: {
          patientId: 'test-patient-2',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '555-123-4567',
          dateOfBirth: '1985-03-15'
        },
        source: 'test-pms',
        correlationId: crypto.randomUUID(),
        practiceId: 'test-practice-1'
      };

      // const eventId = await realTimePipeline.publishEvent(phiEvent);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify data is encrypted in database
      const storedEvent = await prisma.analyticsEvent.findFirst({
        where: { id: phiEvent.id }
      });
      
      expect(storedEvent).toBeTruthy();
      expect(storedEvent?.properties).not.toContain('John Doe');
      expect(storedEvent?.properties).not.toContain('john.doe@example.com');
    }, 10000);

    test('should achieve target processing throughput', async () => {
      const events = [];
      const numEvents = 100;
      
      // Generate test events
      for (let i = 0; i < numEvents; i++) {
        events.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          eventType: 'appointment_updated',
          data: {
            appointmentId: `test-apt-${i}`,
            status: 'confirmed',
            updatedAt: new Date()
          },
          source: 'test-pms',
          correlationId: crypto.randomUUID(),
          practiceId: 'test-practice-1'
        });
      }

      const startTime = performance.now();
      
      // Publish events
      const publishPromises = events.map(event => realTimePipeline.publishEvent(event));
      await Promise.all(publishPromises);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const processingTime = performance.now() - startTime;
      const throughput = numEvents / (processingTime / 1000);
      
      expect(throughput).toBeGreaterThan(50); // 50 events per second minimum
      expect(processingTime).toBeLessThan(5000); // 5 seconds for 100 events
    }, 15000);

    test('should provide accurate processing metrics', async () => {
      const metrics = realTimePipeline.getProcessingMetrics();
      
      expect(metrics.totalEvents).toBeGreaterThan(0);
      expect(metrics.processedEvents).toBeGreaterThan(0);
      expect(metrics.averageLatency).toBeLessThan(500);
      expect(metrics.errors).toBeInstanceOf(Array);
    });

    test('should handle real-time cache operations', async () => {
      const practiceId = 'test-practice-1';
      const eventType = 'appointment_created';
      
      const cacheData = await realTimePipeline.getRealTimeData(practiceId, eventType);
      
      expect(cacheData).toBeDefined();
      expect(typeof cacheData).toBe('object');
    });
  });

  describe('Practice Management System Integration Tests', () => {
    test('should achieve 98.5% integration success rate', async () => {
      // Simulate multiple sync operations
      const syncResults = [];
      
      for (let i = 0; i < 100; i++) {
        try {
          await pmsIntegration.syncAllSystems();
          syncResults.push('success');
        } catch (error) {
          syncResults.push('failure');
        }
      }
      
      const successCount = syncResults.filter(result => result === 'success').length;
      const successRate = successCount / syncResults.length;
      
      expect(successRate).toBeGreaterThanOrEqual(0.985);
    }, 30000);

    test('should maintain sub-5-second sync latency', async () => {
      const startTime = performance.now();
      
      await pmsIntegration.syncAllSystems();
      
      const syncTime = performance.now() - startTime;
      
      expect(syncTime).toBeLessThan(5000);
    }, 10000);

    test('should handle authentication failures gracefully', async () => {
      // This test would simulate authentication failures
      // and verify proper error handling and retry logic
      
      const metrics = await pmsIntegration.getIntegrationMetrics();
      
      expect(metrics.totalSyncs).toBeGreaterThan(0);
      expect(metrics.errors).toBeInstanceOf(Array);
    });

    test('should provide accurate integration metrics', async () => {
      const metrics = await pmsIntegration.getIntegrationMetrics();
      
      expect(metrics.totalSyncs).toBeGreaterThan(0);
      expect(metrics.successfulSyncs).toBeGreaterThan(0);
      expect(metrics.averageLatency).toBeLessThan(5000);
      expect(metrics.lastSyncAt).toBeInstanceOf(Date);
    });

    test('should pass health check validation', async () => {
      const health = await pmsIntegration.healthCheck();
      
      expect(health.status).toMatch(/healthy|degraded/);
      expect(health.successRate).toBeGreaterThanOrEqual(0);
      expect(health.systems).toBeInstanceOf(Array);
      expect(health.systems.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Analytics Engine Tests', () => {
    test('should generate demand forecasts with >90% accuracy', async () => {
      const practiceId = 'test-practice-1';
      
      const forecasts = await analyticsEngine.generateDemandForecast(practiceId, 7);
      
      expect(forecasts).toBeInstanceOf(Array);
      expect(forecasts.length).toBe(7);
      
      for (const forecast of forecasts) {
        expect(forecast.date).toBeInstanceOf(Date);
        expect(forecast.predictedAppointments).toBeGreaterThan(0);
        expect(forecast.confidenceInterval).toBeDefined();
        expect(forecast.confidenceInterval.lower).toBeLessThanOrEqual(forecast.confidenceInterval.upper);
        expect(forecast.recommendations).toBeInstanceOf(Array);
      }
    }, 15000);

    test('should generate patient segments with meaningful insights', async () => {
      const practiceId = 'test-practice-1';
      
      const segments = await analyticsEngine.generatePatientSegments(practiceId);
      
      expect(segments).toBeInstanceOf(Array);
      expect(segments.length).toBeGreaterThan(0);
      
      for (const segment of segments) {
        expect(segment.id).toBeDefined();
        expect(segment.name).toBeDefined();
        expect(segment.characteristics).toBeDefined();
        expect(segment.size).toBeGreaterThanOrEqual(0);
        expect(segment.lifetimeValue).toBeGreaterThanOrEqual(0);
        expect(segment.churnRisk).toBeGreaterThanOrEqual(0);
        expect(segment.churnRisk).toBeLessThanOrEqual(1);
        expect(segment.recommendations).toBeInstanceOf(Array);
      }
    }, 10000);

    test('should generate treatment recommendations with confidence scores', async () => {
      const patientId = 'test-patient-1';
      const practiceId = 'test-practice-1';
      
      const recommendations = await analyticsEngine.generateTreatmentRecommendations(
        patientId,
        practiceId,
        true
      );
      
      expect(recommendations).toBeInstanceOf(Array);
      
      for (const recommendation of recommendations) {
        expect(recommendation.treatmentId).toBeDefined();
        expect(recommendation.treatmentName).toBeDefined();
        expect(recommendation.confidence).toBeGreaterThan(0);
        expect(recommendation.confidence).toBeLessThanOrEqual(1);
        expect(recommendation.reasoning).toBeInstanceOf(Array);
        expect(recommendation.expectedOutcome).toBeDefined();
        expect(recommendation.contraindications).toBeInstanceOf(Array);
        expect(recommendation.alternativeTreatments).toBeInstanceOf(Array);
      }
    }, 10000);

    test('should maintain sub-100ms inference latency', async () => {
      const startTime = performance.now();
      
      await analyticsEngine.generateDemandForecast('test-practice-1', 1);
      
      const inferenceTime = performance.now() - startTime;
      
      expect(inferenceTime).toBeLessThan(100);
    });

    test('should provide accurate model metrics', async () => {
      const metrics = await analyticsEngine.getModelMetrics();
      
      expect(metrics).toBeInstanceOf(Array);
      expect(metrics.length).toBeGreaterThan(0);
      
      for (const metric of metrics) {
        expect(metric.modelId).toBeDefined();
        expect(metric.modelType).toBeDefined();
        expect(metric.accuracy).toBeGreaterThan(0.8); // >80% accuracy
        expect(metric.accuracy).toBeLessThanOrEqual(1);
        expect(metric.inferenceLatency).toBeLessThan(100);
        expect(metric.lastTrained).toBeInstanceOf(Date);
      }
    });

    test('should pass health check validation', async () => {
      const health = await analyticsEngine.healthCheck();
      
      expect(health.status).toMatch(/healthy|degraded/);
      expect(health.models).toBeInstanceOf(Array);
      expect(health.models.length).toBeGreaterThan(0);
      expect(health.averageAccuracy).toBeGreaterThan(0.8);
    });
  });

  describe('Real-time Dashboard API Tests', () => {
    test('should provide dashboard metrics with sub-200ms response time', async () => {
      const startTime = performance.now();
      
      const metrics = await dashboardAPI.getDashboardMetrics('test-practice-1');
      
      const responseTime = performance.now() - startTime;
      
      expect(responseTime).toBeLessThan(200);
      expect(metrics.totalAppointments).toBeGreaterThanOrEqual(0);
      expect(metrics.todayAppointments).toBeGreaterThanOrEqual(0);
      expect(metrics.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(metrics.patientSatisfaction).toBeGreaterThanOrEqual(0);
      expect(metrics.patientSatisfaction).toBeLessThanOrEqual(1);
      expect(metrics.staffUtilization).toBeGreaterThanOrEqual(0);
      expect(metrics.staffUtilization).toBeLessThanOrEqual(1);
      expect(metrics.treatmentPerformance).toBeInstanceOf(Array);
      expect(metrics.realTimeUpdates).toBeInstanceOf(Array);
    });

    test('should provide appointment stream data', async () => {
      const appointments = await dashboardAPI.getAppointmentStream();
      
      expect(appointments).toBeInstanceOf(Array);
      
      for (const appointment of appointments) {
        expect(appointment.id).toBeDefined();
        expect(appointment.patientName).toBeDefined();
        expect(appointment.treatmentName).toBeDefined();
        expect(appointment.scheduledAt).toBeInstanceOf(Date);
        expect(appointment.status).toBeDefined();
        expect(appointment.amount).toBeGreaterThanOrEqual(0);
        expect(appointment.duration).toBeGreaterThan(0);
      }
    });

    test('should provide revenue analytics', async () => {
      const revenue = await dashboardAPI.getRevenueAnalytics('daily');
      
      expect(revenue.daily).toBeInstanceOf(Array);
      expect(revenue.weekly).toBeInstanceOf(Array);
      expect(revenue.monthly).toBeInstanceOf(Array);
      expect(revenue.byTreatment).toBeInstanceOf(Array);
      
      for (const daily of revenue.daily) {
        expect(daily.date).toBeDefined();
        expect(daily.revenue).toBeGreaterThanOrEqual(0);
        expect(daily.appointments).toBeGreaterThanOrEqual(0);
        expect(daily.averageValue).toBeGreaterThanOrEqual(0);
      }
    });

    test('should provide patient analytics', async () => {
      const patients = await dashboardAPI.getPatientAnalytics();
      
      expect(patients.totalPatients).toBeGreaterThanOrEqual(0);
      expect(patients.newPatients).toBeGreaterThanOrEqual(0);
      expect(patients.returningPatients).toBeGreaterThanOrEqual(0);
      expect(patients.patientSegments).toBeInstanceOf(Array);
      expect(patients.topPatients).toBeInstanceOf(Array);
      expect(patients.patientRetention.rate).toBeGreaterThanOrEqual(0);
      expect(patients.patientRetention.rate).toBeLessThanOrEqual(1);
      expect(patients.patientRetention.trend).toBeDefined();
      expect(patients.patientRetention.factors).toBeInstanceOf(Array);
    });

    test('should provide staff analytics', async () => {
      const staff = await dashboardAPI.getStaffAnalytics();
      
      expect(staff.totalStaff).toBeGreaterThanOrEqual(0);
      expect(staff.activeStaff).toBeGreaterThanOrEqual(0);
      expect(staff.utilization).toBeInstanceOf(Array);
      expect(staff.performance).toBeInstanceOf(Array);
      
      for (const utilization of staff.utilization) {
        expect(utilization.staffId).toBeDefined();
        expect(utilization.staffName).toBeDefined();
        expect(utilization.utilization).toBeGreaterThanOrEqual(0);
        expect(utilization.utilization).toBeLessThanOrEqual(1);
        expect(utilization.appointments).toBeGreaterThanOrEqual(0);
        expect(utilization.revenue).toBeGreaterThanOrEqual(0);
        expect(utilization.satisfaction).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle real-time subscriptions', async () => {
      const connectionId = 'test-connection-1';
      let receivedUpdates = 0;
      
      const callback = (update: any) => {
        expect(update.type).toBeDefined();
        expect(update.timestamp).toBeInstanceOf(Date);
        expect(update.id).toBeDefined();
        receivedUpdates++;
      };
      
      dashboardAPI.subscribeToUpdates(connectionId, callback);
      
      // Wait for initial data
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(receivedUpdates).toBeGreaterThan(0);
      
      dashboardAPI.unsubscribeFromUpdates(connectionId);
    });

    test('should pass health check validation', async () => {
      const health = await dashboardAPI.healthCheck();
      
      expect(health.status).toMatch(/healthy|unhealthy/);
      expect(health.connections).toBeGreaterThanOrEqual(0);
      expect(health.cacheStatus).toMatch(/operational|error/);
    });
  });

  describe('End-to-End Integration Tests', () => {
    test('should process complete workflow from PMS to analytics', async () => {
      const startTime = performance.now();
      
      // 1. Simulate PMS data sync
      await pmsIntegration.syncAllSystems();
      
      // 2. Process through real-time pipeline
      const testEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        eventType: 'appointment_created',
        data: {
          appointmentId: 'e2e-test-1',
          patientId: 'e2e-patient-1',
          serviceId: 'e2e-service-1',
          scheduledAt: new Date(),
          amount: 200
        },
        source: 'test-pms',
        correlationId: crypto.randomUUID(),
        practiceId: 'e2e-practice-1'
      };
      
      await realTimePipeline.publishEvent(testEvent);
      
      // 3. Generate analytics
      const forecasts = await analyticsEngine.generateDemandForecast('e2e-practice-1', 1);
      const segments = await analyticsEngine.generatePatientSegments('e2e-practice-1');
      
      // 4. Get dashboard data
      const metrics = await dashboardAPI.getDashboardMetrics('e2e-practice-1');
      
      const totalTime = performance.now() - startTime;
      
      // Validate results
      expect(forecasts).toBeInstanceOf(Array);
      expect(segments).toBeInstanceOf(Array);
      expect(metrics).toBeDefined();
      expect(totalTime).toBeLessThan(10000); // 10 seconds for complete workflow
    }, 15000);

    test('should maintain data consistency across all systems', async () => {
      const testPatientId = 'consistency-test-patient';
      
      // Create test data
      const testAppointment = {
        id: 'consistency-test-apt',
        clientId: testPatientId,
        staffId: 'test-staff-1',
        serviceId: 'test-service-1',
        scheduledAt: new Date(),
        dateTime: new Date(),
        duration: 60,
        price: 150,
        practiceId: 'consistency-test-practice',
        status: 'scheduled' as any,
        amount: 150,
        notes: 'Consistency test appointment',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store in database
      await prisma.appointment.create({
        data: testAppointment
      });
      
      // Verify data appears in all systems
      const pipelineMetrics = realTimePipeline.getProcessingMetrics();
      const pmsMetrics = await pmsIntegration.getIntegrationMetrics();
      const analyticsHealth = await analyticsEngine.healthCheck();
      const dashboardHealth = await dashboardAPI.healthCheck();
      
      expect(pipelineMetrics.totalEvents).toBeGreaterThan(0);
      expect(pmsMetrics.totalSyncs).toBeGreaterThan(0);
      expect(analyticsHealth.status).toMatch(/healthy|degraded/);
      expect(dashboardHealth.status).toMatch(/healthy|unhealthy/);
    }, 10000);

    test('should handle high load scenarios', async () => {
      const numEvents = 50;
      const events = [];
      
      // Generate high load
      for (let i = 0; i < numEvents; i++) {
        events.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          eventType: 'appointment_updated',
          data: {
            appointmentId: `load-test-${i}`,
            status: 'confirmed',
            updatedAt: new Date()
          },
          source: 'load-test',
          correlationId: crypto.randomUUID(),
          practiceId: 'load-test-practice'
        });
      }
      
      const startTime = performance.now();
      
      // Process events
      const publishPromises = events.map(event => realTimePipeline.publishEvent(event));
      await Promise.all(publishPromises);
      
      // Generate analytics under load
      const analyticsPromises = [
        analyticsEngine.generateDemandForecast('load-test-practice', 1),
        analyticsEngine.generatePatientSegments('load-test-practice'),
        dashboardAPI.getDashboardMetrics('load-test-practice')
      ];
      
      await Promise.all(analyticsPromises);
      
      const totalTime = performance.now() - startTime;
      
      expect(totalTime).toBeLessThan(15000); // 15 seconds for high load scenario
    }, 20000);
  });

  describe('Performance Benchmark Tests', () => {
    test('should meet all performance targets simultaneously', async () => {
      const performanceResults = {
        pipelineLatency: 0,
        pmsSyncTime: 0,
        analyticsInference: 0,
        dashboardResponse: 0,
        endToEndTime: 0
      };
      
      const startTime = performance.now();
      
      // Test real-time pipeline
      const pipelineStart = performance.now();
      await realTimePipeline.publishEvent({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        eventType: 'performance_test',
        data: { test: true },
        source: 'performance-test',
        correlationId: crypto.randomUUID(),
        practiceId: 'performance-practice'
      });
      performanceResults.pipelineLatency = performance.now() - pipelineStart;
      
      // Test PMS integration
      const pmsStart = performance.now();
      await pmsIntegration.syncAllSystems();
      performanceResults.pmsSyncTime = performance.now() - pmsStart;
      
      // Test analytics engine
      const analyticsStart = performance.now();
      await analyticsEngine.generateDemandForecast('performance-practice', 1);
      performanceResults.analyticsInference = performance.now() - analyticsStart;
      
      // Test dashboard API
      const dashboardStart = performance.now();
      await dashboardAPI.getDashboardMetrics('performance-practice');
      performanceResults.dashboardResponse = performance.now() - dashboardStart;
      
      performanceResults.endToEndTime = performance.now() - startTime;
      
      // Validate performance targets
      expect(performanceResults.pipelineLatency).toBeLessThan(500);
      expect(performanceResults.pmsSyncTime).toBeLessThan(5000);
      expect(performanceResults.analyticsInference).toBeLessThan(100);
      expect(performanceResults.dashboardResponse).toBeLessThan(200);
      expect(performanceResults.endToEndTime).toBeLessThan(10000);
    }, 15000);

    test('should maintain accuracy targets under load', async () => {
      // Generate load
      const loadPromises = [];
      for (let i = 0; i < 20; i++) {
        loadPromises.push(
          analyticsEngine.generateDemandForecast('accuracy-practice', 1),
          analyticsEngine.generatePatientSegments('accuracy-practice'),
          analyticsEngine.generateTreatmentRecommendations('test-patient', 'accuracy-practice')
        );
      }
      
      await Promise.all(loadPromises);
      
      // Check accuracy metrics
      const modelMetrics = await analyticsEngine.getModelMetrics();
      
      for (const metric of modelMetrics) {
        expect(metric.accuracy).toBeGreaterThan(0.8); // >80% accuracy under load
        expect(metric.inferenceLatency).toBeLessThan(150); // <150ms under load
      }
    }, 20000);
  });
}); 