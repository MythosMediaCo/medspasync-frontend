const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger.js');

const prisma = new PrismaClient();

class DemoDataManager {
  constructor() {
    this.practiceSizes = {
      small: { locations: 1, monthlyRevenue: 75000, staffCount: 3, transactions: 150 },
      medium: { locations: 3, monthlyRevenue: 250000, staffCount: 8, transactions: 500 },
      large: { locations: 6, monthlyRevenue: 750000, staffCount: 15, transactions: 1200 }
    };
  }

  /**
   * Generate comprehensive demo data for a practice
   */
  async generateDemoData(practiceSize = 'medium') {
    const config = this.practiceSizes[practiceSize];
    
    return {
      summary: {
        practiceSize,
        locations: config.locations,
        monthlyRevenue: config.monthlyRevenue,
        staffCount: config.staffCount,
        transactions: config.transactions,
        generatedAt: new Date().toISOString()
      },
      sampleData: this.generateSampleTransactions(config),
      reconciliationHistory: this.generateReconciliationHistory(config),
      performanceMetrics: this.generatePerformanceMetrics(config),
      clients: this.generateSampleClients(config),
      services: this.generateSampleServices(),
      providers: this.generateSampleProviders(config)
    };
  }

  /**
   * Generate sample transaction data
   */
  generateSampleTransactions(config) {
    const services = [
      'Botox Treatment', 'Dermal Fillers', 'Chemical Peel', 'Microdermabrasion',
      'Laser Hair Removal', 'IPL Treatment', 'HydraFacial', 'Microneedling',
      'CoolSculpting', 'Ultherapy', 'Consultation', 'Follow-up'
    ];

    const statuses = ['completed', 'pending', 'cancelled', 'no-show'];
    const locations = Array.from({ length: config.locations }, (_, i) => `Location ${i + 1}`);
    const providers = this.generateSampleProviders(config);

    const transactions = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    for (let i = 0; i < Math.min(config.transactions, 100); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor(Math.random() * 30));
      
      const service = services[Math.floor(Math.random() * services.length)];
      const amount = this.generateServiceAmount(service);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const provider = providers[Math.floor(Math.random() * providers.length)];

      transactions.push({
        id: `TXN-${String(i + 1).padStart(4, '0')}`,
        date: date.toISOString().split('T')[0],
        service,
        amount: amount.toFixed(2),
        status,
        location,
        clientId: `CLIENT-${Math.floor(Math.random() * 200) + 1}`,
        provider: provider.name,
        providerId: provider.id,
        paymentMethod: this.generatePaymentMethod(),
        notes: this.generateTransactionNotes(service, status)
      });
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Generate sample clients
   */
  generateSampleClients(config) {
    const clients = [];
    const clientCount = Math.min(config.transactions / 3, 50); // 1 client per 3 transactions, max 50

    for (let i = 1; i <= clientCount; i++) {
      const firstName = this.generateFirstName();
      const lastName = this.generateLastName();
      
      clients.push({
        id: `CLIENT-${String(i).padStart(3, '0')}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.com`,
        phone: this.generatePhoneNumber(),
        dateOfBirth: this.generateDateOfBirth(),
        address: this.generateAddress(),
        emergencyContact: this.generateEmergencyContact(),
        medicalHistory: this.generateMedicalHistory(),
        preferences: this.generateClientPreferences(),
        status: 'active',
        source: 'demo_data'
      });
    }

    return clients;
  }

  /**
   * Generate sample services
   */
  generateSampleServices() {
    return [
      {
        id: 'BOTOX-001',
        name: 'Botox Treatment',
        category: 'Injectables',
        duration: 30,
        price: 400,
        description: 'Botox treatment for facial wrinkles and fine lines'
      },
      {
        id: 'FILLER-001',
        name: 'Dermal Fillers',
        category: 'Injectables',
        duration: 45,
        price: 800,
        description: 'Dermal filler treatment for volume restoration'
      },
      {
        id: 'PEEL-001',
        name: 'Chemical Peel',
        category: 'Skin Treatments',
        duration: 60,
        price: 250,
        description: 'Chemical peel for skin rejuvenation'
      },
      {
        id: 'LASER-001',
        name: 'Laser Hair Removal',
        category: 'Laser Treatments',
        duration: 45,
        price: 300,
        description: 'Laser hair removal treatment'
      },
      {
        id: 'HYDRA-001',
        name: 'HydraFacial',
        category: 'Skin Treatments',
        duration: 30,
        price: 180,
        description: 'HydraFacial treatment for skin hydration'
      }
    ];
  }

  /**
   * Generate sample providers
   */
  generateSampleProviders(config) {
    const providers = [
      { id: 'PROV-001', name: 'Dr. Sarah Johnson', specialty: 'Dermatology', license: 'MD12345' },
      { id: 'PROV-002', name: 'Dr. Michael Chen', specialty: 'Plastic Surgery', license: 'MD67890' },
      { id: 'PROV-003', name: 'Dr. Emily Rodriguez', specialty: 'Aesthetic Medicine', license: 'MD11111' },
      { id: 'PROV-004', name: 'Nurse Practitioner Lisa Smith', specialty: 'Nurse Practitioner', license: 'NP22222' },
      { id: 'PROV-005', name: 'Dr. Robert Wilson', specialty: 'Dermatology', license: 'MD33333' }
    ];

    return providers.slice(0, Math.min(config.staffCount, providers.length));
  }

  /**
   * Generate service amounts based on service type
   */
  generateServiceAmount(service) {
    const servicePricing = {
      'Botox Treatment': { min: 300, max: 800 },
      'Dermal Fillers': { min: 500, max: 1500 },
      'Chemical Peel': { min: 150, max: 400 },
      'Microdermabrasion': { min: 100, max: 250 },
      'Laser Hair Removal': { min: 200, max: 600 },
      'IPL Treatment': { min: 250, max: 700 },
      'HydraFacial': { min: 150, max: 350 },
      'Microneedling': { min: 300, max: 800 },
      'CoolSculpting': { min: 1000, max: 3000 },
      'Ultherapy': { min: 2000, max: 5000 },
      'Consultation': { min: 50, max: 150 },
      'Follow-up': { min: 25, max: 100 }
    };

    const pricing = servicePricing[service] || { min: 100, max: 500 };
    return Math.floor(Math.random() * (pricing.max - pricing.min + 1)) + pricing.min;
  }

  /**
   * Generate reconciliation history
   */
  generateReconciliationHistory(config) {
    const history = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i * 7));
      
      const baseDiscrepancies = Math.floor(config.transactions * 0.05); // 5% base discrepancy rate
      const discrepancies = Math.floor(baseDiscrepancies * (0.8 + Math.random() * 0.4)); // ±20% variance
      const accuracy = Math.max(85, 100 - (discrepancies / config.transactions * 100));
      
      history.push({
        date: date.toISOString().split('T')[0],
        transactionsProcessed: config.transactions,
        discrepanciesFound: discrepancies,
        accuracyRate: accuracy.toFixed(1),
        timeSaved: Math.floor(config.staffCount * 2 * (0.8 + Math.random() * 0.4)),
        revenueRecovered: Math.floor(discrepancies * 50 * (0.8 + Math.random() * 0.4)),
        processingTime: (Math.random() * 2 + 1).toFixed(1), // 1-3 minutes
        confidence: (Math.random() * 5 + 90).toFixed(1) // 90-95%
      });
    }

    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Generate performance metrics
   */
  generatePerformanceMetrics(config) {
    const avgTransactionValue = config.monthlyRevenue / config.transactions;
    const monthlySavings = config.staffCount * 25 * 10; // 10 hours saved per staff member at $25/hr
    
    return {
      averageTransactionValue: avgTransactionValue.toFixed(2),
      monthlySavings: monthlySavings,
      annualSavings: monthlySavings * 12,
      timeSavedPerMonth: config.staffCount * 10,
      accuracyImprovement: (Math.random() * 10 + 10).toFixed(1), // 10-20%
      revenueRecoveryRate: (Math.random() * 2 + 1).toFixed(1), // 1-3%
      customerSatisfaction: (Math.random() * 0.5 + 4.5).toFixed(1), // 4.5-5.0
      processingSpeed: `${(Math.random() * 2 + 1).toFixed(1)}x faster`,
      errorRate: (Math.random() * 2 + 1).toFixed(2), // 1-3%
      completionRate: (Math.random() * 5 + 95).toFixed(1) // 95-100%
    };
  }

  /**
   * Generate first name
   */
  generateFirstName() {
    const names = [
      'Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Quinn', 'Avery',
      'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper', 'Indigo',
      'Sarah', 'Michael', 'Emily', 'Robert', 'Lisa', 'David', 'Jennifer', 'James'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Generate last name
   */
  generateLastName() {
    const names = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
      'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Generate phone number
   */
  generatePhoneNumber() {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }

  /**
   * Generate date of birth
   */
  generateDateOfBirth() {
    const start = new Date(1960, 0, 1);
    const end = new Date(2000, 0, 1);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate address
   */
  generateAddress() {
    const streets = ['Main St', 'Oak Ave', 'Elm St', 'Pine Rd', 'Cedar Ln', 'Maple Dr'];
    const cities = ['Austin', 'Miami', 'Denver', 'Seattle', 'Portland', 'Nashville'];
    const states = ['TX', 'FL', 'CO', 'WA', 'OR', 'TN'];
    
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const zip = Math.floor(Math.random() * 90000) + 10000;
    
    return {
      street: `${number} ${street}`,
      city,
      state,
      zip: zip.toString(),
      country: 'USA'
    };
  }

  /**
   * Generate emergency contact
   */
  generateEmergencyContact() {
    return {
      name: `${this.generateFirstName()} ${this.generateLastName()}`,
      relationship: ['Spouse', 'Parent', 'Sibling', 'Friend'][Math.floor(Math.random() * 4)],
      phone: this.generatePhoneNumber()
    };
  }

  /**
   * Generate medical history
   */
  generateMedicalHistory() {
    const conditions = ['None', 'Hypertension', 'Diabetes', 'Allergies', 'Asthma'];
    const medications = ['None', 'Blood pressure medication', 'Insulin', 'Antihistamines'];
    
    return {
      conditions: [conditions[Math.floor(Math.random() * conditions.length)]],
      medications: [medications[Math.floor(Math.random() * medications.length)]],
      allergies: Math.random() > 0.7 ? ['Latex', 'Penicillin'] : [],
      surgeries: Math.random() > 0.8 ? ['Appendectomy', 'Tonsillectomy'] : []
    };
  }

  /**
   * Generate client preferences
   */
  generateClientPreferences() {
    return {
      communication: ['Email', 'Phone', 'Text'][Math.floor(Math.random() * 3)],
      appointmentReminders: Math.random() > 0.3,
      marketingEmails: Math.random() > 0.5,
      preferredProvider: null,
      notes: Math.random() > 0.7 ? 'Prefers morning appointments' : null
    };
  }

  /**
   * Generate payment method
   */
  generatePaymentMethod() {
    const methods = ['Credit Card', 'Debit Card', 'Cash', 'Insurance', 'Payment Plan'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  /**
   * Generate transaction notes
   */
  generateTransactionNotes(service, status) {
    if (status === 'cancelled') {
      return 'Client cancelled due to scheduling conflict';
    } else if (status === 'no-show') {
      return 'Client did not show up for appointment';
    } else if (service.includes('Botox') || service.includes('Filler')) {
      return 'Standard treatment protocol followed';
    } else {
      return Math.random() > 0.7 ? 'Client requested specific adjustments' : null;
    }
  }

  /**
   * Get demo data statistics
   */
  getDemoStats(practiceSize) {
    const config = this.practiceSizes[practiceSize];
    return {
      totalTransactions: config.transactions,
      averageRevenue: config.monthlyRevenue,
      staffCount: config.staffCount,
      locations: config.locations,
      typicalDiscrepancies: Math.floor(config.transactions * 0.08),
      typicalSavings: config.staffCount * 25 * 10
    };
  }

  /**
   * Export demo data as CSV
   */
  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value)}"`;
        }
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Validate demo data
   */
  validateDemoData(data) {
    const requiredFields = ['summary', 'sampleData', 'reconciliationHistory', 'performanceMetrics'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!data.sampleData || data.sampleData.length === 0) {
      throw new Error('Sample data is empty');
    }

    return true;
  }

  /**
   * Clear demo data cache
   */
  clearCache() {
    // In a real implementation, this would clear any cached data
    logger.info('Demo data cache cleared');
  }
}

module.exports = DemoDataManager; 