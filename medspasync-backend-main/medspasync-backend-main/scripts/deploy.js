#!/usr/bin/env node

/**
 * MedSpaSync Pro - Multi-Environment Deployment Script
 * 
 * This script handles deployment across all environments in the MedSpaSync Pro ecosystem.
 * Supports development, staging, production, and demo environments.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const environmentManager = require('../config/environment-manager');
const { validateEnvironmentVariables, generateEnvironmentTemplate } = require('../config/environment-schemas');

class DeploymentManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.deploymentLog = [];
    this.startTime = new Date();
  }

  /**
   * Log deployment step
   */
  log(step, message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      step,
      message,
      status,
      environment: this.environment
    };
    
    this.deploymentLog.push(logEntry);
    console.log(`[${timestamp}] [${status}] [${step}] ${message}`);
  }

  /**
   * Execute command with error handling
   */
  executeCommand(command, description) {
    try {
      this.log('EXECUTE', `Running: ${description}`);
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: this.environment }
      });
      this.log('SUCCESS', `${description} completed successfully`);
      return output;
    } catch (error) {
      this.log('ERROR', `${description} failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Validate environment before deployment
   */
  async validateEnvironment() {
    this.log('VALIDATE', 'Starting environment validation');
    
    try {
      // Validate environment variables
      const validation = validateEnvironmentVariables(this.environment);
      if (!validation.isValid) {
        this.log('ERROR', `Environment validation failed: ${validation.errors.join(', ')}`, 'ERROR');
        throw new Error('Environment validation failed');
      }

      // Perform health checks
      const healthChecks = await environmentManager.performHealthChecks();
      if (!healthChecks.overall) {
        this.log('WARNING', 'Some health checks failed, but continuing deployment', 'WARNING');
      }

      this.log('SUCCESS', 'Environment validation completed');
      return { validation, healthChecks };
    } catch (error) {
      this.log('ERROR', `Environment validation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Install dependencies
   */
  installDependencies() {
    this.log('INSTALL', 'Installing Node.js dependencies');
    
    try {
      // Remove existing node_modules for clean install
      if (fs.existsSync('node_modules')) {
        this.executeCommand('rm -rf node_modules', 'Remove existing node_modules');
      }

      // Install dependencies
      this.executeCommand('npm install', 'Install npm dependencies');
      
      // Generate Prisma client
      this.executeCommand('npm run prisma:generate', 'Generate Prisma client');
      
      this.log('SUCCESS', 'Dependencies installed successfully');
    } catch (error) {
      this.log('ERROR', `Dependency installation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    this.log('MIGRATE', 'Running database migrations');
    
    try {
      const config = environmentManager.getConfigSection('database');
      
      if (!config.url && !config.mongoUrl) {
        this.log('SKIP', 'No database configured, skipping migrations');
        return;
      }

      // Run Prisma migrations
      if (config.url) {
        this.executeCommand('npm run prisma:migrate', 'Run Prisma migrations');
      }

      this.log('SUCCESS', 'Database migrations completed');
    } catch (error) {
      this.log('ERROR', `Database migration failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Build application
   */
  buildApplication() {
    this.log('BUILD', 'Building application');
    
    try {
      // Run tests
      this.executeCommand('npm test', 'Run test suite');
      
      // Build application
      this.executeCommand('npm run build', 'Build application');
      
      this.log('SUCCESS', 'Application built successfully');
    } catch (error) {
      this.log('ERROR', `Build failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Deploy to environment
   */
  async deployToEnvironment() {
    this.log('DEPLOY', `Deploying to ${this.environment} environment`);
    
    try {
      switch (this.environment) {
        case 'development':
          await this.deployDevelopment();
          break;
        case 'staging':
          await this.deployStaging();
          break;
        case 'production':
          await this.deployProduction();
          break;
        case 'demo':
          await this.deployDemo();
          break;
        default:
          throw new Error(`Unknown environment: ${this.environment}`);
      }
      
      this.log('SUCCESS', `Deployment to ${this.environment} completed`);
    } catch (error) {
      this.log('ERROR', `Deployment failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Deploy to development environment
   */
  async deployDevelopment() {
    this.log('DEV_DEPLOY', 'Deploying to development environment');
    
    // Start development server
    this.executeCommand('npm run dev', 'Start development server');
  }

  /**
   * Deploy to staging environment
   */
  async deployStaging() {
    this.log('STAGING_DEPLOY', 'Deploying to staging environment');
    
    // Build Docker image
    this.executeCommand('docker build -t medspasync-staging .', 'Build staging Docker image');
    
    // Deploy with Docker Compose
    this.executeCommand('docker-compose -f docker-compose.staging.yml up -d', 'Deploy staging with Docker Compose');
  }

  /**
   * Deploy to production environment
   */
  async deployProduction() {
    this.log('PROD_DEPLOY', 'Deploying to production environment');
    
    // Build production Docker image
    this.executeCommand('docker build -t medspasync-production .', 'Build production Docker image');
    
    // Deploy with production Docker Compose
    this.executeCommand('docker-compose -f docker-compose.production.yml up -d', 'Deploy production with Docker Compose');
    
    // Run health checks
    await this.runHealthChecks();
  }

  /**
   * Deploy to demo environment
   */
  async deployDemo() {
    this.log('DEMO_DEPLOY', 'Deploying to demo environment');
    
    // Build demo Docker image
    this.executeCommand('docker build -t medspasync-demo .', 'Build demo Docker image');
    
    // Deploy with demo Docker Compose
    this.executeCommand('docker-compose -f docker-compose.demo.yml up -d', 'Deploy demo with Docker Compose');
  }

  /**
   * Run post-deployment health checks
   */
  async runHealthChecks() {
    this.log('HEALTH_CHECK', 'Running post-deployment health checks');
    
    try {
      // Wait for services to start
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Perform health checks
      const healthChecks = await environmentManager.performHealthChecks();
      
      if (healthChecks.overall) {
        this.log('SUCCESS', 'All health checks passed');
      } else {
        this.log('WARNING', 'Some health checks failed', 'WARNING');
        Object.entries(healthChecks).forEach(([service, status]) => {
          if (service !== 'overall') {
            this.log('HEALTH', `${service}: ${status ? 'OK' : 'FAILED'}`, status ? 'INFO' : 'WARNING');
          }
        });
      }
    } catch (error) {
      this.log('ERROR', `Health check failed: ${error.message}`, 'ERROR');
    }
  }

  /**
   * Generate deployment report
   */
  generateDeploymentReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const report = {
      deployment: {
        environment: this.environment,
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${duration}ms`,
        status: this.deploymentLog.some(log => log.status === 'ERROR') ? 'FAILED' : 'SUCCESS'
      },
      logs: this.deploymentLog,
      summary: {
        totalSteps: this.deploymentLog.length,
        successfulSteps: this.deploymentLog.filter(log => log.status === 'SUCCESS').length,
        failedSteps: this.deploymentLog.filter(log => log.status === 'ERROR').length,
        warnings: this.deploymentLog.filter(log => log.status === 'WARNING').length
      }
    };

    // Save report to file
    const reportPath = `deployment-${this.environment}-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('REPORT', `Deployment report saved to ${reportPath}`);
    
    return report;
  }

  /**
   * Main deployment process
   */
  async deploy() {
    try {
      this.log('START', `Starting deployment to ${this.environment} environment`);
      
      // Validate environment
      await this.validateEnvironment();
      
      // Install dependencies
      this.installDependencies();
      
      // Run migrations
      await this.runMigrations();
      
      // Build application
      this.buildApplication();
      
      // Deploy to environment
      await this.deployToEnvironment();
      
      // Generate report
      const report = this.generateDeploymentReport();
      
      this.log('COMPLETE', `Deployment completed successfully in ${report.deployment.duration}`);
      
      return report;
    } catch (error) {
      this.log('FAILED', `Deployment failed: ${error.message}`, 'ERROR');
      
      // Generate failure report
      const report = this.generateDeploymentReport();
      
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const deploymentManager = new DeploymentManager();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'deploy':
      deploymentManager.deploy()
        .then(report => {
          console.log('\n🎉 Deployment completed successfully!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Deployment failed!');
          process.exit(1);
        });
      break;
      
    case 'validate':
      deploymentManager.validateEnvironment()
        .then(() => {
          console.log('\n✅ Environment validation passed!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Environment validation failed!');
          process.exit(1);
        });
      break;
      
    case 'health':
      environmentManager.performHealthChecks()
        .then(health => {
          console.log('\n🏥 Health Check Results:');
          Object.entries(health).forEach(([service, status]) => {
            console.log(`  ${service}: ${status ? '✅' : '❌'}`);
          });
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Health check failed!');
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
MedSpaSync Pro - Deployment Manager

Usage:
  node scripts/deploy.js deploy     - Deploy to current environment
  node scripts/deploy.js validate   - Validate environment configuration
  node scripts/deploy.js health     - Run health checks

Environment: ${deploymentManager.environment}
      `);
      process.exit(0);
  }
}

module.exports = DeploymentManager; 