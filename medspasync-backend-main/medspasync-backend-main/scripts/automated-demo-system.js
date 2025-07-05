#!/usr/bin/env node

/**
 * MedSpa Analytics Pro - Automated Demo & Onboarding System
 * Handles demo scheduling, personalized demos, automated follow-ups, and onboarding
 * 
 * Usage:
 *   node scripts/automated-demo-system.js --action=schedule-demo --customer=acme-spa
 *   node scripts/automated-demo-system.js --action=generate-onboarding --customer=acme-spa
 *   node scripts/automated-demo-system.js --action=send-followup --customer=acme-spa
 */

const fs = require('fs');
const path = require('path');
const { DemoDataGenerator } = require('./generate-demo-data.js');

class AutomatedDemoSystem {
  constructor() {
    this.customersDir = path.join(__dirname, '..', 'data', 'customers');
    this.demosDir = path.join(__dirname, '..', 'data', 'demos');
    this.onboardingDir = path.join(__dirname, '..', 'data', 'onboarding');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.customersDir, this.demosDir, this.onboardingDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Customer profile management
  async createCustomerProfile(customerId, profile) {
    const customerFile = path.join(this.customersDir, `${customerId}.json`);
    const customerData = {
      id: customerId,
      profile: profile,
      created: new Date().toISOString(),
      status: 'prospect',
      demos: [],
      onboarding: null,
      followUps: []
    };
    
    fs.writeFileSync(customerFile, JSON.stringify(customerData, null, 2));
    console.log(`✅ Customer profile created: ${customerId}`);
    return customerData;
  }

  async getCustomerProfile(customerId) {
    const customerFile = path.join(this.customersDir, `${customerId}.json`);
    if (fs.existsSync(customerFile)) {
      return JSON.parse(fs.readFileSync(customerFile, 'utf8'));
    }
    return null;
  }

  async updateCustomerProfile(customerId, updates) {
    const customer = await this.getCustomerProfile(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }
    
    Object.assign(customer, updates);
    const customerFile = path.join(this.customersDir, `${customerId}.json`);
    fs.writeFileSync(customerFile, JSON.stringify(customer, null, 2));
    return customer;
  }

  // Automated demo scheduling
  async scheduleDemo(customerId, demoConfig) {
    console.log(`📅 Scheduling demo for ${customerId}...`);
    
    const customer = await this.getCustomerProfile(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const demoId = `demo_${customerId}_${Date.now()}`;
    const demoData = {
      id: demoId,
      customerId: customerId,
      scheduledFor: demoConfig.scheduledFor || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: demoConfig.duration || 30,
      type: demoConfig.type || 'executive',
      scenario: demoConfig.scenario || 'urban',
      attendees: demoConfig.attendees || [],
      customizations: demoConfig.customizations || {},
      status: 'scheduled',
      created: new Date().toISOString()
    };

    // Generate personalized demo data
    await this.generatePersonalizedDemo(customerId, demoData);
    
    // Create calendar invitation
    const calendarInvite = this.createCalendarInvite(demoData);
    
    // Send confirmation email
    await this.sendDemoConfirmation(customerId, demoData, calendarInvite);
    
    // Update customer profile
    customer.demos.push(demoId);
    await this.updateCustomerProfile(customerId, { demos: customer.demos });
    
    // Save demo data
    const demoFile = path.join(this.demosDir, `${demoId}.json`);
    fs.writeFileSync(demoFile, JSON.stringify(demoData, null, 2));
    
    console.log(`✅ Demo scheduled: ${demoId}`);
    return demoData;
  }

  async generatePersonalizedDemo(customerId, demoData) {
    console.log(`🎯 Generating personalized demo for ${customerId}...`);
    
    const customer = await this.getCustomerProfile(customerId);
    const scenario = demoData.scenario;
    
    // Customize demo based on customer profile
    const customizations = {
      ...demoData.customizations,
      practiceName: customer.profile.name,
      revenue: customer.profile.revenue,
      locations: customer.profile.locations,
      staff: customer.profile.staff,
      treatments: customer.profile.treatments || ['Botox', 'Juvederm', 'CoolSculpting', 'Hydrafacials']
    };
    
    // Generate demo data with customizations
    const generator = new DemoDataGenerator(scenario, 6);
    const transactions = await generator.generateTransactions();
    const predictions = await generator.generatePredictions();
    const insights = await generator.generateRealTimeInsights();
    
    // Customize the data for the customer
    const personalizedData = this.customizeDemoData(transactions, predictions, insights, customizations);
    
    // Save personalized demo data
    const demoDataFile = path.join(this.demosDir, `${demoData.id}_data.json`);
    fs.writeFileSync(demoDataFile, JSON.stringify(personalizedData, null, 2));
    
    console.log(`✅ Personalized demo data generated`);
    return personalizedData;
  }

  customizeDemoData(transactions, predictions, insights, customizations) {
    // Customize practice name and details
    const customizedTransactions = transactions.map(txn => ({
      ...txn,
      location: customizations.locations > 1 ? this.getRandomLocation(customizations.locations) : 'Main',
      treatment: customizations.treatments.includes(txn.treatment) ? txn.treatment : 
                 customizations.treatments[Math.floor(Math.random() * customizations.treatments.length)]
    }));
    
    // Adjust revenue predictions based on customer size
    const revenueMultiplier = customizations.revenue / 2100000; // Base on urban scenario
    const customizedPredictions = predictions.map(pred => ({
      ...pred,
      predictedRevenue: Math.round(pred.predictedRevenue * revenueMultiplier)
    }));
    
    // Customize insights
    const customizedInsights = {
      ...insights,
      currentBookings: `${Math.round(85 + Math.random() * 10)}% capacity today`,
      liveRevenue: `$${Math.round(customizations.revenue / 365 * 0.6).toLocaleString()} (${new Date().toLocaleTimeString()} snapshot)`,
      performanceKPIs: `${Math.round(20 + Math.random() * 10)}% above monthly target`
    };
    
    return {
      customizations,
      transactions: customizedTransactions,
      predictions: customizedPredictions,
      insights: customizedInsights,
      reconciliationStats: this.generateReconciliationStats(customizedTransactions),
      businessMetrics: this.generateBusinessMetrics(customizedTransactions)
    };
  }

  getRandomLocation(locationCount) {
    const locations = ['Downtown', 'Suburban', 'Uptown', 'Westside', 'Eastside'];
    return locations[Math.floor(Math.random() * Math.min(locationCount, locations.length))];
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
      totalTransactions: transactions.length
    };
  }

  createCalendarInvite(demoData) {
    const startTime = new Date(demoData.scheduledFor);
    const endTime = new Date(startTime.getTime() + demoData.duration * 60 * 1000);
    
    return {
      subject: `MedSpa Analytics Pro Demo - ${demoData.customerId}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: demoData.duration,
      attendees: demoData.attendees,
      meetingLink: `https://meet.medspasync.com/demo/${demoData.id}`,
      dialIn: '+1-555-123-4567',
      passcode: '123456'
    };
  }

  async sendDemoConfirmation(customerId, demoData, calendarInvite) {
    console.log(`📧 Sending demo confirmation to ${customerId}...`);
    
    const customer = await this.getCustomerProfile(customerId);
    const emailTemplate = this.generateDemoConfirmationEmail(customer, demoData, calendarInvite);
    
    // In a real implementation, this would send an actual email
    const emailFile = path.join(this.demosDir, `${demoData.id}_email.json`);
    fs.writeFileSync(emailFile, JSON.stringify(emailTemplate, null, 2));
    
    console.log(`✅ Demo confirmation email prepared`);
    return emailTemplate;
  }

  generateDemoConfirmationEmail(customer, demoData, calendarInvite) {
    
    return {
      to: customer.profile.email,
      subject: calendarInvite.subject,
      body: `
Dear ${customer.profile.contactName},

Thank you for scheduling your MedSpa Analytics Pro demo!

**Demo Details:**
- Date: ${new Date(demoData.scheduledFor).toLocaleDateString()}
- Time: ${new Date(demoData.scheduledFor).toLocaleTimeString()}
- Duration: ${demoData.duration} minutes
- Type: ${demoData.type} demo

**Meeting Information:**
- Join: ${calendarInvite.meetingLink}
- Dial-in: ${calendarInvite.dialIn}
- Passcode: ${calendarInvite.passcode}

**What to Expect:**
- Executive overview of ROI and business impact
- Technical demonstration of platform capabilities
- Personalized insights for ${customer.profile.name}
- Q&A session

**Preparation:**
- Please have your team ready to discuss current challenges
- We'll customize the demo based on your specific needs
- Feel free to share any questions in advance

We look forward to showing you how MedSpa Analytics Pro can transform your practice!

Best regards,
The MedSpa Analytics Pro Team
      `,
      attachments: [
        {
          name: 'demo_preparation_guide.pdf',
          type: 'application/pdf',
          content: 'Demo preparation guide content...'
        }
      ]
    };
  }

  // Automated onboarding system
  async generateOnboarding(customerId) {
    console.log(`🚀 Generating onboarding for ${customerId}...`);
    
    const customer = await this.getCustomerProfile(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const onboardingId = `onboarding_${customerId}_${Date.now()}`;
    const onboardingData = {
      id: onboardingId,
      customerId: customerId,
      status: 'pending',
      created: new Date().toISOString(),
      steps: this.generateOnboardingSteps(customer),
      timeline: this.generateOnboardingTimeline(),
      resources: this.generateOnboardingResources(customer),
      contacts: this.generateOnboardingContacts()
    };

    // Save onboarding data
    const onboardingFile = path.join(this.onboardingDir, `${onboardingId}.json`);
    fs.writeFileSync(onboardingFile, JSON.stringify(onboardingData, null, 2));
    
    // Update customer profile
    await this.updateCustomerProfile(customerId, { 
      onboarding: onboardingId,
      status: 'onboarding'
    });
    
    // Send onboarding welcome email
    await this.sendOnboardingWelcome(customerId, onboardingData);
    
    console.log(`✅ Onboarding generated: ${onboardingId}`);
    return onboardingData;
  }

  generateOnboardingSteps(customer) {
    return [
      {
        step: 1,
        title: 'Platform Access Setup',
        description: 'Configure user accounts and access permissions',
        duration: '1-2 hours',
        status: 'pending',
        assignee: 'Technical Team',
        resources: ['user_guide.pdf', 'access_setup_video.mp4']
      },
      {
        step: 2,
        title: 'Data Integration',
        description: 'Connect your PMS and payment systems',
        duration: '2-4 hours',
        status: 'pending',
        assignee: 'Integration Team',
        resources: ['integration_guide.pdf', 'api_documentation.pdf']
      },
      {
        step: 3,
        title: 'Custom Configuration',
        description: 'Configure treatments, staff, and business rules',
        duration: '1-2 hours',
        status: 'pending',
        assignee: 'Customer Success',
        resources: ['configuration_guide.pdf', 'best_practices.pdf']
      },
      {
        step: 4,
        title: 'Team Training',
        description: 'Train your team on platform features',
        duration: '2-3 hours',
        status: 'pending',
        assignee: 'Training Team',
        resources: ['training_materials.pdf', 'video_tutorials.zip']
      },
      {
        step: 5,
        title: 'Go-Live Support',
        description: 'Launch with dedicated support',
        duration: '1 week',
        status: 'pending',
        assignee: 'Support Team',
        resources: ['support_guide.pdf', 'emergency_contacts.pdf']
      }
    ];
  }

  generateOnboardingTimeline() {
    const startDate = new Date();
    return [
      {
        phase: 'Week 1',
        activities: ['Platform setup', 'Data integration', 'Initial configuration'],
        milestones: ['Access granted', 'Data connected', 'Basic setup complete']
      },
      {
        phase: 'Week 2',
        activities: ['Advanced configuration', 'Team training', 'Testing'],
        milestones: ['Custom setup complete', 'Team trained', 'System tested']
      },
      {
        phase: 'Week 3',
        activities: ['Go-live preparation', 'Final testing', 'Launch'],
        milestones: ['Ready for launch', 'All systems tested', 'Live in production']
      }
    ];
  }

  generateOnboardingResources(customer) {
    return {
      documentation: [
        'user_guide.pdf',
        'admin_guide.pdf',
        'api_documentation.pdf',
        'best_practices.pdf'
      ],
      videos: [
        'platform_overview.mp4',
        'dashboard_tutorial.mp4',
        'reconciliation_guide.mp4',
        'analytics_tutorial.mp4'
      ],
      templates: [
        'staff_roles_template.xlsx',
        'treatment_configuration.xlsx',
        'business_rules_template.xlsx'
      ],
      support: [
        'support_portal_url',
        'emergency_contact_info',
        'knowledge_base_url'
      ]
    };
  }

  generateOnboardingContacts() {
    return {
      customerSuccess: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@medspasync.com',
        phone: '+1-555-123-4567',
        role: 'Customer Success Manager'
      },
      technicalSupport: {
        name: 'Mike Chen',
        email: 'mike.chen@medspasync.com',
        phone: '+1-555-123-4568',
        role: 'Technical Support Lead'
      },
      integration: {
        name: 'Lisa Rodriguez',
        email: 'lisa.rodriguez@medspasync.com',
        phone: '+1-555-123-4569',
        role: 'Integration Specialist'
      }
    };
  }

  async sendOnboardingWelcome(customerId, onboardingData) {
    console.log(`📧 Sending onboarding welcome to ${customerId}...`);
    
    const customer = await this.getCustomerProfile(customerId);
    const emailTemplate = {
      to: customer.profile.email,
      subject: `Welcome to MedSpa Analytics Pro - Onboarding Started`,
      body: `
Dear ${customer.profile.contactName},

Welcome to MedSpa Analytics Pro! We're excited to help you transform your practice with AI-powered analytics.

**Your Onboarding Journey:**
We've created a personalized onboarding plan with ${onboardingData.steps.length} steps designed specifically for ${customer.profile.name}.

**Next Steps:**
1. Review your onboarding plan in the customer portal
2. Schedule your platform setup session
3. Prepare your team for training

**Your Dedicated Team:**
- Customer Success: ${onboardingData.contacts.customerSuccess.name}
- Technical Support: ${onboardingData.contacts.technicalSupport.name}
- Integration: ${onboardingData.contacts.integration.name}

**Timeline:** 3 weeks to full implementation
**Support:** 24/7 technical support available

We'll be in touch within 24 hours to schedule your first session.

Welcome aboard!

Best regards,
The MedSpa Analytics Pro Team
      `,
      attachments: [
        {
          name: 'onboarding_plan.pdf',
          type: 'application/pdf',
          content: JSON.stringify(onboardingData, null, 2)
        }
      ]
    };
    
    const emailFile = path.join(this.onboardingDir, `${onboardingData.id}_welcome_email.json`);
    fs.writeFileSync(emailFile, JSON.stringify(emailTemplate, null, 2));
    
    console.log(`✅ Onboarding welcome email prepared`);
    return emailTemplate;
  }

  // Automated follow-up system
  async sendFollowUp(customerId, followUpType = 'post-demo') {
    console.log(`📧 Sending ${followUpType} follow-up to ${customerId}...`);
    
    const customer = await this.getCustomerProfile(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const followUpData = {
      id: `followup_${customerId}_${Date.now()}`,
      customerId: customerId,
      type: followUpType,
      sent: new Date().toISOString(),
      content: this.generateFollowUpContent(customer, followUpType)
    };

    // Send follow-up email
    const emailTemplate = this.generateFollowUpEmail(customer, followUpData);
    
    // Save follow-up data
    const followUpFile = path.join(this.customersDir, `${customerId}_followups.json`);
    let followUps = [];
    if (fs.existsSync(followUpFile)) {
      followUps = JSON.parse(fs.readFileSync(followUpFile, 'utf8'));
    }
    followUps.push(followUpData);
    fs.writeFileSync(followUpFile, JSON.stringify(followUps, null, 2));
    
    // Update customer profile
    customer.followUps.push(followUpData.id);
    await this.updateCustomerProfile(customerId, { followUps: customer.followUps });
    
    console.log(`✅ Follow-up sent: ${followUpData.id}`);
    return followUpData;
  }

  generateFollowUpContent(customer, followUpType) {
    const templates = {
      'post-demo': {
        subject: 'MedSpa Analytics Pro Demo - Next Steps',
        body: `
Dear ${customer.profile.contactName},

Thank you for attending your MedSpa Analytics Pro demo! We hope you found the session valuable and can see how our platform can transform ${customer.profile.name}.

**Key Benefits for Your Practice:**
- ${customer.profile.revenue ? `Revenue optimization for your $${(customer.profile.revenue / 1000000).toFixed(1)}M practice` : 'Revenue optimization'}
- Time savings of 18+ hours per week on reconciliation
- 94.7% accurate revenue predictions
- Real-time insights and alerts

**Next Steps:**
1. Schedule a technical deep-dive (30 minutes)
2. Receive your custom proposal
3. Begin onboarding process

**Resources:**
- Demo recording: [Link]
- Technical specifications: [Link]
- ROI calculator: [Link]

Would you like to schedule your technical deep-dive this week?

Best regards,
The MedSpa Analytics Pro Team
        `
      },
      'post-proposal': {
        subject: 'Your MedSpa Analytics Pro Proposal - Questions?',
        body: `
Dear ${customer.profile.contactName},

I hope you've had a chance to review your personalized MedSpa Analytics Pro proposal for ${customer.profile.name}.

**Proposal Highlights:**
- Customized for your ${customer.profile.locations} location(s)
- ROI projection: 300%+ within 6 months
- Implementation timeline: 3 weeks
- Dedicated support team

**Questions or Concerns?**
I'm here to address any questions about:
- Technical implementation
- Pricing and ROI
- Timeline and process
- Custom features

**Next Steps:**
1. Schedule a proposal review call
2. Begin contract negotiations
3. Plan implementation timeline

When would be a good time to discuss your proposal?

Best regards,
The MedSpa Analytics Pro Team
        `
      },
      'onboarding-check': {
        subject: 'How is your MedSpa Analytics Pro onboarding going?',
        body: `
Dear ${customer.profile.contactName},

I wanted to check in on your MedSpa Analytics Pro onboarding progress for ${customer.profile.name}.

**Current Status:** Week ${Math.floor((Date.now() - new Date(customer.created).getTime()) / (7 * 24 * 60 * 60 * 1000))} of 3

**How can we help?**
- Technical questions or issues?
- Additional training needed?
- Configuration assistance?
- Integration support?

**Resources:**
- Support portal: [Link]
- Knowledge base: [Link]
- Video tutorials: [Link]

Please let us know if you need any assistance!

Best regards,
The MedSpa Analytics Pro Team
        `
      }
    };

    return templates[followUpType] || templates['post-demo'];
  }

  generateFollowUpEmail(customer, followUpData) {
    return {
      to: customer.profile.email,
      subject: followUpData.content.subject,
      body: followUpData.content.body,
      attachments: [
        {
          name: 'medspasync_proposal.pdf',
          type: 'application/pdf',
          content: 'Custom proposal content...'
        }
      ]
    };
  }

  // Dashboard and reporting
  async generateDashboard() {
    console.log('📊 Generating automated demo dashboard...');
    
    const customers = this.getAllCustomers();
    const demos = this.getAllDemos();
    const onboarding = this.getAllOnboarding();
    
    const dashboard = {
      generated: new Date().toISOString(),
      summary: {
        totalCustomers: customers.length,
        activeDemos: demos.filter(d => d.status === 'scheduled').length,
        activeOnboarding: onboarding.filter(o => o.status === 'pending').length,
        conversionRate: this.calculateConversionRate(customers)
      },
      customers: customers.map(c => ({
        id: c.id,
        name: c.profile.name,
        status: c.status,
        demos: c.demos.length,
        lastActivity: c.lastActivity || c.created
      })),
      recentDemos: demos.slice(-5).map(d => ({
        id: d.id,
        customerId: d.customerId,
        scheduledFor: d.scheduledFor,
        status: d.status
      })),
      recentOnboarding: onboarding.slice(-5).map(o => ({
        id: o.id,
        customerId: o.customerId,
        status: o.status,
        created: o.created
      }))
    };
    
    const dashboardFile = path.join(__dirname, '..', 'data', 'dashboard.json');
    fs.writeFileSync(dashboardFile, JSON.stringify(dashboard, null, 2));
    
    console.log('✅ Dashboard generated');
    return dashboard;
  }

  getAllCustomers() {
    const customers = [];
    if (fs.existsSync(this.customersDir)) {
      const files = fs.readdirSync(this.customersDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const customer = JSON.parse(fs.readFileSync(path.join(this.customersDir, file), 'utf8'));
          customers.push(customer);
        }
      });
    }
    return customers;
  }

  getAllDemos() {
    const demos = [];
    if (fs.existsSync(this.demosDir)) {
      const files = fs.readdirSync(this.demosDir);
      files.forEach(file => {
        if (file.endsWith('.json') && !file.includes('_data') && !file.includes('_email')) {
          const demo = JSON.parse(fs.readFileSync(path.join(this.demosDir, file), 'utf8'));
          demos.push(demo);
        }
      });
    }
    return demos;
  }

  getAllOnboarding() {
    const onboarding = [];
    if (fs.existsSync(this.onboardingDir)) {
      const files = fs.readdirSync(this.onboardingDir);
      files.forEach(file => {
        if (file.endsWith('.json') && !file.includes('_email')) {
          const onboardingData = JSON.parse(fs.readFileSync(path.join(this.onboardingDir, file), 'utf8'));
          onboarding.push(onboardingData);
        }
      });
    }
    return onboarding;
  }

  calculateConversionRate(customers) {
    const prospects = customers.filter(c => c.status === 'prospect').length;
    const converted = customers.filter(c => c.status === 'onboarding' || c.status === 'active').length;
    return prospects > 0 ? ((converted / prospects) * 100).toFixed(1) : '0.0';
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1];
  const customerId = args.find(arg => arg.startsWith('--customer='))?.split('=')[1];
  
  const system = new AutomatedDemoSystem();
  
  try {
    switch (action) {
      case 'schedule-demo':
        if (!customerId) {
          console.error('Customer ID required for demo scheduling');
          process.exit(1);
        }
        
        // Create sample customer if doesn't exist
        let customer = await system.getCustomerProfile(customerId);
        if (!customer) {
          customer = await system.createCustomerProfile(customerId, {
            name: 'Sample Medical Spa',
            contactName: 'Dr. John Smith',
            email: 'john.smith@samplemedspa.com',
            revenue: 2500000,
            locations: 1,
            staff: 10,
            treatments: ['Botox', 'Juvederm', 'CoolSculpting', 'Hydrafacials']
          });
        }
        
        const demoData = await system.scheduleDemo(customerId, {
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 30,
          type: 'executive',
          scenario: 'urban',
          attendees: ['Dr. John Smith', 'Practice Manager']
        });
        
        console.log('✅ Demo scheduled successfully');
        break;
        
      case 'generate-onboarding':
        if (!customerId) {
          console.error('Customer ID required for onboarding generation');
          process.exit(1);
        }
        
        const onboardingData = await system.generateOnboarding(customerId);
        console.log('✅ Onboarding generated successfully');
        break;
        
      case 'send-followup':
        if (!customerId) {
          console.error('Customer ID required for follow-up');
          process.exit(1);
        }
        
        const followUpType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'post-demo';
        const followUpData = await system.sendFollowUp(customerId, followUpType);
        console.log('✅ Follow-up sent successfully');
        break;
        
      case 'dashboard':
        const dashboard = await system.generateDashboard();
        console.log('✅ Dashboard generated successfully');
        console.log(`📊 Summary: ${dashboard.summary.totalCustomers} customers, ${dashboard.summary.activeDemos} active demos, ${dashboard.summary.conversionRate}% conversion rate`);
        break;
        
      default:
        console.log('Available actions:');
        console.log('  --action=schedule-demo --customer=<id>');
        console.log('  --action=generate-onboarding --customer=<id>');
        console.log('  --action=send-followup --customer=<id> [--type=post-demo|post-proposal|onboarding-check]');
        console.log('  --action=dashboard');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { AutomatedDemoSystem }; 