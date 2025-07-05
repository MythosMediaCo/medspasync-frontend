#!/usr/bin/env node

/**
 * MedSpa Analytics Pro - Demo Portal
 * Web-based self-service demo and onboarding portal
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { AutomatedDemoSystem } = require('./automated-demo-system.js');

class DemoPortal {
  constructor(port = 3001) {
    this.port = port;
    this.app = express();
    this.demoSystem = new AutomatedDemoSystem();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'portal')));
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'portal', 'views'));
  }

  setupRoutes() {
    // Main portal routes
    this.app.get('/', (req, res) => this.renderHome(req, res));
    this.app.get('/demo', (req, res) => this.renderDemo(req, res));
    this.app.get('/onboarding', (req, res) => this.renderOnboarding(req, res));
    this.app.get('/dashboard', (req, res) => this.renderDashboard(req, res));
    
    // API routes
    this.app.post('/api/schedule-demo', (req, res) => this.scheduleDemo(req, res));
    this.app.post('/api/request-onboarding', (req, res) => this.requestOnboarding(req, res));
    this.app.get('/api/demo/:demoId', (req, res) => this.getDemoData(req, res));
    this.app.get('/api/onboarding/:onboardingId', (req, res) => this.getOnboardingData(req, res));
    this.app.get('/api/dashboard', (req, res) => this.getDashboardData(req, res));
    
    // Demo runner routes
    this.app.get('/demo/:demoId/run', (req, res) => this.runDemo(req, res));
    this.app.get('/demo/:demoId/data', (req, res) => this.getDemoData(req, res));
  }

  async renderHome(req, res) {
    const dashboard = await this.demoSystem.generateDashboard();
    res.render('home', {
      title: 'MedSpa Analytics Pro - Demo Portal',
      dashboard: dashboard.summary,
      recentDemos: dashboard.recentDemos,
      recentOnboarding: dashboard.recentOnboarding
    });
  }

  async renderDemo(req, res) {
    const demoId = req.query.demoId;
    let demoData = null;
    
    if (demoId) {
      demoData = await this.getDemoDataById(demoId);
    }
    
    res.render('demo', {
      title: 'Schedule Your Demo',
      demoId: demoId,
      demoData: demoData
    });
  }

  async renderOnboarding(req, res) {
    const onboardingId = req.query.onboardingId;
    let onboardingData = null;
    
    if (onboardingId) {
      onboardingData = await this.getOnboardingDataById(onboardingId);
    }
    
    res.render('onboarding', {
      title: 'Onboarding Portal',
      onboardingId: onboardingId,
      onboardingData: onboardingData
    });
  }

  async renderDashboard(req, res) {
    const dashboard = await this.demoSystem.generateDashboard();
    res.render('dashboard', {
      title: 'Demo Portal Dashboard',
      dashboard: dashboard
    });
  }

  async scheduleDemo(req, res) {
    try {
      const { customerId, customerInfo, demoConfig } = req.body;
      
      // Create or update customer profile
      let customer = await this.demoSystem.getCustomerProfile(customerId);
      if (!customer) {
        customer = await this.demoSystem.createCustomerProfile(customerId, customerInfo);
      }
      
      // Schedule demo
      const demoData = await this.demoSystem.scheduleDemo(customerId, demoConfig);
      
      res.json({
        success: true,
        demoId: demoData.id,
        message: 'Demo scheduled successfully',
        calendarInvite: {
          meetingLink: `https://meet.medspasync.com/demo/${demoData.id}`,
          dialIn: '+1-555-123-4567',
          passcode: '123456'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async requestOnboarding(req, res) {
    try {
      const { customerId } = req.body;
      
      const onboardingData = await this.demoSystem.generateOnboarding(customerId);
      
      res.json({
        success: true,
        onboardingId: onboardingData.id,
        message: 'Onboarding generated successfully',
        steps: onboardingData.steps,
        timeline: onboardingData.timeline
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDemoData(req, res) {
    try {
      const { demoId } = req.params;
      const demoData = await this.getDemoDataById(demoId);
      
      if (!demoData) {
        return res.status(404).json({ error: 'Demo not found' });
      }
      
      res.json(demoData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOnboardingData(req, res) {
    try {
      const { onboardingId } = req.params;
      const onboardingData = await this.getOnboardingDataById(onboardingId);
      
      if (!onboardingData) {
        return res.status(404).json({ error: 'Onboarding not found' });
      }
      
      res.json(onboardingData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDashboardData(req, res) {
    try {
      const dashboard = await this.demoSystem.generateDashboard();
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async runDemo(req, res) {
    try {
      const { demoId } = req.params;
      const demoData = await this.getDemoDataById(demoId);
      
      if (!demoData) {
        return res.status(404).json({ error: 'Demo not found' });
      }
      
      res.render('demo-runner', {
        title: 'Live Demo - MedSpa Analytics Pro',
        demoId: demoId,
        demoData: demoData
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDemoDataById(demoId) {
    const demoFile = path.join(this.demoSystem.demosDir, `${demoId}_data.json`);
    if (fs.existsSync(demoFile)) {
      return JSON.parse(fs.readFileSync(demoFile, 'utf8'));
    }
    return null;
  }

  async getOnboardingDataById(onboardingId) {
    const onboardingFile = path.join(this.demoSystem.onboardingDir, `${onboardingId}.json`);
    if (fs.existsSync(onboardingFile)) {
      return JSON.parse(fs.readFileSync(onboardingFile, 'utf8'));
    }
    return null;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Demo Portal running on http://localhost:${this.port}`);
      console.log(`📊 Dashboard: http://localhost:${this.port}/dashboard`);
      console.log(`🎯 Demo Scheduler: http://localhost:${this.port}/demo`);
      console.log(`🚀 Onboarding Portal: http://localhost:${this.port}/onboarding`);
    });
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1];
  const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1]) || 3001;
  
  if (action === 'start') {
    // Start the portal
    const portal = new DemoPortal(port);
    portal.start();
  } else {
    console.log('Available actions:');
    console.log('  --action=start --port=3001  # Start demo portal');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DemoPortal }; 