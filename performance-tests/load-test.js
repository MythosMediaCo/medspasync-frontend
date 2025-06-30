import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const reconciliationDuration = new Trend('reconciliation_duration');
const apiResponseTime = new Trend('api_response_time');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Sustained load
    { duration: '2m', target: 100 }, // Peak load
    { duration: '3m', target: 50 }, // Scale down
    { duration: '1m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    'reconciliation_duration': ['p(95)<5000'], // 95% of reconciliations below 5s
    'api_response_time': ['p(95)<1000'], // 95% of API calls below 1s
  },
};

// Test data
const testUsers = [
  { email: 'test1@medspasyncpro.com', password: 'testpass123' },
  { email: 'test2@medspasyncpro.com', password: 'testpass123' },
  { email: 'test3@medspasyncpro.com', password: 'testpass123' },
];

const baseURL = __ENV.BASE_URL || 'https://api.medspasyncpro.com';
const frontendURL = __ENV.FRONTEND_URL || 'https://medspasyncpro.com';

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to generate test data
function generateTestData() {
  return {
    transactions: [
      { amount: 150.00, description: 'Facial Treatment', date: '2024-01-15' },
      { amount: 299.99, description: 'Botox Injection', date: '2024-01-16' },
      { amount: 89.50, description: 'Consultation', date: '2024-01-17' },
    ],
    clients: [
      { name: 'John Doe', email: 'john@example.com', phone: '555-0123' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '555-0124' },
    ],
  };
}

// Main test scenarios
export default function () {
  const user = getRandomUser();
  const testData = generateTestData();

  // Scenario 1: User Authentication Flow
  const authResult = check(http.post(`${baseURL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  }), {
    'login successful': (r) => r.status === 200 && r.json('token'),
    'login response time < 1s': (r) => r.timings.duration < 1000,
  });

  if (authResult['login successful']) {
    successfulLogins.add(1);
    const token = JSON.parse(authResult.response.body).token;

    // Scenario 2: Dashboard Access
    const dashboardResult = check(http.get(`${baseURL}/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }), {
      'dashboard loaded': (r) => r.status === 200,
      'dashboard response time < 2s': (r) => r.timings.duration < 2000,
    });

    apiResponseTime.add(dashboardResult.response.timings.duration);

    // Scenario 3: Client Management
    const clientsResult = check(http.get(`${baseURL}/api/clients`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }), {
      'clients loaded': (r) => r.status === 200,
      'clients response time < 1s': (r) => r.timings.duration < 1000,
    });

    // Scenario 4: AI Reconciliation
    const reconciliationStart = Date.now();
    const reconciliationResult = check(http.post(`${baseURL}/api/reconciliation/process`, JSON.stringify({
      transactions: testData.transactions,
      clients: testData.clients,
    }), {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }), {
      'reconciliation successful': (r) => r.status === 200,
      'reconciliation response time < 5s': (r) => r.timings.duration < 5000,
      'reconciliation returns matches': (r) => r.json('matches') && r.json('matches').length > 0,
    });

    if (reconciliationResult['reconciliation successful']) {
      reconciliationDuration.add(Date.now() - reconciliationStart);
    }

    // Scenario 5: Analytics and Reporting
    const analyticsResult = check(http.get(`${baseURL}/api/analytics/revenue`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { period: 'monthly' },
    }), {
      'analytics loaded': (r) => r.status === 200,
      'analytics response time < 2s': (r) => r.timings.duration < 2000,
    });

    // Scenario 6: File Upload (CSV)
    const csvData = `Date,Amount,Description\n2024-01-15,150.00,Facial Treatment\n2024-01-16,299.99,Botox Injection`;
    const uploadResult = check(http.post(`${baseURL}/api/upload/csv`, csvData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/csv',
      },
    }), {
      'file upload successful': (r) => r.status === 200,
      'file upload response time < 3s': (r) => r.timings.duration < 3000,
    });

  } else {
    failedLogins.add(1);
  }

  // Scenario 7: Marketing Site Performance
  const marketingResult = check(http.get(`${frontendURL}`), {
    'marketing site loads': (r) => r.status === 200,
    'marketing site response time < 1s': (r) => r.timings.duration < 1000,
  });

  // Scenario 8: Health Check
  const healthResult = check(http.get(`${baseURL}/health`), {
    'health check passes': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Record errors
  errorRate.add(0); // Will be updated based on results

  // Think time between requests
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

// Setup function for test initialization
export function setup() {
  console.log('Starting MedSpaSync Pro performance test...');
  console.log(`Base URL: ${baseURL}`);
  console.log(`Frontend URL: ${frontendURL}`);
  
  // Verify endpoints are accessible
  const healthCheck = http.get(`${baseURL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Health check failed: ${healthCheck.status}`);
  }
  
  return { baseURL, frontendURL };
}

// Teardown function for cleanup
export function teardown(data) {
  console.log('MedSpaSync Pro performance test completed');
  console.log(`Tested endpoints: ${data.baseURL}`);
}

// Handle test results
export function handleSummary(data) {
  return {
    'performance-test-results.json': JSON.stringify(data, null, 2),
    'performance-test-summary.html': generateHTMLReport(data),
  };
}

// Generate HTML report
function generateHTMLReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>MedSpaSync Pro Performance Test Results</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>MedSpaSync Pro Performance Test Results</h1>
      <div class="metric">
        <strong>Test Duration:</strong> ${data.state.testRunDuration}ms
      </div>
      <div class="metric">
        <strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}
      </div>
      <div class="metric">
        <strong>Error Rate:</strong> ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
      </div>
      <div class="metric">
        <strong>Average Response Time:</strong> ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
      </div>
      <div class="metric">
        <strong>95th Percentile Response Time:</strong> ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
      </div>
    </body>
    </html>
  `;
} 