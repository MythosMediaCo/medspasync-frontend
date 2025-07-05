// tests/load-testing/100k-tps-test.js
const autocannon = require('autocannon');
const { performance } = require('perf_hooks');

class LoadTestSuite {
  constructor() {
    this.baseURL = process.env.LOAD_TEST_URL || 'http://localhost:3000';
    this.results = [];
    this.testScenarios = [
      {
        name: 'Authentication Load Test',
        path: '/api/auth/login',
        method: 'POST',
        body: JSON.stringify({
          email: 'test@medspasync.com',
          password: 'testpassword'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Reconciliation API Load Test',
        path: '/api/reconciliation/process',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Analytics Dashboard Load Test',
        path: '/api/analytics/dashboard',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      },
      {
        name: 'Static Assets Load Test',
        path: '/static/js/main.js',
        method: 'GET'
      }
    ];
  }
  
  async run100kTPSTest() {
    console.log('Starting 100K+ TPS Load Test Suite...');
    
    for (const scenario of this.testScenarios) {
      console.log(`\nTesting: ${scenario.name}`);
      
      // Gradual ramp-up test
      await this.rampUpTest(scenario);
      
      // Sustained load test
      await this.sustainedLoadTest(scenario);
      
      // Spike test
      await this.spikeTest(scenario);
      
      // Recovery test
      await this.recoveryTest(scenario);
    }
    
    await this.generateReport();
  }
  
  async rampUpTest(scenario) {
    console.log('  Running ramp-up test...');
    
    const rampUpSteps = [1000, 5000, 10000, 25000, 50000, 75000, 100000];
    
    for (const rps of rampUpSteps) {
      console.log(`    Testing ${rps} RPS...`);
      
      const result = await this.executeLoadTest({
        ...scenario,
        connections: Math.min(rps / 10, 1000), // Max 1000 connections
        pipelining: 10,
        duration: 30, // 30 seconds per step
        requests: rps,
        timeout: 60
      });
      
      this.results.push({
        scenario: scenario.name,
        type: 'ramp-up',
        targetRPS: rps,
        actualRPS: result.requests.average,
        latency: result.latency,
        errors: result.errors,
        timestamp: new Date()
      });
      
      // Check if system can handle the load
      if (result.errors > result.requests.total * 0.01) { // More than 1% errors
        console.log(`    ❌ System stressed at ${rps} RPS (${result.errors} errors)`);
        break;
      } else {
        console.log(`    ✅ Handled ${rps} RPS successfully`);
      }
      
      // Cool down between tests
      await this.sleep(10000);
    }
  }
  
  async sustainedLoadTest(scenario) {
    console.log('  Running sustained load test...');
    
    const result = await this.executeLoadTest({
      ...scenario,
      connections: 1000,
      pipelining: 10,
      duration: 300, // 5 minutes
      amount: 30000000, // 30M requests over 5 minutes = 100K RPS
      timeout: 60
    });
    
    this.results.push({
      scenario: scenario.name,
      type: 'sustained',
      targetRPS: 100000,
      actualRPS: result.requests.average,
      latency: result.latency,
      errors: result.errors,
      duration: 300,
      timestamp: new Date()
    });
    
    console.log(`    Sustained ${result.requests.average} RPS for 5 minutes`);
  }
  
  async spikeTest(scenario) {
    console.log('  Running spike test...');
    
    // Normal load for 60s, spike for 30s, normal for 60s
    const phases = [
      { rps: 10000, duration: 60 },
      { rps: 150000, duration: 30 }, // 50% over target
      { rps: 10000, duration: 60 }
    ];
    
    for (const [index, phase] of phases.entries()) {
      const result = await this.executeLoadTest({
        ...scenario,
        connections: Math.min(phase.rps / 10, 2000),
        pipelining: 10,
        duration: phase.duration,
        amount: phase.rps * phase.duration,
        timeout: 60
      });
      
      this.results.push({
        scenario: scenario.name,
        type: `spike-phase-${index + 1}`,
        targetRPS: phase.rps,
        actualRPS: result.requests.average,
        latency: result.latency,
        errors: result.errors,
        timestamp: new Date()
      });
    }
  }
  
  async recoveryTest(scenario) {
    console.log('  Running recovery test...');
    
    // Test system recovery after overload
    await this.executeLoadTest({
      ...scenario,
      connections: 2000,
      pipelining: 20,
      duration: 60,
      amount: 12000000, // 200K RPS - intentional overload
      timeout: 60
    });
    
    // Wait for system to recover
    await this.sleep(30000);
    
    // Test normal operations after recovery
    const result = await this.executeLoadTest({
      ...scenario,
      connections: 500,
      pipelining: 10,
      duration: 60,
      amount: 6000000, // 100K RPS
      timeout: 60
    });
    
    this.results.push({
      scenario: scenario.name,
      type: 'recovery',
      targetRPS: 100000,
      actualRPS: result.requests.average,
      latency: result.latency,
      errors: result.errors,
      timestamp: new Date()
    });
  }
  
  async executeLoadTest(config) {
    const instance = autocannon({
      url: `${this.baseURL}${config.path}`,
      method: config.method,
      headers: config.headers,
      body: config.body,
      connections: config.connections,
      pipelining: config.pipelining,
      duration: config.duration,
      amount: config.amount,
      timeout: config.timeout,
      
      // Custom options
      setupClient: (client) => {
        client.setMaxListeners(0);
      }
    });
    
    return new Promise((resolve, reject) => {
      autocannon.track(instance, { renderProgressBar: true });
      
      instance.on('done', resolve);
      instance.on('error', reject);
    });
  }
  
  async generateReport() {
    console.log('\n📊 Load Test Results Summary:');
    console.log('=====================================');
    
    const summary = {
      totalTests: this.results.length,
      maxRPS: Math.max(...this.results.map(r => r.actualRPS)),
      avgLatency: this.results.reduce((sum, r) => sum + r.latency.average, 0) / this.results.length,
      totalErrors: this.results.reduce((sum, r) => sum + r.errors, 0),
      passedTests: this.results.filter(r => r.errors < 100).length
    };
    
    console.log(`Maximum RPS Achieved: ${summary.maxRPS.toFixed(0)}`);
    console.log(`Average Latency: ${summary.avgLatency.toFixed(2)}ms`);
    console.log(`Total Errors: ${summary.totalErrors}`);
    console.log(`Passed Tests: ${summary.passedTests}/${summary.totalTests}`);
    
    // Check if 100K+ TPS requirement is met
    if (summary.maxRPS >= 100000) {
      console.log('🎉 100K+ TPS REQUIREMENT MET!');
    } else {
      console.log(`⚠️  100K+ TPS requirement not met. Max achieved: ${summary.maxRPS.toFixed(0)} RPS`);
    }
    
    // Generate detailed report file
    const reportPath = `./load-test-report-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify({
      summary,
      detailedResults: this.results,
      testConfiguration: this.testScenarios,
      timestamp: new Date(),
      environment: {
        baseURL: this.baseURL,
        nodeVersion: process.version,
        platform: process.platform
      }
    }, null, 2));
    
    console.log(`Detailed report saved to: ${reportPath}`);
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute load test
if (require.main === module) {
  const loadTest = new LoadTestSuite();
  loadTest.run100kTPSTest().catch(console.error);
}

module.exports = LoadTestSuite; 