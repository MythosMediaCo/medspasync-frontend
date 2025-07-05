#!/usr/bin/env node

/**
 * Simplified Security Test for MedSpaSync Pro
 * Tests basic security configurations without Azure Key Vault dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 MedSpaSync Pro - Security Validation');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;
let warnings = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}: PASSED`);
    passed++;
  } else {
    console.log(`❌ ${name}: FAILED - ${details}`);
    failed++;
  }
}

function warn(name, condition, details = '') {
  if (condition) {
    console.log(`⚠️  ${name}: WARNING - ${details}`);
    warnings++;
  } else {
    console.log(`✅ ${name}: PASSED`);
    passed++;
  }
}

// Test 1: Check for .env files in gitignore
console.log('\n📁 Testing file security...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  test('Gitignore Configuration', 
       gitignoreContent.includes('.env') || gitignoreContent.includes('*.env'),
       '.env files not properly ignored');
} else {
  test('Gitignore Configuration', false, '.gitignore file not found');
}

// Test 2: Check for hardcoded secrets in package.json
console.log('\n📦 Testing package.json security...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const secretPatterns = [
    /sk_test_[a-zA-Z0-9]+/,
    /sk_live_[a-zA-Z0-9]+/,
    /password\s*[:=]\s*['"][^'"]+['"]/,
    /secret\s*[:=]\s*['"][^'"]+['"]/
  ];
  
  let hasSecrets = false;
  for (const pattern of secretPatterns) {
    if (pattern.test(packageContent)) {
      hasSecrets = true;
      break;
    }
  }
  
  test('Package.json Security', !hasSecrets, 'Contains hardcoded secrets');
} else {
  test('Package.json Security', false, 'package.json not found');
}

// Test 3: Check for Azure Key Vault dependencies
console.log('\n🔐 Testing Azure Key Vault dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
const azureIdentityPath = path.join(nodeModulesPath, '@azure', 'identity');
const azureKeyVaultPath = path.join(nodeModulesPath, '@azure', 'keyvault-secrets');

test('Azure Identity Package', fs.existsSync(azureIdentityPath), 'Azure Identity not installed');
test('Azure Key Vault Secrets Package', fs.existsSync(azureKeyVaultPath), 'Azure Key Vault Secrets not installed');

// Test 4: Check for security middleware dependencies
console.log('\n🛡️ Testing security middleware dependencies...');
const helmetPath = path.join(nodeModulesPath, 'helmet');
const corsPath = path.join(nodeModulesPath, 'cors');
const bcryptPath = path.join(nodeModulesPath, 'bcryptjs');
const jwtPath = path.join(nodeModulesPath, 'jsonwebtoken');

test('Helmet Security Headers', fs.existsSync(helmetPath), 'Helmet not installed');
test('CORS Configuration', fs.existsSync(corsPath), 'CORS not installed');
test('Password Hashing (bcryptjs)', fs.existsSync(bcryptPath), 'bcryptjs not installed');
test('JWT Authentication', fs.existsSync(jwtPath), 'jsonwebtoken not installed');

// Test 5: Check for environment configuration files
console.log('\n🌍 Testing environment configuration...');
const envFiles = ['.env', '.env.example', '.env.development', '.env.production'];
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasSecrets = /sk_test_|sk_live_|password\s*=|secret\s*=/.test(envContent);
    warn(`Environment File: ${envFile}`, hasSecrets, 'Contains potential secrets');
  }
}

// Test 6: Check for security configuration in server files
console.log('\n⚙️ Testing server security configuration...');
const serverFiles = ['server.js', 'app.js'];
let securityConfig = '';

for (const file of serverFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    securityConfig += fs.readFileSync(filePath, 'utf8');
  }
}

const securityChecks = [
  { name: 'Helmet Security Headers', pattern: /helmet/ },
  { name: 'CORS Configuration', pattern: /cors/ },
  { name: 'Rate Limiting', pattern: /rate.?limit/ },
  { name: 'Input Validation', pattern: /express.?validator/ },
  { name: 'JWT Authentication', pattern: /jsonwebtoken/ }
];

for (const check of securityChecks) {
  test(`Server Security: ${check.name}`, 
       check.pattern.test(securityConfig), 
       'Not configured in server files');
}

// Test 7: Check for test files
console.log('\n🧪 Testing test configuration...');
const testFiles = [
  'tests/azure-keyvault.test.js',
  'tests/test_unit_api.js',
  '__tests__/auth.test.js'
];

for (const testFile of testFiles) {
  const testPath = path.join(__dirname, testFile);
  warn(`Test File: ${testFile}`, !fs.existsSync(testPath), 'Test file not found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 SECURITY VALIDATION SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed + warnings}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND!');
  console.log('Please address the failed tests before proceeding.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  SECURITY WARNINGS FOUND');
  console.log('Consider addressing the warnings for better security.');
  process.exit(2);
} else {
  console.log('\n🎉 ALL SECURITY TESTS PASSED!');
  console.log('Your application meets basic security requirements.');
  process.exit(0);
} 