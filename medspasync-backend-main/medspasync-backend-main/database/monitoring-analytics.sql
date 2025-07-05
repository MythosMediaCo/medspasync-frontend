-- Monitoring & Analytics Database Setup
-- Enhanced monitoring dashboards, predictive analysis, and business intelligence for MedSpaSync Pro

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_stat_monitor";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- System Metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpu_user BIGINT NOT NULL,
    cpu_system BIGINT NOT NULL,
    memory_rss BIGINT NOT NULL,
    memory_heap_used BIGINT NOT NULL,
    memory_heap_total BIGINT NOT NULL,
    memory_external BIGINT NOT NULL,
    uptime DECIMAL(10,2) NOT NULL,
    pid INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL,
    node_version VARCHAR(20) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request Metrics table
CREATE TABLE IF NOT EXISTS request_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    url TEXT NOT NULL,
    path VARCHAR(255) NOT NULL,
    query_params JSONB DEFAULT '{}',
    headers JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    start_time BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Response Metrics table
CREATE TABLE IF NOT EXISTS response_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    end_time BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Events table
CREATE TABLE IF NOT EXISTS business_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Behavior table
CREATE TABLE IF NOT EXISTS user_behavior (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    action VARCHAR(20) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Metrics table
CREATE TABLE IF NOT EXISTS business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    active_users INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    avg_transaction_amount DECIMAL(15,2) DEFAULT 0,
    total_reconciliations INTEGER DEFAULT 0,
    avg_confidence DECIMAL(5,2) DEFAULT 0,
    completed_reconciliations INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avg_query_time DECIMAL(10,2) DEFAULT 0,
    slow_queries INTEGER DEFAULT 0,
    total_queries INTEGER DEFAULT 0,
    avg_hit_rate DECIMAL(5,2) DEFAULT 0,
    avg_memory_usage BIGINT DEFAULT 0,
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_type VARCHAR(50) NOT NULL,
    prediction_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BI Reports table
CREATE TABLE IF NOT EXISTS bi_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPI Metrics table
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_name VARCHAR(100) NOT NULL,
    kpi_value DECIMAL(10,4) NOT NULL,
    kpi_target DECIMAL(10,4) NOT NULL,
    kpi_status VARCHAR(20) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trend Analysis table
CREATE TABLE IF NOT EXISTS trend_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trend_type VARCHAR(50) NOT NULL,
    trend_data JSONB NOT NULL,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Health table
CREATE TABLE IF NOT EXISTS system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    database_status VARCHAR(20) NOT NULL,
    redis_status VARCHAR(20) NOT NULL,
    api_status VARCHAR(20) NOT NULL,
    overall_status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Performance table
CREATE TABLE IF NOT EXISTS real_time_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    cpu_usage DECIMAL(5,2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Monitoring table
CREATE TABLE IF NOT EXISTS user_activity_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    active_users INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    peak_concurrent_users INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring Alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    current_value DECIMAL(15,4) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    message TEXT,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    escalated BOOLEAN DEFAULT false,
    escalated_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Transactions table
CREATE TABLE IF NOT EXISTS business_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    event_details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Dashboard table
CREATE TABLE IF NOT EXISTS analytics_dashboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_name VARCHAR(100) NOT NULL,
    dashboard_type VARCHAR(50) NOT NULL,
    widget_config JSONB NOT NULL,
    refresh_interval INTEGER DEFAULT 300,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Widgets table
CREATE TABLE IF NOT EXISTS analytics_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_name VARCHAR(100) NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    query_config JSONB NOT NULL,
    display_config JSONB NOT NULL,
    refresh_interval INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_pid ON system_metrics(pid);

CREATE INDEX IF NOT EXISTS idx_request_metrics_request_id ON request_metrics(request_id);
CREATE INDEX IF NOT EXISTS idx_request_metrics_user_id ON request_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_request_metrics_timestamp ON request_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_request_metrics_method ON request_metrics(method);

CREATE INDEX IF NOT EXISTS idx_response_metrics_request_id ON response_metrics(request_id);
CREATE INDEX IF NOT EXISTS idx_response_metrics_status_code ON response_metrics(status_code);
CREATE INDEX IF NOT EXISTS idx_response_metrics_duration ON response_metrics(duration);
CREATE INDEX IF NOT EXISTS idx_response_metrics_timestamp ON response_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_business_events_event_type ON business_events(event_type);
CREATE INDEX IF NOT EXISTS idx_business_events_user_id ON business_events(user_id);
CREATE INDEX IF NOT EXISTS idx_business_events_timestamp ON business_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action ON user_behavior(action);
CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON user_behavior(timestamp);

CREATE INDEX IF NOT EXISTS idx_business_metrics_timestamp ON business_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_predictions_prediction_type ON predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_generated_at ON predictions(generated_at);

CREATE INDEX IF NOT EXISTS idx_bi_reports_report_type ON bi_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_bi_reports_generated_at ON bi_reports(generated_at);

CREATE INDEX IF NOT EXISTS idx_kpi_metrics_kpi_name ON kpi_metrics(kpi_name);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_calculated_at ON kpi_metrics(calculated_at);

CREATE INDEX IF NOT EXISTS idx_trend_analysis_trend_type ON trend_analysis(trend_type);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_analyzed_at ON trend_analysis(analyzed_at);

CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health(timestamp);

CREATE INDEX IF NOT EXISTS idx_real_time_performance_timestamp ON real_time_performance(timestamp);

CREATE INDEX IF NOT EXISTS idx_user_activity_monitoring_timestamp ON user_activity_monitoring(timestamp);

CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_alert_type ON monitoring_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_acknowledged ON monitoring_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON monitoring_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_business_transactions_user_id ON business_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_business_transactions_status ON business_transactions(status);
CREATE INDEX IF NOT EXISTS idx_business_transactions_timestamp ON business_transactions(timestamp);

CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_dashboard_dashboard_name ON analytics_dashboard(dashboard_name);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboard_is_active ON analytics_dashboard(is_active);

CREATE INDEX IF NOT EXISTS idx_analytics_widgets_widget_name ON analytics_widgets(widget_name);
CREATE INDEX IF NOT EXISTS idx_analytics_widgets_is_active ON analytics_widgets(is_active);

-- Row Level Security (RLS) policies
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_widgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_metrics
CREATE POLICY system_metrics_admin_policy ON system_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for request_metrics
CREATE POLICY request_metrics_admin_policy ON request_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for response_metrics
CREATE POLICY response_metrics_admin_policy ON response_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for business_events
CREATE POLICY business_events_admin_policy ON business_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for user_behavior
CREATE POLICY user_behavior_admin_policy ON user_behavior
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for business_metrics
CREATE POLICY business_metrics_admin_policy ON business_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for performance_metrics
CREATE POLICY performance_metrics_admin_policy ON performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for predictions
CREATE POLICY predictions_admin_policy ON predictions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for bi_reports
CREATE POLICY bi_reports_admin_policy ON bi_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for kpi_metrics
CREATE POLICY kpi_metrics_admin_policy ON kpi_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for trend_analysis
CREATE POLICY trend_analysis_admin_policy ON trend_analysis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for system_health
CREATE POLICY system_health_admin_policy ON system_health
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for real_time_performance
CREATE POLICY real_time_performance_admin_policy ON real_time_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for user_activity_monitoring
CREATE POLICY user_activity_monitoring_admin_policy ON user_activity_monitoring
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for monitoring_alerts
CREATE POLICY monitoring_alerts_admin_policy ON monitoring_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for business_transactions
CREATE POLICY business_transactions_admin_policy ON business_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for security_events
CREATE POLICY security_events_admin_policy ON security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for analytics_dashboard
CREATE POLICY analytics_dashboard_admin_policy ON analytics_dashboard
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for analytics_widgets
CREATE POLICY analytics_widgets_admin_policy ON analytics_widgets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- Functions for monitoring and analytics

-- Function to store system metrics
CREATE OR REPLACE FUNCTION store_system_metrics(
    cpu_user_param BIGINT,
    cpu_system_param BIGINT,
    memory_rss_param BIGINT,
    memory_heap_used_param BIGINT,
    memory_heap_total_param BIGINT,
    memory_external_param BIGINT,
    uptime_param DECIMAL,
    pid_param INTEGER,
    platform_param VARCHAR,
    node_version_param VARCHAR,
    environment_param VARCHAR
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO system_metrics (
        cpu_user, cpu_system, memory_rss, memory_heap_used, memory_heap_total,
        memory_external, uptime, pid, platform, node_version, environment
    ) VALUES (
        cpu_user_param, cpu_system_param, memory_rss_param, memory_heap_used_param,
        memory_heap_total_param, memory_external_param, uptime_param, pid_param,
        platform_param, node_version_param, environment_param
    ) RETURNING id INTO metric_id;

    RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store request metrics
CREATE OR REPLACE FUNCTION store_request_metrics(
    request_id_param VARCHAR,
    method_param VARCHAR,
    url_param TEXT,
    path_param VARCHAR,
    query_params_param JSONB,
    headers_param JSONB,
    ip_address_param INET,
    user_agent_param TEXT,
    session_id_param VARCHAR,
    user_id_param UUID,
    user_role_param VARCHAR,
    start_time_param BIGINT
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO request_metrics (
        request_id, method, url, path, query_params, headers, ip_address,
        user_agent, session_id, user_id, user_role, start_time
    ) VALUES (
        request_id_param, method_param, url_param, path_param, query_params_param,
        headers_param, ip_address_param, user_agent_param, session_id_param,
        user_id_param, user_role_param, start_time_param
    ) RETURNING id INTO metric_id;

    RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store response metrics
CREATE OR REPLACE FUNCTION store_response_metrics(
    request_id_param VARCHAR,
    status_code_param INTEGER,
    duration_param INTEGER,
    success_param BOOLEAN,
    end_time_param BIGINT
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO response_metrics (
        request_id, status_code, duration, success, end_time
    ) VALUES (
        request_id_param, status_code_param, duration_param, success_param, end_time_param
    ) RETURNING id INTO metric_id;

    RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store business event
CREATE OR REPLACE FUNCTION store_business_event(
    event_type_param VARCHAR,
    action_param VARCHAR,
    resource_param VARCHAR,
    user_id_param UUID,
    user_role_param VARCHAR,
    event_data_param JSONB
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO business_events (
        event_type, action, resource, user_id, user_role, event_data
    ) VALUES (
        event_type_param, action_param, resource_param, user_id_param,
        user_role_param, event_data_param
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store user behavior
CREATE OR REPLACE FUNCTION store_user_behavior(
    user_id_param UUID,
    user_role_param VARCHAR,
    action_param VARCHAR,
    resource_param VARCHAR,
    session_id_param VARCHAR
)
RETURNS UUID AS $$
DECLARE
    behavior_id UUID;
BEGIN
    INSERT INTO user_behavior (
        user_id, user_role, action, resource, session_id
    ) VALUES (
        user_id_param, user_role_param, action_param, resource_param, session_id_param
    ) RETURNING id INTO behavior_id;

    RETURN behavior_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monitoring statistics
CREATE OR REPLACE FUNCTION get_monitoring_statistics(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
    total_requests INTEGER,
    avg_response_time DECIMAL(10,2),
    error_rate DECIMAL(5,2),
    active_users INTEGER,
    total_transactions INTEGER,
    system_health VARCHAR(20),
    alerts_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_requests,
        AVG(duration)::DECIMAL(10,2) as avg_response_time,
        (COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*) * 100)::DECIMAL(5,2) as error_rate,
        COUNT(DISTINCT user_id)::INTEGER as active_users,
        (SELECT COUNT(*) FROM business_transactions WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL)::INTEGER as total_transactions,
        (SELECT overall_status FROM system_health ORDER BY timestamp DESC LIMIT 1)::VARCHAR(20) as system_health,
        (SELECT COUNT(*) FROM monitoring_alerts WHERE created_at > NOW() - (hours_back || ' hours')::INTERVAL)::INTEGER as alerts_count
    FROM response_metrics rm
    LEFT JOIN request_metrics req ON rm.request_id = req.request_id
    WHERE rm.timestamp > NOW() - (hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get analytics dashboard data
CREATE OR REPLACE FUNCTION get_analytics_dashboard_data(
    dashboard_type_param VARCHAR DEFAULT 'overview'
)
RETURNS JSONB AS $$
DECLARE
    dashboard_data JSONB;
BEGIN
    CASE dashboard_type_param
        WHEN 'overview' THEN
            SELECT jsonb_build_object(
                'system_metrics', (
                    SELECT jsonb_build_object(
                        'cpu_usage', AVG((cpu_user + cpu_system) / 1000000),
                        'memory_usage', AVG(memory_heap_used::DECIMAL / memory_heap_total * 100),
                        'uptime', AVG(uptime)
                    ) FROM system_metrics WHERE timestamp > NOW() - INTERVAL '1 hour'
                ),
                'performance_metrics', (
                    SELECT jsonb_build_object(
                        'avg_response_time', AVG(duration),
                        'error_rate', COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*) * 100,
                        'total_requests', COUNT(*)
                    ) FROM response_metrics WHERE timestamp > NOW() - INTERVAL '1 hour'
                ),
                'business_metrics', (
                    SELECT jsonb_build_object(
                        'active_users', COUNT(DISTINCT user_id),
                        'total_transactions', COUNT(*),
                        'success_rate', COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) * 100
                    ) FROM business_transactions WHERE timestamp > NOW() - INTERVAL '1 hour'
                ),
                'alerts', (
                    SELECT jsonb_build_object(
                        'total_alerts', COUNT(*),
                        'high_severity', COUNT(*) FILTER (WHERE severity = 'high'),
                        'unacknowledged', COUNT(*) FILTER (WHERE acknowledged = false)
                    ) FROM monitoring_alerts WHERE created_at > NOW() - INTERVAL '24 hours'
                )
            ) INTO dashboard_data;
            
        WHEN 'performance' THEN
            SELECT jsonb_build_object(
                'response_times', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'timestamp', DATE_TRUNC('minute', timestamp),
                        'avg_duration', AVG(duration)
                    )) FROM response_metrics 
                    WHERE timestamp > NOW() - INTERVAL '1 hour'
                    GROUP BY DATE_TRUNC('minute', timestamp)
                    ORDER BY DATE_TRUNC('minute', timestamp)
                ),
                'error_distribution', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'status_code', status_code,
                        'count', COUNT(*)
                    )) FROM response_metrics 
                    WHERE timestamp > NOW() - INTERVAL '1 hour' AND status_code >= 400
                    GROUP BY status_code
                ),
                'top_endpoints', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'path', req.path,
                        'avg_duration', AVG(rm.duration),
                        'request_count', COUNT(*)
                    )) FROM response_metrics rm
                    JOIN request_metrics req ON rm.request_id = req.request_id
                    WHERE rm.timestamp > NOW() - INTERVAL '1 hour'
                    GROUP BY req.path
                    ORDER BY AVG(rm.duration) DESC
                    LIMIT 10
                )
            ) INTO dashboard_data;
            
        WHEN 'business' THEN
            SELECT jsonb_build_object(
                'user_activity', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'hour', EXTRACT(HOUR FROM timestamp),
                        'active_users', COUNT(DISTINCT user_id)
                    )) FROM user_behavior 
                    WHERE timestamp > NOW() - INTERVAL '24 hours'
                    GROUP BY EXTRACT(HOUR FROM timestamp)
                    ORDER BY EXTRACT(HOUR FROM timestamp)
                ),
                'transaction_metrics', (
                    SELECT jsonb_build_object(
                        'total_transactions', COUNT(*),
                        'total_amount', SUM(amount),
                        'avg_amount', AVG(amount),
                        'success_rate', COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) * 100
                    ) FROM business_transactions 
                    WHERE timestamp > NOW() - INTERVAL '24 hours'
                ),
                'user_behavior', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'action', action,
                        'count', COUNT(*)
                    )) FROM user_behavior 
                    WHERE timestamp > NOW() - INTERVAL '24 hours'
                    GROUP BY action
                    ORDER BY COUNT(*) DESC
                    LIMIT 10
                )
            ) INTO dashboard_data;
            
        ELSE
            dashboard_data := '{}';
    END CASE;

    RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data(
    system_metrics_days INTEGER DEFAULT 7,
    request_metrics_days INTEGER DEFAULT 3,
    response_metrics_days INTEGER DEFAULT 3,
    business_events_days INTEGER DEFAULT 30,
    user_behavior_days INTEGER DEFAULT 30,
    predictions_days INTEGER DEFAULT 7,
    alerts_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old system metrics
    DELETE FROM system_metrics 
    WHERE timestamp < NOW() - (system_metrics_days || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Clean up old request metrics
    DELETE FROM request_metrics 
    WHERE timestamp < NOW() - (request_metrics_days || ' days')::INTERVAL;

    -- Clean up old response metrics
    DELETE FROM response_metrics 
    WHERE timestamp < NOW() - (response_metrics_days || ' days')::INTERVAL;

    -- Clean up old business events
    DELETE FROM business_events 
    WHERE timestamp < NOW() - (business_events_days || ' days')::INTERVAL;

    -- Clean up old user behavior
    DELETE FROM user_behavior 
    WHERE timestamp < NOW() - (user_behavior_days || ' days')::INTERVAL;

    -- Clean up old predictions
    DELETE FROM predictions 
    WHERE generated_at < NOW() - (predictions_days || ' days')::INTERVAL;

    -- Clean up old alerts
    DELETE FROM monitoring_alerts 
    WHERE created_at < NOW() - (alerts_days || ' days')::INTERVAL
    AND acknowledged = true;

    -- Clean up old real-time data
    DELETE FROM real_time_performance 
    WHERE timestamp < NOW() - INTERVAL '7 days';

    DELETE FROM user_activity_monitoring 
    WHERE timestamp < NOW() - INTERVAL '7 days';

    DELETE FROM system_health 
    WHERE timestamp < NOW() - INTERVAL '7 days';

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

CREATE TRIGGER update_analytics_dashboard_updated_at
    BEFORE UPDATE ON analytics_dashboard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_widgets_updated_at
    BEFORE UPDATE ON analytics_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled jobs

-- Clean up old monitoring data daily at 2 AM
SELECT cron.schedule(
    'cleanup-monitoring-data',
    '0 2 * * *',
    'SELECT cleanup_monitoring_data(7, 3, 3, 30, 30, 7, 90);'
);

-- Generate BI reports daily at 6 AM
SELECT cron.schedule(
    'generate-bi-reports',
    '0 6 * * *',
    'SELECT generate_bi_reports();'
);

-- Update KPIs every hour
SELECT cron.schedule(
    'update-kpis',
    '0 * * * *',
    'SELECT update_kpis();'
);

-- Views for monitoring and analytics

-- View for monitoring overview
CREATE OR REPLACE VIEW monitoring_overview AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as total_requests,
    AVG(duration) as avg_response_time,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    COUNT(DISTINCT user_id) as active_users
FROM response_metrics rm
LEFT JOIN request_metrics req ON rm.request_id = req.request_id
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- View for business analytics
CREATE OR REPLACE VIEW business_analytics AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    COUNT(DISTINCT user_id) as daily_active_users,
    COUNT(*) as total_transactions,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_transaction_value,
    COUNT(*) FILTER (WHERE status = 'success') as successful_transactions
FROM business_transactions
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- View for performance analytics
CREATE OR REPLACE VIEW performance_analytics AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    AVG(duration) as avg_response_time,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    COUNT(*) as total_requests,
    (COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*) * 100) as error_rate
FROM response_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Insert default analytics dashboard
INSERT INTO analytics_dashboard (dashboard_name, dashboard_type, widget_config, refresh_interval) VALUES
('System Overview', 'overview', '{"widgets": ["system_health", "performance_metrics", "user_activity", "alerts"]}', 300),
('Performance Dashboard', 'performance', '{"widgets": ["response_times", "error_distribution", "top_endpoints"]}', 60),
('Business Intelligence', 'business', '{"widgets": ["user_activity", "transaction_metrics", "user_behavior"]}', 300)
ON CONFLICT DO NOTHING;

-- Insert default analytics widgets
INSERT INTO analytics_widgets (widget_name, widget_type, data_source, query_config, display_config, refresh_interval) VALUES
('System Health', 'gauge', 'system_health', '{"query": "SELECT overall_status FROM system_health ORDER BY timestamp DESC LIMIT 1"}', '{"title": "System Health", "type": "gauge"}', 60),
('Response Times', 'line_chart', 'response_metrics', '{"query": "SELECT timestamp, AVG(duration) FROM response_metrics GROUP BY timestamp"}', '{"title": "Average Response Time", "type": "line"}', 60),
('User Activity', 'bar_chart', 'user_behavior', '{"query": "SELECT action, COUNT(*) FROM user_behavior GROUP BY action"}', '{"title": "User Activity", "type": "bar"}', 300),
('Error Rate', 'metric', 'response_metrics', '{"query": "SELECT COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*) * 100 FROM response_metrics"}', '{"title": "Error Rate", "type": "metric"}', 60)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medspasync_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO medspasync_user;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO medspasync_user;

-- Comments for documentation
COMMENT ON TABLE system_metrics IS 'System performance and resource utilization metrics';
COMMENT ON TABLE request_metrics IS 'HTTP request tracking and analysis';
COMMENT ON TABLE response_metrics IS 'HTTP response performance metrics';
COMMENT ON TABLE business_events IS 'Business event tracking and analysis';
COMMENT ON TABLE user_behavior IS 'User behavior and interaction tracking';
COMMENT ON TABLE business_metrics IS 'Business performance and transaction metrics';
COMMENT ON TABLE performance_metrics IS 'System performance and response time metrics';
COMMENT ON TABLE predictions IS 'Predictive analytics and forecasting data';
COMMENT ON TABLE bi_reports IS 'Business intelligence reports and analytics';
COMMENT ON TABLE kpi_metrics IS 'Key Performance Indicators and metrics';
COMMENT ON TABLE trend_analysis IS 'Trend analysis and pattern recognition';
COMMENT ON TABLE system_health IS 'System health monitoring and status';
COMMENT ON TABLE real_time_performance IS 'Real-time performance monitoring';
COMMENT ON TABLE user_activity_monitoring IS 'Real-time user activity tracking';
COMMENT ON TABLE monitoring_alerts IS 'System monitoring alerts and notifications';
COMMENT ON TABLE business_transactions IS 'Business transaction tracking';
COMMENT ON TABLE security_events IS 'Security event monitoring and tracking';
COMMENT ON TABLE analytics_dashboard IS 'Analytics dashboard configuration';
COMMENT ON TABLE analytics_widgets IS 'Analytics widget configuration';

COMMENT ON FUNCTION store_system_metrics(BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, DECIMAL, INTEGER, VARCHAR, VARCHAR, VARCHAR) IS 'Store system performance metrics';
COMMENT ON FUNCTION store_request_metrics(VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB, JSONB, INET, TEXT, VARCHAR, UUID, VARCHAR, BIGINT) IS 'Store HTTP request metrics';
COMMENT ON FUNCTION store_response_metrics(VARCHAR, INTEGER, INTEGER, BOOLEAN, BIGINT) IS 'Store HTTP response metrics';
COMMENT ON FUNCTION store_business_event(VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, JSONB) IS 'Store business event data';
COMMENT ON FUNCTION store_user_behavior(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) IS 'Store user behavior data';
COMMENT ON FUNCTION get_monitoring_statistics(INTEGER) IS 'Get comprehensive monitoring statistics';
COMMENT ON FUNCTION get_analytics_dashboard_data(VARCHAR) IS 'Get analytics dashboard data';
COMMENT ON FUNCTION cleanup_monitoring_data(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Clean up old monitoring data'; 