/**
 * Report Generation Engine
 * Manages report templates, AI insights generation, and multi-format report creation
 * for the MedSpaSync Pro reporting system
 */

const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');
const { performanceLogger } = require('../utils/logger');

class ReportGenerationEngine {
  constructor() {
    this.prisma = new PrismaClient();
    this.templatesDir = process.env.TEMPLATES_DIR || './templates';
    this.reportsDir = process.env.REPORTS_DIR || './reports';
    this.ensureDirectories();
    
    // Initialize system templates
    this.initializeSystemTemplates();
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [this.templatesDir, this.reportsDir];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Initialize system report templates
   */
  async initializeSystemTemplates() {
    const systemTemplates = [
      {
        name: 'Monthly Financial Summary',
        description: 'Comprehensive monthly financial overview with revenue, expenses, and profitability analysis',
        templateData: {
          type: 'financial_summary',
          sections: ['revenue_analysis', 'expense_breakdown', 'profitability_metrics', 'trends'],
          charts: ['revenue_trend', 'expense_pie', 'profit_margin'],
          filters: ['date_range', 'service_category', 'provider'],
          aiInsights: true
        }
      },
      {
        name: 'Provider Performance Analysis',
        description: 'Detailed analysis of individual provider performance and productivity',
        templateData: {
          type: 'provider_performance',
          sections: ['appointments', 'revenue', 'client_satisfaction', 'efficiency'],
          charts: ['appointment_volume', 'revenue_per_provider', 'satisfaction_scores'],
          filters: ['provider', 'date_range', 'service_type'],
          aiInsights: true
        }
      },
      {
        name: 'Patient Journey & Retention',
        description: 'Analysis of patient acquisition, retention, and lifetime value',
        templateData: {
          type: 'patient_journey',
          sections: ['acquisition', 'retention', 'lifetime_value', 'satisfaction'],
          charts: ['acquisition_funnel', 'retention_rate', 'lifetime_value'],
          filters: ['acquisition_source', 'service_category', 'time_period'],
          aiInsights: true
        }
      },
      {
        name: 'Inventory & Product Analysis',
        description: 'Product performance, inventory turnover, and profitability analysis',
        templateData: {
          type: 'inventory_analysis',
          sections: ['product_performance', 'inventory_turnover', 'profitability', 'reorder_analysis'],
          charts: ['product_sales', 'inventory_levels', 'profit_margins'],
          filters: ['product_category', 'date_range', 'location'],
          aiInsights: true
        }
      }
    ];

    for (const template of systemTemplates) {
      await this.createOrUpdateSystemTemplate(template);
    }
  }

  /**
   * Create or update system template
   */
  async createOrUpdateSystemTemplate(templateData) {
    const existing = await this.prisma.reportTemplate.findFirst({
      where: {
        name: templateData.name,
        isSystem: true
      }
    });

    if (existing) {
      await this.prisma.reportTemplate.update({
        where: { id: existing.id },
        data: {
          description: templateData.description,
          templateData: templateData.templateData
        }
      });
    } else {
      await this.prisma.reportTemplate.create({
        data: {
          name: templateData.name,
          description: templateData.description,
          templateData: templateData.templateData,
          isSystem: true,
          isActive: true
        }
      });
    }
  }

  /**
   * Generate report
   */
  async generateReport(templateId, userId, tenantId, parameters = {}) {
    const startTime = Date.now();
    
    try {
      // Get template
      const template = await this.getTemplate(templateId, tenantId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create report record
      const report = await this.createReportRecord(templateId, userId, tenantId, parameters);

      // Generate report data
      const reportData = await this.generateReportData(template, parameters);

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(reportData, template);

      // Generate files in requested formats
      const filePaths = await this.generateReportFiles(report, reportData, aiInsights, parameters.formats || ['PDF']);

      // Update report record
      await this.updateReportRecord(report.id, 'COMPLETED', {
        reportData,
        aiInsights,
        filePaths
      });

      performanceLogger.info('Report generation completed', {
        reportId: report.id,
        templateId,
        userId,
        tenantId,
        processingTime: Date.now() - startTime
      });

      return {
        success: true,
        reportId: report.id,
        status: 'COMPLETED',
        filePaths
      };

    } catch (error) {
      performanceLogger.error('Report generation failed', {
        templateId,
        userId,
        tenantId,
        error: error.message,
        processingTime: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId, tenantId) {
    return await this.prisma.reportTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { tenantId: null }, // System templates
          { tenantId: tenantId } // Tenant-specific templates
        ],
        isActive: true
      }
    });
  }

  /**
   * Create report record
   */
  async createReportRecord(templateId, userId, tenantId, parameters) {
    return await this.prisma.generatedReport.create({
      data: {
        tenantId,
        userId,
        templateId,
        status: 'PENDING',
        metadata: {
          parameters,
          createdAt: new Date()
        }
      }
    });
  }

  /**
   * Generate report data based on template
   */
  async generateReportData(template, parameters) {
    const templateType = template.templateData.type;
    
    switch (templateType) {
      case 'financial_summary':
        return await this.generateFinancialSummaryData(parameters);
      case 'provider_performance':
        return await this.generateProviderPerformanceData(parameters);
      case 'patient_journey':
        return await this.generatePatientJourneyData(parameters);
      case 'inventory_analysis':
        return await this.generateInventoryAnalysisData(parameters);
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }

  /**
   * Generate financial summary data
   */
  async generateFinancialSummaryData(parameters) {
    const { startDate, endDate, serviceCategory, provider } = parameters;
    
    // Get appointments data
    const appointments = await this.prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined
        },
        service: serviceCategory ? {
          category: serviceCategory
        } : undefined,
        staff: provider ? {
          id: provider
        } : undefined
      },
      include: {
        service: true,
        staff: true,
        client: true
      }
    });

    // Calculate metrics
    const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price, 0);
    const totalAppointments = appointments.length;
    const averageRevenue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    // Group by service category
    const revenueByCategory = appointments.reduce((acc, apt) => {
      const category = apt.service.category;
      acc[category] = (acc[category] || 0) + apt.price;
      return acc;
    }, {});

    // Group by provider
    const revenueByProvider = appointments.reduce((acc, apt) => {
      const providerName = `${apt.staff.firstName} ${apt.staff.lastName}`;
      acc[providerName] = (acc[providerName] || 0) + apt.price;
      return acc;
    }, {});

    return {
      summary: {
        totalRevenue,
        totalAppointments,
        averageRevenue,
        dateRange: { startDate, endDate }
      },
      revenueByCategory,
      revenueByProvider,
      appointments: appointments.map(apt => ({
        id: apt.id,
        date: apt.dateTime,
        client: `${apt.client.firstName} ${apt.client.lastName}`,
        service: apt.service.name,
        provider: `${apt.staff.firstName} ${apt.staff.lastName}`,
        amount: apt.price,
        status: apt.status
      }))
    };
  }

  /**
   * Generate provider performance data
   */
  async generateProviderPerformanceData(parameters) {
    const { startDate, endDate, provider } = parameters;
    
    const appointments = await this.prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined
        },
        staff: provider ? {
          id: provider
        } : undefined
      },
      include: {
        service: true,
        staff: true,
        client: true
      }
    });

    // Group by provider
    const providerStats = appointments.reduce((acc, apt) => {
      const providerId = apt.staffId;
      if (!acc[providerId]) {
        acc[providerId] = {
          provider: apt.staff,
          appointments: [],
          totalRevenue: 0,
          appointmentCount: 0
        };
      }
      
      acc[providerId].appointments.push(apt);
      acc[providerId].totalRevenue += apt.price;
      acc[providerId].appointmentCount += 1;
      
      return acc;
    }, {});

    return {
      providers: Object.values(providerStats).map(stats => ({
        ...stats,
        averageRevenue: stats.appointmentCount > 0 ? stats.totalRevenue / stats.appointmentCount : 0
      })),
      summary: {
        totalProviders: Object.keys(providerStats).length,
        totalAppointments: appointments.length,
        totalRevenue: appointments.reduce((sum, apt) => sum + apt.price, 0)
      }
    };
  }

  /**
   * Generate patient journey data
   */
  async generatePatientJourneyData(parameters) {
    const { startDate, endDate, acquisitionSource } = parameters;
    
    const clients = await this.prisma.client.findMany({
      where: {
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined
        }
      },
      include: {
        appointments: {
          include: {
            service: true
          }
        }
      }
    });

    // Calculate retention metrics
    const retentionData = clients.map(client => {
      const appointmentCount = client.appointments.length;
      const totalSpent = client.appointments.reduce((sum, apt) => sum + apt.price, 0);
      const firstAppointment = client.appointments.length > 0 ? 
        new Date(Math.min(...client.appointments.map(apt => apt.dateTime))) : null;
      const lastAppointment = client.appointments.length > 0 ? 
        new Date(Math.max(...client.appointments.map(apt => apt.dateTime))) : null;

      return {
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        email: client.email,
        appointmentCount,
        totalSpent,
        averageSpent: appointmentCount > 0 ? totalSpent / appointmentCount : 0,
        firstAppointment,
        lastAppointment,
        isRetained: appointmentCount > 1
      };
    });

    const retainedClients = retentionData.filter(c => c.isRetained);
    const retentionRate = clients.length > 0 ? (retainedClients.length / clients.length) * 100 : 0;

    return {
      acquisition: {
        totalClients: clients.length,
        newClients: clients.filter(c => c.appointments.length === 1).length
      },
      retention: {
        retentionRate,
        retainedClients: retainedClients.length,
        churnedClients: clients.length - retainedClients.length
      },
      lifetimeValue: {
        averageLTV: retentionData.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length,
        topClients: retentionData
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10)
      },
      clientData: retentionData
    };
  }

  /**
   * Generate inventory analysis data
   */
  async generateInventoryAnalysisData(parameters) {
    // This would integrate with inventory management system
    // For now, return mock data structure
    return {
      products: [],
      categories: [],
      turnover: {},
      profitability: {},
      reorderRecommendations: []
    };
  }

  /**
   * Generate AI insights
   */
  async generateAIInsights(reportData, template) {
    if (!template.templateData.aiInsights) {
      return null;
    }

    const insights = {
      summary: [],
      recommendations: [],
      trends: [],
      anomalies: []
    };

    // Generate insights based on template type
    switch (template.templateData.type) {
      case 'financial_summary':
        insights.summary.push(`Total revenue: $${reportData.summary.totalRevenue.toLocaleString()}`);
        insights.summary.push(`Average appointment value: $${reportData.summary.averageRevenue.toFixed(2)}`);
        
        if (reportData.summary.averageRevenue > 200) {
          insights.recommendations.push('High average appointment value suggests premium pricing strategy is working');
        }
        
        const topCategory = Object.entries(reportData.revenueByCategory)
          .sort(([,a], [,b]) => b - a)[0];
        if (topCategory) {
          insights.recommendations.push(`Focus marketing efforts on ${topCategory[0]} services`);
        }
        break;

      case 'provider_performance':
        const topProvider = reportData.providers
          .sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
        if (topProvider) {
          insights.summary.push(`Top performer: ${topProvider.provider.firstName} ${topProvider.provider.lastName} with $${topProvider.totalRevenue.toLocaleString()}`);
        }
        break;

      case 'patient_journey':
        insights.summary.push(`Retention rate: ${reportData.retention.retentionRate.toFixed(1)}%`);
        
        if (reportData.retention.retentionRate < 60) {
          insights.recommendations.push('Consider implementing a client retention program');
        }
        
        insights.recommendations.push(`Focus on converting ${reportData.acquisition.newClients} new clients to repeat customers`);
        break;
    }

    return insights;
  }

  /**
   * Generate report files in multiple formats
   */
  async generateReportFiles(report, reportData, aiInsights, formats) {
    const filePaths = {};
    const reportDir = path.join(this.reportsDir, report.tenantId, report.id);
    
    // Ensure report directory exists
    await fs.mkdir(reportDir, { recursive: true });

    for (const format of formats) {
      switch (format.toUpperCase()) {
        case 'PDF':
          filePaths.PDF = await this.generatePDF(report, reportData, aiInsights, reportDir);
          break;
        case 'EXCEL':
          filePaths.EXCEL = await this.generateExcel(report, reportData, aiInsights, reportDir);
          break;
        case 'JSON':
          filePaths.JSON = await this.generateJSON(report, reportData, aiInsights, reportDir);
          break;
        case 'INTERACTIVE_DASHBOARD':
          filePaths.INTERACTIVE_DASHBOARD = await this.generateInteractiveDashboard(report, reportData, aiInsights, reportDir);
          break;
      }
    }

    return filePaths;
  }

  /**
   * Generate PDF report
   */
  async generatePDF(report, reportData, aiInsights, reportDir) {
    const doc = new PDFDocument();
    const filePath = path.join(reportDir, 'report.pdf');
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);

    // Add header
    doc.fontSize(24).text('MedSpaSync Pro Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Add summary
    if (reportData.summary) {
      doc.fontSize(16).text('Summary');
      doc.fontSize(12);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        if (typeof value === 'number') {
          doc.text(`${key}: $${value.toLocaleString()}`);
        } else {
          doc.text(`${key}: ${value}`);
        }
      });
      doc.moveDown();
    }

    // Add AI insights
    if (aiInsights && aiInsights.recommendations.length > 0) {
      doc.fontSize(16).text('AI Insights & Recommendations');
      doc.fontSize(12);
      aiInsights.recommendations.forEach(rec => {
        doc.text(`• ${rec}`);
      });
      doc.moveDown();
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  /**
   * Generate Excel report
   */
  async generateExcel(report, reportData, aiInsights, reportDir) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report Data');

    // Add summary data
    if (reportData.summary) {
      worksheet.addRow(['Summary']);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        worksheet.addRow([key, typeof value === 'number' ? value.toLocaleString() : value]);
      });
      worksheet.addRow([]);
    }

    // Add detailed data
    if (reportData.appointments) {
      worksheet.addRow(['Appointments']);
      worksheet.addRow(['Date', 'Client', 'Service', 'Provider', 'Amount', 'Status']);
      reportData.appointments.forEach(apt => {
        worksheet.addRow([
          apt.date,
          apt.client,
          apt.service,
          apt.provider,
          apt.amount,
          apt.status
        ]);
      });
    }

    const filePath = path.join(reportDir, 'report.xlsx');
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Generate JSON report
   */
  async generateJSON(report, reportData, aiInsights, reportDir) {
    const jsonData = {
      reportId: report.id,
      generatedAt: new Date().toISOString(),
      data: reportData,
      insights: aiInsights
    };

    const filePath = path.join(reportDir, 'report.json');
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    return filePath;
  }

  /**
   * Generate interactive dashboard
   */
  async generateInteractiveDashboard(report, reportData, aiInsights, reportDir) {
    // Generate HTML dashboard with embedded charts
    const dashboardHTML = this.generateDashboardHTML(report, reportData, aiInsights);
    const filePath = path.join(reportDir, 'dashboard.html');
    await fs.writeFile(filePath, dashboardHTML);
    return filePath;
  }

  /**
   * Generate dashboard HTML
   */
  generateDashboardHTML(report, reportData, aiInsights) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>MedSpaSync Pro Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 50%; float: left; padding: 10px; }
        .insights { clear: both; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>MedSpaSync Pro Report Dashboard</h1>
    <div id="charts">
        <div class="chart-container">
            <canvas id="revenueChart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="performanceChart"></canvas>
        </div>
    </div>
    <div class="insights">
        <h2>AI Insights</h2>
        <ul>
            ${aiInsights?.recommendations?.map(rec => `<li>${rec}</li>`).join('') || ''}
        </ul>
    </div>
    <script>
        // Chart.js implementation would go here
        console.log('Dashboard data:', ${JSON.stringify(reportData)});
    </script>
</body>
</html>`;
  }

  /**
   * Update report record
   */
  async updateReportRecord(reportId, status, metadata = {}) {
    await this.prisma.generatedReport.update({
      where: { id: reportId },
      data: {
        status,
        reportData: metadata.reportData,
        filePaths: metadata.filePaths,
        metadata: {
          ...metadata,
          updatedAt: new Date()
        }
      }
    });
  }

  /**
   * Get report by ID
   */
  async getReport(reportId, userId, tenantId) {
    const report = await this.prisma.generatedReport.findFirst({
      where: {
        id: reportId,
        userId,
        tenantId
      },
      include: {
        template: true
      }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  }

  /**
   * List user's reports
   */
  async listUserReports(userId, tenantId, limit = 10, offset = 0) {
    const reports = await this.prisma.generatedReport.findMany({
      where: {
        userId,
        tenantId
      },
      include: {
        template: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return reports.map(report => ({
      id: report.id,
      templateName: report.template.name,
      status: report.status,
      formats: report.formats,
      createdAt: report.createdAt,
      filePaths: report.filePaths
    }));
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(tenantId) {
    return await this.prisma.reportTemplate.findMany({
      where: {
        OR: [
          { tenantId: null }, // System templates
          { tenantId: tenantId } // Tenant-specific templates
        ],
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Create custom template
   */
  async createCustomTemplate(tenantId, userId, templateData) {
    return await this.prisma.reportTemplate.create({
      data: {
        tenantId,
        name: templateData.name,
        description: templateData.description,
        templateData: templateData.templateData,
        isSystem: false,
        isActive: true
      }
    });
  }
}

module.exports = ReportGenerationEngine; 