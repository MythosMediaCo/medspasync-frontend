#!/usr/bin/env python3
"""
Frontend Performance Monitoring Test Script
Tests the frontend monitoring system endpoints and functionality
"""

import requests
import json
import time
import random
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1/monitoring"

def test_frontend_metrics_endpoint():
    """Test the frontend metrics endpoint"""
    print("🧪 Testing Frontend Metrics Endpoint...")
    
    # Sample metrics data
    metrics_data = {
        "metrics": [
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "session_id": f"test_session_{int(time.time())}",
                "user_id": "test_user_123",
                "metric_type": "web_vital",
                "metric_name": "LCP",
                "value": random.uniform(1000, 3000),
                "unit": "ms",
                "metadata": {
                    "rating": "good",
                    "delta": random.uniform(50, 200)
                },
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "ip_address": "127.0.0.1",
                "environment": "test"
            },
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "session_id": f"test_session_{int(time.time())}",
                "user_id": "test_user_123",
                "metric_type": "error",
                "metric_name": "javascript_error",
                "value": 1,
                "unit": "count",
                "metadata": {
                    "message": "Test error for monitoring",
                    "filename": "test.js",
                    "lineno": 42
                },
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "ip_address": "127.0.0.1",
                "environment": "test"
            },
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "session_id": f"test_session_{int(time.time())}",
                "user_id": "test_user_123",
                "metric_type": "interaction",
                "metric_name": "click",
                "value": random.uniform(100, 500),
                "unit": "ms",
                "metadata": {
                    "element": "button",
                    "id": "test-button",
                    "className": "btn-primary"
                },
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "ip_address": "127.0.0.1",
                "environment": "test"
            }
        ],
        "session_id": f"test_session_{int(time.time())}",
        "user_id": "test_user_123",
        "environment": "test"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/frontend-metrics",
            json=metrics_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: Processed {result.get('processed_count', 0)} metrics")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
        return False

def test_frontend_summary_endpoint():
    """Test the frontend summary endpoint"""
    print("🧪 Testing Frontend Summary Endpoint...")
    
    try:
        response = requests.get(f"{API_BASE}/frontend-summary")
        
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})
            print(f"✅ Success: Active sessions: {data.get('active_sessions', 0)}")
            print(f"   Average load time: {data.get('avg_load_time', 0)}ms")
            print(f"   Error rate: {data.get('error_rate', 0):.2%}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
        return False

def test_frontend_alerts_endpoint():
    """Test the frontend alerts endpoint"""
    print("🧪 Testing Frontend Alerts Endpoint...")
    
    try:
        response = requests.get(f"{API_BASE}/frontend-alerts")
        
        if response.status_code == 200:
            result = response.json()
            alerts = result.get('data', [])
            print(f"✅ Success: Found {len(alerts)} active alerts")
            
            for alert in alerts[:3]:  # Show first 3 alerts
                print(f"   - {alert.get('alert_type', 'Unknown')}: {alert.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
        return False

def test_session_analytics_endpoint():
    """Test the session analytics endpoint"""
    print("🧪 Testing Session Analytics Endpoint...")
    
    session_id = f"test_session_{int(time.time())}"
    
    try:
        response = requests.get(f"{API_BASE}/frontend-session/{session_id}")
        
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})
            print(f"✅ Success: Session analytics retrieved")
            print(f"   Session ID: {data.get('session_id', 'Unknown')}")
            print(f"   Metrics count: {data.get('metrics_count', 0)}")
            return True
        elif response.status_code == 404:
            print(f"ℹ️  Info: Session not found (expected for test)")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
        return False

def test_page_performance_endpoint():
    """Test the page performance endpoint"""
    print("🧪 Testing Page Performance Endpoint...")
    
    page_url = "http://localhost:3000/test-page"
    
    try:
        response = requests.get(f"{API_BASE}/frontend-page/{page_url}")
        
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})
            print(f"✅ Success: Page performance retrieved")
            print(f"   Page URL: {data.get('page_url', 'Unknown')}")
            print(f"   Average load time: {data.get('avg_load_time', 0)}ms")
            return True
        elif response.status_code == 404:
            print(f"ℹ️  Info: Page not found (expected for test)")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
        return False

def simulate_performance_data():
    """Simulate realistic performance data"""
    print("🧪 Simulating Performance Data...")
    
    # Generate multiple sessions with realistic data
    for session_num in range(3):
        session_id = f"sim_session_{session_num}_{int(time.time())}"
        user_id = f"user_{session_num + 1}"
        
        # Generate web vitals
        web_vitals = [
            ("LCP", random.uniform(800, 3500)),
            ("FID", random.uniform(10, 200)),
            ("CLS", random.uniform(0.01, 0.3)),
            ("FCP", random.uniform(500, 2000)),
            ("TTFB", random.uniform(100, 800))
        ]
        
        metrics = []
        for metric_name, value in web_vitals:
            metrics.append({
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "session_id": session_id,
                "user_id": user_id,
                "metric_type": "web_vital",
                "metric_name": metric_name,
                "value": value,
                "unit": "ms" if metric_name != "CLS" else "score",
                "metadata": {
                    "rating": "good" if value < 2500 else "needs_improvement",
                    "delta": random.uniform(50, 200)
                },
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "ip_address": "127.0.0.1",
                "environment": "test"
            })
        
        # Add some interactions
        for i in range(random.randint(2, 5)):
            metrics.append({
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "session_id": session_id,
                "user_id": user_id,
                "metric_type": "interaction",
                "metric_name": random.choice(["click", "submit", "navigation"]),
                "value": random.uniform(50, 300),
                "unit": "ms",
                "metadata": {
                    "element": random.choice(["button", "input", "link"]),
                    "page": f"/page-{i + 1}"
                },
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "ip_address": "127.0.0.1",
                "environment": "test"
            })
        
        # Add occasional errors
        if random.random() < 0.3:  # 30% chance of error
            metrics.append({
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "session_id": session_id,
                "user_id": user_id,
                "metric_type": "error",
                "metric_name": "javascript_error",
                "value": 1,
                "unit": "count",
                "metadata": {
                    "message": "Simulated error for testing",
                    "filename": "app.js",
                    "lineno": random.randint(1, 100)
                },
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "ip_address": "127.0.0.1",
                "environment": "test"
            })
        
        # Send metrics
        metrics_data = {
            "metrics": metrics,
            "session_id": session_id,
            "user_id": user_id,
            "environment": "test"
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/frontend-metrics",
                json=metrics_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Session {session_num + 1}: Processed {result.get('processed_count', 0)} metrics")
            else:
                print(f"❌ Session {session_num + 1}: Failed to process metrics")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Session {session_num + 1}: Connection error - {e}")
        
        time.sleep(0.5)  # Small delay between sessions

def main():
    """Run all frontend monitoring tests"""
    print("🚀 Frontend Performance Monitoring Test Suite")
    print("=" * 50)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            print("❌ Server is not responding properly")
            return
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to server. Make sure it's running on localhost:8000")
        return
    
    print("✅ Server is running")
    print()
    
    # Run tests
    tests = [
        test_frontend_metrics_endpoint,
        test_frontend_summary_endpoint,
        test_frontend_alerts_endpoint,
        test_session_analytics_endpoint,
        test_page_performance_endpoint
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
        print()
    
    # Simulate performance data
    simulate_performance_data()
    print()
    
    # Summary
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Frontend monitoring is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the server logs for more details.")
    
    print("\n💡 Next steps:")
    print("1. Start the frontend development server: npm run dev")
    print("2. Navigate to http://localhost:3000/performance-test")
    print("3. Run manual tests and check the dashboard")
    print("4. View the performance dashboard at http://localhost:3000/performance")

if __name__ == "__main__":
    main() 