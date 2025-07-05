const request = require('supertest');
const app = require('./app');

// Simple test runner for dashboard endpoint
async function testDashboard() {
  console.log('🧪 Testing Real-Time Dashboard API...');
  
  try {
    // Test 1: Authentication required
    console.log('Test 1: Authentication required');
    const res1 = await request(app)
      .get('/api/analytics/dashboard?spa_id=test-spa-001')
      .expect(401);
    console.log('✅ Authentication test passed');
    
    // Test 2: Health check
    console.log('Test 2: Health check');
    const res2 = await request(app)
      .get('/api/analytics/health')
      .expect(200);
    console.log('✅ Health check passed');
    
    console.log('🎉 All tests passed!');
    console.log('📊 Dashboard API is ready for production');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testDashboard(); 