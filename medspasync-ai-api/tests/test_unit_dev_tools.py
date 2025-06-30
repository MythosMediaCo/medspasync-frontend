"""
Unit tests for development tools functionality
"""

import pytest
import time
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from dev_tools import DevTools, profile_function, debug_function, performance_timer, cache_result

class TestDevTools:
    """Test cases for development tools functionality"""
    
    def test_dev_tools_initialization(self):
        """Test DevTools initialization"""
        tools = DevTools()
        assert tools is not None
        assert tools.debug_mode is False
        assert tools.performance_log == []
        assert tools.profiler is None
    
    def test_dev_tools_init_app(self):
        """Test DevTools app initialization"""
        mock_app = Mock()
        mock_app.config = {
            'DEBUG': True,
            'REDIS_HOST': 'localhost',
            'REDIS_PORT': 6379,
            'REDIS_DB': 0
        }
        
        with patch('dev_tools.redis.Redis') as mock_redis:
            mock_client = Mock()
            mock_redis.return_value = mock_client
            
            tools = DevTools()
            tools.init_app(mock_app)
            
            assert tools.app == mock_app
            assert tools.debug_mode is True
            assert tools.redis_client == mock_client
    
    def test_dev_tools_init_app_no_redis(self):
        """Test DevTools initialization without Redis"""
        mock_app = Mock()
        mock_app.config = {'DEBUG': True}
        
        with patch('dev_tools.redis.Redis', side_effect=Exception("Redis not available")):
            tools = DevTools()
            tools.init_app(mock_app)
            
            assert tools.app == mock_app
            assert tools.debug_mode is True
            assert tools.redis_client is None
    
    def test_get_memory_usage(self, dev_tools, mock_psutil):
        """Test memory usage retrieval"""
        memory_usage = dev_tools._get_memory_usage()
        
        assert 'rss' in memory_usage
        assert 'vms' in memory_usage
        assert 'percent' in memory_usage
        assert 'available' in memory_usage
        assert 'total' in memory_usage
        
        assert memory_usage['rss'] == 1000000
        assert memory_usage['vms'] == 2000000
        assert memory_usage['percent'] == 25.5
        assert memory_usage['available'] == 8000000
        assert memory_usage['total'] == 16000000
    
    def test_get_system_info(self, dev_tools, mock_psutil):
        """Test system information retrieval"""
        system_info = dev_tools._get_system_info()
        
        assert 'cpu_count' in system_info
        assert 'cpu_percent' in system_info
        assert 'boot_time' in system_info
        assert 'platform' in system_info
        assert 'python_version' in system_info
        
        assert system_info['cpu_percent'] == 15.2
    
    def test_get_redis_status_connected(self, dev_tools):
        """Test Redis status when connected"""
        mock_client = Mock()
        mock_client.info.return_value = {
            'redis_version': '6.0.0',
            'connected_clients': 1,
            'used_memory': 1000000,
            'keyspace_hits': 100,
            'keyspace_misses': 10
        }
        dev_tools.redis_client = mock_client
        
        status = dev_tools._get_redis_status()
        
        assert status['status'] == 'connected'
        assert status['version'] == '6.0.0'
        assert status['connected_clients'] == 1
    
    def test_get_redis_status_not_available(self, dev_tools):
        """Test Redis status when not available"""
        dev_tools.redis_client = None
        
        status = dev_tools._get_redis_status()
        
        assert status['status'] == 'not_available'
    
    def test_get_redis_status_error(self, dev_tools):
        """Test Redis status when error occurs"""
        mock_client = Mock()
        mock_client.info.side_effect = Exception("Connection error")
        dev_tools.redis_client = mock_client
        
        status = dev_tools._get_redis_status()
        
        assert status['status'] == 'error'
        assert 'error' in status
    
    def test_get_active_requests(self, dev_tools):
        """Test active requests retrieval"""
        dev_tools.performance_log = [
            {
                'request_id': 'req_123',
                'method': 'GET',
                'path': '/health',
                'duration': 0.1
            },
            {
                'request_id': 'req_124',
                'method': 'POST',
                'path': '/upload',
                'duration': 0.5
            }
        ]
        
        active_requests = dev_tools._get_active_requests()
        
        assert len(active_requests) == 2
        assert active_requests[0]['request_id'] == 'req_123'
        assert active_requests[1]['request_id'] == 'req_124'
    
    def test_get_performance_stats(self, dev_tools):
        """Test performance statistics calculation"""
        dev_tools.performance_log = [
            {'duration': 0.1},
            {'duration': 0.2},
            {'duration': 0.3},
            {'duration': 1.5},  # Slow request
            {'duration': 0.4}
        ]
        
        stats = dev_tools._get_performance_stats()
        
        assert stats['total_requests'] == 5
        assert stats['avg_duration'] == 0.5
        assert stats['max_duration'] == 1.5
        assert stats['min_duration'] == 0.1
        assert stats['slow_requests'] == 1
    
    def test_get_performance_stats_empty(self, dev_tools):
        """Test performance statistics with empty log"""
        stats = dev_tools._get_performance_stats()
        
        assert stats['total_requests'] == 0
        assert stats['avg_duration'] == 0
    
    def test_get_cache_info(self, dev_tools):
        """Test cache information retrieval"""
        mock_client = Mock()
        mock_client.keys.return_value = ['key1', 'key2', 'key3']
        mock_client.ttl.return_value = 300
        mock_client.type.return_value = 'string'
        mock_client.info.return_value = {'used_memory': 1000000}
        dev_tools.redis_client = mock_client
        
        cache_info = dev_tools._get_cache_info()
        
        assert cache_info['total_keys'] == 3
        assert 'sample_keys' in cache_info
        assert 'memory_usage' in cache_info
    
    def test_get_cache_info_no_redis(self, dev_tools):
        """Test cache information when Redis not available"""
        dev_tools.redis_client = None
        
        cache_info = dev_tools._get_cache_info()
        
        assert 'error' in cache_info
        assert cache_info['error'] == 'Redis not available'
    
    def test_get_cpu_usage(self, dev_tools, mock_psutil):
        """Test CPU usage retrieval"""
        cpu_usage = dev_tools._get_cpu_usage()
        
        assert cpu_usage == 15.2
    
    def test_get_disk_usage(self, dev_tools, mock_psutil):
        """Test disk usage retrieval"""
        disk_usage = dev_tools._get_disk_usage()
        
        assert 'total' in disk_usage
        assert 'used' in disk_usage
        assert 'free' in disk_usage
        assert 'percent' in disk_usage
        
        assert disk_usage['total'] == 1000000000
        assert disk_usage['used'] == 500000000
        assert disk_usage['free'] == 500000000
        assert disk_usage['percent'] == 50.0
    
    def test_get_network_stats(self, dev_tools, mock_psutil):
        """Test network statistics retrieval"""
        network_stats = dev_tools._get_network_stats()
        
        assert 'bytes_sent' in network_stats
        assert 'bytes_recv' in network_stats
        assert 'packets_sent' in network_stats
        assert 'packets_recv' in network_stats
        
        assert network_stats['bytes_sent'] == 1000000
        assert network_stats['bytes_recv'] == 2000000
        assert network_stats['packets_sent'] == 1000
        assert network_stats['packets_recv'] == 2000
    
    def test_run_automated_tests(self, dev_tools, mock_requests):
        """Test automated test execution"""
        dev_tools.redis_client = Mock()
        dev_tools.redis_client.ping.return_value = True
        
        test_results = dev_tools._run_automated_tests()
        
        assert 'timestamp' in test_results
        assert 'tests' in test_results
        assert len(test_results['tests']) >= 3  # At least redis, health, memory tests
        
        # Check test results
        test_names = [test['name'] for test in test_results['tests']]
        assert 'redis_connection' in test_names
        assert 'health_endpoint' in test_names
        assert 'memory_usage' in test_names
    
    def test_run_automated_tests_redis_failure(self, dev_tools, mock_requests):
        """Test automated tests with Redis failure"""
        dev_tools.redis_client = Mock()
        dev_tools.redis_client.ping.side_effect = Exception("Connection failed")
        
        test_results = dev_tools._run_automated_tests()
        
        redis_test = next(test for test in test_results['tests'] if test['name'] == 'redis_connection')
        assert redis_test['status'] == 'failed'
        assert 'Connection failed' in redis_test['message']

class TestDecorators:
    """Test cases for decorators"""
    
    def test_profile_function(self):
        """Test profile_function decorator"""
        @profile_function
        def test_function():
            time.sleep(0.01)  # Small delay to measure
            return "test result"
        
        with patch('dev_tools.logger.info') as mock_logger:
            result = test_function()
            
            assert result == "test result"
            mock_logger.assert_called_once()
            log_message = mock_logger.call_args[0][0]
            assert "test_function" in log_message
            assert "seconds" in log_message
    
    def test_debug_function(self):
        """Test debug_function decorator"""
        @debug_function
        def test_function(arg1, arg2, kwarg1="default"):
            return f"{arg1}_{arg2}_{kwarg1}"
        
        with patch('dev_tools.logger.debug') as mock_logger:
            result = test_function("a", "b", kwarg1="c")
            
            assert result == "a_b_c"
            assert mock_logger.call_count == 2  # Entering and exiting
    
    def test_debug_function_with_exception(self):
        """Test debug_function decorator with exception"""
        @debug_function
        def test_function():
            raise ValueError("Test error")
        
        with patch('dev_tools.logger.debug') as mock_debug, \
             patch('dev_tools.logger.error') as mock_error:
            
            with pytest.raises(ValueError):
                test_function()
            
            assert mock_debug.call_count == 1  # Only entering
            assert mock_error.call_count == 1  # Error logged
    
    def test_performance_timer(self):
        """Test performance_timer context manager"""
        with patch('dev_tools.logger.info') as mock_logger:
            with performance_timer("test_timer"):
                time.sleep(0.01)  # Small delay to measure
            
            mock_logger.assert_called_once()
            log_message = mock_logger.call_args[0][0]
            assert "test_timer" in log_message
            assert "seconds" in log_message
    
    def test_cache_result(self):
        """Test cache_result decorator"""
        mock_redis = Mock()
        mock_redis.get.return_value = None
        mock_redis.setex.return_value = True
        
        with patch('dev_tools.current_app') as mock_app:
            mock_app.extensions = {'dev_tools': Mock()}
            mock_app.extensions['dev_tools'].redis_client = mock_redis
            
            @cache_result(ttl=300)
            def test_function(arg1, arg2):
                return f"result_{arg1}_{arg2}"
            
            result = test_function("a", "b")
            
            assert result == "result_a_b"
            assert mock_redis.setex.called
    
    def test_cache_result_with_cache_hit(self):
        """Test cache_result decorator with cache hit"""
        mock_redis = Mock()
        mock_redis.get.return_value = json.dumps("cached_result")
        
        with patch('dev_tools.current_app') as mock_app:
            mock_app.extensions = {'dev_tools': Mock()}
            mock_app.extensions['dev_tools'].redis_client = mock_redis
            
            @cache_result(ttl=300)
            def test_function(arg1, arg2):
                return f"result_{arg1}_{arg2}"  # This should not be called
            
            result = test_function("a", "b")
            
            assert result == "cached_result"
            assert not mock_redis.setex.called

class TestDevToolsIntegration:
    """Integration tests for development tools"""
    
    def test_dev_tools_with_flask_app(self):
        """Test DevTools integration with Flask app"""
        from flask import Flask
        
        app = Flask(__name__)
        app.config['DEBUG'] = True
        app.config['REDIS_HOST'] = 'localhost'
        app.config['REDIS_PORT'] = 6379
        
        with patch('dev_tools.redis.Redis') as mock_redis:
            mock_client = Mock()
            mock_redis.return_value = mock_client
            
            tools = DevTools()
            tools.init_app(app)
            
            # Test that routes are registered
            with app.test_client() as client:
                response = client.get('/api/v1/dev/debug/info')
                assert response.status_code == 200
    
    def test_dev_tools_performance_monitoring(self):
        """Test performance monitoring middleware"""
        from flask import Flask, request, g
        
        app = Flask(__name__)
        app.config['DEBUG'] = True
        
        tools = DevTools()
        tools.init_app(app)
        
        @app.route('/test')
        def test_route():
            return {'status': 'ok'}
        
        with app.test_client() as client:
            response = client.get('/test')
            assert response.status_code == 200
            
            # Check that performance log was updated
            assert len(tools.performance_log) == 1
            assert tools.performance_log[0]['path'] == '/test'
            assert 'duration' in tools.performance_log[0] 