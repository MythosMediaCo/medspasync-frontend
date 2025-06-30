"""
Advanced Alerting System for MedSpaSync Pro Ecosystem
Email, Slack, and webhook integration for critical events
"""

import os
import json
import smtplib
import requests
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class AlertingSystem:
    """Advanced alerting system for ecosystem monitoring"""
    
    def __init__(self):
        self.alert_history = []
        self.alert_config = self._load_config()
        self.alert_cooldowns = {}  # Prevent alert spam
        
    def _load_config(self) -> Dict[str, Any]:
        """Load alerting configuration from environment"""
        return {
            'email': {
                'enabled': os.getenv('ALERT_EMAIL_ENABLED', 'false').lower() == 'true',
                'smtp_server': os.getenv('ALERT_SMTP_SERVER', 'smtp.gmail.com'),
                'smtp_port': int(os.getenv('ALERT_SMTP_PORT', '587')),
                'username': os.getenv('ALERT_EMAIL_USERNAME', ''),
                'password': os.getenv('ALERT_EMAIL_PASSWORD', ''),
                'from_email': os.getenv('ALERT_FROM_EMAIL', ''),
                'to_emails': os.getenv('ALERT_TO_EMAILS', '').split(','),
            },
            'slack': {
                'enabled': os.getenv('ALERT_SLACK_ENABLED', 'false').lower() == 'true',
                'webhook_url': os.getenv('ALERT_SLACK_WEBHOOK', ''),
                'channel': os.getenv('ALERT_SLACK_CHANNEL', '#alerts'),
            },
            'webhook': {
                'enabled': os.getenv('ALERT_WEBHOOK_ENABLED', 'false').lower() == 'true',
                'url': os.getenv('ALERT_WEBHOOK_URL', ''),
                'headers': json.loads(os.getenv('ALERT_WEBHOOK_HEADERS', '{}')),
            },
            'thresholds': {
                'service_down_cooldown': int(os.getenv('ALERT_SERVICE_DOWN_COOLDOWN', '300')),  # 5 minutes
                'security_alert_cooldown': int(os.getenv('ALERT_SECURITY_COOLDOWN', '60')),     # 1 minute
                'performance_alert_cooldown': int(os.getenv('ALERT_PERFORMANCE_COOLDOWN', '600')), # 10 minutes
            }
        }
    
    def send_alert(self, alert_type: str, message: str, severity: str = 'medium', 
                   data: Optional[Dict] = None) -> bool:
        """Send alert through all configured channels"""
        
        # Check cooldown
        if not self._should_send_alert(alert_type, severity):
            logger.info(f"Alert suppressed due to cooldown: {alert_type}")
            return False
        
        alert = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': alert_type,
            'message': message,
            'severity': severity,
            'data': data or {},
            'environment': os.getenv('ENVIRONMENT', 'development')
        }
        
        # Add to history
        self.alert_history.append(alert)
        
        # Keep only last 1000 alerts
        if len(self.alert_history) > 1000:
            self.alert_history = self.alert_history[-1000:]
        
        # Send through all channels
        success = True
        
        if self.alert_config['email']['enabled']:
            if not self._send_email_alert(alert):
                success = False
        
        if self.alert_config['slack']['enabled']:
            if not self._send_slack_alert(alert):
                success = False
        
        if self.alert_config['webhook']['enabled']:
            if not self._send_webhook_alert(alert):
                success = False
        
        # Update cooldown
        self._update_cooldown(alert_type, severity)
        
        logger.info(f"Alert sent: {alert_type} - {message}")
        return success
    
    def _should_send_alert(self, alert_type: str, severity: str) -> bool:
        """Check if alert should be sent based on cooldown"""
        cooldown_key = f"{alert_type}_{severity}"
        last_sent = self.alert_cooldowns.get(cooldown_key)
        
        if not last_sent:
            return True
        
        # Get cooldown duration based on alert type
        if 'service_down' in alert_type:
            cooldown_duration = self.alert_config['thresholds']['service_down_cooldown']
        elif 'security' in alert_type:
            cooldown_duration = self.alert_config['thresholds']['security_alert_cooldown']
        elif 'performance' in alert_type:
            cooldown_duration = self.alert_config['thresholds']['performance_alert_cooldown']
        else:
            cooldown_duration = 300  # Default 5 minutes
        
        return datetime.utcnow() - last_sent > timedelta(seconds=cooldown_duration)
    
    def _update_cooldown(self, alert_type: str, severity: str):
        """Update cooldown timestamp"""
        cooldown_key = f"{alert_type}_{severity}"
        self.alert_cooldowns[cooldown_key] = datetime.utcnow()
    
    def _send_email_alert(self, alert: Dict) -> bool:
        """Send alert via email"""
        try:
            config = self.alert_config['email']
            
            msg = MimeMultipart()
            msg['From'] = config['from_email']
            msg['To'] = ', '.join(config['to_emails'])
            msg['Subject'] = f"[{alert['severity'].upper()}] MedSpaSync Alert: {alert['type']}"
            
            # Create email body
            body = f"""
MedSpaSync Pro Ecosystem Alert

Type: {alert['type']}
Severity: {alert['severity']}
Timestamp: {alert['timestamp']}
Environment: {alert['environment']}

Message: {alert['message']}

Additional Data: {json.dumps(alert['data'], indent=2)}

---
This is an automated alert from the MedSpaSync Pro Ecosystem.
            """
            
            msg.attach(MimeText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP(config['smtp_server'], config['smtp_port'])
            server.starttls()
            server.login(config['username'], config['password'])
            server.send_message(msg)
            server.quit()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False
    
    def _send_slack_alert(self, alert: Dict) -> bool:
        """Send alert via Slack webhook"""
        try:
            config = self.alert_config['slack']
            
            # Create Slack message
            color = {
                'low': '#36a64f',      # Green
                'medium': '#ff8c00',   # Orange
                'high': '#ff0000',     # Red
                'critical': '#8b0000'  # Dark red
            }.get(alert['severity'], '#ff8c00')
            
            slack_message = {
                "channel": config['channel'],
                "attachments": [{
                    "color": color,
                    "title": f"MedSpaSync Alert: {alert['type']}",
                    "text": alert['message'],
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert['severity'].upper(),
                            "short": True
                        },
                        {
                            "title": "Environment",
                            "value": alert['environment'],
                            "short": True
                        },
                        {
                            "title": "Timestamp",
                            "value": alert['timestamp'],
                            "short": True
                        }
                    ],
                    "footer": "MedSpaSync Pro Ecosystem",
                    "ts": int(datetime.utcnow().timestamp())
                }]
            }
            
            # Add additional data if present
            if alert['data']:
                slack_message['attachments'][0]['fields'].append({
                    "title": "Additional Data",
                    "value": f"```{json.dumps(alert['data'], indent=2)}```",
                    "short": False
                })
            
            # Send to Slack
            response = requests.post(
                config['webhook_url'],
                json=slack_message,
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
            return False
    
    def _send_webhook_alert(self, alert: Dict) -> bool:
        """Send alert via webhook"""
        try:
            config = self.alert_config['webhook']
            
            # Send webhook
            response = requests.post(
                config['url'],
                json=alert,
                headers=config['headers'],
                timeout=10
            )
            
            return response.status_code in [200, 201, 202]
            
        except Exception as e:
            logger.error(f"Failed to send webhook alert: {e}")
            return False
    
    def service_down_alert(self, service_name: str, error_message: str = ""):
        """Send service down alert"""
        message = f"Service {service_name} is down"
        if error_message:
            message += f": {error_message}"
        
        return self.send_alert(
            alert_type='service_down',
            message=message,
            severity='high',
            data={'service': service_name, 'error': error_message}
        )
    
    def security_alert(self, event_type: str, details: str, user_id: str = None):
        """Send security alert"""
        message = f"Security event: {event_type}"
        if details:
            message += f" - {details}"
        
        data = {
            'event_type': event_type,
            'details': details,
            'user_id': user_id
        }
        
        return self.send_alert(
            alert_type='security_violation',
            message=message,
            severity='critical',
            data=data
        )
    
    def performance_alert(self, metric: str, value: float, threshold: float):
        """Send performance alert"""
        message = f"Performance threshold exceeded: {metric} = {value} (threshold: {threshold})"
        
        return self.send_alert(
            alert_type='performance_degradation',
            message=message,
            severity='medium',
            data={
                'metric': metric,
                'value': value,
                'threshold': threshold
            }
        )
    
    def deployment_alert(self, status: str, details: str = ""):
        """Send deployment alert"""
        message = f"Deployment {status}"
        if details:
            message += f": {details}"
        
        return self.send_alert(
            alert_type='deployment',
            message=message,
            severity='medium' if status == 'success' else 'high',
            data={'status': status, 'details': details}
        )
    
    def get_alert_history(self, limit: int = 100) -> List[Dict]:
        """Get recent alert history"""
        return self.alert_history[-limit:]
    
    def get_alert_stats(self) -> Dict:
        """Get alert statistics"""
        if not self.alert_history:
            return {
                'total_alerts': 0,
                'alerts_by_type': {},
                'alerts_by_severity': {},
                'recent_alerts': 0
            }
        
        stats = {
            'total_alerts': len(self.alert_history),
            'alerts_by_type': {},
            'alerts_by_severity': {},
            'recent_alerts': 0
        }
        
        # Count by type and severity
        for alert in self.alert_history:
            alert_type = alert['type']
            severity = alert['severity']
            
            stats['alerts_by_type'][alert_type] = stats['alerts_by_type'].get(alert_type, 0) + 1
            stats['alerts_by_severity'][severity] = stats['alerts_by_severity'].get(severity, 0) + 1
        
        # Count recent alerts (last 24 hours)
        cutoff = datetime.utcnow() - timedelta(hours=24)
        stats['recent_alerts'] = sum(
            1 for alert in self.alert_history
            if datetime.fromisoformat(alert['timestamp']) > cutoff
        )
        
        return stats

# Global alerting instance
alerting_system = AlertingSystem() 