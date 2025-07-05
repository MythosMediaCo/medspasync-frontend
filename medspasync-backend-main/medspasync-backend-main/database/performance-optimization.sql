-- Performance Optimization Database Setup
-- Database query optimization, caching, connection pooling, and monitoring for MedSpaSync Pro

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_stat_monitor";
CREATE EXTENSION IF NOT EXISTS "auto_explain";

-- Performance Logs table
CREATE TABLE IF NOT EXISTS performance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id VARCHAR(255) NOT NULL,
    query_text TEXT NOT NULL,
    duration INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    execution_plan JSONB,
    rows_affected INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Alerts table
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    message TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database Statistics table
CREATE TABLE IF NOT EXISTS database_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    collection_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags JSONB DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'performance_monitor'
);

-- Cache Performance table
CREATE TABLE IF NOT EXISTS cache_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hit_rate DECIMAL(5,2) NOT NULL,
    total_commands INTEGER NOT NULL,
    connected_clients INTEGER NOT NULL,
    used_memory BIGINT NOT NULL,
    cache_evictions INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query Patterns table
CREATE TABLE IF NOT EXISTS query_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_hash VARCHAR(64) NOT NULL UNIQUE,
    query_pattern TEXT NOT NULL,
    execution_count INTEGER DEFAULT 1,
    total_duration BIGINT DEFAULT 0,
    avg_duration DECIMAL(10,2) DEFAULT 0,
    min_duration INTEGER DEFAULT 0,
    max_duration INTEGER DEFAULT 0,
    last_executed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    optimization_suggestions JSONB DEFAULT '[]',
    is_optimized BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index Usage Statistics table
CREATE TABLE IF NOT EXISTS index_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_name VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    index_name VARCHAR(100) NOT NULL,
    scans_count BIGINT DEFAULT 0,
    tuples_read BIGINT DEFAULT 0,
    tuples_fetched BIGINT DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT true,
    usage_percentage DECIMAL(5,2) DEFAULT 0,
    collection_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(schema_name, table_name, index_name, collection_date)
);

-- Connection Pool Statistics table
CREATE TABLE IF NOT EXISTS connection_pool_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_connections INTEGER NOT NULL,
    active_connections INTEGER NOT NULL,
    idle_connections INTEGER NOT NULL,
    waiting_connections INTEGER DEFAULT 0,
    max_connections INTEGER NOT NULL,
    connection_wait_time DECIMAL(10,2) DEFAULT 0,
    connection_errors INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Reports table
CREATE TABLE IF NOT EXISTS performance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL,
    report_period VARCHAR(20) NOT NULL,
    report_data JSONB NOT NULL,
    summary TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimization Recommendations table
CREATE TABLE IF NOT EXISTS optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact_score DECIMAL(3,2) DEFAULT 0,
    implementation_effort VARCHAR(20) DEFAULT 'MEDIUM',
    estimated_improvement DECIMAL(5,2) DEFAULT 0,
    affected_components JSONB DEFAULT '[]',
    sql_script TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    implemented_at TIMESTAMP WITH TIME ZONE,
    implemented_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Baselines table
CREATE TABLE IF NOT EXISTS performance_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baseline_name VARCHAR(100) NOT NULL,
    baseline_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    baseline_value DECIMAL(15,4) NOT NULL,
    acceptable_range JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp ON performance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_logs_duration ON performance_logs(duration);
CREATE INDEX IF NOT EXISTS idx_performance_logs_status ON performance_logs(status);
CREATE INDEX IF NOT EXISTS idx_performance_logs_query_id ON performance_logs(query_id);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_type ON performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_timestamp ON performance_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_acknowledged ON performance_alerts(acknowledged);

CREATE INDEX IF NOT EXISTS idx_database_statistics_metric ON database_statistics(metric_name);
CREATE INDEX IF NOT EXISTS idx_database_statistics_collection_time ON database_statistics(collection_time);

CREATE INDEX IF NOT EXISTS idx_cache_performance_timestamp ON cache_performance(timestamp);
CREATE INDEX IF NOT EXISTS idx_cache_performance_hit_rate ON cache_performance(hit_rate);

CREATE INDEX IF NOT EXISTS idx_query_patterns_hash ON query_patterns(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_query_patterns_execution_count ON query_patterns(execution_count);
CREATE INDEX IF NOT EXISTS idx_query_patterns_avg_duration ON query_patterns(avg_duration);
CREATE INDEX IF NOT EXISTS idx_query_patterns_last_executed ON query_patterns(last_executed);

CREATE INDEX IF NOT EXISTS idx_index_usage_stats_table ON index_usage_stats(schema_name, table_name);
CREATE INDEX IF NOT EXISTS idx_index_usage_stats_usage ON index_usage_stats(is_used);
CREATE INDEX IF NOT EXISTS idx_index_usage_stats_collection_date ON index_usage_stats(collection_date);

CREATE INDEX IF NOT EXISTS idx_connection_pool_stats_timestamp ON connection_pool_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_connection_pool_stats_active ON connection_pool_stats(active_connections);

CREATE INDEX IF NOT EXISTS idx_performance_reports_type ON performance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_performance_reports_generated_at ON performance_reports(generated_at);

CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_type ON optimization_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_priority ON optimization_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_status ON optimization_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_performance_baselines_name ON performance_baselines(baseline_name);
CREATE INDEX IF NOT EXISTS idx_performance_baselines_type ON performance_baselines(baseline_type);
CREATE INDEX IF NOT EXISTS idx_performance_baselines_active ON performance_baselines(is_active);

-- Row Level Security (RLS) policies
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_baselines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_logs
CREATE POLICY performance_logs_admin_policy ON performance_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for performance_alerts
CREATE POLICY performance_alerts_admin_policy ON performance_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for database_statistics
CREATE POLICY database_statistics_admin_policy ON database_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for cache_performance
CREATE POLICY cache_performance_admin_policy ON cache_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for query_patterns
CREATE POLICY query_patterns_admin_policy ON query_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for index_usage_stats
CREATE POLICY index_usage_stats_admin_policy ON index_usage_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for connection_pool_stats
CREATE POLICY connection_pool_stats_admin_policy ON connection_pool_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for performance_reports
CREATE POLICY performance_reports_admin_policy ON performance_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for optimization_recommendations
CREATE POLICY optimization_recommendations_admin_policy ON optimization_recommendations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for performance_baselines
CREATE POLICY performance_baselines_admin_policy ON performance_baselines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- Functions for performance optimization

-- Function to log performance data
CREATE OR REPLACE FUNCTION log_performance_data(
    query_uuid VARCHAR,
    query_text_param TEXT,
    duration_param INTEGER,
    status_param VARCHAR,
    error_msg TEXT DEFAULT NULL,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_text TEXT DEFAULT NULL,
    execution_plan_json JSONB DEFAULT NULL,
    rows_affected_param INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO performance_logs (
        query_id, query_text, duration, status, error_message,
        user_id, ip_address, user_agent, execution_plan, rows_affected
    ) VALUES (
        query_uuid, query_text_param, duration_param, status_param, error_msg,
        user_uuid, ip_addr, user_agent_text, execution_plan_json, rows_affected_param
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create performance alert
CREATE OR REPLACE FUNCTION create_performance_alert(
    alert_type_param VARCHAR,
    severity_param VARCHAR,
    message_param TEXT,
    details_json JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO performance_alerts (
        alert_type, severity, message, details
    ) VALUES (
        alert_type_param, severity_param, message_param, details_json
    ) RETURNING id INTO alert_id;

    RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance statistics
CREATE OR REPLACE FUNCTION get_performance_statistics(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
    total_queries INTEGER,
    slow_queries INTEGER,
    avg_duration DECIMAL(10,2),
    max_duration INTEGER,
    error_count INTEGER,
    cache_hit_rate DECIMAL(5,2),
    active_connections INTEGER,
    idle_connections INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_queries,
        COUNT(*) FILTER (WHERE duration > 1000)::INTEGER as slow_queries,
        AVG(duration)::DECIMAL(10,2) as avg_duration,
        MAX(duration)::INTEGER as max_duration,
        COUNT(*) FILTER (WHERE status = 'ERROR')::INTEGER as error_count,
        (SELECT hit_rate FROM cache_performance ORDER BY timestamp DESC LIMIT 1)::DECIMAL(5,2) as cache_hit_rate,
        (SELECT active_connections FROM connection_pool_stats ORDER BY timestamp DESC LIMIT 1)::INTEGER as active_connections,
        (SELECT idle_connections FROM connection_pool_stats ORDER BY timestamp DESC LIMIT 1)::INTEGER as idle_connections
    FROM performance_logs 
    WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze query patterns
CREATE OR REPLACE FUNCTION analyze_query_patterns(
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE(
    pattern_hash VARCHAR,
    query_pattern TEXT,
    execution_count INTEGER,
    avg_duration DECIMAL(10,2),
    total_duration BIGINT,
    optimization_needed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qp.pattern_hash,
        qp.query_pattern,
        qp.execution_count,
        qp.avg_duration,
        qp.total_duration,
        CASE WHEN qp.avg_duration > 500 OR qp.execution_count > 1000 THEN true ELSE false END as optimization_needed
    FROM query_patterns qp
    WHERE qp.last_executed > NOW() - (days_back || ' days')::INTERVAL
    ORDER BY qp.total_duration DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(
    threshold_ms INTEGER DEFAULT 1000,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    query_text TEXT,
    duration INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.query_text,
        pl.duration,
        pl.timestamp,
        COUNT(*) OVER (PARTITION BY pl.query_text) as execution_count
    FROM performance_logs pl
    WHERE pl.duration > threshold_ms
    ORDER BY pl.duration DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old performance data
CREATE OR REPLACE FUNCTION cleanup_performance_data(
    logs_days INTEGER DEFAULT 30,
    alerts_days INTEGER DEFAULT 90,
    stats_days INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old performance logs
    DELETE FROM performance_logs 
    WHERE timestamp < NOW() - (logs_days || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Clean up old performance alerts
    DELETE FROM performance_alerts 
    WHERE timestamp < NOW() - (alerts_days || ' days')::INTERVAL
    AND acknowledged = true;

    -- Clean up old database statistics
    DELETE FROM database_statistics 
    WHERE collection_time < NOW() - (stats_days || ' days')::INTERVAL;

    -- Clean up old cache performance data
    DELETE FROM cache_performance 
    WHERE timestamp < NOW() - (stats_days || ' days')::INTERVAL;

    -- Clean up old connection pool stats
    DELETE FROM connection_pool_stats 
    WHERE timestamp < NOW() - (stats_days || ' days')::INTERVAL;

    -- Archive old performance reports
    UPDATE performance_reports 
    SET is_archived = true, archived_at = NOW()
    WHERE generated_at < NOW() - INTERVAL '1 year'
    AND is_archived = false;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate performance report
CREATE OR REPLACE FUNCTION generate_performance_report(
    report_type_param VARCHAR,
    report_period_param VARCHAR DEFAULT '24h'
)
RETURNS UUID AS $$
DECLARE
    report_id UUID;
    report_data JSONB;
    summary_text TEXT;
BEGIN
    -- Generate report data based on type
    CASE report_type_param
        WHEN 'database' THEN
            SELECT 
                jsonb_build_object(
                    'type', 'database_performance',
                    'period', report_period_param,
                    'total_queries', COUNT(*),
                    'slow_queries', COUNT(*) FILTER (WHERE duration > 1000),
                    'avg_duration', AVG(duration),
                    'max_duration', MAX(duration),
                    'error_rate', (COUNT(*) FILTER (WHERE status = 'ERROR')::DECIMAL / COUNT(*) * 100)
                ),
                'Database performance report for ' || report_period_param
            INTO report_data, summary_text
            FROM performance_logs
            WHERE timestamp > CASE 
                WHEN report_period_param = '24h' THEN NOW() - INTERVAL '24 hours'
                WHEN report_period_param = '7d' THEN NOW() - INTERVAL '7 days'
                WHEN report_period_param = '30d' THEN NOW() - INTERVAL '30 days'
                ELSE NOW() - INTERVAL '24 hours'
            END;
            
        WHEN 'cache' THEN
            SELECT 
                jsonb_build_object(
                    'type', 'cache_performance',
                    'period', report_period_param,
                    'avg_hit_rate', AVG(hit_rate),
                    'total_commands', SUM(total_commands),
                    'avg_connected_clients', AVG(connected_clients),
                    'avg_used_memory', AVG(used_memory)
                ),
                'Cache performance report for ' || report_period_param
            INTO report_data, summary_text
            FROM cache_performance
            WHERE timestamp > CASE 
                WHEN report_period_param = '24h' THEN NOW() - INTERVAL '24 hours'
                WHEN report_period_param = '7d' THEN NOW() - INTERVAL '7 days'
                WHEN report_period_param = '30d' THEN NOW() - INTERVAL '30 days'
                ELSE NOW() - INTERVAL '24 hours'
            END;
            
        WHEN 'connection_pool' THEN
            SELECT 
                jsonb_build_object(
                    'type', 'connection_pool_performance',
                    'period', report_period_param,
                    'avg_active_connections', AVG(active_connections),
                    'avg_idle_connections', AVG(idle_connections),
                    'max_waiting_connections', MAX(waiting_connections),
                    'total_errors', SUM(connection_errors)
                ),
                'Connection pool performance report for ' || report_period_param
            INTO report_data, summary_text
            FROM connection_pool_stats
            WHERE timestamp > CASE 
                WHEN report_period_param = '24h' THEN NOW() - INTERVAL '24 hours'
                WHEN report_period_param = '7d' THEN NOW() - INTERVAL '7 days'
                WHEN report_period_param = '30d' THEN NOW() - INTERVAL '30 days'
                ELSE NOW() - INTERVAL '24 hours'
            END;
            
        ELSE
            -- Default summary report
            SELECT 
                jsonb_build_object(
                    'type', 'performance_summary',
                    'period', report_period_param,
                    'database', (
                        SELECT jsonb_build_object(
                            'total_queries', COUNT(*),
                            'avg_duration', AVG(duration)
                        ) FROM performance_logs WHERE timestamp > NOW() - INTERVAL '24 hours'
                    ),
                    'cache', (
                        SELECT jsonb_build_object(
                            'hit_rate', AVG(hit_rate)
                        ) FROM cache_performance WHERE timestamp > NOW() - INTERVAL '24 hours'
                    ),
                    'alerts', (
                        SELECT COUNT(*) FROM performance_alerts WHERE timestamp > NOW() - INTERVAL '24 hours'
                    )
                ),
                'Performance summary report for ' || report_period_param
            INTO report_data, summary_text;
    END CASE;

    INSERT INTO performance_reports (
        report_type, report_period, report_data, summary
    ) VALUES (
        report_type_param,
        report_period_param,
        report_data,
        summary_text
    ) RETURNING id INTO report_id;

    RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update query patterns
CREATE OR REPLACE FUNCTION update_query_pattern(
    pattern_hash_param VARCHAR,
    query_pattern_param TEXT,
    duration_param INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO query_patterns (
        pattern_hash, query_pattern, execution_count, total_duration, 
        avg_duration, min_duration, max_duration, last_executed
    ) VALUES (
        pattern_hash_param, query_pattern_param, 1, duration_param,
        duration_param, duration_param, duration_param, NOW()
    )
    ON CONFLICT (pattern_hash) DO UPDATE SET
        execution_count = query_patterns.execution_count + 1,
        total_duration = query_patterns.total_duration + duration_param,
        avg_duration = (query_patterns.total_duration + duration_param) / (query_patterns.execution_count + 1),
        min_duration = LEAST(query_patterns.min_duration, duration_param),
        max_duration = GREATEST(query_patterns.max_duration, duration_param),
        last_executed = NOW(),
        updated_at = NOW();
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

CREATE TRIGGER update_query_patterns_updated_at
    BEFORE UPDATE ON query_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_optimization_recommendations_updated_at
    BEFORE UPDATE ON optimization_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_baselines_updated_at
    BEFORE UPDATE ON performance_baselines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled jobs

-- Clean up old performance data every day at 2 AM
SELECT cron.schedule(
    'cleanup-performance-data',
    '0 2 * * *',
    'SELECT cleanup_performance_data(30, 90, 7);'
);

-- Generate performance reports every 6 hours
SELECT cron.schedule(
    'generate-performance-reports',
    '0 */6 * * *',
    'SELECT generate_performance_report(''summary'', ''24h'');'
);

-- Analyze query patterns every day at 3 AM
SELECT cron.schedule(
    'analyze-query-patterns',
    '0 3 * * *',
    'SELECT analyze_query_patterns(7);'
);

-- Views for performance monitoring

-- View for performance summary
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_queries,
    COUNT(*) FILTER (WHERE duration > 1000) as slow_queries,
    AVG(duration) as avg_duration,
    MAX(duration) as max_duration,
    COUNT(*) FILTER (WHERE status = 'ERROR') as error_count,
    (COUNT(*) FILTER (WHERE status = 'ERROR')::DECIMAL / COUNT(*) * 100) as error_rate
FROM performance_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- View for slow query analysis
CREATE OR REPLACE VIEW slow_query_analysis AS
SELECT 
    query_text,
    COUNT(*) as execution_count,
    AVG(duration) as avg_duration,
    MAX(duration) as max_duration,
    MIN(duration) as min_duration,
    SUM(duration) as total_duration,
    MAX(timestamp) as last_executed
FROM performance_logs
WHERE duration > 1000
GROUP BY query_text
ORDER BY total_duration DESC;

-- View for alert summary
CREATE OR REPLACE VIEW alert_summary AS
SELECT 
    alert_type,
    severity,
    COUNT(*) as alert_count,
    COUNT(*) FILTER (WHERE acknowledged = true) as acknowledged_count,
    COUNT(*) FILTER (WHERE resolved = true) as resolved_count,
    MAX(timestamp) as last_alert
FROM performance_alerts
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY alert_type, severity
ORDER BY alert_count DESC;

-- Insert default performance baselines
INSERT INTO performance_baselines (baseline_name, baseline_type, metric_name, baseline_value, acceptable_range) VALUES
('Query Response Time', 'DATABASE', 'avg_duration', 100, '{"min": 0, "max": 500}'),
('Slow Query Rate', 'DATABASE', 'slow_query_rate', 5, '{"min": 0, "max": 10}'),
('Cache Hit Rate', 'CACHE', 'hit_rate', 80, '{"min": 70, "max": 100}'),
('Connection Pool Utilization', 'CONNECTION', 'active_connections', 10, '{"min": 0, "max": 15}'),
('Error Rate', 'GENERAL', 'error_rate', 1, '{"min": 0, "max": 5}')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medspasync_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO medspasync_user;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO medspasync_user;

-- Comments for documentation
COMMENT ON TABLE performance_logs IS 'Comprehensive performance logging for database queries';
COMMENT ON TABLE performance_alerts IS 'Performance alerts and notifications';
COMMENT ON TABLE database_statistics IS 'Database performance metrics and statistics';
COMMENT ON TABLE cache_performance IS 'Cache performance monitoring and metrics';
COMMENT ON TABLE query_patterns IS 'Query pattern analysis and optimization tracking';
COMMENT ON TABLE index_usage_stats IS 'Database index usage statistics and optimization';
COMMENT ON TABLE connection_pool_stats IS 'Database connection pool monitoring';
COMMENT ON TABLE performance_reports IS 'Performance reports and analytics';
COMMENT ON TABLE optimization_recommendations IS 'Performance optimization recommendations';
COMMENT ON TABLE performance_baselines IS 'Performance baselines and thresholds';

COMMENT ON FUNCTION log_performance_data(VARCHAR, TEXT, INTEGER, VARCHAR, TEXT, UUID, INET, TEXT, JSONB, INTEGER) IS 'Log comprehensive performance data for queries';
COMMENT ON FUNCTION create_performance_alert(VARCHAR, VARCHAR, TEXT, JSONB) IS 'Create performance alert with details';
COMMENT ON FUNCTION get_performance_statistics(INTEGER) IS 'Get comprehensive performance statistics';
COMMENT ON FUNCTION analyze_query_patterns(INTEGER) IS 'Analyze query patterns for optimization';
COMMENT ON FUNCTION get_slow_queries(INTEGER, INTEGER) IS 'Get slow queries with analysis';
COMMENT ON FUNCTION cleanup_performance_data(INTEGER, INTEGER, INTEGER) IS 'Clean up old performance data';
COMMENT ON FUNCTION generate_performance_report(VARCHAR, VARCHAR) IS 'Generate performance reports';
COMMENT ON FUNCTION update_query_pattern(VARCHAR, TEXT, INTEGER) IS 'Update query pattern statistics'; 