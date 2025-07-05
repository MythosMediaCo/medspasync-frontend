#!/usr/bin/env node

/**
 * Test Runner for MedSpaSync Pro Reporting System
 * Executes comprehensive tests and provides detailed results
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bright');
  console.log('='.repeat(60));
}

function logSection(message) {
  console.log('\n' + '-'.repeat(40));
  log(message, 'cyan');
  console.log('-'.repeat(40));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test configuration
const testConfig = {
  timeout: 30000,
  verbose: true,
  coverage: true,
  parallel: false
};

// Test suites
const testSuites = [
  {
    name: 'Unit Tests',
    file: 'tests/reporting-system.test.js',
    description: 'Individual component testing'
  },
  {
    name: 'Integration Tests',
    file: 'tests/reporting-integration.test.js',
    description: 'End-to-end workflow testing'
  },
  {
    name: 'API Tests',
    file: 'tests/reporting-api.test.js',
    description: 'REST API endpoint testing'
  },
  {
    name: 'Security Tests',
    file: 'tests/reporting-security.test.js',
    description: 'Security and compliance testing'
  }
];

// Environment setup
function setupTestEnvironment() {
  logSection('Setting up test environment');
  
  try {
    // Check if .env.test exists
    const envTestPath = path.join(__dirname, '..', '.env.test');
    if (!fs.existsSync(envTestPath)) {
      logWarning('Creating .env.test file for testing');
      const envTestContent = `
# Test Environment Configuration
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/medspasync_test
JWT_SECRET=test-jwt-secret-key-for-testing-only
ENCRYPTION_KEY=test-encryption-key-32-chars-long
UPLOAD_DIR=./test-uploads
TEMPLATES_DIR=./test-templates
REPORTS_DIR=./test-reports
LOG_LEVEL=error
      `.trim();
      
      fs.writeFileSync(envTestPath, envTestContent);
      logSuccess('Created .env.test file');
    }

    // Create test directories
    const testDirs = ['test-uploads', 'test-templates', 'test-reports'];
    testDirs.forEach(dir => {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logSuccess(`Created test directory: ${dir}`);
      }
    });

    // Install test dependencies if needed
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    
    if (!packageJson.devDependencies?.jest) {
      logWarning('Installing test dependencies...');
      execSync('npm install --save-dev jest supertest @types/jest', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    }

    logSuccess('Test environment setup complete');
  } catch (error) {
    logError(`Failed to setup test environment: ${error.message}`);
    process.exit(1);
  }
}

// Database setup
async function setupTestDatabase() {
  logSection('Setting up test database');
  
  try {
    // Check if PostgreSQL is running
    execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
    logSuccess('PostgreSQL is running');
    
    // Create test database if it doesn't exist
    try {
      execSync('createdb medspasync_test', { stdio: 'pipe' });
      logSuccess('Created test database: medspasync_test');
    } catch (error) {
      if (error.message.includes('already exists')) {
        logInfo('Test database already exists');
      } else {
        throw error;
      }
    }

    // Run database migrations
    logInfo('Running database migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: 'postgresql://test:test@localhost:5432/medspasync_test' }
    });
    
    logSuccess('Database setup complete');
  } catch (error) {
    logError(`Failed to setup test database: ${error.message}`);
    logWarning('Make sure PostgreSQL is running and accessible');
    process.exit(1);
  }
}

// Run individual test suite
function runTestSuite(suite) {
  logSection(`Running ${suite.name}`);
  logInfo(suite.description);
  
  try {
    const testFile = path.join(__dirname, '..', suite.file);
    
    if (!fs.existsSync(testFile)) {
      logWarning(`Test file not found: ${suite.file}`);
      return { success: false, skipped: true };
    }

    const startTime = Date.now();
    
    // Run the test file
    execSync(`node ${testFile}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' },
      timeout: testConfig.timeout
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    logSuccess(`${suite.name} completed in ${duration}s`);
    return { success: true, duration };
    
  } catch (error) {
    logError(`${suite.name} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  logHeader('MedSpaSync Pro Reporting System - Test Suite');
  
  const results = {
    total: testSuites.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    suites: []
  };

  const startTime = Date.now();

  for (const suite of testSuites) {
    const result = runTestSuite(suite);
    results.suites.push({ ...suite, ...result });
    
    if (result.success) {
      results.passed++;
    } else if (result.skipped) {
      results.skipped++;
    } else {
      results.failed++;
    }
  }

  results.duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Generate test report
  generateTestReport(results);
  
  return results;
}

// Generate test report
function generateTestReport(results) {
  logHeader('Test Results Summary');
  
  console.log(`\n📊 Test Execution Summary:`);
  console.log(`   Total Suites: ${results.total}`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Duration: ${results.duration}s`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`   Success Rate: ${successRate}%`);
  
  console.log(`\n📋 Detailed Results:`);
  results.suites.forEach(suite => {
    const status = suite.success ? '✅ PASS' : suite.skipped ? '⏭️  SKIP' : '❌ FAIL';
    const duration = suite.duration ? ` (${suite.duration}s)` : '';
    console.log(`   ${status} ${suite.name}${duration}`);
    
    if (suite.error) {
      console.log(`      Error: ${suite.error}`);
    }
  });

  // Save report to file
  const reportPath = path.join(__dirname, '..', 'test-report.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      duration: results.duration,
      successRate: parseFloat(successRate)
    },
    suites: results.suites.map(suite => ({
      name: suite.name,
      description: suite.description,
      success: suite.success,
      skipped: suite.skipped,
      duration: suite.duration,
      error: suite.error
    }))
  };

  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  logSuccess(`Test report saved to: ${reportPath}`);

  // Exit with appropriate code
  if (results.failed > 0) {
    logError('Some tests failed. Please review the results above.');
    process.exit(1);
  } else {
    logSuccess('All tests passed! 🎉');
    process.exit(0);
  }
}

// Cleanup function
function cleanup() {
  logSection('Cleaning up test environment');
  
  try {
    // Remove test files
    const testFiles = ['test-uploads', 'test-templates', 'test-reports'];
    testFiles.forEach(dir => {
      const dirPath = path.join(__dirname, '..', dir);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        logSuccess(`Cleaned up: ${dir}`);
      }
    });

    // Remove test report
    const reportPath = path.join(__dirname, '..', 'test-report.json');
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
      logSuccess('Removed test report');
    }

    logSuccess('Cleanup complete');
  } catch (error) {
    logWarning(`Cleanup warning: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    // Setup
    setupTestEnvironment();
    await setupTestDatabase();
    
    // Run tests
    const results = await runAllTests();
    
    // Cleanup
    cleanup();
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logWarning('\nTest execution interrupted by user');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logWarning('\nTest execution terminated');
  cleanup();
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  setupTestEnvironment,
  setupTestDatabase,
  cleanup
}; 