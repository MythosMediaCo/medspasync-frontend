#!/usr/bin/env node

/**
 * Security Audit Script for MedSpaSync Pro
 * Validates authentication, authorization, and security configurations
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.routes = [];
    this.securityIssues = [];
    this.warnings = [];
    this.passCount = 0;
    this.failCount = 0;
  }

  /**
   * Scan all route files for security middleware
   */
  async scanRoutes() {
    console.log('🔍 Scanning API routes for security middleware...\n');
    
    const routeFiles = [
      'routes/aiReconciliation.js',
      'routes/auth.js',
      'routes/health.js',
      'routes/clients.js',
      'routes/appointments.js',
      'routes/services.js',
      'routes/staff.js',
      'routes/practices.js'
    ];

    for (const routeFile of routeFiles) {
      await this.analyzeRouteFile(routeFile);
    }

    // Scan server routes
    const serverRouteDir = path.join(__dirname, '../server/routes');
    if (fs.existsSync(serverRouteDir)) {
      await this.scanDirectory(serverRouteDir);
    }
  }

  /**
   * Analyze a single route file
   */
  async analyzeRouteFile(routeFile) {
    const fullPath = path.join(__dirname, '..', routeFile);
    
    if (!fs.existsSync(fullPath)) {
      this.warnings.push(`Route file not found: ${routeFile}`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`📁 Analyzing: ${routeFile}`);
    
    // Check for authentication middleware
    const hasAuth = this.checkForAuthMiddleware(content);
    const hasRBAC = this.checkForRBACMiddleware(content);
    const hasRateLimit = this.checkForRateLimit(content);
    const hasValidation = this.checkForValidation(content);
    
    // Identify sensitive endpoints
    const sensitiveEndpoints = this.identifySensitiveEndpoints(content);
    
    // Report findings
    this.reportRouteFindings(routeFile, {
      hasAuth,
      hasRBAC,
      hasRateLimit,
      hasValidation,
      sensitiveEndpoints
    });
  }

  /**
   * Check for authentication middleware usage
   */
  checkForAuthMiddleware(content) {
    const authPatterns = [
      /require.*auth\.middleware/,
      /require.*authenticateToken/,
      /auth\.middleware/,
      /authenticateToken/,
      /requireAuth/,
      /@require_auth/
    ];
    
    return authPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check for RBAC middleware usage
   */
  checkForRBACMiddleware(content) {
    const rbacPatterns = [
      /requireRole/,
      /require_role/,
      /@require_role/,
      /role.*middleware/,
      /authorization/
    ];
    
    return rbacPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check for rate limiting
   */
  checkForRateLimit(content) {
    const rateLimitPatterns = [
      /rateLimiter/,
      /rate.*limit/,
      /throttle/,
      /rateLimit/
    ];
    
    return rateLimitPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check for input validation
   */
  checkForValidation(content) {
    const validationPatterns = [
      /validation/,
      /validate/,
      /joi/,
      /yup/,
      /express-validator/
    ];
    
    return validationPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Identify sensitive endpoints that need protection
   */
  identifySensitiveEndpoints(content) {
    const sensitivePatterns = [
      /\/users?/,
      /\/clients?/,
      /\/appointments?/,
      /\/payments?/,
      /\/billing/,
      /\/admin/,
      /\/settings/,
      /\/profile/,
      /\/data/,
      /\/export/,
      /\/import/
    ];
    
    const endpoints = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(line)) {
          endpoints.push({
            line: index + 1,
            pattern: pattern.source,
            content: line.trim()
          });
        }
      });
    });
    
    return endpoints;
  }

  /**
   * Report findings for a route file
   */
  reportRouteFindings(routeFile, findings) {
    const { hasAuth, hasRBAC, hasRateLimit, hasValidation, sensitiveEndpoints } = findings;
    
    console.log(`  ✅ Authentication: ${hasAuth ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ RBAC: ${hasRBAC ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Rate Limiting: ${hasRateLimit ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Validation: ${hasValidation ? 'PASS' : 'FAIL'}`);
    
    if (sensitiveEndpoints.length > 0) {
      console.log(`  ⚠️  Sensitive endpoints found: ${sensitiveEndpoints.length}`);
      sensitiveEndpoints.forEach(endpoint => {
        console.log(`     Line ${endpoint.line}: ${endpoint.content}`);
      });
    }
    
    // Track statistics
    if (hasAuth && hasRBAC) {
      this.passCount++;
    } else {
      this.failCount++;
      this.securityIssues.push({
        file: routeFile,
        issue: 'Missing authentication or authorization',
        details: { hasAuth, hasRBAC }
      });
    }
    
    console.log('');
  }

  /**
   * Scan directory recursively
   */
  async scanDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (file.endsWith('.js')) {
        await this.analyzeRouteFile(fullPath.replace(__dirname + '/../', ''));
      }
    }
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment() {
    console.log('🔧 Validating environment configuration...\n');
    
    const requiredEnvVars = [
      'JWT_SECRET',
      'DATABASE_URL',
      'NODE_ENV'
    ];
    
    const optionalEnvVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'EMAIL_PASSWORD',
      'ENCRYPTION_KEY'
    ];
    
    console.log('Required Environment Variables:');
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`  ✅ ${varName}: ${value ? 'SET' : 'NOT SET'}`);
        this.passCount++;
      } else {
        console.log(`  ❌ ${varName}: NOT SET`);
        this.failCount++;
        this.securityIssues.push({
          file: 'Environment',
          issue: `Missing required environment variable: ${varName}`
        });
      }
    });
    
    console.log('\nOptional Environment Variables:');
    optionalEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`  ✅ ${varName}: SET`);
        this.passCount++;
      } else {
        console.log(`  ⚠️  ${varName}: NOT SET (optional)`);
        this.warnings.push(`Optional environment variable not set: ${varName}`);
      }
    });
    
    console.log('');
  }

  /**
   * Check for hardcoded secrets
   */
  checkForHardcodedSecrets() {
    console.log('🔐 Checking for hardcoded secrets...\n');
    
    const secretPatterns = [
      /sk_test_[a-zA-Z0-9]+/,
      /sk_live_[a-zA-Z0-9]+/,
      /pk_test_[a-zA-Z0-9]+/,
      /pk_live_[a-zA-Z0-9]+/,
      /whsec_[a-zA-Z0-9]+/,
      /[a-zA-Z0-9]{64,}/, // Long strings that might be secrets
      /password.*['"][^'"]{8,}['"]/,
      /secret.*['"][^'"]{8,}['"]/
    ];
    
    const filesToCheck = [
      'config/environment-manager.js',
      'config/environment-schemas.js',
      'config/environment.js',
      'middleware/auth.middleware.js',
      'services/authService.js'
    ];
    
    let foundSecrets = 0;
    
    filesToCheck.forEach(file => {
      const fullPath = path.join(__dirname, '..', file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          secretPatterns.forEach(pattern => {
            if (pattern.test(line)) {
              console.log(`  ❌ ${file}:${index + 1} - Potential secret found`);
              console.log(`     ${line.trim()}`);
              foundSecrets++;
              this.securityIssues.push({
                file: `${file}:${index + 1}`,
                issue: 'Potential hardcoded secret found',
                details: line.trim()
              });
            }
          });
        });
      }
    });
    
    if (foundSecrets === 0) {
      console.log('  ✅ No hardcoded secrets found');
      this.passCount++;
    } else {
      this.failCount++;
    }
    
    console.log('');
  }

  /**
   * Generate security report
   */
  generateReport() {
    console.log('📊 Security Audit Report');
    console.log('=' .repeat(50));
    console.log(`Total Checks: ${this.passCount + this.failCount}`);
    console.log(`Passed: ${this.passCount}`);
    console.log(`Failed: ${this.failCount}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Security Issues: ${this.securityIssues.length}`);
    
    if (this.securityIssues.length > 0) {
      console.log('\n🚨 Security Issues Found:');
      this.securityIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.file}`);
        console.log(`   Issue: ${issue.issue}`);
        if (issue.details) {
          console.log(`   Details: ${JSON.stringify(issue.details)}`);
        }
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n' + '=' .repeat(50));
    
    if (this.failCount === 0) {
      console.log('🎉 All security checks passed!');
      process.exit(0);
    } else {
      console.log('❌ Security issues found. Please address them before deployment.');
      process.exit(1);
    }
  }

  /**
   * Run complete security audit
   */
  async run() {
    console.log('🔒 MedSpaSync Pro Security Audit');
    console.log('=' .repeat(50));
    console.log('');
    
    await this.scanRoutes();
    this.validateEnvironment();
    this.checkForHardcodedSecrets();
    this.generateReport();
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.run().catch(console.error);
}

module.exports = SecurityAuditor; 