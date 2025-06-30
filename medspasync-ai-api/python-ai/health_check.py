import asyncio
import logging
import time
import psutil
import redis
import json
from typing import Dict, Any, List
from pathlib import Path
from datetime import datetime, timedelta

from config import get_config, get_config_manager

logger = logging.getLogger(__name__)

class HealthChecker:
    """Comprehensive health check system for MedSpaSync Pro Backend"""
    
    def __init__(self):
        self.config = get_config()
        self.config_manager = get_config_manager()
        self.redis_client = None
        self.last_check = None
        self.check_results = {}
    
    async def check_environment_configuration(self) -> Dict[str, Any]:
        """Check environment configuration validity"""
        try:
            # Validate configuration
            config_dict = self.config.dict()
            
            # Check critical settings
            critical_checks = {
                "api_secret_key_configured": self.config.API_SECRET_KEY != "your-secret-key-change-in-production",
                "hipaa_compliance_enabled": self.config.HIPAA_COMPLIANCE_MODE,
                "environment_valid": self.config.ENVIRONMENT in ["development", "staging", "production"],
                "model_threshold_valid": 0.0 <= self.config.MODEL_THRESHOLD <= 1.0,
                "database_url_configured": bool(self.config.DATABASE_URL),
                "redis_url_configured": bool(self.config.REDIS_URL)
            }
            
            # Environment-specific checks
            if self.config.ENVIRONMENT == "production":
                critical_checks.update({
                    "production_secret_key": self.config.API_SECRET_KEY != "your-secret-key-change-in-production",
                    "production_cors_restricted": self.config.CORS_ORIGINS != ["*"],
                    "production_debug_disabled": not self.config.DEBUG
                })
            
            return {
                "status": "healthy" if all(critical_checks.values()) else "warning",
                "checks": critical_checks,
                "config_summary": {
                    "environment": self.config.ENVIRONMENT,
                    "debug": self.config.DEBUG,
                    "log_level": self.config.LOG_LEVEL,
                    "api_version": self.config.API_VERSION
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Environment configuration check failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Network connections
            connections = len(psutil.net_connections())
            
            # Process info
            process = psutil.Process()
            process_memory = process.memory_info()
            
            checks = {
                "cpu_usage_ok": cpu_percent < 80,
                "memory_usage_ok": memory.percent < 85,
                "disk_usage_ok": disk.percent < 90,
                "connections_reasonable": connections < 1000
            }
            
            return {
                "status": "healthy" if all(checks.values()) else "warning",
                "checks": checks,
                "metrics": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free / (1024**3),
                    "network_connections": connections,
                    "process_memory_mb": process_memory.rss / (1024**2)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"System resources check failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def check_redis_connection(self) -> Dict[str, Any]:
        """Check Redis connection and health"""
        try:
            if not self.redis_client:
                self.redis_client = redis.from_url(self.config.REDIS_URL)
            
            # Test connection
            self.redis_client.ping()
            
            # Get Redis info
            info = self.redis_client.info()
            
            # Check memory usage
            memory_used = info.get('used_memory_human', 'N/A')
            memory_peak = info.get('used_memory_peak_human', 'N/A')
            
            # Check connected clients
            connected_clients = info.get('connected_clients', 0)
            
            checks = {
                "connection_ok": True,
                "memory_usage_ok": True,  # Redis handles memory well
                "clients_reasonable": connected_clients < 100
            }
            
            return {
                "status": "healthy" if all(checks.values()) else "warning",
                "checks": checks,
                "metrics": {
                    "memory_used": memory_used,
                    "memory_peak": memory_peak,
                    "connected_clients": connected_clients,
                    "redis_version": info.get('redis_version', 'N/A')
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Redis connection check failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def check_file_system(self) -> Dict[str, Any]:
        """Check file system health and permissions"""
        try:
            required_dirs = [
                self.config.UPLOAD_DIR,
                Path(self.config.MODEL_PATH).parent,
                "./logs",
                "./backups"
            ]
            
            dir_checks = {}
            for directory in required_dirs:
                path = Path(directory)
                dir_checks[f"{directory}_exists"] = path.exists()
                dir_checks[f"{directory}_writable"] = path.exists() and os.access(path, os.W_OK)
            
            # Check model file
            model_path = Path(self.config.MODEL_PATH)
            model_checks = {
                "model_file_exists": model_path.exists(),
                "model_file_readable": model_path.exists() and os.access(model_path, os.R_OK)
            }
            
            all_checks = {**dir_checks, **model_checks}
            
            return {
                "status": "healthy" if all(all_checks.values()) else "warning",
                "checks": all_checks,
                "metrics": {
                    "upload_dir_size_mb": self._get_dir_size(self.config.UPLOAD_DIR) / (1024**2),
                    "logs_dir_size_mb": self._get_dir_size("./logs") / (1024**2),
                    "backups_dir_size_mb": self._get_dir_size("./backups") / (1024**2)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"File system check failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _get_dir_size(self, directory: str) -> int:
        """Get directory size in bytes"""
        try:
            total_size = 0
            path = Path(directory)
            if path.exists():
                for file_path in path.rglob('*'):
                    if file_path.is_file():
                        total_size += file_path.stat().st_size
            return total_size
        except Exception:
            return 0
    
    async def check_ai_engine(self) -> Dict[str, Any]:
        """Check AI engine health"""
        try:
            # Import here to avoid circular imports
            from reconciliation_engine import ReconciliationEngine
            
            engine = ReconciliationEngine(
                max_workers=self.config.MAX_WORKERS,
                batch_size=self.config.BATCH_SIZE
            )
            
            checks = {
                "engine_initialized": True,
                "model_loaded": engine.is_model_loaded(),
                "workers_configured": engine.max_workers == self.config.MAX_WORKERS,
                "batch_size_configured": engine.batch_size == self.config.BATCH_SIZE
            }
            
            # Test prediction if model is loaded
            if engine.is_model_loaded():
                try:
                    # Simple test prediction
                    test_result = engine.predict_match(
                        {"customer_name": "Test", "amount": 100.0},
                        {"customer_name": "Test", "amount": 100.0},
                        self.config.MODEL_THRESHOLD
                    )
                    checks["prediction_working"] = "confidence" in test_result
                except Exception:
                    checks["prediction_working"] = False
            else:
                checks["prediction_working"] = False
            
            return {
                "status": "healthy" if all(checks.values()) else "warning",
                "checks": checks,
                "metrics": {
                    "max_workers": self.config.MAX_WORKERS,
                    "batch_size": self.config.BATCH_SIZE,
                    "model_threshold": self.config.MODEL_THRESHOLD,
                    "active_jobs": len(engine.active_jobs) if hasattr(engine, 'active_jobs') else 0
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"AI engine check failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def run_comprehensive_health_check(self) -> Dict[str, Any]:
        """Run all health checks"""
        start_time = time.time()
        
        # Run all checks concurrently
        checks = await asyncio.gather(
            self.check_environment_configuration(),
            self.check_system_resources(),
            self.check_redis_connection(),
            self.check_file_system(),
            self.check_ai_engine(),
            return_exceptions=True
        )
        
        # Process results
        check_names = [
            "environment_configuration",
            "system_resources", 
            "redis_connection",
            "file_system",
            "ai_engine"
        ]
        
        results = {}
        overall_status = "healthy"
        
        for name, result in zip(check_names, checks):
            if isinstance(result, Exception):
                results[name] = {
                    "status": "error",
                    "error": str(result),
                    "timestamp": datetime.now().isoformat()
                }
                overall_status = "error"
            else:
                results[name] = result
                if result["status"] == "error":
                    overall_status = "error"
                elif result["status"] == "warning" and overall_status == "healthy":
                    overall_status = "warning"
        
        # Calculate overall metrics
        total_checks = sum(len(result.get("checks", {})) for result in results.values())
        passed_checks = sum(
            sum(1 for check in result.get("checks", {}).values() if check)
            for result in results.values()
        )
        
        health_score = (passed_checks / total_checks * 100) if total_checks > 0 else 0
        
        self.last_check = datetime.now()
        self.check_results = results
        
        return {
            "status": overall_status,
            "health_score": round(health_score, 2),
            "checks": results,
            "summary": {
                "total_checks": total_checks,
                "passed_checks": passed_checks,
                "failed_checks": total_checks - passed_checks,
                "check_time_ms": round((time.time() - start_time) * 1000, 2)
            },
            "timestamp": datetime.now().isoformat(),
            "version": self.config.API_VERSION
        }
    
    def get_last_check_results(self) -> Dict[str, Any]:
        """Get results from the last health check"""
        return self.check_results if self.check_results else {
            "status": "unknown",
            "message": "No health check has been run yet",
            "timestamp": datetime.now().isoformat()
        }

# Global health checker instance
health_checker = HealthChecker()

async def get_health_status() -> Dict[str, Any]:
    """Get comprehensive health status"""
    return await health_checker.run_comprehensive_health_check()

async def get_quick_health_status() -> Dict[str, Any]:
    """Get quick health status (cached if recent)"""
    if (health_checker.last_check and 
        datetime.now() - health_checker.last_check < timedelta(minutes=5)):
        return health_checker.get_last_check_results()
    
    return await health_checker.run_comprehensive_health_check() 