-- Advanced Threat Detection Database Setup
-- Machine learning and behavioral analysis schema for MedSpaSync Pro

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Threat Detection Logs table
CREATE TABLE IF NOT EXISTS threat_detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_data JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    threat_score DECIMAL(3,2),
    action_taken VARCHAR(50),
    analysis_results JSONB
);

-- Behavioral Profiles table
CREATE TABLE IF NOT EXISTS behavioral_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL,
    request_patterns JSONB DEFAULT '{}',
    timing_patterns JSONB DEFAULT '{}',
    threat_score_history JSONB DEFAULT '[]',
    anomaly_count INTEGER DEFAULT 0,
    last_anomaly TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Machine Learning Models table
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    model_data JSONB NOT NULL,
    training_data_size INTEGER,
    accuracy_score DECIMAL(5,4),
    last_trained TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_name, model_version)
);

-- Anomaly Detection Rules table
CREATE TABLE IF NOT EXISTS anomaly_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    rule_config JSONB NOT NULL,
    threshold_value DECIMAL(10,4),
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rule_name)
);

-- Threat Intelligence table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_type VARCHAR(50) NOT NULL,
    threat_source VARCHAR(100),
    threat_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Network Traffic Analysis table
CREATE TABLE IF NOT EXISTS network_traffic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_method VARCHAR(10),
    request_path TEXT,
    response_status INTEGER,
    response_time INTEGER,
    bytes_sent BIGINT,
    bytes_received BIGINT,
    user_agent TEXT,
    referer TEXT,
    session_id VARCHAR(255),
    is_anomalous BOOLEAN DEFAULT false,
    anomaly_score DECIMAL(3,2)
);

-- User Behavior Analytics table
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    page_url TEXT,
    time_spent INTEGER,
    mouse_movements INTEGER,
    keystrokes INTEGER,
    scroll_events INTEGER,
    click_events INTEGER,
    is_suspicious BOOLEAN DEFAULT false,
    risk_score DECIMAL(3,2)
);

-- Geographic Anomaly Detection table
CREATE TABLE IF NOT EXISTS geographic_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET NOT NULL,
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    previous_location JSONB,
    distance_km DECIMAL(10,2),
    time_difference_seconds INTEGER,
    is_anomalous BOOLEAN DEFAULT false,
    anomaly_reason TEXT
);

-- Predictive Threat Modeling table
CREATE TABLE IF NOT EXISTS predictive_threats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    threat_type VARCHAR(50) NOT NULL,
    probability DECIMAL(3,2) NOT NULL,
    confidence_level DECIMAL(3,2),
    predicted_timestamp TIMESTAMP WITH TIME ZONE,
    factors JSONB,
    mitigation_suggestions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Security Metrics table
CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period VARCHAR(20) DEFAULT 'hourly',
    tags JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_threat_detection_logs_timestamp ON threat_detection_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_threat_detection_logs_severity ON threat_detection_logs(severity);
CREATE INDEX IF NOT EXISTS idx_threat_detection_logs_user_id ON threat_detection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_detection_logs_ip ON threat_detection_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_threat_detection_logs_threat_score ON threat_detection_logs(threat_score);

CREATE INDEX IF NOT EXISTS idx_behavioral_profiles_user_id ON behavioral_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_profiles_updated_at ON behavioral_profiles(updated_at);

CREATE INDEX IF NOT EXISTS idx_ml_models_name_version ON ml_models(model_name, model_version);
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON ml_models(is_active);

CREATE INDEX IF NOT EXISTS idx_anomaly_rules_type ON anomaly_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_rules_active ON anomaly_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_threat_intelligence_type ON threat_intelligence(threat_type);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_active ON threat_intelligence(is_active);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_last_seen ON threat_intelligence(last_seen);

CREATE INDEX IF NOT EXISTS idx_network_traffic_timestamp ON network_traffic(timestamp);
CREATE INDEX IF NOT EXISTS idx_network_traffic_ip ON network_traffic(ip_address);
CREATE INDEX IF NOT EXISTS idx_network_traffic_user_id ON network_traffic(user_id);
CREATE INDEX IF NOT EXISTS idx_network_traffic_anomalous ON network_traffic(is_anomalous);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON user_behavior_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_behavior_event_type ON user_behavior_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_suspicious ON user_behavior_analytics(is_suspicious);

CREATE INDEX IF NOT EXISTS idx_geographic_anomalies_user_id ON geographic_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_geographic_anomalies_timestamp ON geographic_anomalies(timestamp);
CREATE INDEX IF NOT EXISTS idx_geographic_anomalies_anomalous ON geographic_anomalies(is_anomalous);

CREATE INDEX IF NOT EXISTS idx_predictive_threats_user_id ON predictive_threats(user_id);
CREATE INDEX IF NOT EXISTS idx_predictive_threats_type ON predictive_threats(threat_type);
CREATE INDEX IF NOT EXISTS idx_predictive_threats_probability ON predictive_threats(probability);
CREATE INDEX IF NOT EXISTS idx_predictive_threats_active ON predictive_threats(is_active);

CREATE INDEX IF NOT EXISTS idx_security_metrics_name_timestamp ON security_metrics(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_metrics_period ON security_metrics(period);

-- Row Level Security (RLS) policies
ALTER TABLE threat_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for threat_detection_logs
CREATE POLICY threat_logs_user_policy ON threat_detection_logs
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY threat_logs_admin_policy ON threat_detection_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for behavioral_profiles
CREATE POLICY behavioral_profiles_user_policy ON behavioral_profiles
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY behavioral_profiles_admin_policy ON behavioral_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for ml_models (admin only)
CREATE POLICY ml_models_admin_policy ON ml_models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for anomaly_rules (admin only)
CREATE POLICY anomaly_rules_admin_policy ON anomaly_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for threat_intelligence (admin only)
CREATE POLICY threat_intelligence_admin_policy ON threat_intelligence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for network_traffic
CREATE POLICY network_traffic_user_policy ON network_traffic
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY network_traffic_admin_policy ON network_traffic
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for user_behavior_analytics
CREATE POLICY user_behavior_user_policy ON user_behavior_analytics
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_behavior_admin_policy ON user_behavior_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for geographic_anomalies
CREATE POLICY geographic_anomalies_user_policy ON geographic_anomalies
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY geographic_anomalies_admin_policy ON geographic_anomalies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for predictive_threats
CREATE POLICY predictive_threats_user_policy ON predictive_threats
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY predictive_threats_admin_policy ON predictive_threats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for security_metrics (admin only)
CREATE POLICY security_metrics_admin_policy ON security_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- Functions for advanced threat detection

-- Function to log threat detection event
CREATE OR REPLACE FUNCTION log_threat_detection(
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    user_uuid UUID DEFAULT NULL,
    session_id VARCHAR DEFAULT NULL,
    request_id VARCHAR DEFAULT NULL,
    threat_score DECIMAL DEFAULT NULL,
    action_taken VARCHAR DEFAULT NULL,
    analysis_results JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    severity_level VARCHAR(20);
BEGIN
    -- Determine severity based on threat score
    IF threat_score >= 0.9 THEN
        severity_level := 'CRITICAL';
    ELSIF threat_score >= 0.7 THEN
        severity_level := 'HIGH';
    ELSIF threat_score >= 0.5 THEN
        severity_level := 'MEDIUM';
    ELSE
        severity_level := 'LOW';
    END IF;

    INSERT INTO threat_detection_logs (
        event_data, ip_address, user_agent, user_id, session_id, 
        request_id, threat_score, action_taken, analysis_results, severity
    ) VALUES (
        event_data, ip_address, user_agent, user_uuid, session_id,
        request_id, threat_score, action_taken, analysis_results, severity_level
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update behavioral profile
CREATE OR REPLACE FUNCTION update_behavioral_profile(
    user_uuid UUID,
    profile_data JSONB,
    request_patterns JSONB DEFAULT NULL,
    timing_patterns JSONB DEFAULT NULL,
    threat_score DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO behavioral_profiles (
        user_id, profile_data, request_patterns, timing_patterns, threat_score_history
    ) VALUES (
        user_uuid, profile_data, 
        COALESCE(request_patterns, '{}'::JSONB),
        COALESCE(timing_patterns, '{}'::JSONB),
        CASE 
            WHEN threat_score IS NOT NULL 
            THEN jsonb_build_array(jsonb_build_object('score', threat_score, 'timestamp', NOW()))
            ELSE '[]'::JSONB
        END
    ) ON CONFLICT (user_id) DO UPDATE SET
        profile_data = EXCLUDED.profile_data,
        request_patterns = COALESCE(EXCLUDED.request_patterns, behavioral_profiles.request_patterns),
        timing_patterns = COALESCE(EXCLUDED.timing_patterns, behavioral_profiles.timing_patterns),
        threat_score_history = CASE 
            WHEN EXCLUDED.threat_score_history IS NOT NULL 
            THEN behavioral_profiles.threat_score_history || EXCLUDED.threat_score_history
            ELSE behavioral_profiles.threat_score_history
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get threat statistics
CREATE OR REPLACE FUNCTION get_threat_statistics(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
    total_threats INTEGER,
    critical_threats INTEGER,
    high_threats INTEGER,
    medium_threats INTEGER,
    low_threats INTEGER,
    avg_threat_score DECIMAL(3,2),
    top_threat_types JSONB,
    top_ips JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_threats,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL')::INTEGER as critical_threats,
        COUNT(*) FILTER (WHERE severity = 'HIGH')::INTEGER as high_threats,
        COUNT(*) FILTER (WHERE severity = 'MEDIUM')::INTEGER as medium_threats,
        COUNT(*) FILTER (WHERE severity = 'LOW')::INTEGER as low_threats,
        AVG(threat_score) as avg_threat_score,
        (SELECT jsonb_object_agg(threat_type, count) FROM (
            SELECT 
                event_data->>'threatType' as threat_type,
                COUNT(*) as count
            FROM threat_detection_logs 
            WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL
            GROUP BY event_data->>'threatType'
            ORDER BY count DESC
            LIMIT 10
        ) t) as top_threat_types,
        (SELECT jsonb_object_agg(ip_address::TEXT, count) FROM (
            SELECT 
                ip_address,
                COUNT(*) as count
            FROM threat_detection_logs 
            WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL
            GROUP BY ip_address
            ORDER BY count DESC
            LIMIT 10
        ) t) as top_ips
    FROM threat_detection_logs 
    WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect geographic anomalies
CREATE OR REPLACE FUNCTION detect_geographic_anomaly(
    user_uuid UUID,
    ip_addr INET,
    country_name VARCHAR,
    region_name VARCHAR,
    city_name VARCHAR,
    lat DECIMAL,
    lon DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    last_location RECORD;
    distance_km DECIMAL;
    time_diff_seconds INTEGER;
    is_anomalous BOOLEAN := FALSE;
BEGIN
    -- Get user's last known location
    SELECT * INTO last_location
    FROM geographic_anomalies
    WHERE user_id = user_uuid
    ORDER BY timestamp DESC
    LIMIT 1;

    IF last_location.id IS NOT NULL THEN
        -- Calculate distance (simplified calculation)
        distance_km := SQRT(
            POWER((lat - last_location.latitude) * 111.32, 2) +
            POWER((lon - last_location.longitude) * 111.32 * COS(RADIANS(lat)), 2)
        );

        -- Calculate time difference
        time_diff_seconds := EXTRACT(EPOCH FROM (NOW() - last_location.timestamp));

        -- Check if anomaly (distance > 1000km in less than 1 hour)
        IF distance_km > 1000 AND time_diff_seconds < 3600 THEN
            is_anomalous := TRUE;
        END IF;
    END IF;

    -- Log the location
    INSERT INTO geographic_anomalies (
        user_id, ip_address, country, region, city, 
        latitude, longitude, previous_location, distance_km, 
        time_difference_seconds, is_anomalous
    ) VALUES (
        user_uuid, ip_addr, country_name, region_name, city_name,
        lat, lon, 
        CASE WHEN last_location.id IS NOT NULL 
             THEN jsonb_build_object('latitude', last_location.latitude, 'longitude', last_location.longitude)
             ELSE NULL 
        END,
        COALESCE(distance_km, 0),
        COALESCE(time_diff_seconds, 0),
        is_anomalous
    );

    RETURN is_anomalous;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_threat_data(
    days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old threat detection logs
    DELETE FROM threat_detection_logs 
    WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Clean up old network traffic data
    DELETE FROM network_traffic 
    WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;

    -- Clean up old user behavior data
    DELETE FROM user_behavior_analytics 
    WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;

    -- Clean up old geographic anomalies
    DELETE FROM geographic_anomalies 
    WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;

    -- Clean up old predictive threats
    DELETE FROM predictive_threats 
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

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

CREATE TRIGGER update_behavioral_profiles_updated_at
    BEFORE UPDATE ON behavioral_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_models_updated_at
    BEFORE UPDATE ON ml_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anomaly_rules_updated_at
    BEFORE UPDATE ON anomaly_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_intelligence_updated_at
    BEFORE UPDATE ON threat_intelligence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled jobs

-- Clean up old data every day at 2 AM
SELECT cron.schedule(
    'cleanup-old-threat-data',
    '0 2 * * *',
    'SELECT cleanup_old_threat_data(90);'
);

-- Update security metrics every hour
SELECT cron.schedule(
    'update-security-metrics',
    '0 * * * *',
    'INSERT INTO security_metrics (metric_name, metric_value, metric_unit, period)
     SELECT 
         ''active_threats_per_hour'',
         COUNT(*)::DECIMAL,
         ''count'',
         ''hourly''
     FROM threat_detection_logs 
     WHERE timestamp > NOW() - INTERVAL ''1 hour''
     AND severity IN (''HIGH'', ''CRITICAL'');'
);

-- Views for reporting

-- View for threat detection summary
CREATE OR REPLACE VIEW threat_detection_summary AS
SELECT 
    DATE(timestamp) as date,
    severity,
    COUNT(*) as count,
    AVG(threat_score) as avg_score,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT user_id) as unique_users
FROM threat_detection_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), severity
ORDER BY date DESC, severity;

-- View for behavioral anomalies
CREATE OR REPLACE VIEW behavioral_anomalies_summary AS
SELECT 
    bp.user_id,
    u.email,
    bp.anomaly_count,
    bp.last_anomaly,
    COUNT(tdl.id) as threat_count,
    AVG(tdl.threat_score) as avg_threat_score
FROM behavioral_profiles bp
LEFT JOIN users u ON bp.user_id = u.id
LEFT JOIN threat_detection_logs tdl ON bp.user_id = tdl.user_id
WHERE bp.anomaly_count > 0
GROUP BY bp.user_id, u.email, bp.anomaly_count, bp.last_anomaly
ORDER BY bp.anomaly_count DESC;

-- View for network traffic anomalies
CREATE OR REPLACE VIEW network_traffic_anomalies AS
SELECT 
    DATE(timestamp) as date,
    ip_address,
    COUNT(*) as request_count,
    AVG(response_time) as avg_response_time,
    COUNT(*) FILTER (WHERE is_anomalous = true) as anomaly_count,
    AVG(anomaly_score) as avg_anomaly_score
FROM network_traffic
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), ip_address
HAVING COUNT(*) FILTER (WHERE is_anomalous = true) > 0
ORDER BY date DESC, anomaly_count DESC;

-- Insert default anomaly rules
INSERT INTO anomaly_rules (rule_name, rule_type, rule_config, threshold_value, severity) VALUES
('High Request Frequency', 'FREQUENCY', '{"window_minutes": 60, "max_requests": 1000}', 1000, 'HIGH'),
('Geographic Anomaly', 'GEOGRAPHIC', '{"max_distance_km": 1000, "time_window_hours": 1}', 1000, 'MEDIUM'),
('Response Time Anomaly', 'PERFORMANCE', '{"max_response_time_ms": 5000}', 5000, 'MEDIUM'),
('Authentication Failure', 'AUTH', '{"max_failures": 5, "time_window_minutes": 15}', 5, 'HIGH'),
('Data Access Anomaly', 'DATA', '{"max_records": 10000}', 10000, 'MEDIUM')
ON CONFLICT (rule_name) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medspasync_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO medspasync_user;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO medspasync_user;

-- Comments for documentation
COMMENT ON TABLE threat_detection_logs IS 'Comprehensive threat detection event logging';
COMMENT ON TABLE behavioral_profiles IS 'User behavioral analysis profiles for ML';
COMMENT ON TABLE ml_models IS 'Machine learning models for threat detection';
COMMENT ON TABLE anomaly_rules IS 'Configurable anomaly detection rules';
COMMENT ON TABLE threat_intelligence IS 'External threat intelligence data';
COMMENT ON TABLE network_traffic IS 'Network traffic analysis data';
COMMENT ON TABLE user_behavior_analytics IS 'User behavior analytics for anomaly detection';
COMMENT ON TABLE geographic_anomalies IS 'Geographic location anomaly detection';
COMMENT ON TABLE predictive_threats IS 'Predictive threat modeling results';
COMMENT ON TABLE security_metrics IS 'Security performance metrics';

COMMENT ON FUNCTION log_threat_detection(JSONB, INET, TEXT, UUID, VARCHAR, VARCHAR, DECIMAL, VARCHAR, JSONB) IS 'Log threat detection events with comprehensive data';
COMMENT ON FUNCTION update_behavioral_profile(UUID, JSONB, JSONB, JSONB, DECIMAL) IS 'Update user behavioral profile for ML analysis';
COMMENT ON FUNCTION get_threat_statistics(INTEGER) IS 'Get comprehensive threat detection statistics';
COMMENT ON FUNCTION detect_geographic_anomaly(UUID, INET, VARCHAR, VARCHAR, VARCHAR, DECIMAL, DECIMAL) IS 'Detect geographic location anomalies';
COMMENT ON FUNCTION cleanup_old_threat_data(INTEGER) IS 'Clean up old threat detection data'; 