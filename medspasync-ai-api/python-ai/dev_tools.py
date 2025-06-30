"""
Developer Tools for MedSpaSync Pro Backend
Enhanced debugging, profiling, testing, and development utilities
"""

import os
import sys
import time
import json
import logging
import traceback
import cProfile
import pstats
import io
import psutil
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable
from functools import wraps
from contextlib import contextmanager
import redis
from flask import request, jsonify, current_app, g
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DevTools:
    """Comprehensive developer tools for backend development"""
    
    def __init__(self, app=None):
        self.app = app
        self.redis_client = None
        self.profiler = None
        self.debug_mode = False
        self.performance_log = []
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize developer tools with Flask app"""
        self.app = app
        self.debug_mode = app.config.get('DEBUG', False)
        
        # Initialize Redis for caching and debugging
        try:
            self.redis_client = redis.Redis(
                host=app.config.get('REDIS_HOST', 'localhost'),
                port=app.config.get('REDIS_PORT', 6379),
                db=app.config.get('REDIS_DB', 0),
                decode_responses=True
            )
        except Exception as e:
            logger.warning(f"Redis not available for dev tools: {e}")
        
        # Register development routes
        self._register_dev_routes(app)
        
        # Setup performance monitoring
        self._setup_performance_monitoring(app)
        
        logger.info("Developer tools initialized successfully")
    
    def _register_dev_routes(self, app):
        """Register development-specific routes"""
        
        @app.route('/api/v1/dev/debug/info', methods=['GET'])
        def debug_info():
            """Get debug information"""
            if not self.debug_mode:
                return jsonify({'error': 'Debug mode not enabled'}), 403
            
            return jsonify({
                'debug_info': {
                    'timestamp': datetime.utcnow().isoformat(),
                    'environment': os.getenv('ENVIRONMENT', 'development'),
                    'python_version': sys.version,
                    'memory_usage': self._get_memory_usage(),
                    'system_info': self._get_system_info(),
                    'redis_status': self._get_redis_status(),
                    'active_requests': self._get_active_requests(),
                    'performance_stats': self._get_performance_stats()
                }
            })
        
        @app.route('/api/v1/dev/debug/profile', methods=['POST'])
        def start_profiling():
            """Start performance profiling"""
            if not self.debug_mode:
                return jsonify({'error': 'Debug mode not enabled'}), 403
            
            try:
                data = request.get_json() or {}
                profile_name = data.get('name', f'profile_{int(time.time())}')
                
                self.profiler = cProfile.Profile()
                self.profiler.enable()
                
                return jsonify({
                    'status': 'success',
                    'message': f'Profiling started: {profile_name}',
                    'profile_name': profile_name
                })
            except Exception as e:
                return jsonify({'error': f'Failed to start profiling: {str(e)}'}), 500
        
        @app.route('/api/v1/dev/debug/profile/stop', methods=['POST'])
        def stop_profiling():
            """Stop performance profiling and get results"""
            if not self.debug_mode:
                return jsonify({'error': 'Debug mode not enabled'}), 403
            
            if not self.profiler:
                return jsonify({'error': 'No active profiling session'}), 400
            
            try:
                self.profiler.disable()
                
                # Get profiling stats
                s = io.StringIO()
                ps = pstats.Stats(self.profiler, stream=s).sort_stats('cumulative')
                ps.print_stats(20)  # Top 20 functions
                
                profile_results = s.getvalue()
                self.profiler = None
                
                return jsonify({
                    'status': 'success',
                    'message': 'Profiling stopped',
                    'results': profile_results
                })
            except Exception as e:
                return jsonify({'error': f'Failed to stop profiling: {str(e)}'}), 500
        
        @app.route('/api/v1/dev/debug/cache', methods=['GET'])
        def debug_cache():
            """Debug Redis cache"""
            if not self.debug_mode:
                return jsonify({'error': 'Debug mode not enabled'}), 403
            
            try:
                cache_info = self._get_cache_info()
                return jsonify(cache_info)
            except Exception as e:
                return jsonify({'error': f'Failed to get cache info: {str(e)}'}), 500
        
        @app.route('/api/v1/dev/debug/cache/clear', methods=['POST'])
        def clear_cache():
            """Clear Redis cache"""
            if not self.debug_mode:
                return jsonify({'error': 'Debug mode not enabled'}), 403
            
            try:
                if self.redis_client:
                    self.redis_client.flushdb()
                    return jsonify({'status': 'success', 'message': 'Cache cleared'})
                else:
                    return jsonify({'error': 'Redis not available'}), 500
            except Exception as e:
                return jsonify({'error': f'Failed to clear cache: {str(e)}'}), 500
        
        @app.route('/api/v1/dev/debug/performance', methods=['GET'])
        def get_performance():
            """Get performance statistics"""
            if not self.debug_mode:
                return jsonify({'error': 'Debug mode not enabled'}), 403
            
            return jsonify({
                'performance': {
                    'memory_usage': self._get_memory_usage(),
                    'cpu_usage': self._get_cpu_usage(),
                    'disk_usage': self._get_disk_usage(),
                    'network_stats': self._get_network_stats(),
                    'recent_requests': self.performance_log[-10:] if self.performance_log else []
                }
            })
        
        @app.route('/api/v1/dev/debug/test', methods=['POST'])
        def run_tests():
            """Run automated tests"""
            if not self.debug_mode:
                return jsonify({'error': 'Debug mode not enabled'}), 403
            
            try:
                test_results = self._run_automated_tests()
                return jsonify(test_results)
            except Exception as e:
                return jsonify({'error': f'Failed to run tests: {str(e)}'}), 500
    
    def _setup_performance_monitoring(self, app):
        """Setup performance monitoring middleware"""
        
        @app.before_request
        def start_performance_timer():
            """Start performance timer for request"""
            g.start_time = time.time()
            g.request_id = f"req_{int(time.time() * 1000)}"
        
        @app.after_request
        def end_performance_timer(response):
            """End performance timer and log request"""
            if hasattr(g, 'start_time'):
                duration = time.time() - g.start_time
                request_info = {
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'method': request.method,
                    'path': request.path,
                    'duration': duration,
                    'status_code': response.status_code,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                self.performance_log.append(request_info)
                
                # Keep only last 100 requests
                if len(self.performance_log) > 100:
                    self.performance_log = self.performance_log[-100:]
                
                # Log slow requests
                if duration > 1.0:  # Requests taking more than 1 second
                    logger.warning(f"Slow request: {request.method} {request.path} took {duration:.2f}s")
            
            return response
    
    def _get_memory_usage(self) -> Dict[str, Any]:
        """Get memory usage information"""
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            'rss': memory_info.rss,  # Resident Set Size
            'vms': memory_info.vms,  # Virtual Memory Size
            'percent': process.memory_percent(),
            'available': psutil.virtual_memory().available,
            'total': psutil.virtual_memory().total
        }
    
    def _get_system_info(self) -> Dict[str, Any]:
        """Get system information"""
        return {
            'cpu_count': psutil.cpu_count(),
            'cpu_percent': psutil.cpu_percent(interval=1),
            'boot_time': datetime.fromtimestamp(psutil.boot_time()).isoformat(),
            'platform': sys.platform,
            'python_version': sys.version
        }
    
    def _get_redis_status(self) -> Dict[str, Any]:
        """Get Redis status"""
        if not self.redis_client:
            return {'status': 'not_available'}
        
        try:
            info = self.redis_client.info()
            return {
                'status': 'connected',
                'version': info.get('redis_version'),
                'connected_clients': info.get('connected_clients'),
                'used_memory': info.get('used_memory'),
                'keyspace_hits': info.get('keyspace_hits'),
                'keyspace_misses': info.get('keyspace_misses')
            }
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def _get_active_requests(self) -> List[Dict[str, Any]]:
        """Get active requests information"""
        # This is a simplified version - in production you'd track active requests
        return [
            {
                'request_id': req.get('request_id', 'unknown'),
                'method': req.get('method', 'unknown'),
                'path': req.get('path', 'unknown'),
                'duration': req.get('duration', 0)
            }
            for req in self.performance_log[-5:]  # Last 5 requests
        ]
    
    def _get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        if not self.performance_log:
            return {'total_requests': 0, 'avg_duration': 0}
        
        durations = [req['duration'] for req in self.performance_log]
        return {
            'total_requests': len(self.performance_log),
            'avg_duration': sum(durations) / len(durations),
            'max_duration': max(durations),
            'min_duration': min(durations),
            'slow_requests': len([d for d in durations if d > 1.0])
        }
    
    def _get_cache_info(self) -> Dict[str, Any]:
        """Get cache information"""
        if not self.redis_client:
            return {'error': 'Redis not available'}
        
        try:
            keys = self.redis_client.keys('*')
            cache_stats = {}
            
            for key in keys[:10]:  # First 10 keys
                ttl = self.redis_client.ttl(key)
                cache_stats[key] = {
                    'ttl': ttl,
                    'type': self.redis_client.type(key)
                }
            
            return {
                'total_keys': len(keys),
                'sample_keys': cache_stats,
                'memory_usage': self.redis_client.info('memory')
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _get_cpu_usage(self) -> float:
        """Get CPU usage percentage"""
        return psutil.cpu_percent(interval=1)
    
    def _get_disk_usage(self) -> Dict[str, Any]:
        """Get disk usage information"""
        disk_usage = psutil.disk_usage('/')
        return {
            'total': disk_usage.total,
            'used': disk_usage.used,
            'free': disk_usage.free,
            'percent': disk_usage.percent
        }
    
    def _get_network_stats(self) -> Dict[str, Any]:
        """Get network statistics"""
        network_io = psutil.net_io_counters()
        return {
            'bytes_sent': network_io.bytes_sent,
            'bytes_recv': network_io.bytes_recv,
            'packets_sent': network_io.packets_sent,
            'packets_recv': network_io.packets_recv
        }
    
    def _run_automated_tests(self) -> Dict[str, Any]:
        """Run automated tests"""
        test_results = {
            'timestamp': datetime.utcnow().isoformat(),
            'tests': []
        }
        
        # Test Redis connection
        try:
            if self.redis_client:
                self.redis_client.ping()
                test_results['tests'].append({
                    'name': 'redis_connection',
                    'status': 'passed',
                    'message': 'Redis connection successful'
                })
            else:
                test_results['tests'].append({
                    'name': 'redis_connection',
                    'status': 'skipped',
                    'message': 'Redis not configured'
                })
        except Exception as e:
            test_results['tests'].append({
                'name': 'redis_connection',
                'status': 'failed',
                'message': f'Redis connection failed: {str(e)}'
            })
        
        # Test API endpoints
        try:
            response = requests.get('http://localhost:8000/health/quick', timeout=5)
            if response.status_code == 200:
                test_results['tests'].append({
                    'name': 'health_endpoint',
                    'status': 'passed',
                    'message': 'Health endpoint responding'
                })
            else:
                test_results['tests'].append({
                    'name': 'health_endpoint',
                    'status': 'failed',
                    'message': f'Health endpoint returned {response.status_code}'
                })
        except Exception as e:
            test_results['tests'].append({
                'name': 'health_endpoint',
                'status': 'failed',
                'message': f'Health endpoint test failed: {str(e)}'
            })
        
        # Test memory usage
        memory_usage = self._get_memory_usage()
        if memory_usage['percent'] < 80:
            test_results['tests'].append({
                'name': 'memory_usage',
                'status': 'passed',
                'message': f'Memory usage: {memory_usage["percent"]:.1f}%'
            })
        else:
            test_results['tests'].append({
                'name': 'memory_usage',
                'status': 'warning',
                'message': f'High memory usage: {memory_usage["percent"]:.1f}%'
            })
        
        return test_results

# Performance decorator
def profile_function(func: Callable) -> Callable:
    """Decorator to profile function performance"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start_time
        
        logger.info(f"Function {func.__name__} took {duration:.4f} seconds")
        return result
    
    return wrapper

# Debug decorator
def debug_function(func: Callable) -> Callable:
    """Decorator to add debug logging to functions"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger.debug(f"Entering {func.__name__} with args: {args}, kwargs: {kwargs}")
        
        try:
            result = func(*args, **kwargs)
            logger.debug(f"Exiting {func.__name__} with result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    return wrapper

# Performance context manager
@contextmanager
def performance_timer(name: str):
    """Context manager for timing code blocks"""
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        logger.info(f"Performance timer '{name}': {duration:.4f} seconds")

# Cache decorator
def cache_result(ttl: int = 300):
    """Decorator to cache function results"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"cache:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            try:
                if hasattr(current_app, 'extensions') and 'dev_tools' in current_app.extensions:
                    dev_tools = current_app.extensions['dev_tools']
                    if dev_tools.redis_client:
                        cached_result = dev_tools.redis_client.get(cache_key)
                        if cached_result:
                            return json.loads(cached_result)
            except Exception:
                pass
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            
            try:
                if hasattr(current_app, 'extensions') and 'dev_tools' in current_app.extensions:
                    dev_tools = current_app.extensions['dev_tools']
                    if dev_tools.redis_client:
                        dev_tools.redis_client.setex(cache_key, ttl, json.dumps(result))
            except Exception:
                pass
            
            return result
        
        return wrapper
    return decorator

# Global dev tools instance
dev_tools = DevTools()

def init_dev_tools(app):
    """Initialize developer tools for Flask app"""
    dev_tools.init_app(app)
    app.extensions['dev_tools'] = dev_tools
    
    logger.info("Developer tools initialized successfully") 