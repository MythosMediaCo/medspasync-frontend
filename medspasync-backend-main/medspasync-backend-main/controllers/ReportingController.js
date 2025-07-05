/**
 * Reporting Controller
 * Business logic for file processing, report generation, POS integration,
 * scheduling, and analytics for the MedSpaSync Pro reporting system
 */

const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const { performanceLogger } = require('../utils/logger');

class ReportingController {
  constructor() {
    this.prisma = new PrismaClient();
    this.scheduledJobs = new Map();
    this.initializeScheduledJobs();
  }

  /**
   * Initialize scheduled jobs from database
   */
  async initializeScheduledJobs() {
    try {
      const activeSchedules = await this.prisma.scheduledReport.findMany({
        where: { isActive: true }
      });

      for (const schedule of activeSchedules) {
        this.scheduleReport(schedule);
      }

      console.log(`✅ Initialized ${activeSchedules.length} scheduled reports`);
    } catch (error) {
      console.error('❌ Failed to initialize scheduled jobs:', error);
    }
  }

  /**
   * Create scheduled report
   */
  async createScheduledReport(scheduleData) {
    try {
      // Validate cron expression
      if (!cron.validate(scheduleData.cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      // Calculate next run time
      const nextRun = this.calculateNextRun(scheduleData.cronExpression);

      const schedule = await this.prisma.scheduledReport.create({
        data: {
          tenantId: scheduleData.tenantId,
          userId: scheduleData.userId,
          templateId: scheduleData.templateId,
          name: scheduleData.name,
          description: scheduleData.description,
          cronExpression: scheduleData.cronExpression,
          recipients: scheduleData.recipients,
          formats: scheduleData.formats,
          nextRun
        }
      });

      // Schedule the job
      this.scheduleReport(schedule);

      return schedule;
    } catch (error) {
      console.error('Create scheduled report error:', error);
      throw error;
    }
  }

  /**
   * Schedule a report job
   */
  scheduleReport(schedule) {
    const jobId = `report_${schedule.id}`;
    
    // Cancel existing job if it exists
    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.get(jobId).stop();
    }

    // Create new scheduled job
    const job = cron.schedule(schedule.cronExpression, async () => {
      await this.executeScheduledReport(schedule);
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });

    this.scheduledJobs.set(jobId, job);
    console.log(`📅 Scheduled report: ${schedule.name} (${schedule.cronExpression})`);
  }

  /**
   * Execute a scheduled report
   */
  async executeScheduledReport(schedule) {
    try {
      console.log(`🔄 Executing scheduled report: ${schedule.name}`);

      // Generate the report
      const ReportGenerationEngine = require('../services/ReportGenerationEngine');
      const reportEngine = new ReportGenerationEngine();
      
      const result = await reportEngine.generateReport(
        schedule.templateId,
        schedule.userId,
        schedule.tenantId,
        { formats: schedule.formats }
      );

      // Update schedule with last run time
      await this.prisma.scheduledReport.update({
        where: { id: schedule.id },
        data: {
          lastRun: new Date(),
          nextRun: this.calculateNextRun(schedule.cronExpression)
        }
      });

      // Send notifications if recipients are configured
      if (schedule.recipients && schedule.recipients.length > 0) {
        await this.sendReportNotifications(schedule, result);
      }

      console.log(`✅ Scheduled report completed: ${schedule.name}`);

    } catch (error) {
      console.error(`❌ Scheduled report failed: ${schedule.name}`, error);
      
      // Update schedule with error
      await this.prisma.scheduledReport.update({
        where: { id: schedule.id },
        data: {
          lastRun: new Date(),
          error: error.message
        }
      });
    }
  }

  /**
   * Calculate next run time from cron expression
   */
  calculateNextRun(cronExpression) {
    const now = new Date();
    const nextRun = cron.getNextDate(cronExpression, now);
    return nextRun;
  }

  /**
   * Send report notifications
   */
  async sendReportNotifications(schedule, reportResult) {
    try {
      // This would integrate with your notification service
      // For now, we'll log the notification
      console.log(`📧 Sending report notifications for: ${schedule.name}`);
      console.log(`   Recipients: ${schedule.recipients.join(', ')}`);
      console.log(`   Report ID: ${reportResult.reportId}`);
      
      // TODO: Implement actual notification sending
      // await notificationService.sendReportNotification(schedule, reportResult);
      
    } catch (error) {
      console.error('Failed to send report notifications:', error);
    }
  }

  /**
   * Get scheduled reports for user
   */
  async getScheduledReports(userId, tenantId) {
    try {
      const schedules = await this.prisma.scheduledReport.findMany({
        where: {
          userId,
          tenantId
        },
        include: {
          template: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return schedules.map(schedule => ({
        id: schedule.id,
        name: schedule.name,
        description: schedule.description,
        cronExpression: schedule.cronExpression,
        isActive: schedule.isActive,
        recipients: schedule.recipients,
        formats: schedule.formats,
        lastRun: schedule.lastRun,
        nextRun: schedule.nextRun,
        templateName: schedule.template.name,
        createdAt: schedule.createdAt
      }));
    } catch (error) {
      console.error('Get scheduled reports error:', error);
      throw error;
    }
  }

  /**
   * Update scheduled report
   */
  async updateScheduledReport(scheduleId, userId, updateData) {
    try {
      // Verify ownership
      const existing = await this.prisma.scheduledReport.findFirst({
        where: {
          id: scheduleId,
          userId
        }
      });

      if (!existing) {
        throw new Error('Scheduled report not found');
      }

      // Validate cron expression if provided
      if (updateData.cronExpression && !cron.validate(updateData.cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      // Calculate next run if cron expression changed
      if (updateData.cronExpression) {
        updateData.nextRun = this.calculateNextRun(updateData.cronExpression);
      }

      const schedule = await this.prisma.scheduledReport.update({
        where: { id: scheduleId },
        data: updateData,
        include: {
          template: true
        }
      });

      // Reschedule job if cron expression changed
      if (updateData.cronExpression) {
        this.scheduleReport(schedule);
      }

      return schedule;
    } catch (error) {
      console.error('Update scheduled report error:', error);
      throw error;
    }
  }

  /**
   * Delete scheduled report
   */
  async deleteScheduledReport(scheduleId, userId) {
    try {
      // Verify ownership
      const existing = await this.prisma.scheduledReport.findFirst({
        where: {
          id: scheduleId,
          userId
        }
      });

      if (!existing) {
        throw new Error('Scheduled report not found');
      }

      // Stop the scheduled job
      const jobId = `report_${scheduleId}`;
      if (this.scheduledJobs.has(jobId)) {
        this.scheduledJobs.get(jobId).stop();
        this.scheduledJobs.delete(jobId);
      }

      // Delete from database
      await this.prisma.scheduledReport.delete({
        where: { id: scheduleId }
      });

      return { success: true, message: 'Scheduled report deleted successfully' };
    } catch (error) {
      console.error('Delete scheduled report error:', error);
      throw error;
    }
  }

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview(userId, tenantId) {
    try {
      const [
        totalReports,
        totalFiles,
        totalIntegrations,
        recentActivity
      ] = await Promise.all([
        // Total reports generated
        this.prisma.generatedReport.count({
          where: { userId, tenantId }
        }),

        // Total files processed
        this.prisma.fileProcessingJob.count({
          where: { userId, tenantId }
        }),

        // Total POS integrations
        this.prisma.pOSIntegration.count({
          where: { tenantId }
        }),

        // Recent activity (last 30 days)
        this.prisma.generatedReport.findMany({
          where: {
            userId,
            tenantId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            template: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        })
      ]);

      // Calculate success rates
      const successfulReports = await this.prisma.generatedReport.count({
        where: {
          userId,
          tenantId,
          status: 'COMPLETED'
        }
      });

      const successfulFiles = await this.prisma.fileProcessingJob.count({
        where: {
          userId,
          tenantId,
          status: 'COMPLETED'
        }
      });

      const reportSuccessRate = totalReports > 0 ? (successfulReports / totalReports) * 100 : 0;
      const fileSuccessRate = totalFiles > 0 ? (successfulFiles / totalFiles) * 100 : 0;

      return {
        summary: {
          totalReports,
          totalFiles,
          totalIntegrations,
          reportSuccessRate: Math.round(reportSuccessRate * 100) / 100,
          fileSuccessRate: Math.round(fileSuccessRate * 100) / 100
        },
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          templateName: activity.template.name,
          status: activity.status,
          createdAt: activity.createdAt,
          formats: activity.formats
        }))
      };
    } catch (error) {
      console.error('Get analytics overview error:', error);
      throw error;
    }
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(userId, tenantId, period = '30d') {
    try {
      const days = this.parsePeriod(period);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [
        reportsByDay,
        filesByDay,
        topTemplates,
        topFormats
      ] = await Promise.all([
        // Reports generated by day
        this.prisma.generatedReport.groupBy({
          by: ['createdAt'],
          where: {
            userId,
            tenantId,
            createdAt: { gte: startDate }
          },
          _count: {
            id: true
          }
        }),

        // Files processed by day
        this.prisma.fileProcessingJob.groupBy({
          by: ['createdAt'],
          where: {
            userId,
            tenantId,
            createdAt: { gte: startDate }
          },
          _count: {
            id: true
          }
        }),

        // Top templates used
        this.prisma.generatedReport.groupBy({
          by: ['templateId'],
          where: {
            userId,
            tenantId,
            createdAt: { gte: startDate }
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 5
        }),

        // Top formats used
        this.prisma.generatedReport.groupBy({
          by: ['formats'],
          where: {
            userId,
            tenantId,
            createdAt: { gte: startDate }
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 5
        })
      ]);

      // Process reports by day
      const reportsByDayMap = new Map();
      reportsByDay.forEach(item => {
        const date = item.createdAt.toISOString().split('T')[0];
        reportsByDayMap.set(date, item._count.id);
      });

      // Process files by day
      const filesByDayMap = new Map();
      filesByDay.forEach(item => {
        const date = item.createdAt.toISOString().split('T')[0];
        filesByDayMap.set(date, item._count.id);
      });

      // Generate date range
      const dateRange = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dateRange.push(date.toISOString().split('T')[0]);
      }

      return {
        period,
        dateRange,
        reportsByDay: dateRange.map(date => ({
          date,
          count: reportsByDayMap.get(date) || 0
        })),
        filesByDay: dateRange.map(date => ({
          date,
          count: filesByDayMap.get(date) || 0
        })),
        topTemplates: await this.getTemplateNames(topTemplates),
        topFormats: topFormats.map(item => ({
          format: item.formats[0], // Assuming single format per report
          count: item._count.id
        }))
      };
    } catch (error) {
      console.error('Get usage analytics error:', error);
      throw error;
    }
  }

  /**
   * Parse period string to days
   */
  parsePeriod(period) {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) {
      return 30; // Default to 30 days
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 30;
    }
  }

  /**
   * Get template names for analytics
   */
  async getTemplateNames(templateCounts) {
    try {
      const templateIds = templateCounts.map(item => item.templateId);
      const templates = await this.prisma.reportTemplate.findMany({
        where: {
          id: { in: templateIds }
        },
        select: {
          id: true,
          name: true
        }
      });

      const templateMap = new Map(templates.map(t => [t.id, t.name]));

      return templateCounts.map(item => ({
        templateName: templateMap.get(item.templateId) || 'Unknown',
        count: item._count.id
      }));
    } catch (error) {
      console.error('Get template names error:', error);
      return templateCounts.map(item => ({
        templateName: 'Unknown',
        count: item._count.id
      }));
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(tenantId) {
    try {
      const [
        activeIntegrations,
        failedJobs,
        pendingReports,
        systemErrors
      ] = await Promise.all([
        // Active POS integrations
        this.prisma.pOSIntegration.count({
          where: {
            tenantId,
            status: 'ACTIVE'
          }
        }),

        // Failed file processing jobs (last 24 hours)
        this.prisma.fileProcessingJob.count({
          where: {
            tenantId,
            status: 'FAILED',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),

        // Pending reports
        this.prisma.generatedReport.count({
          where: {
            tenantId,
            status: 'PENDING'
          }
        }),

        // System errors (last 24 hours)
        this.prisma.auditLog.count({
          where: {
            tenantId,
            action: 'ERROR',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        status: 'healthy',
        metrics: {
          activeIntegrations,
          failedJobs,
          pendingReports,
          systemErrors
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Get system health error:', error);
      throw error;
    }
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData(tenantId, daysToKeep = 90) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const [
        deletedReports,
        deletedFiles,
        deletedAuditLogs
      ] = await Promise.all([
        // Delete old completed reports
        this.prisma.generatedReport.deleteMany({
          where: {
            tenantId,
            status: 'COMPLETED',
            createdAt: { lt: cutoffDate }
          }
        }),

        // Delete old completed file jobs
        this.prisma.fileProcessingJob.deleteMany({
          where: {
            tenantId,
            status: 'COMPLETED',
            createdAt: { lt: cutoffDate }
          }
        }),

        // Delete old audit logs
        this.prisma.auditLog.deleteMany({
          where: {
            tenantId,
            createdAt: { lt: cutoffDate }
          }
        })
      ]);

      console.log(`🧹 Cleanup completed for tenant ${tenantId}:`, {
        reports: deletedReports.count,
        files: deletedFiles.count,
        auditLogs: deletedAuditLogs.count
      });

      return {
        success: true,
        deleted: {
          reports: deletedReports.count,
          files: deletedFiles.count,
          auditLogs: deletedAuditLogs.count
        }
      };
    } catch (error) {
      console.error('Cleanup old data error:', error);
      throw error;
    }
  }
}

module.exports = ReportingController; 