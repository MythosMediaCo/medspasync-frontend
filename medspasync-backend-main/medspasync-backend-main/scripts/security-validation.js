#!/usr/bin/env node

/**
 * MedSpaSync Pro - Security Validation Script
 * 
 * This script performs comprehensive security validation including:
 * - Azure Key Vault integration testing
 * - Environment variable security audit
 * - API security validation
 * - Database connection security
 * - Authentication system validation
 */

const keyVaultManager = require('../config/azure-keyvault');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addTestResult(testName, status, details = '') {
    const result = {
      name: testName,
      status,
      details,
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(result);
    
    switch (status) {
      case 'PASSED':
        this.results.passed++;
        this.log(`${testName}: PASSED`, 'success');
        break;
      case 'FAILED':
        this.results.failed++;
        this.log(`${testName}: FAILED - ${details}`, 'error');
        break;
      case 'WARNING':
        this.results.warnings++;
        this.log(`${testName}: WARNING - ${details}`, 'warning');
        break;
    }
  }

  async validateAzureKeyVault() {
    this.log('🔐 Starting Azure Key Vault validation...');
    
    try {
      // Test Key Vault initialization
      const initialized = await keyVaultManager.initialize();
      
      if (initialized) {
        this.addTestResult('Azure Key Vault Initialization', 'PASSED');
        
        // Test secret retrieval
        try {
          const testSecret = await keyVaultManager.getSecret('JWT-SECRET');
          if (testSecret && testSecret.length > 0) {
            this.addTestResult('Secret Retrieval', 'PASSED');
          } else {
            this.addTestResult('Secret Retrieval', 'WARNING', 'Secret retrieved but appears empty');
          }
        } catch (error) {
          this.addTestResult('Secret Retrieval', 'FAILED', error.message);
        }

        // Test configuration helpers
        try {
          const stripeConfig = await keyVaultManager.getStripeConfig();
          const hasStripeKey = stripeConfig.secretKey && stripeConfig.secretKey.startsWith('sk_');
          
          if (hasStripeKey) {
            this.addTestResult('Stripe Configuration', 'PASSED');
          } else {
            this.addTestResult('Stripe Configuration', 'WARNING', 'Stripe key format appears invalid');
          }
        } catch (error) {
          this.addTestResult('Stripe Configuration', 'FAILED', error.message);
        }

        // Test email configuration
        try {
          const emailConfig = await keyVaultManager.getEmailConfig();
          const hasEmailConfig = emailConfig.user && emailConfig.pass && emailConfig.host;
          
          if (hasEmailConfig) {
            this.addTestResult('Email Configuration', 'PASSED');
          } else {
            this.addTestResult('Email Configuration', 'WARNING', 'Incomplete email configuration');
          }
        } catch (error) {
          this.addTestResult('Email Configuration', 'FAILED', error.message);
        }

      } else {
        this.addTestResult('Azure Key Vault Initialization', 'FAILED', 'Failed to initialize Key Vault');
      }
    } catch (error) {
      this.addTestResult('Azure Key Vault Integration', 'FAILED', error.message);
    }
  }

  validateEnvironmentVariables() {
    this.log('🌍 Validating environment variables...');
    
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'MONGO_URI'
    ];

    const sensitiveEnvVars = [
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'EMAIL_PASS',
      'INTERNAL_API_KEY'
    ];

    // Check for required environment variables
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addTestResult(`Environment Variable: ${envVar}`, 'PASSED');
      } else {
        this.addTestResult(`Environment Variable: ${envVar}`, 'WARNING', 'Not set in environment');
      }
    }

    // Check for hardcoded secrets in environment
    for (const envVar of sensitiveEnvVars) {
      if (process.env[envVar]) {
        const value = process.env[envVar];
        
        // Check if it's a placeholder or default value
        if (value.includes('your_') || value.includes('placeholder') || value === 'secret') {
          this.addTestResult(`Sensitive Environment Variable: ${envVar}`, 'FAILED', 'Contains placeholder value');
        } else if (value.length < 8) {
          this.addTestResult(`Sensitive Environment Variable: ${envVar}`, 'WARNING', 'Value appears too short');
        } else {
          this.addTestResult(`Sensitive Environment Variable: ${envVar}`, 'PASSED');
        }
      }
    }
  }

  validateFileSecurity() {
    this.log('📁 Validating file security...');
    
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.staging',
      'config/database.js',
      'config/email.js'
    ];

    const filesToCheck = [
      'package.json',
      'server.js',
      'app.js'
    ];

    // Check for sensitive files in git
    for (const file of sensitiveFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for hardcoded secrets
        const secretPatterns = [
          /sk_test_[a-zA-Z0-9]+/,
          /sk_live_[a-zA-Z0-9]+/,
          /password\s*[:=]\s*['"][^'"]+['"]/,
          /secret\s*[:=]\s*['"][^'"]+['"]/,
          /api_key\s*[:=]\s*['"][^'"]+['"]/
        ];

        let hasSecrets = false;
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            hasSecrets = true;
            break;
          }
        }

        if (hasSecrets) {
          this.addTestResult(`File Security: ${file}`, 'FAILED', 'Contains hardcoded secrets');
        } else {
          this.addTestResult(`File Security: ${file}`, 'PASSED');
        }
      }
    }

    // Check for .env files in gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      const envPatterns = ['.env', '.env.*', '*.env'];
      
      let envIgnored = false;
      for (const pattern of envPatterns) {
        if (gitignoreContent.includes(pattern)) {
          envIgnored = true;
          break;
        }
      }

      if (envIgnored) {
        this.addTestResult('Gitignore Configuration', 'PASSED');
      } else {
        this.addTestResult('Gitignore Configuration', 'WARNING', '.env files may not be ignored');
      }
    } else {
      this.addTestResult('Gitignore Configuration', 'FAILED', '.gitignore file not found');
    }
  }

  validateAPISecurity() {
    this.log('🔒 Validating API security configuration...');
    
    try {
      // Check if security middleware is properly configured
      const serverPath = path.join(process.cwd(), 'server.js');
      const appPath = path.join(process.cwd(), 'app.js');
      
      let securityConfig = '';
      if (fs.existsSync(serverPath)) {
        securityConfig += fs.readFileSync(serverPath, 'utf8');
      }
      if (fs.existsSync(appPath)) {
        securityConfig += fs.readFileSync(appPath, 'utf8');
      }

      const securityChecks = [
        {
          name: 'Helmet Security Headers',
          pattern: /helmet/,
          required: true
        },
        {
          name: 'CORS Configuration',
          pattern: /cors/,
          required: true
        },
        {
          name: 'Rate Limiting',
          pattern: /rate.?limit/,
          required: true
        },
        {
          name: 'Input Validation',
          pattern: /express.?validator/,
          required: true
        },
        {
          name: 'JWT Authentication',
          pattern: /jsonwebtoken/,
          required: true
        }
      ];

      for (const check of securityChecks) {
        if (check.pattern.test(securityConfig)) {
          this.addTestResult(`API Security: ${check.name}`, 'PASSED');
        } else if (check.required) {
          this.addTestResult(`API Security: ${check.name}`, 'FAILED', 'Not configured');
        } else {
          this.addTestResult(`API Security: ${check.name}`, 'WARNING', 'Not configured');
        }
      }

    } catch (error) {
      this.addTestResult('API Security Configuration', 'FAILED', error.message);
    }
  }

  validateDatabaseSecurity() {
    this.log('🗄️ Validating database security...');
    
    try {
      const mongoUri = process.env.MONGO_URI;
      
      if (mongoUri) {
        // Check for MongoDB connection string security
        if (mongoUri.includes('mongodb://') && !mongoUri.includes('mongodb+srv://')) {
          this.addTestResult('Database Connection', 'WARNING', 'Using non-SSL MongoDB connection');
        } else if (mongoUri.includes('mongodb+srv://')) {
          this.addTestResult('Database Connection', 'PASSED');
        } else {
          this.addTestResult('Database Connection', 'FAILED', 'Invalid MongoDB URI format');
        }

        // Check for credentials in connection string
        if (mongoUri.includes('@') && mongoUri.includes(':')) {
          this.addTestResult('Database Credentials', 'PASSED');
        } else {
          this.addTestResult('Database Credentials', 'WARNING', 'No credentials found in connection string');
        }
      } else {
        this.addTestResult('Database Connection', 'FAILED', 'MONGO_URI not configured');
      }

    } catch (error) {
      this.addTestResult('Database Security', 'FAILED', error.message);
    }
  }

  validateAuthenticationSecurity() {
    this.log('🔐 Validating authentication security...');
    
    const jwtSecret = process.env.JWT_SECRET;
    
    if (jwtSecret) {
      // Check JWT secret strength
      if (jwtSecret.length >= 32) {
        this.addTestResult('JWT Secret Strength', 'PASSED');
      } else {
        this.addTestResult('JWT Secret Strength', 'WARNING', 'JWT secret may be too short');
      }

      // Check if JWT secret is not a default value
      if (jwtSecret === 'your-secret-key' || jwtSecret === 'secret') {
        this.addTestResult('JWT Secret Configuration', 'FAILED', 'Using default JWT secret');
      } else {
        this.addTestResult('JWT Secret Configuration', 'PASSED');
      }
    } else {
      this.addTestResult('JWT Secret Configuration', 'FAILED', 'JWT_SECRET not configured');
    }

    // Check for bcrypt usage
    try {
      const bcryptPath = path.join(process.cwd(), 'node_modules/bcryptjs');
      if (fs.existsSync(bcryptPath)) {
        this.addTestResult('Password Hashing', 'PASSED', 'bcryptjs available for password hashing');
      } else {
        this.addTestResult('Password Hashing', 'WARNING', 'bcryptjs not found');
      }
    } catch (error) {
      this.addTestResult('Password Hashing', 'FAILED', error.message);
    }
  }

  generateSecurityReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    this.log('📊 Generating security validation report...');
    
    const report = {
      summary: {
        totalTests: this.results.tests.length,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      results: this.results.tests,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'security-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 Security report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`⏱️  Duration: ${report.summary.duration}`);
    console.log('='.repeat(60));

    if (report.summary.failed > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.details}`);
        });
    }

    if (report.summary.warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.tests
        .filter(test => test.status === 'WARNING')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.details}`);
        });
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    const failedTests = this.results.tests.filter(test => test.status === 'FAILED');
    const warningTests = this.results.tests.filter(test => test.status === 'WARNING');

    if (failedTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Critical Security Issues',
        items: failedTests.map(test => ({
          issue: test.name,
          description: test.details,
          action: this.getRecommendationAction(test.name)
        }))
      });
    }

    if (warningTests.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Security Improvements',
        items: warningTests.map(test => ({
          issue: test.name,
          description: test.details,
          action: this.getRecommendationAction(test.name)
        }))
      });
    }

    return recommendations;
  }

  getRecommendationAction(testName) {
    const actions = {
      'Azure Key Vault Initialization': 'Configure Azure Key Vault credentials and permissions',
      'Secret Retrieval': 'Verify Azure Key Vault access and secret names',
      'Stripe Configuration': 'Add valid Stripe API keys to Azure Key Vault',
      'Email Configuration': 'Configure email service credentials in Azure Key Vault',
      'Environment Variable': 'Set required environment variables or configure Azure Key Vault',
      'File Security': 'Remove hardcoded secrets and use Azure Key Vault',
      'Gitignore Configuration': 'Add .env files to .gitignore',
      'API Security': 'Implement missing security middleware',
      'Database Connection': 'Use SSL-enabled database connection',
      'JWT Secret Configuration': 'Generate a strong JWT secret and store in Azure Key Vault'
    };

    for (const [key, action] of Object.entries(actions)) {
      if (testName.includes(key)) {
        return action;
      }
    }

    return 'Review and address the specific security issue';
  }

  async runAllValidations() {
    this.log('🚀 Starting comprehensive security validation...');
    
    await this.validateAzureKeyVault();
    this.validateEnvironmentVariables();
    this.validateFileSecurity();
    this.validateAPISecurity();
    this.validateDatabaseSecurity();
    this.validateAuthenticationSecurity();
    
    return this.generateSecurityReport();
  }
}

// Main execution
async function main() {
  const validator = new SecurityValidator();
  
  try {
    await validator.runAllValidations();
    
    // Exit with appropriate code
    if (validator.results.failed > 0) {
      process.exit(1);
    } else if (validator.results.warnings > 0) {
      process.exit(2);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Security validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = SecurityValidator; 