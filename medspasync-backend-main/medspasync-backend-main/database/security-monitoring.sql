-- Security Monitoring & Alerting Database Setup
-- Real-time monitoring, alerting, and incident response for MedSpaSync Pro

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Security Incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    threat_score DECIMAL(3,2),
    ip_address INET,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    status VARCHAR(20) DEFAULT 'DETECTED',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident Actions table
CREATE TABLE IF NOT EXISTS incident_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,
    action_name VARCHAR(50) NOT NULL,
    result JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Security Alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(255),
    message TEXT NOT NULL,
    details JSONB,
    status VARCHAR(20) DEFAULT 'SENT',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Metrics table
CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period VARCHAR(20) DEFAULT 'hourly',
    tags JSONB DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'system'
);

-- Real-time Monitoring Data table
CREATE TABLE IF NOT EXISTS realtime_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_key VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ttl INTEGER DEFAULT 3600
);

-- Security Dashboard Widgets table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_name VARCHAR(100) NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    widget_config JSONB NOT NULL,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 300,
    height INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 30,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert Rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    channels JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rule_name)
);

-- Security Notifications table
CREATE TABLE IF NOT EXISTS security_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Audit Log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255)
);

-- Security Performance table
CREATE TABLE IF NOT EXISTS security_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    component VARCHAR(50),
    tags JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_incidents_timestamp ON security_incidents(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_ip ON security_incidents(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);

CREATE INDEX IF NOT EXISTS idx_incident_actions_incident_id ON incident_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_actions_timestamp ON incident_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_incident_actions_name ON incident_actions(action_name);

CREATE INDEX IF NOT EXISTS idx_security_alerts_incident_id ON security_alerts(incident_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_timestamp ON security_alerts(sent_at);
CREATE INDEX IF NOT EXISTS idx_security_alerts_channel ON security_alerts(channel);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_security_metrics_name_timestamp ON security_metrics(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_metrics_period ON security_metrics(period);
CREATE INDEX IF NOT EXISTS idx_security_metrics_source ON security_metrics(source);

CREATE INDEX IF NOT EXISTS idx_realtime_monitoring_key_timestamp ON realtime_monitoring(metric_key, timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_monitoring_ttl ON realtime_monitoring(ttl);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_active ON dashboard_widgets(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);

CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_priority ON alert_rules(priority);

CREATE INDEX IF NOT EXISTS idx_security_notifications_user_id ON security_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_security_notifications_read ON security_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_security_notifications_priority ON security_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_security_notifications_type ON security_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_timestamp ON security_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_resource ON security_audit_log(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_security_performance_name_timestamp ON security_performance(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_performance_component ON security_performance(component);

-- Row Level Security (RLS) policies
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_incidents
CREATE POLICY incidents_admin_policy ON security_incidents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for incident_actions
CREATE POLICY incident_actions_admin_policy ON incident_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for security_alerts
CREATE POLICY security_alerts_admin_policy ON security_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for security_metrics
CREATE POLICY security_metrics_admin_policy ON security_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for realtime_monitoring
CREATE POLICY realtime_monitoring_admin_policy ON realtime_monitoring
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for dashboard_widgets
CREATE POLICY dashboard_widgets_admin_policy ON dashboard_widgets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for alert_rules
CREATE POLICY alert_rules_admin_policy ON alert_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for security_notifications
CREATE POLICY security_notifications_user_policy ON security_notifications
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY security_notifications_admin_policy ON security_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for security_audit_log
CREATE POLICY security_audit_log_admin_policy ON security_audit_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for security_performance
CREATE POLICY security_performance_admin_policy ON security_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- Functions for security monitoring

-- Function to log security incident
CREATE OR REPLACE FUNCTION log_security_incident(
    incident_type VARCHAR,
    severity VARCHAR,
    threat_score DECIMAL DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_uuid UUID DEFAULT NULL,
    incident_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    incident_id UUID;
BEGIN
    INSERT INTO security_incidents (
        incident_type, severity, threat_score, ip_address, user_id, details
    ) VALUES (
        incident_type, severity, threat_score, ip_address, user_uuid, incident_details
    ) RETURNING id INTO incident_id;

    RETURN incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log incident action
CREATE OR REPLACE FUNCTION log_incident_action(
    incident_uuid UUID,
    action_name VARCHAR,
    action_result JSONB DEFAULT NULL,
    executed_by_uuid UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO incident_actions (
        incident_id, action_name, result, executed_by
    ) VALUES (
        incident_uuid, action_name, action_result, executed_by_uuid
    ) RETURNING id INTO action_id;

    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send security alert
CREATE OR REPLACE FUNCTION send_security_alert(
    incident_uuid UUID,
    alert_type VARCHAR,
    severity VARCHAR,
    channel VARCHAR,
    recipient VARCHAR,
    alert_message TEXT,
    alert_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO security_alerts (
        incident_id, alert_type, severity, channel, recipient, message, details
    ) VALUES (
        incident_uuid, alert_type, severity, channel, recipient, alert_message, alert_details
    ) RETURNING id INTO alert_id;

    RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security monitoring statistics
CREATE OR REPLACE FUNCTION get_security_monitoring_stats(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
    total_incidents INTEGER,
    critical_incidents INTEGER,
    high_incidents INTEGER,
    medium_incidents INTEGER,
    low_incidents INTEGER,
    resolved_incidents INTEGER,
    total_alerts INTEGER,
    email_alerts INTEGER,
    webhook_alerts INTEGER,
    slack_alerts INTEGER,
    avg_response_time DECIMAL(10,2),
    active_incidents INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_incidents,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL')::INTEGER as critical_incidents,
        COUNT(*) FILTER (WHERE severity = 'HIGH')::INTEGER as high_incidents,
        COUNT(*) FILTER (WHERE severity = 'MEDIUM')::INTEGER as medium_incidents,
        COUNT(*) FILTER (WHERE severity = 'LOW')::INTEGER as low_incidents,
        COUNT(*) FILTER (WHERE status = 'RESOLVED')::INTEGER as resolved_incidents,
        (SELECT COUNT(*) FROM security_alerts WHERE sent_at > NOW() - (hours_back || ' hours')::INTERVAL)::INTEGER as total_alerts,
        (SELECT COUNT(*) FROM security_alerts WHERE sent_at > NOW() - (hours_back || ' hours')::INTERVAL AND channel = 'email')::INTEGER as email_alerts,
        (SELECT COUNT(*) FROM security_alerts WHERE sent_at > NOW() - (hours_back || ' hours')::INTERVAL AND channel = 'webhook')::INTEGER as webhook_alerts,
        (SELECT COUNT(*) FROM security_alerts WHERE sent_at > NOW() - (hours_back || ' hours')::INTERVAL AND channel = 'slack')::INTEGER as slack_alerts,
        (SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - timestamp))) FROM security_incidents WHERE resolved_at IS NOT NULL AND timestamp > NOW() - (hours_back || ' hours')::INTERVAL)::DECIMAL(10,2) as avg_response_time,
        COUNT(*) FILTER (WHERE status = 'DETECTED')::INTEGER as active_incidents
    FROM security_incidents 
    WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create security notification
CREATE OR REPLACE FUNCTION create_security_notification(
    user_uuid UUID,
    notification_type VARCHAR,
    notification_title VARCHAR,
    notification_message TEXT,
    notification_details JSONB DEFAULT NULL,
    notification_priority VARCHAR DEFAULT 'NORMAL',
    expires_in_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO security_notifications (
        user_id, notification_type, title, message, details, priority, expires_at
    ) VALUES (
        user_uuid, notification_type, notification_title, notification_message, 
        notification_details, notification_priority, 
        NOW() + (expires_in_hours || ' hours')::INTERVAL
    ) RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security audit event
CREATE OR REPLACE FUNCTION log_security_audit(
    user_uuid UUID,
    audit_action VARCHAR,
    resource_type VARCHAR DEFAULT NULL,
    resource_id VARCHAR DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_text TEXT DEFAULT NULL,
    audit_details JSONB DEFAULT NULL,
    session_uuid VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        user_id, action, resource_type, resource_id, ip_address, user_agent, details, session_id
    ) VALUES (
        user_uuid, audit_action, resource_type, resource_id, ip_addr, user_agent_text, audit_details, session_uuid
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update real-time monitoring data
CREATE OR REPLACE FUNCTION update_realtime_monitoring(
    metric_key_name VARCHAR,
    metric_value_data JSONB,
    ttl_seconds INTEGER DEFAULT 3600
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO realtime_monitoring (metric_key, metric_value, ttl)
    VALUES (metric_key_name, metric_value_data, ttl_seconds)
    ON CONFLICT (metric_key) DO UPDATE SET
        metric_value = EXCLUDED.metric_value,
        timestamp = NOW(),
        ttl = EXCLUDED.ttl;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired monitoring data
CREATE OR REPLACE FUNCTION cleanup_expired_monitoring_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM realtime_monitoring 
    WHERE timestamp < NOW() - (ttl || ' seconds')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    DELETE FROM security_notifications 
    WHERE expires_at < NOW() AND is_read = true;
    
    DELETE FROM security_alerts 
    WHERE sent_at < NOW() - INTERVAL '30 days' AND status = 'SENT';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic operations

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_incidents_updated_at
    BEFORE UPDATE ON security_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
    BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled jobs

-- Clean up expired monitoring data every hour
SELECT cron.schedule(
    'cleanup-expired-monitoring-data',
    '0 * * * *',
    'SELECT cleanup_expired_monitoring_data();'
);

-- Update security metrics every 5 minutes
SELECT cron.schedule(
    'update-security-metrics',
    '*/5 * * * *',
    'INSERT INTO security_metrics (metric_name, metric_value, metric_unit, period, source)
     SELECT 
         ''active_incidents'',
         COUNT(*)::DECIMAL,
         ''count'',
         ''5min'',
         ''monitoring''
     FROM security_incidents 
     WHERE status = ''DETECTED''
     AND timestamp > NOW() - INTERVAL ''1 hour'';'
);

-- Views for reporting

-- View for security incidents summary
CREATE OR REPLACE VIEW security_incidents_summary AS
SELECT 
    DATE(timestamp) as date,
    incident_type,
    severity,
    COUNT(*) as count,
    AVG(threat_score) as avg_threat_score,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT user_id) as unique_users
FROM security_incidents
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), incident_type, severity
ORDER BY date DESC, severity, count DESC;

-- View for alert delivery statistics
CREATE OR REPLACE VIEW alert_delivery_stats AS
SELECT 
    DATE(sent_at) as date,
    channel,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) as avg_delivery_time
FROM security_alerts
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at), channel, status
ORDER BY date DESC, channel, status;

-- View for security performance metrics
CREATE OR REPLACE VIEW security_performance_summary AS
SELECT 
    DATE(timestamp) as date,
    component,
    metric_name,
    AVG(metric_value) as avg_value,
    MAX(metric_value) as max_value,
    MIN(metric_value) as min_value
FROM security_performance
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), component, metric_name
ORDER BY date DESC, component, metric_name;

-- Insert default alert rules
INSERT INTO alert_rules (rule_name, rule_type, conditions, actions, channels, priority) VALUES
('Critical Incident Alert', 'INCIDENT', '{"severity": "CRITICAL"}', '["NOTIFY_ADMIN", "BLOCK_IP"]', '["email", "slack", "sms"]', 1),
('High Threat Score Alert', 'THREAT', '{"threat_score": {"min": 0.8}}', '["INCREASE_MONITORING", "NOTIFY_ADMIN"]', '["email", "slack"]', 2),
('Geographic Anomaly Alert', 'GEOGRAPHIC', '{"distance": {"min": 1000}}', '["FORCE_MFA", "NOTIFY_ADMIN"]', '["email", "slack"]', 2),
('Authentication Failure Alert', 'AUTH', '{"failure_count": {"min": 5}}', '["BLOCK_IP", "NOTIFY_ADMIN"]', '["email", "slack"]', 2),
('System Performance Alert', 'PERFORMANCE', '{"response_time": {"min": 5000}}', '["NOTIFY_ADMIN"]', '["email"]', 3)
ON CONFLICT (rule_name) DO NOTHING;

-- Insert default dashboard widgets
INSERT INTO dashboard_widgets (widget_name, widget_type, widget_config, position_x, position_y, width, height) VALUES
('Security Incidents', 'chart', '{"type": "line", "metric": "incidents_per_hour", "title": "Security Incidents Over Time"}', 0, 0, 400, 300),
('Threat Distribution', 'chart', '{"type": "pie", "metric": "threats_by_severity", "title": "Threats by Severity"}', 420, 0, 300, 300),
('Active Alerts', 'list', '{"metric": "active_alerts", "title": "Active Security Alerts", "limit": 10}', 0, 320, 400, 200),
('System Performance', 'gauge', '{"metric": "system_health", "title": "System Health Score"}', 420, 320, 300, 200),
('Recent Incidents', 'table', '{"metric": "recent_incidents", "title": "Recent Security Incidents", "columns": ["Time", "Type", "Severity", "Status"]}', 740, 0, 400, 520)
ON CONFLICT (widget_name) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medspasync_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO medspasync_user;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO medspasync_user;

-- Comments for documentation
COMMENT ON TABLE security_incidents IS 'Security incident tracking and management';
COMMENT ON TABLE incident_actions IS 'Automated and manual incident response actions';
COMMENT ON TABLE security_alerts IS 'Security alert delivery and tracking';
COMMENT ON TABLE security_metrics IS 'Security performance and monitoring metrics';
COMMENT ON TABLE realtime_monitoring IS 'Real-time monitoring data storage';
COMMENT ON TABLE dashboard_widgets IS 'Security dashboard widget configuration';
COMMENT ON TABLE alert_rules IS 'Configurable alert rules and conditions';
COMMENT ON TABLE security_notifications IS 'User-facing security notifications';
COMMENT ON TABLE security_audit_log IS 'Comprehensive security audit trail';
COMMENT ON TABLE security_performance IS 'Security system performance metrics';

COMMENT ON FUNCTION log_security_incident(VARCHAR, VARCHAR, DECIMAL, INET, UUID, JSONB) IS 'Log security incident with comprehensive details';
COMMENT ON FUNCTION log_incident_action(UUID, VARCHAR, JSONB, UUID) IS 'Log incident response action';
COMMENT ON FUNCTION send_security_alert(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, JSONB) IS 'Send security alert through multiple channels';
COMMENT ON FUNCTION get_security_monitoring_stats(INTEGER) IS 'Get comprehensive security monitoring statistics';
COMMENT ON FUNCTION create_security_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB, VARCHAR, INTEGER) IS 'Create user-facing security notification';
COMMENT ON FUNCTION log_security_audit(UUID, VARCHAR, VARCHAR, VARCHAR, INET, TEXT, JSONB, VARCHAR) IS 'Log security audit event';
COMMENT ON FUNCTION update_realtime_monitoring(VARCHAR, JSONB, INTEGER) IS 'Update real-time monitoring data';
COMMENT ON FUNCTION cleanup_expired_monitoring_data() IS 'Clean up expired monitoring and notification data'; 