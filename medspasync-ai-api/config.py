import os
import logging
from typing import Dict, Any, Optional
from pydantic import BaseSettings, validator
from pathlib import Path

logger = logging.getLogger(__name__)

class EnvironmentConfig(BaseSettings):
    """Centralized environment configuration for MedSpaSync Pro Backend"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_SECRET_KEY: str = "your-secret-key-change-in-production"
    API_VERSION: str = "2.0.0"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://ai_king:kingdom_secure_2024@localhost:5432/medspa_ai"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    
    # AI Engine Configuration
    MAX_WORKERS: int = 4
    BATCH_SIZE: int = 100
    MODEL_THRESHOLD: float = 0.95
    MODEL_PATH: str = "./models/reconciliation_model.pkl"
    
    # HIPAA Compliance
    HIPAA_COMPLIANCE_MODE: bool = True
    DATA_ENCRYPTION_ENABLED: bool = True
    AUDIT_LOGGING_ENABLED: bool = True
    DATA_RETENTION_DAYS: int = 2555  # 7 years
    
    # Security
    CORS_ORIGINS: str = "*"
    CORS_ALLOW_CREDENTIALS: bool = True
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Monitoring
    PROMETHEUS_ENABLED: bool = True
    HEALTH_CHECK_INTERVAL: int = 30
    METRICS_ENDPOINT: str = "/metrics"
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_TYPES: str = "csv,xlsx,xls"
    
    # External Services
    BACKUP_ENABLED: bool = True
    BACKUP_SCHEDULE: str = "0 2 * * *"  # Daily at 2 AM
    BACKUP_RETENTION_DAYS: int = 30
    
    @validator('ENVIRONMENT')
    def validate_environment(cls, v):
        allowed = ['development', 'staging', 'production']
        if v not in allowed:
            raise ValueError(f'ENVIRONMENT must be one of {allowed}')
        return v
    
    @validator('MODEL_THRESHOLD')
    def validate_threshold(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError('MODEL_THRESHOLD must be between 0.0 and 1.0')
        return v
    
    @validator('CORS_ORIGINS')
    def parse_cors_origins(cls, v):
        if v == "*":
            return ["*"]
        return [origin.strip() for origin in v.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

class ConfigManager:
    """Manages configuration loading and validation"""
    
    def __init__(self):
        self.config = EnvironmentConfig()
        self._validate_config()
        self._setup_logging()
        self._create_directories()
    
    def _validate_config(self):
        """Validate critical configuration settings"""
        if self.config.ENVIRONMENT == "production":
            if self.config.API_SECRET_KEY == "your-secret-key-change-in-production":
                raise ValueError("API_SECRET_KEY must be changed in production")
            
            if not self.config.HIPAA_COMPLIANCE_MODE:
                raise ValueError("HIPAA_COMPLIANCE_MODE must be enabled in production")
            
            if self.config.CORS_ORIGINS == ["*"]:
                logger.warning("CORS_ORIGINS is set to '*' in production - consider restricting")
    
    def _setup_logging(self):
        """Configure logging based on environment"""
        log_level = getattr(logging, self.config.LOG_LEVEL.upper())
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler('app.log') if self.config.ENVIRONMENT != "development" else logging.NullHandler()
            ]
        )
    
    def _create_directories(self):
        """Create necessary directories"""
        directories = [
            self.config.UPLOAD_DIR,
            Path(self.config.MODEL_PATH).parent,
            "./logs",
            "./backups"
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    def get_config(self) -> EnvironmentConfig:
        """Get the current configuration"""
        return self.config
    
    def get_database_config(self) -> Dict[str, Any]:
        """Get database-specific configuration"""
        return {
            "url": self.config.DATABASE_URL,
            "pool_size": self.config.DATABASE_POOL_SIZE,
            "max_overflow": self.config.DATABASE_MAX_OVERFLOW,
            "echo": self.config.DEBUG
        }
    
    def get_redis_config(self) -> Dict[str, Any]:
        """Get Redis-specific configuration"""
        return {
            "url": self.config.REDIS_URL,
            "password": self.config.REDIS_PASSWORD,
            "db": self.config.REDIS_DB
        }
    
    def get_cors_config(self) -> Dict[str, Any]:
        """Get CORS configuration"""
        return {
            "allow_origins": self.config.CORS_ORIGINS,
            "allow_credentials": self.config.CORS_ALLOW_CREDENTIALS,
            "allow_methods": ["*"],
            "allow_headers": ["*"]
        }
    
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.config.ENVIRONMENT == "production"
    
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.config.ENVIRONMENT == "development"
    
    def get_health_check_config(self) -> Dict[str, Any]:
        """Get health check configuration"""
        return {
            "interval": self.config.HEALTH_CHECK_INTERVAL,
            "timeout": 10,
            "retries": 3
        }

# Global configuration instance
config_manager = ConfigManager()
config = config_manager.get_config()

def get_config() -> EnvironmentConfig:
    """Get the global configuration instance"""
    return config

def get_config_manager() -> ConfigManager:
    """Get the configuration manager instance"""
    return config_manager 