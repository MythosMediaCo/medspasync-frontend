#!/usr/bin/env node

/**
 * MedSpa Analytics Pro - Demo Data Generation Script
 * Creates realistic demo data for customer presentations
 * 
 * Usage:
 *   node scripts/generate-demo-data.js --scenario=urban --months=12
 *   node scripts/generate-demo-data.js --scenario=enterprise --months=24
 *   node scripts/generate-demo-data.js --seed-predictions --accuracy=94.7
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Demo Data Specifications
const DEMO_SCENARIOS = {
  urban: {
    name: "Riverside Medical Spa",
    revenue: 2100000, // $2.1M annually
    locations: 1,
    treatments: ["Botox", "Juvederm", "CoolSculpting", "Hydrafacials", "Laser Hair Removal", "Chemical Peels"],
    staff: 8,
    operatingHours: { start: 9, end: 19, days: 6 },
    profile: {
      type: "Urban High-Volume",
      description: "Single-location medical spa in downtown area with high patient volume",
      specialties: ["Anti-aging", "Body contouring", "Skin rejuvenation"]
    }
  },
  
  enterprise: {
    name: "Aesthetic Excellence Group",
    revenue: 7200000, // $7.2M annually
    locations: 3,
    franchise: true,
    corporateOverhead: 0.08, // 8% of revenue
    treatments: ["Botox", "Juvederm", "CoolSculpting", "Hydrafacials", "Laser Hair Removal", "Chemical Peels", "Sculptra", "Kybella"],
    staff: 24, // 8 per location
    operatingHours: { start: 9, end: 19, days: 6 },
    profile: {
      type: "Multi-Location Enterprise",
      description: "Three-location medical spa chain with corporate oversight",
      specialties: ["Anti-aging", "Body contouring", "Skin rejuvenation", "Facial aesthetics"]
    }
  }
};

// Seasonal patterns and trends
const SEASONAL_PATTERNS = {
  botox: { summer: 1.34, winter: 0.85, spring: 1.12, fall: 0.95 },
  juvederm: { summer: 1.28, winter: 0.92, spring: 1.08, fall: 0.98 },
  coolsculpting: { summer: 1.45, winter: 0.75, spring: 1.15, fall: 0.90 },
  hydrafacials: { summer: 1.22, winter: 0.88, spring: 1.05, fall: 1.02 },
  laserHairRemoval: { summer: 1.38, winter: 0.82, spring: 1.18, fall: 0.95 },
  chemicalPeels: { summer: 1.15, winter: 0.95, spring: 1.08, fall: 1.05 }
};

// Staff profiles
const STAFF_PROFILES = {
  urban: [
    { name: "Dr. Sarah Johnson", role: "Medical Director", productivity: 1.23 },
    { name: "Dr. Michael Chen", role: "Physician", productivity: 1.18 },
    { name: "Nurse Practitioner Lisa Rodriguez", role: "NP", productivity: 1.15 },
    { name: "Esthetician Jennifer Smith", role: "Esthetician", productivity: 1.12 },
    { name: "Esthetician Maria Garcia", role: "Esthetician", productivity: 1.08 },
    { name: "Receptionist Amanda Wilson", role: "Front Desk", productivity: 1.05 },
    { name: "Manager David Thompson", role: "Practice Manager", productivity: 1.20 },
    { name: "Technician Robert Kim", role: "Laser Technician", productivity: 1.10 }
  ],
  
  enterprise: [
    // Downtown Location
    { name: "Dr. Emily Davis", role: "Medical Director", location: "Downtown", productivity: 1.42 },
    { name: "Dr. James Wilson", role: "Physician", location: "Downtown", productivity: 1.38 },
    { name: "NP Rachel Green", role: "NP", location: "Downtown", productivity: 1.35 },
    { name: "Esthetician Tina Brown", role: "Esthetician", location: "Downtown", productivity: 1.32 },
    { name: "Manager Kevin Lee", role: "Practice Manager", location: "Downtown", productivity: 1.40 },
    
    // Suburban Location
    { name: "Dr. Patricia Martinez", role: "Medical Director", location: "Suburban", productivity: 0.78 },
    { name: "Dr. Robert Johnson", role: "Physician", location: "Suburban", productivity: 0.82 },
    { name: "NP Stephanie White", role: "NP", location: "Suburban", productivity: 0.85 },
    { name: "Esthetician Jessica Taylor", role: "Esthetician", location: "Suburban", productivity: 0.80 },
    { name: "Manager Brian Anderson", role: "Practice Manager", location: "Suburban", productivity: 0.75 },
    
    // Uptown Location
    { name: "Dr. Christopher Lee", role: "Medical Director", location: "Uptown", productivity: 1.15 },
    { name: "Dr. Amanda Foster", role: "Physician", location: "Uptown", productivity: 1.12 },
    { name: "NP Michelle Clark", role: "NP", location: "Uptown", productivity: 1.08 },
    { name: "Esthetician Nicole Hall", role: "Esthetician", location: "Uptown", productivity: 1.05 },
    { name: "Manager Daniel Wright", role: "Practice Manager", location: "Uptown", productivity: 1.10 }
  ]
};

class DemoDataGenerator {
  constructor(scenario, months = 12) {
    this.scenario = scenario;
    this.months = months;
    this.config = DEMO_SCENARIOS[scenario];
    this.staff = STAFF_PROFILES[scenario];
    this.startDate = new Date();
    this.startDate.setMonth(this.startDate.getMonth() - months);
  }

  // Generate realistic transaction data
  async generateTransactions() {
    console.log(`Generating ${this.months} months of transaction data for ${this.config.name}...`);
    
    const transactions = [];
    const currentDate = new Date(this.startDate);
    
    while (currentDate <= new Date()) {
      const dayOfWeek = currentDate.getDay();
      const month = currentDate.getMonth();
      const season = this.getSeason(month);
      
      // Skip Sundays
      if (dayOfWeek === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Generate daily transactions
      const dailyTransactions = this.generateDailyTransactions(currentDate, season);
      transactions.push(...dailyTransactions);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return transactions;
  }

  generateDailyTransactions(date, season) {
    const transactions = [];
    const baseTransactions = this.scenario === 'urban' ? 150 : 120; // Daily average
    const actualTransactions = Math.floor(baseTransactions * (0.8 + Math.random() * 0.4)); // ±20% variation
    
    for (let i = 0; i < actualTransactions; i++) {
      const treatment = this.selectRandomTreatment();
      const seasonalMultiplier = SEASONAL_PATTERNS[treatment.toLowerCase().replace(/\s+/g, '')]?.[season] || 1.0;
      const basePrice = this.getTreatmentPrice(treatment);
      const finalPrice = basePrice * seasonalMultiplier * (0.9 + Math.random() * 0.2); // ±10% price variation
      
      const staff = this.selectRandomStaff();
      const hour = this.config.operatingHours.start + Math.floor(Math.random() * (this.config.operatingHours.end - this.config.operatingHours.start));
      const appointmentTime = new Date(date);
      appointmentTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
      
      transactions.push({
        id: `txn_${date.getTime()}_${i}`,
        date: date,
        appointmentTime: appointmentTime,
        treatment: treatment,
        price: Math.round(finalPrice * 100) / 100,
        staffId: staff.name,
        location: this.scenario === 'enterprise' ? staff.location : 'Main',
        patientId: `patient_${Math.floor(Math.random() * 1000)}`,
        status: 'completed',
        paymentMethod: this.selectRandomPaymentMethod(),
        seasonalMultiplier: seasonalMultiplier,
        reconciliationStatus: this.generateReconciliationStatus()
      });
    }
    
    return transactions;
  }

  selectRandomTreatment() {
    const treatments = this.config.treatments;
    return treatments[Math.floor(Math.random() * treatments.length)];
  }

  getTreatmentPrice(treatment) {
    const prices = {
      'Botox': 450,
      'Juvederm': 650,
      'CoolSculpting': 1200,
      'Hydrafacials': 180,
      'Laser Hair Removal': 350,
      'Chemical Peels': 250,
      'Sculptra': 800,
      'Kybella': 750
    };
    return prices[treatment] || 400;
  }

  selectRandomStaff() {
    return this.staff[Math.floor(Math.random() * this.staff.length)];
  }

  selectRandomPaymentMethod() {
    const methods = ['credit_card', 'debit_card', 'cash', 'insurance', 'financing'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  generateReconciliationStatus() {
    const rand = Math.random();
    if (rand < 0.912) return 'automatically_matched'; // 91.2% automatic match
    if (rand < 0.988) return 'manual_review_required'; // 8.8% manual review
    return 'fraud_suspicious'; // 1.2% fraud detection
  }

  getSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  // Generate predictive analytics results
  async generatePredictions() {
    console.log('Generating predictive analytics results...');
    
    const predictions = [];
    const currentDate = new Date();
    
    // Generate 30-day revenue predictions
    for (let i = 1; i <= 30; i++) {
      const predictionDate = new Date(currentDate);
      predictionDate.setDate(currentDate.getDate() + i);
      
      const baseRevenue = this.config.revenue / 365; // Daily average
      const seasonalFactor = this.getSeasonalFactor(predictionDate);
      const dayOfWeekFactor = this.getDayOfWeekFactor(predictionDate.getDay());
      const predictedRevenue = baseRevenue * seasonalFactor * dayOfWeekFactor * (0.95 + Math.random() * 0.1);
      
      predictions.push({
        date: predictionDate,
        predictedRevenue: Math.round(predictedRevenue),
        confidence: 0.947 + (Math.random() * 0.03), // 94.7% ± 3%
        factors: ['seasonal_trends', 'day_of_week', 'historical_patterns'],
        accuracy: 0.947
      });
    }
    
    return predictions;
  }

  getSeasonalFactor(date) {
    const month = date.getMonth();
    const season = this.getSeason(month);
    const seasonalMultipliers = {
      spring: 1.12,
      summer: 1.34,
      fall: 0.95,
      winter: 0.85
    };
    return seasonalMultipliers[season] || 1.0;
  }

  getDayOfWeekFactor(day) {
    const dayFactors = {
      1: 0.85, // Monday
      2: 0.95, // Tuesday
      3: 1.05, // Wednesday
      4: 1.15, // Thursday
      5: 1.10, // Friday
      6: 0.90  // Saturday
    };
    return dayFactors[day] || 1.0;
  }

  // Generate real-time insights
  async generateRealTimeInsights() {
    console.log('Generating real-time insights...');
    
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    
    // Calculate current day's performance
    const todayTransactions = await this.getTodayTransactions();
    const currentRevenue = todayTransactions.reduce((sum, txn) => sum + txn.price, 0);
    const capacityUtilization = this.calculateCapacityUtilization(currentHour);
    
    const insights = {
      timestamp: currentDate,
      currentBookings: `${Math.round(capacityUtilization * 100)}% capacity today`,
      liveRevenue: `$${currentRevenue.toLocaleString()} (${currentDate.toLocaleTimeString()} snapshot)`,
      alertsActive: this.generateActiveAlerts(),
      performanceKPIs: this.generatePerformanceKPIs(),
      staffProductivity: this.generateStaffProductivity(),
      inventoryStatus: this.generateInventoryStatus()
    };
    
    return insights;
  }

  async getTodayTransactions() {
    // Mock today's transactions
    const today = new Date();
    const baseTransactions = this.scenario === 'urban' ? 150 : 120;
    const actualTransactions = Math.floor(baseTransactions * 0.6); // 60% of daily average for current time
    
    const transactions = [];
    for (let i = 0; i < actualTransactions; i++) {
      const treatment = this.selectRandomTreatment();
      const price = this.getTreatmentPrice(treatment);
      transactions.push({ price });
    }
    
    return transactions;
  }

  calculateCapacityUtilization(hour) {
    const operatingHours = this.config.operatingHours.end - this.config.operatingHours.start;
    const elapsedHours = hour - this.config.operatingHours.start;
    const baseUtilization = elapsedHours / operatingHours;
    return Math.min(0.87, baseUtilization * 1.2); // 87% capacity
  }

  generateActiveAlerts() {
    const alerts = [];
    
    // Low inventory alert
    if (Math.random() < 0.3) {
      alerts.push('Low Juvederm inventory');
    }
    
    // Provider overtime alert
    if (Math.random() < 0.2) {
      alerts.push('Provider overtime');
    }
    
    // High demand alert
    if (Math.random() < 0.4) {
      alerts.push('High Botox demand');
    }
    
    return alerts.length > 0 ? alerts.join(', ') : 'No active alerts';
  }

  generatePerformanceKPIs() {
    const baseTarget = this.config.revenue / 12; // Monthly target
    const currentPerformance = baseTarget * (1.23 + Math.random() * 0.1); // 23% above target
    return `${Math.round((currentPerformance / baseTarget - 1) * 100)}% above monthly target`;
  }

  generateStaffProductivity() {
    const staffProductivity = this.staff.map(staff => ({
      name: staff.name,
      productivity: staff.productivity,
      treatmentsToday: Math.floor(15 * staff.productivity),
      revenueGenerated: Math.floor(5000 * staff.productivity)
    }));
    
    return staffProductivity;
  }

  generateInventoryStatus() {
    const inventory = {
      'Botox': { current: 45, reorderPoint: 50, daysUntilReorder: 5 },
      'Juvederm': { current: 12, reorderPoint: 20, daysUntilReorder: 2 },
      'CoolSculpting': { current: 8, reorderPoint: 10, daysUntilReorder: 7 },
      'Hydrafacials': { current: 35, reorderPoint: 30, daysUntilReorder: 14 }
    };
    
    return inventory;
  }

  // Save demo data to files
  async saveDemoData(transactions, predictions, insights) {
    const demoData = {
      scenario: this.scenario,
      config: this.config,
      generatedAt: new Date().toISOString(),
      transactions: transactions,
      predictions: predictions,
      insights: insights,
      reconciliationStats: this.generateReconciliationStats(transactions),
      businessMetrics: this.generateBusinessMetrics(transactions)
    };
    
    const filename = `demo-data-${this.scenario}-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(__dirname, '..', 'data', filename);
    
    // Ensure data directory exists
    const dataDir = path.dirname(filepath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(demoData, null, 2));
    console.log(`Demo data saved to: ${filepath}`);
    
    return filepath;
  }

  generateReconciliationStats(transactions) {
    const total = transactions.length;
    const autoMatched = transactions.filter(t => t.reconciliationStatus === 'automatically_matched').length;
    const manualReview = transactions.filter(t => t.reconciliationStatus === 'manual_review_required').length;
    const fraud = transactions.filter(t => t.reconciliationStatus === 'fraud_suspicious').length;
    
    return {
      totalTransactions: total,
      automaticMatchRate: `${((autoMatched / total) * 100).toFixed(1)}%`,
      manualReviewRate: `${((manualReview / total) * 100).toFixed(1)}%`,
      fraudDetectionRate: `${((fraud / total) * 100).toFixed(1)}%`,
      timeSaved: `${Math.round((manualReview + fraud) * 0.1)} hours/week`
    };
  }

  generateBusinessMetrics(transactions) {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.price, 0);
    const avgTransactionValue = totalRevenue / transactions.length;
    const revenueByTreatment = {};
    
    transactions.forEach(t => {
      revenueByTreatment[t.treatment] = (revenueByTreatment[t.treatment] || 0) + t.price;
    });
    
    return {
      totalRevenue: Math.round(totalRevenue),
      averageTransactionValue: Math.round(avgTransactionValue),
      revenueByTreatment: revenueByTreatment,
      totalTransactions: transactions.length,
      seasonalTrends: this.analyzeSeasonalTrends(transactions)
    };
  }

  analyzeSeasonalTrends(transactions) {
    const seasonalData = {};
    transactions.forEach(t => {
      const season = this.getSeason(t.date.getMonth());
      if (!seasonalData[season]) seasonalData[season] = [];
      seasonalData[season].push(t.price);
    });
    
    const trends = {};
    Object.keys(seasonalData).forEach(season => {
      const avg = seasonalData[season].reduce((sum, price) => sum + price, 0) / seasonalData[season].length;
      trends[season] = Math.round(avg);
    });
    
    return trends;
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const scenario = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1] || 'urban';
  const months = parseInt(args.find(arg => arg.startsWith('--months='))?.split('=')[1]) || 12;
  const seedPredictions = args.includes('--seed-predictions');
  const accuracy = parseFloat(args.find(arg => arg.startsWith('--accuracy='))?.split('=')[1]) || 94.7;
  
  if (!DEMO_SCENARIOS[scenario]) {
    console.error(`Invalid scenario: ${scenario}. Available scenarios: ${Object.keys(DEMO_SCENARIOS).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`🚀 Generating demo data for ${DEMO_SCENARIOS[scenario].name}`);
  console.log(`📊 Scenario: ${scenario} | Months: ${months} | Accuracy: ${accuracy}%`);
  
  try {
    const generator = new DemoDataGenerator(scenario, months);
    
    const transactions = await generator.generateTransactions();
    const predictions = await generator.generatePredictions();
    const insights = await generator.generateRealTimeInsights();
    
    const filepath = await generator.saveDemoData(transactions, predictions, insights);
    
    console.log('\n✅ Demo data generation complete!');
    console.log(`📁 Data saved to: ${filepath}`);
    console.log(`📈 Generated ${transactions.length} transactions`);
    console.log(`🔮 Generated ${predictions.length} predictions`);
    console.log(`📊 Real-time insights available`);
    
    // Display summary statistics
    const reconciliationStats = generator.generateReconciliationStats(transactions);
    const businessMetrics = generator.generateBusinessMetrics(transactions);
    
    console.log('\n📊 Demo Data Summary:');
    console.log(`🏥 Practice: ${DEMO_SCENARIOS[scenario].name}`);
    console.log(`💰 Total Revenue: $${businessMetrics.totalRevenue.toLocaleString()}`);
    console.log(`📋 Total Transactions: ${businessMetrics.totalTransactions.toLocaleString()}`);
    console.log(`🎯 Average Transaction: $${businessMetrics.averageTransactionValue}`);
    console.log(`✅ Auto-Match Rate: ${reconciliationStats.automaticMatchRate}`);
    console.log(`⏰ Time Saved: ${reconciliationStats.timeSaved}`);
    
  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DemoDataGenerator, DEMO_SCENARIOS }; 