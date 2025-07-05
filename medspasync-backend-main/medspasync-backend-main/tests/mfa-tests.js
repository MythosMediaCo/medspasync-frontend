/**
 * Multi-Factor Authentication Test Suite
 * Comprehensive testing for TOTP, SMS, and hardware token MFA
 */

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const mfaMiddleware = require('../middleware/mfa');

class MFATestSuite {
  constructor() {
    this.testResults = [];
    this.failures = [];
    this.passes = 0;
    this.total = 0;
    this.testUsers = new Map();
  }

  /**
   * Run all MFA tests
   */
  async runAllTests() {
    console.log('🔐 Running Multi-Factor Authentication Test Suite...\n');

    await this.testTOTPSetup();
    await this.testTOTPVerification();
    await this.testSMSSetup();
    await this.testSMSVerification();
    await this.testBackupCodes();
    await this.testHardwareTokens();
    await this.testMFAMiddleware();
    await this.testMFARoutes();
    await this.testSecurityFeatures();
    await this.testIntegration();

    this.generateReport();
  }

  /**
   * Test TOTP setup
   */
  async testTOTPSetup() {
    console.log('📱 Testing TOTP Setup...');
    
    // Test successful TOTP setup
    await this.runTest('TOTP Setup Success', async () => {
      const user = await this.createTestUser('TOTP_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      return response.status === 200 && 
             response.body.secret &&
             response.body.qrCode &&
             response.body.backupCodes &&
             response.body.backupCodes.length === 10;
    });

    // Test duplicate TOTP setup
    await this.runTest('TOTP Setup Duplicate', async () => {
      const user = await this.createTestUser('TOTP_DUP_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // First setup
      await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      // Second setup should fail
      const response = await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      return response.status === 400 && 
             response.body.error === 'TOTP already enabled';
    });

    // Test unauthorized TOTP setup
    await this.runTest('TOTP Setup Unauthorized', async () => {
      const response = await request(app)
        .post('/api/mfa/totp/setup')
        .send({});
      
      return response.status === 401;
    });
  }

  /**
   * Test TOTP verification
   */
  async testTOTPVerification() {
    console.log('🔢 Testing TOTP Verification...');
    
    // Test valid TOTP verification
    await this.runTest('TOTP Verification Success', async () => {
      const user = await this.createTestUser('TOTP_VERIFY_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup TOTP
      const setupResponse = await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      const secret = setupResponse.body.secret;
      const totpToken = speakeasy.totp({
        secret: secret,
        encoding: 'base32'
      });
      
      // Verify TOTP
      const response = await request(app)
        .post('/api/mfa/totp/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: totpToken });
      
      return response.status === 200 && response.body.verified === true;
    });

    // Test invalid TOTP verification
    await this.runTest('TOTP Verification Invalid', async () => {
      const user = await this.createTestUser('TOTP_INVALID_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/totp/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: '123456' });
      
      return response.status === 401 && 
             response.body.error === 'Invalid token';
    });

    // Test missing TOTP token
    await this.runTest('TOTP Verification Missing Token', async () => {
      const user = await this.createTestUser('TOTP_MISSING_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/totp/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      return response.status === 400 && 
             response.body.error === 'Token required';
    });
  }

  /**
   * Test SMS setup
   */
  async testSMSSetup() {
    console.log('📞 Testing SMS Setup...');
    
    // Test successful SMS setup
    await this.runTest('SMS Setup Success', async () => {
      const user = await this.createTestUser('SMS_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/sms/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber: '+1234567890' });
      
      return response.status === 200 && 
             response.body.phoneNumber === '+1234567890';
    });

    // Test invalid phone number
    await this.runTest('SMS Setup Invalid Phone', async () => {
      const user = await this.createTestUser('SMS_INVALID_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/sms/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber: 'invalid-phone' });
      
      return response.status === 400 && 
             response.body.error === 'Invalid phone number';
    });

    // Test missing phone number
    await this.runTest('SMS Setup Missing Phone', async () => {
      const user = await this.createTestUser('SMS_MISSING_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/sms/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      return response.status === 400 && 
             response.body.error === 'Phone number required';
    });
  }

  /**
   * Test SMS verification
   */
  async testSMSVerification() {
    console.log('📱 Testing SMS Verification...');
    
    // Test SMS verification (mock)
    await this.runTest('SMS Verification Mock', async () => {
      const user = await this.createTestUser('SMS_VERIFY_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup SMS
      await request(app)
        .post('/api/mfa/sms/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber: '+1234567890' });
      
      // Mock verification (in real test, would use actual SMS code)
      const response = await request(app)
        .post('/api/mfa/sms/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '123456' });
      
      // Should fail with invalid code (expected behavior)
      return response.status === 401;
    });

    // Test SMS resend
    await this.runTest('SMS Resend', async () => {
      const user = await this.createTestUser('SMS_RESEND_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup SMS first
      await request(app)
        .post('/api/mfa/sms/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber: '+1234567890' });
      
      // Resend SMS
      const response = await request(app)
        .post('/api/mfa/sms/resend')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      return response.status === 200 && 
             response.body.message === 'SMS verification code resent';
    });
  }

  /**
   * Test backup codes
   */
  async testBackupCodes() {
    console.log('🔑 Testing Backup Codes...');
    
    // Test backup code generation
    await this.runTest('Backup Codes Generation', async () => {
      const user = await this.createTestUser('BACKUP_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/backup/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      return response.status === 200 && 
             response.body.backupCodes &&
             response.body.backupCodes.length === 10;
    });

    // Test backup code verification (mock)
    await this.runTest('Backup Codes Verification Mock', async () => {
      const user = await this.createTestUser('BACKUP_VERIFY_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Generate backup codes
      const generateResponse = await request(app)
        .post('/api/mfa/backup/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      const backupCode = generateResponse.body.backupCodes[0];
      
      // Verify backup code
      const response = await request(app)
        .post('/api/mfa/backup/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ backupCode: backupCode });
      
      // Should succeed with valid backup code
      return response.status === 200 && response.body.verified === true;
    });

    // Test invalid backup code
    await this.runTest('Backup Codes Invalid', async () => {
      const user = await this.createTestUser('BACKUP_INVALID_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/backup/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ backupCode: 'INVALID' });
      
      return response.status === 401 && 
             response.body.error === 'Invalid backup code';
    });
  }

  /**
   * Test hardware tokens
   */
  async testHardwareTokens() {
    console.log('🔐 Testing Hardware Tokens...');
    
    // Test hardware token setup
    await this.runTest('Hardware Token Setup', async () => {
      const user = await this.createTestUser('HARDWARE_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .post('/api/mfa/hardware/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tokenId: 'test-token-id',
          publicKey: 'test-public-key',
          tokenType: 'FIDO2'
        });
      
      return response.status === 200 && 
             response.body.tokenId === 'test-token-id';
    });

    // Test hardware token verification (mock)
    await this.runTest('Hardware Token Verification Mock', async () => {
      const user = await this.createTestUser('HARDWARE_VERIFY_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup hardware token
      await request(app)
        .post('/api/mfa/hardware/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tokenId: 'test-token-id',
          publicKey: 'test-public-key',
          tokenType: 'FIDO2'
        });
      
      // Verify hardware token
      const response = await request(app)
        .post('/api/mfa/hardware/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tokenId: 'test-token-id',
          signature: 'test-signature'
        });
      
      // Should succeed with valid hardware token
      return response.status === 200 && response.body.verified === true;
    });
  }

  /**
   * Test MFA middleware
   */
  async testMFAMiddleware() {
    console.log('🛡️ Testing MFA Middleware...');
    
    // Test MFA requirement detection
    await this.runTest('MFA Requirement Detection', async () => {
      const user = await this.createTestUser('MFA_MIDDLEWARE_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup TOTP to enable MFA
      await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      // Check MFA status
      const response = await request(app)
        .get('/api/mfa/status')
        .set('Authorization', `Bearer ${token}`);
      
      return response.status === 200 && 
             response.body.required === true;
    });

    // Test MFA verification middleware
    await this.runTest('MFA Verification Middleware', async () => {
      const user = await this.createTestUser('MFA_VERIFY_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup TOTP
      const setupResponse = await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      const secret = setupResponse.body.secret;
      const totpToken = speakeasy.totp({
        secret: secret,
        encoding: 'base32'
      });
      
      // Verify through middleware
      const response = await request(app)
        .post('/api/mfa/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          method: 'TOTP',
          token: totpToken 
        });
      
      return response.status === 200 && response.body.verified === true;
    });
  }

  /**
   * Test MFA routes
   */
  async testMFARoutes() {
    console.log('🛣️ Testing MFA Routes...');
    
    // Test MFA status route
    await this.runTest('MFA Status Route', async () => {
      const user = await this.createTestUser('MFA_ROUTES_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .get('/api/mfa/status')
        .set('Authorization', `Bearer ${token}`);
      
      return response.status === 200 && 
             response.body.userId === user.id;
    });

    // Test MFA logs route
    await this.runTest('MFA Logs Route', async () => {
      const user = await this.createTestUser('MFA_LOGS_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .get('/api/mfa/logs')
        .set('Authorization', `Bearer ${token}`);
      
      return response.status === 200 && 
             Array.isArray(response.body.logs);
    });

    // Test MFA statistics route (admin only)
    await this.runTest('MFA Statistics Route Admin', async () => {
      const adminUser = await this.createTestUser('MFA_ADMIN_USER');
      const adminToken = this.generateToken(adminUser.id, 'ADMIN');
      
      const response = await request(app)
        .get('/api/mfa/statistics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      return response.status === 200 && 
             response.body.statistics;
    });

    // Test MFA statistics route (non-admin)
    await this.runTest('MFA Statistics Route Non-Admin', async () => {
      const user = await this.createTestUser('MFA_NON_ADMIN_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const response = await request(app)
        .get('/api/mfa/statistics')
        .set('Authorization', `Bearer ${token}`);
      
      return response.status === 403;
    });
  }

  /**
   * Test security features
   */
  async testSecurityFeatures() {
    console.log('🔒 Testing MFA Security Features...');
    
    // Test rate limiting on MFA endpoints
    await this.runTest('MFA Rate Limiting', async () => {
      const user = await this.createTestUser('MFA_RATE_LIMIT_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/mfa/totp/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: '123456' })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);
      
      return rateLimited.length > 0;
    });

    // Test MFA lockout after failed attempts
    await this.runTest('MFA Lockout Protection', async () => {
      const user = await this.createTestUser('MFA_LOCKOUT_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup TOTP
      await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      // Make multiple failed attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/mfa/totp/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({ token: '000000' });
      }
      
      // Should be locked out
      const response = await request(app)
        .post('/api/mfa/totp/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: '123456' });
      
      return response.status === 401 && 
             response.body.message.includes('locked');
    });

    // Test session-based MFA verification
    await this.runTest('MFA Session Verification', async () => {
      const user = await this.createTestUser('MFA_SESSION_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup and verify TOTP
      const setupResponse = await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      const secret = setupResponse.body.secret;
      const totpToken = speakeasy.totp({
        secret: secret,
        encoding: 'base32'
      });
      
      await request(app)
        .post('/api/mfa/totp/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: totpToken });
      
      // Should not require MFA again in same session
      const statusResponse = await request(app)
        .get('/api/mfa/status')
        .set('Authorization', `Bearer ${token}`);
      
      return statusResponse.status === 200;
    });
  }

  /**
   * Test integration scenarios
   */
  async testIntegration() {
    console.log('🔗 Testing MFA Integration...');
    
    // Test multiple MFA methods for same user
    await this.runTest('Multiple MFA Methods', async () => {
      const user = await this.createTestUser('MFA_MULTI_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup TOTP
      await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      // Setup SMS
      await request(app)
        .post('/api/mfa/sms/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber: '+1234567890' });
      
      // Check status
      const response = await request(app)
        .get('/api/mfa/status')
        .set('Authorization', `Bearer ${token}`);
      
      return response.status === 200 && 
             response.body.methods.length >= 2;
    });

    // Test MFA method disable
    await this.runTest('MFA Method Disable', async () => {
      const user = await this.createTestUser('MFA_DISABLE_USER');
      const token = this.generateToken(user.id, 'STAFF');
      
      // Setup TOTP
      await request(app)
        .post('/api/mfa/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      // Disable TOTP
      const response = await request(app)
        .delete('/api/mfa/method/TOTP')
        .set('Authorization', `Bearer ${token}`);
      
      return response.status === 200 && 
             response.body.message.includes('disabled');
    });

    // Test MFA with different user roles
    await this.runTest('MFA Role-Based Access', async () => {
      const adminUser = await this.createTestUser('MFA_ADMIN_ROLE_USER');
      const staffUser = await this.createTestUser('MFA_STAFF_ROLE_USER');
      
      const adminToken = this.generateToken(adminUser.id, 'ADMIN');
      const staffToken = this.generateToken(staffUser.id, 'STAFF');
      
      // Admin should access statistics
      const adminResponse = await request(app)
        .get('/api/mfa/statistics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Staff should not access statistics
      const staffResponse = await request(app)
        .get('/api/mfa/statistics')
        .set('Authorization', `Bearer ${staffToken}`);
      
      return adminResponse.status === 200 && 
             staffResponse.status === 403;
    });
  }

  /**
   * Create test user
   */
  async createTestUser(email) {
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      email: `${email}_${Date.now()}@test.com`,
      role: 'STAFF'
    };
    
    this.testUsers.set(userId, user);
    return user;
  }

  /**
   * Generate JWT token for testing
   */
  generateToken(userId, role = 'STAFF') {
    return jwt.sign(
      {
        id: userId,
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
    console.log('\n📊 MFA Test Report');
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
      console.log('🎉 All MFA tests passed!');
      process.exit(0);
    } else {
      console.log('❌ MFA issues found. Please address them.');
      process.exit(1);
    }
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    // Clean up test users and data
    for (const [userId, user] of this.testUsers) {
      try {
        // Clean up MFA data
        await mfaMiddleware.disableMFAMethod(userId, 'TOTP');
        await mfaMiddleware.disableMFAMethod(userId, 'SMS');
        await mfaMiddleware.disableMFAMethod(userId, 'HARDWARE');
      } catch (error) {
        console.error(`Failed to cleanup user ${userId}:`, error);
      }
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new MFATestSuite();
  testSuite.runAllTests()
    .then(() => testSuite.cleanup())
    .catch(console.error);
}

module.exports = MFATestSuite; 