const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { eventBus } = require('../microservices/event-bus');

const prisma = new PrismaClient();

/**
 * AI Report Generation Engine
 * 
 * Features:
 * - Medical spa-specific report templates
 * - Multi-format output (PDF, Excel, JSON, Dashboard)
 * - AI insights integration
 * - Dynamic content generation
 * - Real-time data aggregation
 * - Customizable branding
 * - Scheduled report generation
 */

class AIReportEngine {
  constructor() {
    this.templates = this.initializeTemplates();
    this.aiInsights = this.initializeAIInsights();
    this.outputFormats = ['pdf', 'excel', 'json', 'dashboard'];
  }

  /**
   * Initialize medical spa report templates
   */
  initializeTemplates() {
    return {
      performance_summary: {
        name: 'Performance Summary Report',
        description: 'Comprehensive overview of practice performance metrics',
        sections: [
          'executive_summary',
          'financial_performance',
          'appointment_metrics',
          'client_analytics',
          'staff_performance',
          'ai_insights',
          'recommendations'
        ],
        charts: [
          'revenue_trend',
          'appointment_distribution',
          'client_retention',
          'service_popularity'
        ]
      },
      reconciliation_report: {
        name: 'AI Reconciliation Report',
        description: 'Detailed analysis of AI-powered reconciliation results',
        sections: [
          'reconciliation_summary',
          'accuracy_metrics',
          'discrepancy_analysis',
          'cost_savings',
          'efficiency_gains',
          'ai_insights',
          'action_items'
        ],
        charts: [
          'accuracy_trend',
          'discrepancy_types',
          'processing_time',
          'cost_benefit'
        ]
      },
      client_analytics: {
        name: 'Client Analytics Report',
        description: 'Deep dive into client behavior and preferences',
        sections: [
          'client_overview',
          'demographics',
          'service_preferences',
          'appointment_patterns',
          'satisfaction_metrics',
          'retention_analysis',
          'ai_insights',
          'recommendations'
        ],
        charts: [
          'client_segments',
          'service_preferences',
          'appointment_trends',
          'satisfaction_scores'
        ]
      },
      financial_analysis: {
        name: 'Financial Analysis Report',
        description: 'Comprehensive financial performance analysis',
        sections: [
          'financial_summary',
          'revenue_analysis',
          'expense_breakdown',
          'profitability_metrics',
          'cash_flow_analysis',
          'budget_variance',
          'ai_insights',
          'forecasting'
        ],
        charts: [
          'revenue_trends',
          'expense_categories',
          'profit_margins',
          'cash_flow'
        ]
      },
      operational_efficiency: {
        name: 'Operational Efficiency Report',
        description: 'Analysis of operational processes and efficiency',
        sections: [
          'efficiency_overview',
          'staff_utilization',
          'appointment_efficiency',
          'resource_allocation',
          'bottleneck_analysis',
          'ai_insights',
          'optimization_opportunities'
        ],
        charts: [
          'staff_utilization',
          'appointment_efficiency',
          'resource_allocation',
          'bottleneck_analysis'
        ]
      }
    };
  }

  /**
   * Initialize AI insights categories
   */
  initializeAIInsights() {
    return {
      revenue_optimization: {
        name: 'Revenue Optimization',
        description: 'AI-driven insights for revenue growth',
        metrics: ['revenue_trend', 'service_mix', 'pricing_analysis', 'upsell_opportunities']
      },
      client_retention: {
        name: 'Client Retention',
        description: 'Predictive analytics for client retention',
        metrics: ['churn_risk', 'lifetime_value', 'engagement_score', 'satisfaction_trends']
      },
      operational_efficiency: {
        name: 'Operational Efficiency',
        description: 'Process optimization insights',
        metrics: ['staff_utilization', 'appointment_efficiency', 'resource_allocation', 'bottleneck_analysis']
      },
      market_trends: {
        name: 'Market Trends',
        description: 'Industry and market analysis',
        metrics: ['market_position', 'competitive_analysis', 'trend_forecasting', 'opportunity_identification']
      }
    };
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(templateName, practiceId, options = {}) {
    const reportId = crypto.randomUUID();
    
    try {
      // Create report record
      const report = await prisma.generatedReport.create({
        data: {
          id: reportId,
          practiceId,
          templateName,
          status: 'GENERATING',
          format: options.format || 'pdf',
          metadata: {
            options,
            generatedAt: new Date().toISOString()
          }
        }
      });

      logger.info(`Report generation started`, { reportId, templateName });

      // Get template configuration
      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`Unknown template: ${templateName}`);
      }

      // Gather data for report
      const reportData = await this.gatherReportData(templateName, practiceId, options);
      
      // Generate AI insights
      const aiInsights = await this.generateAIInsights(templateName, practiceId, reportData);
      
      // Combine data and insights
      const fullReportData = {
        ...reportData,
        aiInsights,
        template,
        metadata: {
          generatedAt: new Date().toISOString(),
          practiceId,
          templateName,
          options
        }
      };

      // Generate report in requested format
      const reportContent = await this.generateReportContent(fullReportData, options.format || 'pdf');
      
      // Update report record
      await prisma.generatedReport.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          content: reportContent,
          metadata: {
            ...report.metadata,
            dataSummary: {
              sections: template.sections.length,
              charts: template.charts.length,
              aiInsights: aiInsights.length,
              recordCount: this.getRecordCount(reportData)
            }
          }
        }
      });

      // Publish event
      await eventBus.publishEvent('report.generated', {
        reportId,
        practiceId,
        templateName,
        format: options.format || 'pdf'
      });

      logger.info(`Report generation completed`, { reportId, templateName });

      return {
        reportId,
        status: 'completed',
        content: reportContent,
        metadata: fullReportData.metadata
      };

    } catch (error) {
      logger.error(`Report generation failed`, { reportId, templateName, error: error.message });
      
      // Update report with error
      if (reportId) {
        await prisma.generatedReport.update({
          where: { id: reportId },
          data: {
            status: 'FAILED',
            error: error.message
          }
        });
      }

      throw error;
    }
  }

  /**
   * Gather data for report generation
   */
  async gatherReportData(templateName, practiceId, options) {
    const data = {};

    switch (templateName) {
      case 'performance_summary':
        data.financial = await this.getFinancialData(practiceId, options);
        data.appointments = await this.getAppointmentData(practiceId, options);
        data.clients = await this.getClientData(practiceId, options);
        data.staff = await this.getStaffData(practiceId, options);
        break;

      case 'reconciliation_report':
        data.reconciliation = await this.getReconciliationData(practiceId, options);
        data.accuracy = await this.getAccuracyMetrics(practiceId, options);
        data.discrepancies = await this.getDiscrepancyData(practiceId, options);
        break;

      case 'client_analytics':
        data.clients = await this.getClientAnalyticsData(practiceId, options);
        data.demographics = await this.getDemographicsData(practiceId, options);
        data.preferences = await this.getClientPreferencesData(practiceId, options);
        break;

      case 'financial_analysis':
        data.financial = await this.getDetailedFinancialData(practiceId, options);
        data.expenses = await this.getExpenseData(practiceId, options);
        data.cashFlow = await this.getCashFlowData(practiceId, options);
        break;

      case 'operational_efficiency':
        data.efficiency = await this.getEfficiencyData(practiceId, options);
        data.staff = await this.getStaffEfficiencyData(practiceId, options);
        data.resources = await this.getResourceData(practiceId, options);
        break;

      default:
        throw new Error(`Unknown template: ${templateName}`);
    }

    return data;
  }

  /**
   * Generate AI insights for the report
   */
  async generateAIInsights(templateName, practiceId, reportData) {
    const insights = [];

    try {
      // Get existing AI insights from database
      const existingInsights = await prisma.aiInsight.findMany({
        where: {
          practiceId,
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Add existing insights
      insights.push(...existingInsights);

      // Generate new insights based on report data
      const newInsights = await this.analyzeDataForInsights(templateName, reportData);
      insights.push(...newInsights);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(templateName, reportData, insights);
      insights.push(...recommendations);

      return insights;
    } catch (error) {
      logger.error('Failed to generate AI insights', { error: error.message });
      return [];
    }
  }

  /**
   * Analyze data to generate new insights
   */
  async analyzeDataForInsights(templateName, reportData) {
    const insights = [];

    try {
      switch (templateName) {
        case 'performance_summary':
          insights.push(...await this.analyzePerformanceData(reportData));
          break;
        case 'reconciliation_report':
          insights.push(...await this.analyzeReconciliationData(reportData));
          break;
        case 'client_analytics':
          insights.push(...await this.analyzeClientData(reportData));
          break;
        case 'financial_analysis':
          insights.push(...await this.analyzeFinancialData(reportData));
          break;
        case 'operational_efficiency':
          insights.push(...await this.analyzeEfficiencyData(reportData));
          break;
      }
    } catch (error) {
      logger.error('Data analysis failed', { error: error.message });
    }

    return insights;
  }

  /**
   * Generate recommendations based on insights
   */
  async generateRecommendations(templateName, reportData, insights) {
    const recommendations = [];

    try {
      // Analyze insights to generate actionable recommendations
      const analysis = await this.analyzeInsightsForRecommendations(insights, reportData);
      
      analysis.forEach(item => {
        recommendations.push({
          id: crypto.randomUUID(),
          type: 'recommendation',
          title: item.title,
          description: item.description,
          priority: item.priority,
          impact: item.impact,
          actionItems: item.actionItems,
          estimatedValue: item.estimatedValue,
          createdAt: new Date()
        });
      });
    } catch (error) {
      logger.error('Recommendation generation failed', { error: error.message });
    }

    return recommendations;
  }

  /**
   * Generate report content in specified format
   */
  async generateReportContent(reportData, format) {
    switch (format.toLowerCase()) {
      case 'pdf':
        return await this.generatePDFReport(reportData);
      case 'excel':
        return await this.generateExcelReport(reportData);
      case 'json':
        return await this.generateJSONReport(reportData);
      case 'dashboard':
        return await this.generateDashboardReport(reportData);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(reportData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add report header
        this.addPDFHeader(doc, reportData);

        // Add sections
        reportData.template.sections.forEach(section => {
          this.addPDFSection(doc, section, reportData);
        });

        // Add charts and visualizations
        reportData.template.charts.forEach(chart => {
          this.addPDFChart(doc, chart, reportData);
        });

        // Add AI insights
        this.addPDFAIInsights(doc, reportData.aiInsights);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(reportData) {
    const workbook = new ExcelJS.Workbook();
    
    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    this.addExcelSummary(summarySheet, reportData);

    // Add data sheets
    Object.entries(reportData).forEach(([key, data]) => {
      if (key !== 'template' && key !== 'aiInsights' && key !== 'metadata') {
        const sheet = workbook.addWorksheet(key.charAt(0).toUpperCase() + key.slice(1));
        this.addExcelData(sheet, data, key);
      }
    });

    // Add AI insights sheet
    const insightsSheet = workbook.addWorksheet('AI Insights');
    this.addExcelInsights(insightsSheet, reportData.aiInsights);

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(reportData) {
    return JSON.stringify({
      report: {
        template: reportData.template.name,
        generatedAt: reportData.metadata.generatedAt,
        sections: reportData.template.sections,
        data: reportData,
        aiInsights: reportData.aiInsights
      }
    }, null, 2);
  }

  /**
   * Generate dashboard report
   */
  async generateDashboardReport(reportData) {
    return {
      type: 'dashboard',
      template: reportData.template.name,
      generatedAt: reportData.metadata.generatedAt,
      widgets: this.generateDashboardWidgets(reportData),
      data: reportData,
      aiInsights: reportData.aiInsights
    };
  }

  /**
   * Data gathering methods
   */
  async getFinancialData(practiceId, options) {
    const { startDate, endDate } = this.getDateRange(options);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        practiceId,
        dateTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        service: true,
        client: true
      }
    });

    const revenue = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
    const appointmentCount = appointments.length;
    const averageRevenue = appointmentCount > 0 ? revenue / appointmentCount : 0;

    return {
      totalRevenue: revenue,
      appointmentCount,
      averageRevenue,
      revenueByService: this.groupByService(appointments),
      revenueByMonth: this.groupByMonth(appointments),
      topServices: this.getTopServices(appointments)
    };
  }

  async getAppointmentData(practiceId, options) {
    const { startDate, endDate } = this.getDateRange(options);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        practiceId,
        dateTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        service: true,
        staff: true,
        client: true
      }
    });

    return {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(apt => apt.status === 'COMPLETED').length,
      cancelledAppointments: appointments.filter(apt => apt.status === 'CANCELLED').length,
      averageDuration: this.calculateAverageDuration(appointments),
      appointmentsByStatus: this.groupByStatus(appointments),
      appointmentsByStaff: this.groupByStaff(appointments),
      appointmentsByService: this.groupByService(appointments)
    };
  }

  async getClientData(practiceId, options) {
    const { startDate, endDate } = this.getDateRange(options);
    
    const clients = await prisma.client.findMany({
      where: {
        appointments: {
          some: {
            practiceId,
            dateTime: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      include: {
        appointments: {
          where: {
            dateTime: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    return {
      totalClients: clients.length,
      newClients: this.getNewClients(clients, startDate),
      returningClients: this.getReturningClients(clients),
      averageAppointmentsPerClient: this.calculateAverageAppointmentsPerClient(clients),
      clientRetentionRate: this.calculateClientRetentionRate(clients),
      topClients: this.getTopClients(clients)
    };
  }

  async getStaffData(practiceId, options) {
    const { startDate, endDate } = this.getDateRange(options);
    
    const staff = await prisma.staff.findMany({
      where: { practiceId },
      include: {
        appointments: {
          where: {
            dateTime: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    return {
      totalStaff: staff.length,
      staffUtilization: this.calculateStaffUtilization(staff),
      appointmentsByStaff: this.groupByStaff(staff.flatMap(s => s.appointments)),
      topPerformers: this.getTopPerformers(staff),
      averageAppointmentsPerStaff: this.calculateAverageAppointmentsPerStaff(staff)
    };
  }

  async getReconciliationData(practiceId, options) {
    const { startDate, endDate } = this.getDateRange(options);
    
    const reconciliationJobs = await prisma.fileProcessingJob.findMany({
      where: {
        practiceId,
        detectedSchema: 'reconciliation',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return {
      totalJobs: reconciliationJobs.length,
      successfulJobs: reconciliationJobs.filter(job => job.status === 'COMPLETED').length,
      failedJobs: reconciliationJobs.filter(job => job.status === 'FAILED').length,
      totalRecordsProcessed: reconciliationJobs.reduce((sum, job) => sum + (job.recordsProcessed || 0), 0),
      totalRecordsFailed: reconciliationJobs.reduce((sum, job) => sum + (job.recordsFailed || 0), 0),
      averageProcessingTime: this.calculateAverageProcessingTime(reconciliationJobs)
    };
  }

  /**
   * Helper methods
   */
  getDateRange(options) {
    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    const startDate = options.startDate ? new Date(options.startDate) : 
                     new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    
    return { startDate, endDate };
  }

  groupByService(appointments) {
    const grouped = {};
    appointments.forEach(apt => {
      const serviceName = apt.service?.name || 'Unknown';
      if (!grouped[serviceName]) {
        grouped[serviceName] = { count: 0, revenue: 0 };
      }
      grouped[serviceName].count++;
      grouped[serviceName].revenue += apt.price || 0;
    });
    return grouped;
  }

  groupByMonth(appointments) {
    const grouped = {};
    appointments.forEach(apt => {
      const month = apt.dateTime.toISOString().substring(0, 7); // YYYY-MM
      if (!grouped[month]) {
        grouped[month] = { count: 0, revenue: 0 };
      }
      grouped[month].count++;
      grouped[month].revenue += apt.price || 0;
    });
    return grouped;
  }

  groupByStatus(appointments) {
    const grouped = {};
    appointments.forEach(apt => {
      const status = apt.status;
      if (!grouped[status]) {
        grouped[status] = 0;
      }
      grouped[status]++;
    });
    return grouped;
  }

  groupByStaff(appointments) {
    const grouped = {};
    appointments.forEach(apt => {
      const staffName = apt.staff ? `${apt.staff.firstName} ${apt.staff.lastName}` : 'Unknown';
      if (!grouped[staffName]) {
        grouped[staffName] = { count: 0, revenue: 0 };
      }
      grouped[staffName].count++;
      grouped[staffName].revenue += apt.price || 0;
    });
    return grouped;
  }

  getTopServices(appointments) {
    const serviceStats = this.groupByService(appointments);
    return Object.entries(serviceStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  getTopClients(clients) {
    return clients
      .map(client => ({
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        appointmentCount: client.appointments.length,
        totalSpent: client.appointments.reduce((sum, apt) => sum + (apt.price || 0), 0)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }

  getTopPerformers(staff) {
    return staff
      .map(s => ({
        name: `${s.firstName} ${s.lastName}`,
        appointmentCount: s.appointments.length,
        utilization: this.calculateStaffUtilization([s])
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 10);
  }

  calculateAverageDuration(appointments) {
    const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED');
    if (completedAppointments.length === 0) return 0;
    
    const totalDuration = completedAppointments.reduce((sum, apt) => sum + (apt.duration || 0), 0);
    return totalDuration / completedAppointments.length;
  }

  calculateStaffUtilization(staff) {
    // Simplified calculation - in production, consider working hours, availability, etc.
    const totalAppointments = staff.reduce((sum, s) => sum + s.appointments.length, 0);
    const totalStaff = staff.length;
    return totalStaff > 0 ? totalAppointments / totalStaff : 0;
  }

  calculateAverageAppointmentsPerClient(clients) {
    if (clients.length === 0) return 0;
    const totalAppointments = clients.reduce((sum, client) => sum + client.appointments.length, 0);
    return totalAppointments / clients.length;
  }

  calculateAverageAppointmentsPerStaff(staff) {
    if (staff.length === 0) return 0;
    const totalAppointments = staff.reduce((sum, s) => sum + s.appointments.length, 0);
    return totalAppointments / staff.length;
  }

  calculateClientRetentionRate(clients) {
    if (clients.length === 0) return 0;
    const returningClients = this.getReturningClients(clients);
    return (returningClients.length / clients.length) * 100;
  }

  getNewClients(clients, startDate) {
    return clients.filter(client => 
      client.appointments.some(apt => apt.dateTime >= startDate)
    );
  }

  getReturningClients(clients) {
    return clients.filter(client => client.appointments.length > 1);
  }

  calculateAverageProcessingTime(jobs) {
    const completedJobs = jobs.filter(job => job.status === 'COMPLETED');
    if (completedJobs.length === 0) return 0;
    
    // This would need to be calculated based on actual processing time data
    return 0; // Placeholder
  }

  getRecordCount(reportData) {
    let count = 0;
    Object.values(reportData).forEach(data => {
      if (Array.isArray(data)) {
        count += data.length;
      } else if (typeof data === 'object' && data !== null) {
        count += this.getRecordCount(data);
      }
    });
    return count;
  }

  /**
   * PDF generation helper methods
   */
  addPDFHeader(doc, reportData) {
    doc.fontSize(24)
       .text(reportData.template.name, { align: 'center' })
       .moveDown();
    
    doc.fontSize(12)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
       .moveDown(2);
  }

  addPDFSection(doc, section, reportData) {
    doc.fontSize(16)
       .text(section.replace(/_/g, ' ').toUpperCase())
       .moveDown();
    
    // Add section content based on data
    this.addPDFSectionContent(doc, section, reportData);
    
    doc.moveDown(2);
  }

  addPDFSectionContent(doc, section, reportData) {
    // Implementation would vary based on section type
    doc.fontSize(12)
       .text(`Content for ${section} section`);
  }

  addPDFChart(doc, chart, reportData) {
    // Implementation would generate chart images
    doc.fontSize(14)
       .text(`Chart: ${chart}`)
       .moveDown();
  }

  addPDFAIInsights(doc, insights) {
    doc.fontSize(16)
       .text('AI INSIGHTS')
       .moveDown();
    
    insights.forEach(insight => {
      doc.fontSize(12)
         .text(insight.title)
         .fontSize(10)
         .text(insight.description)
         .moveDown();
    });
  }

  /**
   * Excel generation helper methods
   */
  addExcelSummary(sheet, reportData) {
    sheet.addRow(['Report Summary']);
    sheet.addRow(['Template', reportData.template.name]);
    sheet.addRow(['Generated', reportData.metadata.generatedAt]);
    sheet.addRow([]);
  }

  addExcelData(sheet, data, dataType) {
    // Implementation would add data to Excel sheet
    sheet.addRow([`${dataType} Data`]);
  }

  addExcelInsights(sheet, insights) {
    sheet.addRow(['AI Insights']);
    insights.forEach(insight => {
      sheet.addRow([insight.title, insight.description]);
    });
  }

  /**
   * Dashboard generation helper methods
   */
  generateDashboardWidgets(reportData) {
    return reportData.template.charts.map(chart => ({
      type: 'chart',
      title: chart.replace(/_/g, ' ').toUpperCase(),
      data: this.getChartData(chart, reportData)
    }));
  }

  getChartData(chart, reportData) {
    // Implementation would return chart-specific data
    return { type: chart, data: [] };
  }

  /**
   * Analysis methods (placeholders)
   */
  async analyzePerformanceData(reportData) {
    return [];
  }

  async analyzeReconciliationData(reportData) {
    return [];
  }

  async analyzeClientData(reportData) {
    return [];
  }

  async analyzeFinancialData(reportData) {
    return [];
  }

  async analyzeEfficiencyData(reportData) {
    return [];
  }

  async analyzeInsightsForRecommendations(insights, reportData) {
    return [];
  }

  /**
   * Get report by ID
   */
  async getReport(reportId) {
    return await prisma.generatedReport.findUnique({
      where: { id: reportId }
    });
  }

  /**
   * Get all reports for a practice
   */
  async getPracticeReports(practiceId, limit = 50) {
    return await prisma.generatedReport.findMany({
      where: { practiceId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

module.exports = AIReportEngine; 