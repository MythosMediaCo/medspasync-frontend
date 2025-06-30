"""
Security Module for MedSpaSync Pro Ecosystem
Implements authentication, authorization, encryption, audit logging, and HIPAA compliance
"""

import os
import jwt
import hashlib
import hmac
import base64
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
from functools import wraps
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import redis
from flask import request, jsonify, current_app, g
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecurityManager:
    """Centralized security management for the ecosystem"""
    
    def __init__(self, app=None):
        self.app = app
        self.redis_client = None
        self.encryption_key = None
        self.jwt_secret = None
        self.audit_logger = None
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize security with Flask app"""
        self.app = app
        
        # Initialize Redis for session management
        self.redis_client = redis.Redis(
            host=app.config.get('REDIS_HOST', 'localhost'),
            port=app.config.get('REDIS_PORT', 6379),
            db=app.config.get('REDIS_DB', 0),
            decode_responses=True
        )
        
        # Initialize encryption
        self._init_encryption()
        
        # Initialize JWT
        self._init_jwt()
        
        # Initialize audit logging
        self._init_audit_logging()
        
        # Register security middleware
        self._register_middleware(app)
    
    def _init_encryption(self):
        """Initialize encryption keys"""
        env = os.getenv('ENVIRONMENT', 'development')
        
        if env == 'production':
            # Production: Use secure key management
            self.encryption_key = os.getenv('ENCRYPTION_KEY')
            if not self.encryption_key:
                raise ValueError("ENCRYPTION_KEY required in production")
        else:
            # Development/Staging: Generate or use default key
            self.encryption_key = os.getenv('ENCRYPTION_KEY', Fernet.generate_key())
        
        self.fernet = Fernet(self.encryption_key)
    
    def _init_jwt(self):
        """Initialize JWT configuration"""
        env = os.getenv('ENVIRONMENT', 'development')
        
        if env == 'production':
            self.jwt_secret = os.getenv('JWT_SECRET')
            if not self.jwt_secret:
                raise ValueError("JWT_SECRET required in production")
        else:
            self.jwt_secret = os.getenv('JWT_SECRET', 'dev-secret-key-change-in-production')
    
    def _init_audit_logging(self):
        """Initialize audit logging"""
        env = os.getenv('ENVIRONMENT', 'development')
        
        # Create audit logger
        self.audit_logger = logging.getLogger('audit')
        self.audit_logger.setLevel(logging.INFO)
        
        # Create file handler for audit logs
        audit_handler = logging.FileHandler('logs/audit.log')
        audit_handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        audit_handler.setFormatter(formatter)
        
        # Add handler to logger
        self.audit_logger.addHandler(audit_handler)
        
        # Set audit level based on environment
        if env == 'production':
            self.audit_level = 'FULL'
        elif env == 'staging':
            self.audit_level = 'ENHANCED'
        else:
            self.audit_level = 'BASIC'
    
    def _register_middleware(self, app):
        """Register security middleware"""
        
        @app.before_request
        def security_middleware():
            """Security middleware for all requests"""
            # Add request ID for tracking
            g.request_id = self._generate_request_id()
            
            # Log request for audit
            self._audit_request('REQUEST_START')
            
            # Check rate limiting
            if not self._check_rate_limit():
                return jsonify({'error': 'Rate limit exceeded'}), 429
            
            # Validate JWT for protected routes
            if self._is_protected_route():
                token = self._extract_token()
                if not token or not self._validate_token(token):
                    return jsonify({'error': 'Invalid or missing token'}), 401
        
        @app.after_request
        def security_response_middleware(response):
            """Security middleware for responses"""
            # Add security headers
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            
            # Log response for audit
            self._audit_request('REQUEST_END', response=response)
            
            return response
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        return hashlib.sha256(f"{time.time()}{request.remote_addr}".encode()).hexdigest()[:16]
    
    def _audit_request(self, event_type: str, response=None):
        """Log audit event"""
        if self.audit_level == 'BASIC' and event_type != 'REQUEST_END':
            return
        
        audit_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': getattr(g, 'request_id', 'unknown'),
            'event_type': event_type,
            'method': request.method,
            'path': request.path,
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'user_id': getattr(g, 'user_id', None),
            'environment': os.getenv('ENVIRONMENT', 'development')
        }
        
        if response:
            audit_data['status_code'] = response.status_code
            audit_data['response_size'] = len(response.get_data())
        
        if self.audit_level in ['ENHANCED', 'FULL']:
            audit_data['headers'] = dict(request.headers)
            audit_data['query_params'] = dict(request.args)
        
        if self.audit_level == 'FULL':
            audit_data['body'] = request.get_data().decode('utf-8', errors='ignore')
        
        self.audit_logger.info(json.dumps(audit_data))
    
    def _check_rate_limit(self) -> bool:
        """Check rate limiting"""
        env = os.getenv('ENVIRONMENT', 'development')
        client_ip = request.remote_addr
        
        # Get rate limit configuration
        if env == 'development':
            limit = 100  # requests per minute
            window = 60
        elif env == 'staging':
            limit = 1000  # requests per hour
            window = 3600
        else:  # production
            limit = 1000  # requests per hour
            window = 3600
        
        # Check rate limit using Redis
        key = f"rate_limit:{client_ip}"
        current = self.redis_client.get(key)
        
        if current and int(current) >= limit:
            return False
        
        # Increment counter
        pipe = self.redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        pipe.execute()
        
        return True
    
    def _is_protected_route(self) -> bool:
        """Check if route requires authentication"""
        protected_prefixes = ['/api/', '/admin/', '/secure/']
        return any(request.path.startswith(prefix) for prefix in protected_prefixes)
    
    def _extract_token(self) -> Optional[str]:
        """Extract JWT token from request"""
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            return auth_header[7:]
        return request.args.get('token')
    
    def _validate_token(self, token: str) -> bool:
        """Validate JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            g.user_id = payload.get('user_id')
            g.user_role = payload.get('role')
            return True
        except jwt.ExpiredSignatureError:
            return False
        except jwt.InvalidTokenError:
            return False

class AuthenticationService:
    """Authentication service for user management"""
    
    def __init__(self, security_manager: SecurityManager):
        self.security_manager = security_manager
        self.redis_client = security_manager.redis_client
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user and return token"""
        # In production, this would validate against database
        # For demo purposes, using simple validation
        
        if username == 'admin' and password == 'admin123':
            user_data = {
                'user_id': 1,
                'username': 'admin',
                'role': 'admin',
                'permissions': ['read', 'write', 'admin']
            }
            
            # Generate JWT token
            token = self._generate_token(user_data)
            
            # Store session in Redis
            session_key = f"session:{token}"
            self.redis_client.setex(session_key, 3600, json.dumps(user_data))
            
            return {
                'token': token,
                'user': user_data,
                'expires_in': 3600
            }
        
        return None
    
    def _generate_token(self, user_data: Dict) -> str:
        """Generate JWT token"""
        payload = {
            'user_id': user_data['user_id'],
            'username': user_data['username'],
            'role': user_data['role'],
            'exp': datetime.utcnow() + timedelta(hours=1),
            'iat': datetime.utcnow()
        }
        
        return jwt.encode(payload, self.security_manager.jwt_secret, algorithm='HS256')
    
    def logout(self, token: str) -> bool:
        """Logout user by invalidating token"""
        session_key = f"session:{token}"
        return bool(self.redis_client.delete(session_key))

class AuthorizationService:
    """Authorization service for role-based access control"""
    
    def __init__(self, security_manager: SecurityManager):
        self.security_manager = security_manager
    
    def require_auth(self, f):
        """Decorator to require authentication"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = self.security_manager._extract_token()
            if not token or not self.security_manager._validate_token(token):
                return jsonify({'error': 'Authentication required'}), 401
            return f(*args, **kwargs)
        return decorated_function
    
    def require_role(self, required_role: str):
        """Decorator to require specific role"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                if not hasattr(g, 'user_role') or g.user_role != required_role:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    def require_permission(self, required_permission: str):
        """Decorator to require specific permission"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # In production, check user permissions from database
                if not hasattr(g, 'user_role') or g.user_role != 'admin':
                    return jsonify({'error': 'Insufficient permissions'}), 403
                return f(*args, **kwargs)
            return decorated_function
        return decorator

class EncryptionService:
    """Encryption service for data protection"""
    
    def __init__(self, security_manager: SecurityManager):
        self.security_manager = security_manager
        self.fernet = security_manager.fernet
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        env = os.getenv('ENVIRONMENT', 'development')
        
        if env == 'development':
            return data  # No encryption in development
        
        encrypted_data = self.fernet.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        env = os.getenv('ENVIRONMENT', 'development')
        
        if env == 'development':
            return encrypted_data  # No encryption in development
        
        try:
            decoded_data = base64.b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return None
    
    def hash_password(self, password: str) -> str:
        """Hash password using secure algorithm"""
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.b64encode(kdf.derive(password.encode()))
        salt_b64 = base64.b64encode(salt).decode()
        return f"{salt_b64}:{key.decode()}"
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            salt_b64, key_b64 = hashed_password.split(':')
            salt = base64.b64decode(salt_b64)
            key = base64.b64decode(key_b64)
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            kdf.verify(password.encode(), key)
            return True
        except Exception:
            return False

class HIPAAComplianceService:
    """HIPAA compliance service for healthcare data protection"""
    
    def __init__(self, security_manager: SecurityManager):
        self.security_manager = security_manager
        self.audit_logger = security_manager.audit_logger
    
    def log_phi_access(self, user_id: int, data_type: str, action: str, record_id: str = None):
        """Log access to Protected Health Information (PHI)"""
        audit_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'PHI_ACCESS',
            'user_id': user_id,
            'data_type': data_type,
            'action': action,
            'record_id': record_id,
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'request_id': getattr(g, 'request_id', 'unknown')
        }
        
        self.audit_logger.info(json.dumps(audit_data))
    
    def validate_phi_data(self, data: Dict) -> Dict:
        """Validate and sanitize PHI data"""
        # Remove or mask sensitive fields
        sensitive_fields = ['ssn', 'credit_card', 'bank_account', 'password']
        
        sanitized_data = data.copy()
        for field in sensitive_fields:
            if field in sanitized_data:
                sanitized_data[field] = '***MASKED***'
        
        return sanitized_data
    
    def require_phi_consent(self, f):
        """Decorator to require PHI consent"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if user has consented to PHI access
            consent_header = request.headers.get('X-PHI-Consent')
            if not consent_header or consent_header != 'true':
                return jsonify({'error': 'PHI consent required'}), 403
            
            # Log PHI access
            self.log_phi_access(
                user_id=getattr(g, 'user_id', 0),
                data_type='PHI',
                action='ACCESS'
            )
            
            return f(*args, **kwargs)
        return decorated_function

# Global security manager instance
security_manager = SecurityManager()
auth_service = AuthenticationService(security_manager)
auth_service = AuthorizationService(security_manager)
encryption_service = EncryptionService(security_manager)
hipaa_service = HIPAAComplianceService(security_manager)

def init_security(app):
    """Initialize security for Flask app"""
    security_manager.init_app(app)
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    logger.info("Security system initialized successfully") 