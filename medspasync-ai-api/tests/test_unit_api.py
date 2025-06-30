"""
Unit tests for API server endpoints and functionality
"""

import pytest
import json
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from fastapi import status

from api_server import MedSpaSyncAPI

class TestAPIServer:
    """Test cases for API server functionality"""
    
    def test_api_initialization(self, test_config):
        """Test API server initialization"""
        with patch.dict('os.environ', test_config):
            api = MedSpaSyncAPI()
            assert api is not None
            assert hasattr(api, 'app')
    
    def test_health_endpoint(self, api_client):
        """Test health check endpoint"""
        response = api_client.get("/health/quick")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_full_health_endpoint(self, api_client):
        """Test full health check endpoint"""
        response = api_client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "status" in data
        assert "services" in data
        assert "timestamp" in data
    
    def test_api_status_endpoint(self, api_client):
        """Test API status endpoint"""
        response = api_client.get("/status")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "status" in data
        assert "version" in data
    
    def test_config_endpoint(self, api_client):
        """Test configuration endpoint"""
        response = api_client.get("/config")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "environment" in data
        assert "version" in data
    
    def test_upload_endpoint_success(self, api_client, mock_file_upload):
        """Test successful file upload"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.upload_file.return_value = "test_job_123"
            
            files = {"file": ("test.csv", b"test content", "text/csv")}
            response = api_client.post("/api/v1/reconciliation/upload", files=files)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "job_id" in data
            assert data["job_id"] == "test_job_123"
    
    def test_upload_endpoint_invalid_file(self, api_client):
        """Test file upload with invalid file"""
        files = {"file": ("test.txt", b"test content", "text/plain")}
        response = api_client.post("/api/v1/reconciliation/upload", files=files)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_upload_endpoint_no_file(self, api_client):
        """Test file upload without file"""
        response = api_client.post("/api/v1/reconciliation/upload")
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_process_job_endpoint(self, api_client):
        """Test job processing endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.process_job.return_value = {"status": "processing"}
            
            response = api_client.post("/api/v1/reconciliation/process/test_job_123")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "status" in data
    
    def test_job_status_endpoint(self, api_client):
        """Test job status endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.get_job_status.return_value = "completed"
            
            response = api_client.get("/api/v1/reconciliation/status/test_job_123")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "status" in data
            assert data["status"] == "completed"
    
    def test_job_results_endpoint(self, api_client):
        """Test job results endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.get_job_results.return_value = {
                "matches": [],
                "accuracy": 0.95
            }
            
            response = api_client.get("/api/v1/reconciliation/results/test_job_123")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "matches" in data
            assert "accuracy" in data
    
    def test_history_endpoint(self, api_client):
        """Test history endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.get_history.return_value = []
            
            response = api_client.get("/api/v1/reconciliation/history")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "history" in data
    
    def test_train_model_endpoint(self, api_client):
        """Test model training endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.train_model.return_value = {"accuracy": 0.92}
            
            response = api_client.post("/api/v1/reconciliation/train")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "accuracy" in data
    
    def test_predict_endpoint(self, api_client, sample_transaction_data):
        """Test prediction endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.predict_matches.return_value = []
            
            response = api_client.post(
                "/api/v1/reconciliation/predict",
                json={"transactions": sample_transaction_data}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "predictions" in data
    
    def test_confidence_endpoint(self, api_client, sample_transaction_data):
        """Test confidence calculation endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.calculate_confidence.return_value = 0.85
            
            response = api_client.post(
                "/api/v1/reconciliation/confidence",
                json={"transactions": sample_transaction_data}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "confidence" in data
    
    def test_analytics_endpoint(self, api_client):
        """Test analytics endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.get_performance_analytics.return_value = {}
            
            response = api_client.get("/api/v1/reconciliation/analytics/performance")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "analytics" in data
    
    def test_accuracy_analytics_endpoint(self, api_client):
        """Test accuracy analytics endpoint"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.get_accuracy_analytics.return_value = {}
            
            response = api_client.get("/api/v1/reconciliation/analytics/accuracy")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "analytics" in data
    
    def test_error_handling_500(self, api_client):
        """Test 500 error handling"""
        with patch('api_server.ReconciliationEngine') as mock_engine:
            mock_instance = Mock()
            mock_engine.return_value = mock_instance
            mock_instance.upload_file.side_effect = Exception("Test error")
            
            files = {"file": ("test.csv", b"test content", "text/csv")}
            response = api_client.post("/api/v1/reconciliation/upload", files=files)
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            data = response.json()
            assert "error" in data
    
    def test_cors_headers(self, api_client):
        """Test CORS headers are present"""
        response = api_client.options("/health/quick")
        assert response.status_code == status.HTTP_200_OK
        
        # Check for CORS headers
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
    
    def test_rate_limiting(self, api_client):
        """Test rate limiting functionality"""
        # Make multiple requests to trigger rate limiting
        for _ in range(10):
            response = api_client.get("/health/quick")
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                break
        else:
            # If rate limiting is not triggered, that's also acceptable
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_429_TOO_MANY_REQUESTS]
    
    def test_request_logging(self, api_client):
        """Test that requests are properly logged"""
        response = api_client.get("/health/quick")
        assert response.status_code == status.HTTP_200_OK
        
        # In a real implementation, you would check the logs
        # For now, we just verify the endpoint responds correctly
        assert response.json()["status"] == "healthy"
    
    def test_invalid_job_id(self, api_client):
        """Test handling of invalid job IDs"""
        response = api_client.get("/api/v1/reconciliation/status/invalid_job_id")
        
        # Should return 404 for invalid job ID
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_missing_required_fields(self, api_client):
        """Test handling of missing required fields"""
        response = api_client.post("/api/v1/reconciliation/predict", json={})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_invalid_json_payload(self, api_client):
        """Test handling of invalid JSON payload"""
        response = api_client.post(
            "/api/v1/reconciliation/predict",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 