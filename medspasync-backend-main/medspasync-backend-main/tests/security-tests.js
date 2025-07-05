/**
 * Security Testing Suite
 * Comprehensive security tests for MedSpaSync Pro API
 */

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class SecurityTestSuite {
  constructor() {
    this.testResults = [];
    this.failures = [];
    this.passes = 0;
    this.total = 0;
  }

  /**
   * Run all security tests
   */
  async runAllTests() {
    console.log('🔒 Running Security Test Suite...\n');

    await this.testAuthentication();
    await this.testAuthorization();
    await this.testRateLimiting();
    await this.testInputValidation();
    await this.testSQLInjection();
    await this.testXSS();
    await this.testCSRF();
    await this.testPathTraversal();
    await this.testSecurityHeaders();
    await this.testErrorHandling();
    await this.testAPIKeyValidation();
    await this.testDDoSProtection();

    this.generateReport();
  }

  /**
   * Test authentication mechanisms
   */
  async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    // Test valid login
    await this.runTest('Valid Login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'validpassword'
        });
      
      return response.status === 200 && response.body.token;
    });

    // Test invalid credentials
    await this.runTest('Invalid Credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      return response.status === 401;
    });

    // Test missing token
    await this.runTest('Missing Token', async () => {
      const response = await request(app)
        .get('/api/protected-route');
      
      return response.status === 401;
    });

    // Test invalid token
    await this.runTest('Invalid Token', async () => {
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', 'Bearer invalid-token');
      
      return response.status === 403;
    });

    // Test expired token
    await this.runTest('Expired Token', async () => {
      const expiredToken = jwt.sign(
        { id: 'test', exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET || 'test-secret'
      );
      
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      return response.status === 403;
    });
  }

  /**
   * Test authorization and RBAC
   */
  async testAuthorization() {
    console.log('🔑 Testing Authorization...');
    
    // Test admin access
    await this.runTest('Admin Access', async () => {
      const adminToken = this.generateToken('ADMIN');
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      return response.status === 200;
    });

    // Test unauthorized access
    await this.runTest('Unauthorized Access', async () => {
      const userToken = this.generateToken('STAFF');
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);
      
      return response.status === 403;
    });

    // Test role-based access
    await this.runTest('Role-Based Access', async () => {
      const managerToken = this.generateToken('MANAGER');
      const response = await request(app)
        .get('/api/staff/manage')
        .set('Authorization', `Bearer ${managerToken}`);
      
      return response.status === 200;
    });
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting() {
    console.log('⏱️  Testing Rate Limiting...');
    
    // Test basic rate limiting
    await this.runTest('Basic Rate Limiting', async () => {
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(
          request(app)
            .get('/api/test-endpoint')
            .set('Authorization', `Bearer ${this.generateToken('STAFF')}`)
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);
      
      return rateLimited.length > 0;
    });

    // Test burst protection
    await this.runTest('Burst Protection', async () => {
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/sensitive-endpoint')
            .set('Authorization', `Bearer ${this.generateToken('STAFF')}`)
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);
      
      return rateLimited.length > 0;
    });
  }

  /**
   * Test input validation
   */
  async testInputValidation() {
    console.log('✅ Testing Input Validation...');
    
    // Test email validation
    await this.runTest('Email Validation', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password'
        });
      
      return response.status === 400;
    });

    // Test required fields
    await this.runTest('Required Fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        });
      
      return response.status === 400;
    });

    // Test data types
    await this.runTest('Data Type Validation', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${this.generateToken('ADMIN')}`)
        .send({
          email: 'test@example.com',
          age: 'not-a-number',
          role: 'INVALID_ROLE'
        });
      
      return response.status === 400;
    });
  }

  /**
   * Test SQL injection protection
   */
  async testSQLInjection() {
    console.log('💉 Testing SQL Injection Protection...');
    
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "1' OR '1' = '1' --",
      "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com'); --"
    ];

    for (const payload of sqlInjectionPayloads) {
      await this.runTest(`SQL Injection: ${payload.substring(0, 20)}...`, async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'password'
          });
        
        // Should not return 500 (server error) or expose database info
        return response.status !== 500 && 
               !response.text.includes('syntax error') &&
               !response.text.includes('SQL');
      });
    }
  }

  /**
   * Test XSS protection
   */
  async testXSS() {
    console.log('🛡️  Testing XSS Protection...');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      '"><script>alert("XSS")</script>',
      '&#60;script&#62;alert("XSS")&#60;/script&#62;'
    ];

    for (const payload of xssPayloads) {
      await this.runTest(`XSS: ${payload.substring(0, 20)}...`, async () => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${this.generateToken('ADMIN')}`)
          .send({
            name: payload,
            email: 'test@example.com'
          });
        
        // Should sanitize or reject the payload
        return response.status === 400 || 
               (response.status === 200 && !response.text.includes(payload));
      });
    }
  }

  /**
   * Test CSRF protection
   */
  async testCSRF() {
    console.log('🔄 Testing CSRF Protection...');
    
    // Test without CSRF token
    await this.runTest('CSRF Token Required', async () => {
      const response = await request(app)
        .post('/api/sensitive-action')
        .set('Authorization', `Bearer ${this.generateToken('ADMIN')}`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('action=delete&id=1');
      
      return response.status === 403;
    });

    // Test with invalid CSRF token
    await this.runTest('Invalid CSRF Token', async () => {
      const response = await request(app)
        .post('/api/sensitive-action')
        .set('Authorization', `Bearer ${this.generateToken('ADMIN')}`)
        .set('X-CSRF-Token', 'invalid-token')
        .send('action=delete&id=1');
      
      return response.status === 403;
    });
  }

  /**
   * Test path traversal protection
   */
  async testPathTraversal() {
    console.log('📁 Testing Path Traversal Protection...');
    
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ];

    for (const payload of pathTraversalPayloads) {
      await this.runTest(`Path Traversal: ${payload.substring(0, 20)}...`, async () => {
        const response = await request(app)
          .get(`/api/files/${payload}`)
          .set('Authorization', `Bearer ${this.generateToken('STAFF')}`);
        
        return response.status === 400 || response.status === 404;
      });
    }
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders() {
    console.log('🛡️  Testing Security Headers...');
    
    await this.runTest('Security Headers Present', async () => {
      const response = await request(app)
        .get('/api/health');
      
      const headers = response.headers;
      
      return headers['x-content-type-options'] === 'nosniff' &&
             headers['x-frame-options'] === 'DENY' &&
             headers['x-xss-protection'] === '1; mode=block' &&
             !headers['x-powered-by'];
    });

    await this.runTest('CORS Headers', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://evil.com');
      
      return response.status === 403 || 
             !response.headers['access-control-allow-origin'];
    });
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('❌ Testing Error Handling...');
    
    // Test internal error exposure
    await this.runTest('No Internal Error Exposure', async () => {
      const response = await request(app)
        .get('/api/trigger-error')
        .set('Authorization', `Bearer ${this.generateToken('ADMIN')}`);
      
      const body = response.body;
      
      return !body.stack &&
             !body.message.includes('internal') &&
             !body.message.includes('database');
    });

    // Test error logging
    await this.runTest('Error Logging', async () => {
      const response = await request(app)
        .get('/api/trigger-error');
      
      // Should return a request ID for tracking
      return response.body.requestId && 
             response.body.requestId.length > 0;
    });
  }

  /**
   * Test API key validation
   */
  async testAPIKeyValidation() {
    console.log('🔑 Testing API Key Validation...');
    
    // Test missing API key
    await this.runTest('Missing API Key', async () => {
      const response = await request(app)
        .get('/api/external/data');
      
      return response.status === 401;
    });

    // Test invalid API key
    await this.runTest('Invalid API Key', async () => {
      const response = await request(app)
        .get('/api/external/data')
        .set('X-API-Key', 'invalid-key');
      
      return response.status === 401;
    });

    // Test expired API key
    await this.runTest('Expired API Key', async () => {
      const response = await request(app)
        .get('/api/external/data')
        .set('X-API-Key', 'expired-key');
      
      return response.status === 401;
    });
  }

  /**
   * Test DDoS protection
   */
  async testDDoSProtection() {
    console.log('🚫 Testing DDoS Protection...');
    
    await this.runTest('DDoS Protection', async () => {
      const promises = [];
      for (let i = 0; i < 200; i++) {
        promises.push(
          request(app)
            .get('/api/test-endpoint')
            .set('X-Forwarded-For', '192.168.1.1')
        );
      }
      
      const responses = await Promise.all(promises);
      const blocked = responses.filter(r => r.status === 429 || r.status === 403);
      
      return blocked.length > 0;
    });
  }

  /**
   * Generate JWT token for testing
   */
  generateToken(role = 'STAFF') {
    return jwt.sign(
      {
        id: crypto.randomUUID(),
        email: 'test@example.com',
        role: role,
        exp: Math.floor(Date.now() / 1000) + 3600
      },
      process.env.JWT_SECRET || 'test-secret'
    );
  }

  /**
   * Run individual test
   */
  async runTest(name, testFunction) {
    this.total++;
    
    try {
      const result = await testFunction();
      
      if (result) {
        console.log(`  ✅ ${name}`);
        this.passes++;
        this.testResults.push({ name, status: 'PASS' });
      } else {
        console.log(`  ❌ ${name}`);
        this.failures.push({ name, error: 'Test failed' });
        this.testResults.push({ name, status: 'FAIL' });
      }
    } catch (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
      this.failures.push({ name, error: error.message });
      this.testResults.push({ name, status: 'ERROR' });
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 Security Test Report');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.total}`);
    console.log(`Passed: ${this.passes}`);
    console.log(`Failed: ${this.failures.length}`);
    console.log(`Success Rate: ${((this.passes / this.total) * 100).toFixed(1)}%`);
    
    if (this.failures.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.failures.forEach(failure => {
        console.log(`  - ${failure.name}: ${failure.error}`);
      });
    }
    
    console.log('\n' + '=' .repeat(50));
    
    if (this.failures.length === 0) {
      console.log('🎉 All security tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Security issues found. Please address them.');
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new SecurityTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = SecurityTestSuite; 