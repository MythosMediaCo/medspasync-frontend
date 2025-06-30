import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import redis
import json

from config import get_config, get_config_manager

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for API protection"""
    
    def __init__(self, app, redis_client: redis.Redis, config):
        super().__init__(app)
        self.redis_client = redis_client
        self.config = config
        self.rate_limit_requests = config.RATE_LIMIT_REQUESTS
        self.rate_limit_window = config.RATE_LIMIT_WINDOW
    
    async def dispatch(self, request: Request, call_next):
        if not self.config.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        try:
            # Check current rate
            current_requests = self.redis_client.get(key)
            if current_requests and int(current_requests) >= self.rate_limit_requests:
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "retry_after": self.rate_limit_window
                    },
                    headers={"Retry-After": str(self.rate_limit_window)}
                )
            
            # Increment request count
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, self.rate_limit_window)
            pipe.execute()
            
        except Exception as e:
            logger.warning(f"Rate limiting failed: {e}")
            # Continue without rate limiting if Redis is unavailable
        
        return await call_next(request)

class EnvironmentMiddleware(BaseHTTPMiddleware):
    """Environment-aware middleware for request processing"""
    
    def __init__(self, app, config):
        super().__init__(app)
        self.config = config
    
    async def dispatch(self, request: Request, call_next):
        # Add environment info to request state
        request.state.environment = self.config.ENVIRONMENT
        request.state.debug = self.config.DEBUG
        
        # Add request timing
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add timing header
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Environment"] = self.config.ENVIRONMENT
        
        return response

class APIGateway:
    """Multi-environment API Gateway for MedSpaSync Pro"""
    
    def __init__(self):
        self.config = get_config()
        self.config_manager = get_config_manager()
        self.redis_client = None
        self.app = FastAPI(
            title="MedSpaSync Pro API Gateway",
            description="Multi-environment API Gateway with AI-powered features",
            version=self.config.API_VERSION,
            docs_url="/docs" if self.config.DEBUG else None,
            redoc_url="/redoc" if self.config.DEBUG else None
        )
        
        self._setup_middleware()
        self._setup_routes()
        self._setup_redis()
    
    def _setup_redis(self):
        """Initialize Redis connection for rate limiting"""
        try:
            redis_config = self.config_manager.get_redis_config()
            self.redis_client = redis.from_url(redis_config["url"])
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            self.redis_client = None
    
    def _setup_middleware(self):
        """Setup middleware stack"""
        # CORS middleware
        cors_config = self.config_manager.get_cors_config()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_config["allow_origins"],
            allow_credentials=cors_config["allow_credentials"],
            allow_methods=cors_config["allow_methods"],
            allow_headers=cors_config["allow_headers"],
        )
        
        # Trusted host middleware (for production)
        if self.config.is_production():
            self.app.add_middleware(
                TrustedHostMiddleware,
                allowed_hosts=["*.medspasyncpro.com", "localhost", "127.0.0.1"]
            )
        
        # Environment middleware
        self.app.add_middleware(EnvironmentMiddleware, config=self.config)
        
        # Rate limiting middleware
        if self.redis_client:
            self.app.add_middleware(RateLimitMiddleware, redis_client=self.redis_client, config=self.config)
    
    def _setup_routes(self):
        """Setup API routes with environment-based routing"""
        
        # Health and status routes
        self.app.add_api_route("/health", self.health_check, methods=["GET"])
        self.app.add_api_route("/health/quick", self.quick_health_check, methods=["GET"])
        self.app.add_api_route("/status", self.get_status, methods=["GET"])
        self.app.add_api_route("/config", self.get_configuration, methods=["GET"])
        
        # Environment-specific routes
        if self.config.is_development():
            self._setup_development_routes()
        elif self.config.is_staging():
            self._setup_staging_routes()
        else:  # Production
            self._setup_production_routes()
        
        # Global error handlers
        self.app.add_exception_handler(Exception, self.global_exception_handler)
        self.app.add_exception_handler(HTTPException, self.http_exception_handler)
    
    def _setup_development_routes(self):
        """Setup development-specific routes"""
        logger.info("Setting up development routes")
        
        # Development tools
        self.app.add_api_route("/dev/redis-status", self.redis_status, methods=["GET"])
        self.app.add_api_route("/dev/config-dump", self.config_dump, methods=["GET"])
        self.app.add_api_route("/dev/performance", self.performance_metrics, methods=["GET"])
    
    def _setup_staging_routes(self):
        """Setup staging-specific routes"""
        logger.info("Setting up staging routes")
        
        # Staging-specific features
        self.app.add_api_route("/staging/analytics", self.staging_analytics, methods=["GET"])
        self.app.add_api_route("/staging/load-test", self.load_test_endpoint, methods=["POST"])
    
    def _setup_production_routes(self):
        """Setup production-specific routes"""
        logger.info("Setting up production routes")
        
        # Production monitoring
        self.app.add_api_route("/monitoring/health", self.production_health, methods=["GET"])
        self.app.add_api_route("/monitoring/metrics", self.production_metrics, methods=["GET"])
    
    async def health_check(self, request: Request):
        """Comprehensive health check"""
        try:
            # Check Redis
            redis_healthy = False
            if self.redis_client:
                try:
                    self.redis_client.ping()
                    redis_healthy = True
                except:
                    pass
            
            # Check environment
            env_healthy = self.config.ENVIRONMENT in ["development", "staging", "production"]
            
            # Overall health
            overall_healthy = redis_healthy and env_healthy
            
            return {
                "status": "healthy" if overall_healthy else "unhealthy",
                "environment": self.config.ENVIRONMENT,
                "timestamp": time.time(),
                "services": {
                    "redis": "healthy" if redis_healthy else "unhealthy",
                    "environment": "healthy" if env_healthy else "unhealthy"
                },
                "version": self.config.API_VERSION
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return JSONResponse(
                status_code=500,
                content={"status": "unhealthy", "error": str(e)}
            )
    
    async def quick_health_check(self, request: Request):
        """Quick health check for load balancers"""
        return {
            "status": "healthy",
            "environment": self.config.ENVIRONMENT,
            "timestamp": time.time()
        }
    
    async def get_status(self, request: Request):
        """Get API gateway status"""
        return {
            "gateway": "operational",
            "environment": self.config.ENVIRONMENT,
            "version": self.config.API_VERSION,
            "rate_limiting": self.config.RATE_LIMIT_ENABLED,
            "cors_enabled": True,
            "timestamp": time.time()
        }
    
    async def get_configuration(self, request: Request):
        """Get sanitized configuration"""
        return {
            "environment": self.config.ENVIRONMENT,
            "debug": self.config.DEBUG,
            "version": self.config.API_VERSION,
            "rate_limit_enabled": self.config.RATE_LIMIT_ENABLED,
            "hipaa_compliance": self.config.HIPAA_COMPLIANCE_MODE,
            "timestamp": time.time()
        }
    
    # Development routes
    async def redis_status(self, request: Request):
        """Get Redis status (development only)"""
        if not self.config.is_development():
            raise HTTPException(status_code=404, detail="Not found")
        
        try:
            if self.redis_client:
                info = self.redis_client.info()
                return {
                    "status": "connected",
                    "info": {
                        "version": info.get("redis_version"),
                        "connected_clients": info.get("connected_clients"),
                        "used_memory": info.get("used_memory_human")
                    }
                }
            else:
                return {"status": "disconnected"}
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def config_dump(self, request: Request):
        """Dump configuration (development only)"""
        if not self.config.is_development():
            raise HTTPException(status_code=404, detail="Not found")
        
        return self.config.dict()
    
    async def performance_metrics(self, request: Request):
        """Get performance metrics (development only)"""
        if not self.config.is_development():
            raise HTTPException(status_code=404, detail="Not found")
        
        return {
            "uptime": time.time(),
            "environment": self.config.ENVIRONMENT,
            "rate_limiting": self.config.RATE_LIMIT_ENABLED,
            "redis_connected": self.redis_client is not None
        }
    
    # Staging routes
    async def staging_analytics(self, request: Request):
        """Staging analytics endpoint"""
        if not self.config.is_staging():
            raise HTTPException(status_code=404, detail="Not found")
        
        return {
            "analytics": "enabled",
            "environment": "staging",
            "timestamp": time.time()
        }
    
    async def load_test_endpoint(self, request: Request):
        """Load testing endpoint (staging only)"""
        if not self.config.is_staging():
            raise HTTPException(status_code=404, detail="Not found")
        
        return {"message": "Load test endpoint", "timestamp": time.time()}
    
    # Production routes
    async def production_health(self, request: Request):
        """Production health check"""
        if not self.config.is_production():
            raise HTTPException(status_code=404, detail="Not found")
        
        return {
            "status": "operational",
            "environment": "production",
            "timestamp": time.time()
        }
    
    async def production_metrics(self, request: Request):
        """Production metrics endpoint"""
        if not self.config.is_production():
            raise HTTPException(status_code=404, detail="Not found")
        
        return {
            "metrics": "enabled",
            "environment": "production",
            "timestamp": time.time()
        }
    
    async def global_exception_handler(self, request: Request, exc: Exception):
        """Global exception handler"""
        logger.error(f"Global exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "environment": self.config.ENVIRONMENT,
                "timestamp": time.time()
            }
        )
    
    async def http_exception_handler(self, request: Request, exc: HTTPException):
        """HTTP exception handler"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail,
                "environment": self.config.ENVIRONMENT,
                "timestamp": time.time()
            }
        )
    
    def get_app(self):
        """Get the FastAPI application"""
        return self.app

# Create global gateway instance
api_gateway = APIGateway()
app = api_gateway.get_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 