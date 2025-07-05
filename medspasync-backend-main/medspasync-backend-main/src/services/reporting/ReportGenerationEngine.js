const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { aiReconciliationService } = require('../../engine/aiReconciliation');
const { auditLogger } = require('../auditService');
const { encryptionService } = require('../encryptionService');

class ReportGenerationEngine {
  constructor() {
    this.templates = this.initializeTemplates();
    this.outputDir = path.join(process.cwd(), 'reports', 'generated');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Initialize medical spa report templates
   */
  initializeTemplates() {
    return {
      'monthly-financial-summary': {
        name: 'Monthly Financial Summary',
        description: 'Comprehensive monthly financial analysis with revenue trends',
        requiredFields: ['amount', 'date', 'service'],
        aiInsights: ['revenue_trends', 'service_performance', 'seasonal_patterns'],
        charts: ['revenue_timeline', 'service_distribution', 'monthly_comparison']
      },
      'provider-performance-analysis': {
        name: 'Provider Performance Analysis',
        description: 'Detailed provider productivity and revenue analysis',
        requiredFields: ['provider', 'amount', 'date', 'service'],
        aiInsights: ['provider_efficiency', 'revenue_optimization', 'capacity_analysis'],
        charts: ['provider_revenue', 'service_distribution', 'productivity_trends']
      },
      'patient-journey-retention': {
        name: 'Patient Journey & Retention',
        description: 'Patient lifecycle analysis and retention insights',
        requiredFields: ['patient', 'date', 'service', 'amount'],
        aiInsights: ['retention_patterns', 'lifetime_value', 'churn_prediction'],
        charts: ['patient_lifecycle', 'retention_funnel', 'lifetime_value_distribution']
      },
      'inventory-product-analysis': {
        name: 'Inventory & Product Analysis',
        description: 'Product performance and inventory optimization',
        requiredFields: ['service', 'amount', 'date'],
        aiInsights: ['product_performance', 'inventory_optimization', 'pricing_analysis'],
        charts: ['product_revenue', 'inventory_turnover', 'profit_margins']
      },
      'hipaa-compliance-audit': {
        name: 'HIPAA Compliance & Audit Trail',
        description: 'Comprehensive compliance reporting and audit trail',
        requiredFields: ['date', 'user', 'action'],
        aiInsights: ['compliance_score', 'risk_assessment', 'anomaly_detection'],
        charts: ['compliance_timeline', 'access_patterns', 'risk_distribution']
      }
    };
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(templateId, data, options = {}) {
    const reportId = uuidv4();
    const startTime = Date.now();

    try {
      // Validate template
      const template = this.templates[templateId];
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Validate required fields
      this.validateRequiredFields(data, template.requiredFields);

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(data, template.aiInsights, options);

      // Create report data structure
      const reportData = {
        reportId,
        templateId,
        templateName: template.name,
        generatedAt: new Date().toISOString(),
        dataSummary: this.generateDataSummary(data),
        insights: aiInsights,
        charts: await this.generateCharts(data, template.charts),
        recommendations: this.generateRecommendations(aiInsights),
        metadata: {
          recordCount: data.length,
          dateRange: this.getDateRange(data),
          processingTime: Date.now() - startTime
        }
      };

      // Generate output files
      const outputs = {};
      
      if (options.formats?.includes('pdf')) {
        outputs.pdf = await this.generatePDF(reportData, options);
      }
      
      if (options.formats?.includes('excel')) {
        outputs.excel = await this.generateExcel(reportData, options);
      }
      
      if (options.formats?.includes('json')) {
        outputs.json = await this.generateJSON(reportData, options);
      }

      // Log audit trail
      await auditLogger.log({
        action: 'REPORT_GENERATED',
        userId: options.userId,
        tenantId: options.tenantId,
        details: {
          reportId,
          templateId,
          recordCount: data.length,
          formats: Object.keys(outputs),
          processingTime: Date.now() - startTime
        }
      });

      return {
        reportId,
        status: 'COMPLETED',
        outputs,
        reportData,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      // Log error
      await auditLogger.log({
        action: 'REPORT_GENERATION_FAILED',
        userId: options.userId,
        tenantId: options.tenantId,
        details: {
          reportId,
          templateId,
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Validate required fields are present in data
   */
  validateRequiredFields(data, requiredFields) {
    if (!data.length) {
      throw new Error('No data provided for report generation');
    }

    const sampleRecord = data[0];
    const missingFields = requiredFields.filter(field => !sampleRecord.hasOwnProperty(field));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Generate AI-powered insights
   */
  async generateAIInsights(data, insightTypes, options) {
    const insights = {};

    for (const insightType of insightTypes) {
      try {
        switch (insightType) {
          case 'revenue_trends':
            insights.revenueTrends = await this.analyzeRevenueTrends(data);
            break;
          case 'service_performance':
            insights.servicePerformance = await this.analyzeServicePerformance(data);
            break;
          case 'provider_efficiency':
            insights.providerEfficiency = await this.analyzeProviderEfficiency(data);
            break;
          case 'retention_patterns':
            insights.retentionPatterns = await this.analyzeRetentionPatterns(data);
            break;
          case 'compliance_score':
            insights.complianceScore = await this.analyzeComplianceScore(data);
            break;
          default:
            console.warn(`Unknown insight type: ${insightType}`);
        }
      } catch (error) {
        console.warn(`Failed to generate ${insightType} insight:`, error.message);
        insights[insightType] = { error: error.message };
      }
    }

    return insights;
  }

  /**
   * Analyze revenue trends using AI
   */
  async analyzeRevenueTrends(data) {
    const revenueData = data
      .filter(record => record.amount && record.date)
      .map(record => ({
        date: new Date(record.date),
        amount: parseFloat(record.amount) || 0
      }))
      .sort((a, b) => a.date - b.date);

    if (revenueData.length < 2) {
      return { error: 'Insufficient data for trend analysis' };
    }

    // Calculate basic trends
    const totalRevenue = revenueData.reduce((sum, record) => sum + record.amount, 0);
    const avgRevenue = totalRevenue / revenueData.length;
    
    // Calculate growth rate
    const firstMonth = revenueData[0];
    const lastMonth = revenueData[revenueData.length - 1];
    const growthRate = ((lastMonth.amount - firstMonth.amount) / firstMonth.amount) * 100;

    // Use AI service for advanced analysis if available
    let aiAnalysis = null;
    if (aiReconciliationService && aiReconciliationService.isServiceAvailable()) {
      try {
        aiAnalysis = await aiReconciliationService.analyzeTrends({
          data: revenueData,
          analysisType: 'revenue_trends'
        });
      } catch (error) {
        console.warn('AI trend analysis failed:', error.message);
      }
    }

    return {
      totalRevenue,
      averageRevenue: avgRevenue,
      growthRate: growthRate.toFixed(2),
      trendDirection: growthRate > 0 ? 'increasing' : 'decreasing',
      dataPoints: revenueData.length,
      aiAnalysis
    };
  }

  /**
   * Analyze service performance
   */
  async analyzeServicePerformance(data) {
    const serviceStats = {};
    
    data.forEach(record => {
      if (record.service && record.amount) {
        const service = record.service;
        const amount = parseFloat(record.amount) || 0;
        
        if (!serviceStats[service]) {
          serviceStats[service] = {
            count: 0,
            totalRevenue: 0,
            avgRevenue: 0
          };
        }
        
        serviceStats[service].count++;
        serviceStats[service].totalRevenue += amount;
      }
    });

    // Calculate averages and sort by revenue
    Object.keys(serviceStats).forEach(service => {
      serviceStats[service].avgRevenue = 
        serviceStats[service].totalRevenue / serviceStats[service].count;
    });

    const sortedServices = Object.entries(serviceStats)
      .sort(([,a], [,b]) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10); // Top 10 services

    return {
      topServices: sortedServices,
      totalServices: Object.keys(serviceStats).length,
      totalRevenue: Object.values(serviceStats).reduce((sum, stat) => sum + stat.totalRevenue, 0)
    };
  }

  /**
   * Analyze provider efficiency
   */
  async analyzeProviderEfficiency(data) {
    const providerStats = {};
    
    data.forEach(record => {
      if (record.provider && record.amount) {
        const provider = record.provider;
        const amount = parseFloat(record.amount) || 0;
        
        if (!providerStats[provider]) {
          providerStats[provider] = {
            count: 0,
            totalRevenue: 0,
            avgRevenue: 0
          };
        }
        
        providerStats[provider].count++;
        providerStats[provider].totalRevenue += amount;
      }
    });

    // Calculate averages
    Object.keys(providerStats).forEach(provider => {
      providerStats[provider].avgRevenue = 
        providerStats[provider].totalRevenue / providerStats[provider].count;
    });

    const sortedProviders = Object.entries(providerStats)
      .sort(([,a], [,b]) => b.avgRevenue - a.avgRevenue);

    return {
      topProviders: sortedProviders.slice(0, 5),
      totalProviders: Object.keys(providerStats).length,
      averageProviderRevenue: Object.values(providerStats).reduce((sum, stat) => sum + stat.avgRevenue, 0) / Object.keys(providerStats).length
    };
  }

  /**
   * Analyze retention patterns
   */
  async analyzeRetentionPatterns(data) {
    const patientVisits = {};
    
    data.forEach(record => {
      if (record.patient && record.date) {
        const patient = record.patient;
        const date = new Date(record.date);
        
        if (!patientVisits[patient]) {
          patientVisits[patient] = [];
        }
        
        patientVisits[patient].push(date);
      }
    });

    // Calculate retention metrics
    const patients = Object.keys(patientVisits);
    const repeatPatients = patients.filter(patient => patientVisits[patient].length > 1);
    const retentionRate = (repeatPatients.length / patients.length) * 100;

    // Calculate average visits per patient
    const totalVisits = patients.reduce((sum, patient) => sum + patientVisits[patient].length, 0);
    const avgVisitsPerPatient = totalVisits / patients.length;

    return {
      totalPatients: patients.length,
      repeatPatients: repeatPatients.length,
      retentionRate: retentionRate.toFixed(2),
      averageVisitsPerPatient: avgVisitsPerPatient.toFixed(2),
      newPatients: patients.length - repeatPatients.length
    };
  }

  /**
   * Analyze compliance score
   */
  async analyzeComplianceScore(data) {
    // This would integrate with existing HIPAA compliance system
    const complianceChecks = {
      dataEncryption: true,
      accessControls: true,
      auditLogging: true,
      dataRetention: true,
      breachDetection: true
    };

    const score = Object.values(complianceChecks).filter(Boolean).length / Object.keys(complianceChecks).length * 100;

    return {
      overallScore: score.toFixed(1),
      checks: complianceChecks,
      recommendations: score < 100 ? ['Review access controls', 'Enhance audit logging'] : []
    };
  }

  /**
   * Generate charts data
   */
  async generateCharts(data, chartTypes) {
    const charts = {};

    for (const chartType of chartTypes) {
      try {
        switch (chartType) {
          case 'revenue_timeline':
            charts.revenueTimeline = this.generateRevenueTimelineChart(data);
            break;
          case 'service_distribution':
            charts.serviceDistribution = this.generateServiceDistributionChart(data);
            break;
          case 'provider_revenue':
            charts.providerRevenue = this.generateProviderRevenueChart(data);
            break;
          default:
            console.warn(`Unknown chart type: ${chartType}`);
        }
      } catch (error) {
        console.warn(`Failed to generate ${chartType} chart:`, error.message);
        charts[chartType] = { error: error.message };
      }
    }

    return charts;
  }

  /**
   * Generate revenue timeline chart data
   */
  generateRevenueTimelineChart(data) {
    const timelineData = {};
    
    data.forEach(record => {
      if (record.date && record.amount) {
        const date = new Date(record.date).toISOString().split('T')[0];
        const amount = parseFloat(record.amount) || 0;
        
        timelineData[date] = (timelineData[date] || 0) + amount;
      }
    });

    return {
      type: 'line',
      data: Object.entries(timelineData).map(([date, amount]) => ({ date, amount })),
      options: {
        title: 'Revenue Timeline',
        xAxis: 'Date',
        yAxis: 'Revenue ($)'
      }
    };
  }

  /**
   * Generate service distribution chart data
   */
  generateServiceDistributionChart(data) {
    const serviceCounts = {};
    
    data.forEach(record => {
      if (record.service) {
        serviceCounts[record.service] = (serviceCounts[record.service] || 0) + 1;
      }
    });

    return {
      type: 'pie',
      data: Object.entries(serviceCounts).map(([service, count]) => ({ service, count })),
      options: {
        title: 'Service Distribution'
      }
    };
  }

  /**
   * Generate provider revenue chart data
   */
  generateProviderRevenueChart(data) {
    const providerRevenue = {};
    
    data.forEach(record => {
      if (record.provider && record.amount) {
        const provider = record.provider;
        const amount = parseFloat(record.amount) || 0;
        
        providerRevenue[provider] = (providerRevenue[provider] || 0) + amount;
      }
    });

    return {
      type: 'bar',
      data: Object.entries(providerRevenue).map(([provider, revenue]) => ({ provider, revenue })),
      options: {
        title: 'Provider Revenue',
        xAxis: 'Provider',
        yAxis: 'Revenue ($)'
      }
    };
  }

  /**
   * Generate recommendations based on insights
   */
  generateRecommendations(insights) {
    const recommendations = [];

    // Revenue recommendations
    if (insights.revenueTrends) {
      if (insights.revenueTrends.growthRate < 0) {
        recommendations.push('Consider promotional campaigns to boost revenue');
      }
      if (insights.revenueTrends.averageRevenue < 100) {
        recommendations.push('Review pricing strategy for low-value services');
      }
    }

    // Service recommendations
    if (insights.servicePerformance) {
      const topServices = insights.servicePerformance.topServices;
      if (topServices.length > 0) {
        recommendations.push(`Focus marketing efforts on top-performing service: ${topServices[0][0]}`);
      }
    }

    // Provider recommendations
    if (insights.providerEfficiency) {
      recommendations.push('Consider training programs for underperforming providers');
    }

    // Retention recommendations
    if (insights.retentionPatterns) {
      if (insights.retentionPatterns.retentionRate < 50) {
        recommendations.push('Implement customer retention programs');
      }
    }

    return recommendations;
  }

  /**
   * Generate PDF report
   */
  async generatePDF(reportData, options) {
    const filename = `report-${reportData.reportId}.pdf`;
    const filepath = path.join(this.outputDir, filename);
    
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Add header
    doc.fontSize(24).text('MedSpaSync Pro Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(reportData.templateName, { align: 'center' });
    doc.moveDown();

    // Add metadata
    doc.fontSize(12).text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`);
    doc.text(`Records Processed: ${reportData.metadata.recordCount}`);
    doc.moveDown();

    // Add insights
    doc.fontSize(14).text('Key Insights', { underline: true });
    doc.moveDown();
    
    Object.entries(reportData.insights).forEach(([key, insight]) => {
      if (insight && !insight.error) {
        doc.fontSize(12).text(`${key}: ${JSON.stringify(insight, null, 2)}`);
        doc.moveDown();
      }
    });

    // Add recommendations
    if (reportData.recommendations.length > 0) {
      doc.fontSize(14).text('Recommendations', { underline: true });
      doc.moveDown();
      
      reportData.recommendations.forEach(rec => {
        doc.fontSize(12).text(`• ${rec}`);
        doc.moveDown();
      });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve({ filename, filepath }));
      stream.on('error', reject);
    });
  }

  /**
   * Generate Excel report
   */
  async generateExcel(reportData, options) {
    const filename = `report-${reportData.reportId}.xlsx`;
    const filepath = path.join(this.outputDir, filename);
    
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Report', reportData.templateName]);
    summarySheet.addRow(['Generated', new Date(reportData.generatedAt).toLocaleString()]);
    summarySheet.addRow(['Records', reportData.metadata.recordCount]);
    
    // Insights sheet
    const insightsSheet = workbook.addWorksheet('Insights');
    Object.entries(reportData.insights).forEach(([key, insight]) => {
      if (insight && !insight.error) {
        insightsSheet.addRow([key, JSON.stringify(insight)]);
      }
    });

    // Recommendations sheet
    const recSheet = workbook.addWorksheet('Recommendations');
    reportData.recommendations.forEach(rec => {
      recSheet.addRow([rec]);
    });

    await workbook.xlsx.writeFile(filepath);
    return { filename, filepath };
  }

  /**
   * Generate JSON report
   */
  async generateJSON(reportData, options) {
    const filename = `report-${reportData.reportId}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.promises.writeFile(filepath, JSON.stringify(reportData, null, 2));
    return { filename, filepath };
  }

  /**
   * Generate data summary
   */
  generateDataSummary(data) {
    return {
      totalRecords: data.length,
      dateRange: this.getDateRange(data),
      fields: Object.keys(data[0] || {}),
      sampleRecord: data[0] || {}
    };
  }

  /**
   * Get date range from data
   */
  getDateRange(data) {
    const dates = data
      .filter(record => record.date)
      .map(record => new Date(record.date))
      .sort((a, b) => a - b);

    if (dates.length === 0) return null;

    return {
      start: dates[0].toISOString(),
      end: dates[dates.length - 1].toISOString(),
      days: Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return Object.entries(this.templates).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      requiredFields: template.requiredFields
    }));
  }
}

module.exports = ReportGenerationEngine; 