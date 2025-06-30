"""
Pytest configuration and fixtures for MedSpaSync Pro Backend
"""

import pytest
import asyncio
import tempfile
import os
import sys
from pathlib import Path
from unittest.mock import Mock, patch
import redis
import json

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from api_server import MedSpaSyncAPI
from config import get_config
from health_check import HealthChecker
from reconciliation_engine import ReconciliationEngine
from dev_tools import DevTools

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def test_config():
    """Test configuration fixture"""
    return {
        'ENVIRONMENT': 'test',
        'DEBUG': True,
        'LOG_LEVEL': 'DEBUG',
        'API_HOST': '0.0.0.0',
        'API_PORT': 8001,  # Different port for testing
        'API_SECRET_KEY': 'test-secret-key',
        'API_VERSION': '1.0.0',
        'DATABASE_URL': 'sqlite:///:memory:',
        'REDIS_URL': 'redis://localhost:6379/1',  # Use different DB for testing
        'MAX_WORKERS': 2,
        'BATCH_SIZE': 10,
        'MODEL_THRESHOLD': 0.8,
        'HIPAA_COMPLIANCE_MODE': False,
        'DATA_ENCRYPTION_ENABLED': False,
        'AUDIT_LOGGING_ENABLED': True
    }

@pytest.fixture
def mock_redis():
    """Mock Redis client for testing"""
    with patch('redis.Redis') as mock_redis:
        mock_client = Mock()
        mock_redis.return_value = mock_client
        mock_client.ping.return_value = True
        mock_client.get.return_value = None
        mock_client.set.return_value = True
        mock_client.setex.return_value = True
        mock_client.delete.return_value = 1
        mock_client.flushdb.return_value = True
        mock_client.info.return_value = {
            'redis_version': '6.0.0',
            'connected_clients': 1,
            'used_memory': 1000000,
            'keyspace_hits': 100,
            'keyspace_misses': 10
        }
        yield mock_client

@pytest.fixture
def mock_health_checker():
    """Mock health checker for testing"""
    with patch('health_check.HealthChecker') as mock_checker:
        mock_instance = Mock()
        mock_checker.return_value = mock_instance
        mock_instance.check_all.return_value = {
            'overall': True,
            'services': {
                'redis': 'healthy',
                'environment': 'healthy'
            }
        }
        yield mock_instance

@pytest.fixture
def mock_reconciliation_engine():
    """Mock reconciliation engine for testing"""
    with patch('reconciliation_engine.ReconciliationEngine') as mock_engine:
        mock_instance = Mock()
        mock_engine.return_value = mock_instance
        mock_instance.upload_file.return_value = 'test_job_123'
        mock_instance.process_job.return_value = {'status': 'processing'}
        mock_instance.get_job_status.return_value = 'completed'
        mock_instance.get_job_results.return_value = {
            'matches': [],
            'accuracy': 0.95
        }
        mock_instance.get_history.return_value = []
        mock_instance.train_model.return_value = {'accuracy': 0.92}
        mock_instance.predict_matches.return_value = []
        mock_instance.calculate_confidence.return_value = 0.85
        mock_instance.get_performance_analytics.return_value = {}
        mock_instance.get_accuracy_analytics.return_value = {}
        yield mock_instance

@pytest.fixture
def api_client():
    """API client fixture for testing endpoints"""
    from fastapi.testclient import TestClient
    from api_server import medspa_api
    
    with TestClient(medspa_api.app) as client:
        yield client

@pytest.fixture
def test_file():
    """Test file fixture for file upload tests"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write("date,amount,description\n2024-01-01,100.00,Test transaction\n")
        f.flush()
        yield f.name
    os.unlink(f.name)

@pytest.fixture
def sample_transaction_data():
    """Sample transaction data for testing"""
    return [
        {
            'date': '2024-01-01',
            'amount': 100.00,
            'description': 'Test transaction 1',
            'category': 'services'
        },
        {
            'date': '2024-01-02',
            'amount': 150.00,
            'description': 'Test transaction 2',
            'category': 'products'
        }
    ]

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        'username': 'testuser',
        'password': 'testpass123',
        'email': 'test@example.com',
        'role': 'user',
        'permissions': ['read', 'write']
    }

@pytest.fixture
def mock_auth_token():
    """Mock authentication token for testing"""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6InVzZXIiLCJleHAiOjE3MzU2ODgwMDB9.test_signature"

@pytest.fixture
def dev_tools():
    """Development tools fixture for testing"""
    tools = DevTools()
    tools.debug_mode = True
    tools.performance_log = []
    return tools

@pytest.fixture
def mock_psutil():
    """Mock psutil for system monitoring tests"""
    with patch('psutil.Process') as mock_process, \
         patch('psutil.virtual_memory') as mock_vm, \
         patch('psutil.cpu_percent') as mock_cpu, \
         patch('psutil.disk_usage') as mock_disk, \
         patch('psutil.net_io_counters') as mock_net:
        
        # Mock process memory info
        mock_memory = Mock()
        mock_memory.rss = 1000000
        mock_memory.vms = 2000000
        mock_process.return_value.memory_info.return_value = mock_memory
        mock_process.return_value.memory_percent.return_value = 25.5
        
        # Mock virtual memory
        mock_vm.return_value.available = 8000000
        mock_vm.return_value.total = 16000000
        
        # Mock CPU
        mock_cpu.return_value = 15.2
        
        # Mock disk usage
        mock_disk.return_value.total = 1000000000
        mock_disk.return_value.used = 500000000
        mock_disk.return_value.free = 500000000
        mock_disk.return_value.percent = 50.0
        
        # Mock network stats
        mock_net.return_value.bytes_sent = 1000000
        mock_net.return_value.bytes_recv = 2000000
        mock_net.return_value.packets_sent = 1000
        mock_net.return_value.packets_recv = 2000
        
        yield {
            'process': mock_process,
            'virtual_memory': mock_vm,
            'cpu_percent': mock_cpu,
            'disk_usage': mock_disk,
            'net_io_counters': mock_net
        }

@pytest.fixture
def test_environment():
    """Test environment setup and teardown"""
    # Setup test environment
    original_env = os.environ.copy()
    
    # Set test environment variables
    os.environ.update({
        'ENVIRONMENT': 'test',
        'DEBUG': 'true',
        'LOG_LEVEL': 'DEBUG',
        'API_SECRET_KEY': 'test-secret-key',
        'JWT_SECRET': 'test-jwt-secret',
        'ENCRYPTION_KEY': 'test-encryption-key',
        'AUDIT_LOGGING_ENABLED': 'true',
        'HIPAA_COMPLIANCE_MODE': 'false'
    })
    
    yield
    
    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)

@pytest.fixture
def mock_requests():
    """Mock requests for external API testing"""
    with patch('requests.get') as mock_get, \
         patch('requests.post') as mock_post:
        
        # Mock successful health check response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'status': 'healthy'}
        mock_get.return_value = mock_response
        mock_post.return_value = mock_response
        
        yield {
            'get': mock_get,
            'post': mock_post
        }

@pytest.fixture
def sample_audit_log():
    """Sample audit log data for testing"""
    return [
        {
            'timestamp': '2024-01-01T10:00:00Z',
            'event_type': 'LOGIN_SUCCESS',
            'user_id': 1,
            'ip_address': '127.0.0.1',
            'user_agent': 'test-agent'
        },
        {
            'timestamp': '2024-01-01T10:05:00Z',
            'event_type': 'PHI_ACCESS',
            'user_id': 1,
            'data_type': 'patient_records',
            'action': 'READ'
        }
    ]

@pytest.fixture
def mock_file_upload():
    """Mock file upload for testing"""
    with patch('fastapi.UploadFile') as mock_upload:
        mock_file = Mock()
        mock_file.filename = 'test_transactions.csv'
        mock_file.content_type = 'text/csv'
        mock_file.file.read.return_value = b"date,amount,description\n2024-01-01,100.00,Test"
        mock_upload.return_value = mock_file
        yield mock_file

# Pytest configuration
def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "security: marks tests as security tests"
    )

def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    for item in items:
        # Mark tests based on their location
        if 'test_integration' in item.nodeid:
            item.add_marker(pytest.mark.integration)
        elif 'test_security' in item.nodeid:
            item.add_marker(pytest.mark.security)
        else:
            item.add_marker(pytest.mark.unit) 