"""
Prometheus Metrics Collection for MedSpaSync Pro Ecosystem
Business KPIs, API metrics, and system performance monitoring
"""

import os
import time
import psutil
import redis
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from prometheus_client import (
    Counter, Histogram, Gauge, Summary, 
    generate_latest, CONTENT_TYPE_LATEST,
    CollectorRegistry, multiprocess
)
import logging

logger = logging.getLogger(__name__)

class MetricsCollector:
    """Comprehensive metrics collection for the ecosystem"""
    
    def __init__(self):
        self.registry = CollectorRegistry()
        
        # API Metrics
        self.api_requests_total = Counter(
            'medspasync_api_requests_total',
            'Total number of API requests',
            ['method', 'endpoint', 'status_code'],
            registry=self.registry
        )
        
        self.api_request_duration = Histogram(
            'medspasync_api_request_duration_seconds',
            'API request duration in seconds',
            ['method', 'endpoint'],
            registry=self.registry
        )
        
        # Business Metrics
        self.reconciliation_jobs_total = Counter(
            'medspasync_reconciliation_jobs_total',
            'Total number of reconciliation jobs',
            ['status', 'environment'],
            registry=self.registry
        )
        
        self.reconciliation_accuracy = Gauge(
            'medspasync_reconciliation_accuracy',
            'Reconciliation accuracy percentage',
            ['model_version'],
            registry=self.registry
        )
        
        self.active_users = Gauge(
            'medspasync_active_users',
            'Number of active users',
            ['environment'],
            registry=self.registry
        )
        
        self.transactions_processed = Counter(
            'medspasync_transactions_processed_total',
            'Total number of transactions processed',
            ['status', 'environment'],
            registry=self.registry
        )
        
        # System Metrics
        self.system_memory_usage = Gauge(
            'medspasync_system_memory_bytes',
            'System memory usage in bytes',
            ['type'],
            registry=self.registry
        )
        
        self.system_cpu_usage = Gauge(
            'medspasync_system_cpu_percent',
            'System CPU usage percentage',
            registry=self.registry
        )
        
        self.system_disk_usage = Gauge(
            'medspasync_system_disk_bytes',
            'System disk usage in bytes',
            ['mount_point'],
            registry=self.registry
        )
        
        # Redis Metrics
        self.redis_connections = Gauge(
            'medspasync_redis_connections',
            'Number of Redis connections',
            registry=self.registry
        )
        
        self.redis_memory_usage = Gauge(
            'medspasync_redis_memory_bytes',
            'Redis memory usage in bytes',
            registry=self.registry
        )
        
        self.redis_operations = Counter(
            'medspasync_redis_operations_total',
            'Total number of Redis operations',
            ['operation'],
            registry=self.registry
        )
        
        # Security Metrics
        self.security_events = Counter(
            'medspasync_security_events_total',
            'Total number of security events',
            ['event_type', 'severity'],
            registry=self.registry
        )
        
        self.authentication_attempts = Counter(
            'medspasync_auth_attempts_total',
            'Total number of authentication attempts',
            ['status', 'method'],
            registry=self.registry
        )
        
        # Performance Metrics
        self.database_connections = Gauge(
            'medspasync_database_connections',
            'Number of database connections',
            registry=self.registry
        )
        
        self.database_query_duration = Histogram(
            'medspasync_database_query_duration_seconds',
            'Database query duration in seconds',
            ['query_type'],
            registry=self.registry
        )
        
        # WebSocket Metrics
        self.websocket_connections = Gauge(
            'medspasync_websocket_connections',
            'Number of active WebSocket connections',
            registry=self.registry
        )
        
        self.websocket_messages = Counter(
            'medspasync_websocket_messages_total',
            'Total number of WebSocket messages',
            ['direction', 'type'],
            registry=self.registry
        )
        
        # Custom Business KPIs
        self.revenue_processed = Counter(
            'medspasync_revenue_processed_total',
            'Total revenue processed in dollars',
            ['environment'],
            registry=self.registry
        )
        
        self.customer_satisfaction = Gauge(
            'medspasync_customer_satisfaction_score',
            'Customer satisfaction score (0-100)",
            registry=self.registry
        )
        
        self.system_uptime = Gauge(
            'medspasync_system_uptime_seconds',
            'System uptime in seconds',
            registry=self.registry
        )
        
        # Initialize metrics
        self.start_time = time.time()
        self.redis_client = None
        self._init_redis_client()
    
    def _init_redis_client(self):
        """Initialize Redis client for metrics"""
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=int(os.getenv('REDIS_DB', 0)),
                decode_responses=True
            )
        except Exception as e:
            logger.warning(f"Failed to initialize Redis client for metrics: {e}")
    
    def record_api_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Record API request metrics"""
        self.api_requests_total.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
        self.api_request_duration.labels(method=method, endpoint=endpoint).observe(duration)
    
    def record_reconciliation_job(self, status: str, environment: str = 'development'):
        """Record reconciliation job metrics"""
        self.reconciliation_jobs_total.labels(status=status, environment=environment).inc()
    
    def update_reconciliation_accuracy(self, accuracy: float, model_version: str = 'latest'):
        """Update reconciliation accuracy metric"""
        self.reconciliation_accuracy.labels(model_version=model_version).set(accuracy)
    
    def update_active_users(self, count: int, environment: str = 'development'):
        """Update active users metric"""
        self.active_users.labels(environment=environment).set(count)
    
    def record_transaction_processed(self, status: str, environment: str = 'development'):
        """Record transaction processing metric"""
        self.transactions_processed.labels(status=status, environment=environment).inc()
    
    def record_security_event(self, event_type: str, severity: str = 'medium'):
        """Record security event metric"""
        self.security_events.labels(event_type=event_type, severity=severity).inc()
    
    def record_auth_attempt(self, status: str, method: str = 'jwt'):
        """Record authentication attempt metric"""
        self.authentication_attempts.labels(status=status, method=method).inc()
    
    def record_websocket_connection(self, count: int):
        """Update WebSocket connections metric"""
        self.websocket_connections.set(count)
    
    def record_websocket_message(self, direction: str, message_type: str):
        """Record WebSocket message metric"""
        self.websocket_messages.labels(direction=direction, type=message_type).inc()
    
    def record_revenue_processed(self, amount: float, environment: str = 'development'):
        """Record revenue processing metric"""
        self.revenue_processed.labels(environment=environment).inc(amount)
    
    def update_customer_satisfaction(self, score: float):
        """Update customer satisfaction metric"""
        self.customer_satisfaction.set(score)
    
    def collect_system_metrics(self):
        """Collect system performance metrics"""
        try:
            # Memory metrics
            memory = psutil.virtual_memory()
            self.system_memory_usage.labels(type='total').set(memory.total)
            self.system_memory_usage.labels(type='available').set(memory.available)
            self.system_memory_usage.labels(type='used').set(memory.used)
            
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            self.system_cpu_usage.set(cpu_percent)
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            self.system_disk_usage.labels(mount_point='/').set(disk.used)
            
            # System uptime
            uptime = time.time() - self.start_time
            self.system_uptime.set(uptime)
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
    
    def collect_redis_metrics(self):
        """Collect Redis performance metrics"""
        if not self.redis_client:
            return
        
        try:
            info = self.redis_client.info()
            
            # Connection metrics
            self.redis_connections.set(info.get('connected_clients', 0))
            
            # Memory metrics
            self.redis_memory_usage.set(info.get('used_memory', 0))
            
            # Operation metrics
            self.redis_operations.labels(operation='get').inc(info.get('keyspace_hits', 0))
            self.redis_operations.labels(operation='set').inc(info.get('keyspace_misses', 0))
            
        except Exception as e:
            logger.error(f"Failed to collect Redis metrics: {e}")
    
    def collect_database_metrics(self):
        """Collect database performance metrics"""
        # This would be implemented based on your database setup
        # For now, we'll use placeholder values
        try:
            # Placeholder for database connection count
            self.database_connections.set(5)  # Example value
            
        except Exception as e:
            logger.error(f"Failed to collect database metrics: {e}")
    
    def collect_all_metrics(self):
        """Collect all metrics"""
        self.collect_system_metrics()
        self.collect_redis_metrics()
        self.collect_database_metrics()
    
    def get_metrics(self) -> str:
        """Get metrics in Prometheus format"""
        return generate_latest(self.registry)
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get a summary of key metrics"""
        return {
            'system': {
                'uptime_seconds': time.time() - self.start_time,
                'memory_usage_percent': psutil.virtual_memory().percent,
                'cpu_usage_percent': psutil.cpu_percent(),
            },
            'api': {
                'total_requests': self._get_counter_value(self.api_requests_total),
                'avg_request_duration': self._get_histogram_avg(self.api_request_duration),
            },
            'business': {
                'reconciliation_jobs': self._get_counter_value(self.reconciliation_jobs_total),
                'transactions_processed': self._get_counter_value(self.transactions_processed),
                'active_users': self._get_gauge_value(self.active_users),
            },
            'security': {
                'security_events': self._get_counter_value(self.security_events),
                'auth_attempts': self._get_counter_value(self.authentication_attempts),
            }
        }
    
    def _get_counter_value(self, counter) -> int:
        """Get counter value (simplified)"""
        try:
            # This is a simplified approach - in practice you'd use the actual counter value
            return 0
        except:
            return 0
    
    def _get_gauge_value(self, gauge) -> float:
        """Get gauge value (simplified)"""
        try:
            # This is a simplified approach - in practice you'd use the actual gauge value
            return 0.0
        except:
            return 0.0
    
    def _get_histogram_avg(self, histogram) -> float:
        """Get histogram average (simplified)"""
        try:
            # This is a simplified approach - in practice you'd use the actual histogram value
            return 0.0
        except:
            return 0.0

# Global metrics collector instance
metrics_collector = MetricsCollector()

# Middleware for automatic API metrics collection
def metrics_middleware(request, call_next):
    """FastAPI middleware for automatic metrics collection"""
    start_time = time.time()
    
    response = call_next(request)
    
    duration = time.time() - start_time
    metrics_collector.record_api_request(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration=duration
    )
    
    return response 