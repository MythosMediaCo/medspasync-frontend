-- Scalability & Load Balancing Database Setup
-- Service discovery, health monitoring, load distribution, and high availability for MedSpaSync Pro

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_stat_monitor";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service Registry table
CREATE TABLE IF NOT EXISTS service_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id VARCHAR(255) NOT NULL UNIQUE,
    service_type VARCHAR(50) NOT NULL,
    worker_id VARCHAR(50),
    instance_id VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    health_status VARCHAR(20) DEFAULT 'healthy',
    capabilities JSONB DEFAULT '[]',
    load_metrics JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load Balancer Configuration table
CREATE TABLE IF NOT EXISTS load_balancer_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_name VARCHAR(100) NOT NULL UNIQUE,
    algorithm VARCHAR(50) NOT NULL DEFAULT 'round_robin',
    health_check_interval INTEGER DEFAULT 30000,
    max_connections INTEGER DEFAULT 1000,
    connection_timeout INTEGER DEFAULT 30000,
    retry_attempts INTEGER DEFAULT 3,
    circuit_breaker_threshold INTEGER DEFAULT 5,
    circuit_breaker_timeout INTEGER DEFAULT 60000,
    sticky_session_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 1800,
    weight_distribution JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Monitoring table
CREATE TABLE IF NOT EXISTS health_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    health_status VARCHAR(20) NOT NULL,
    response_time INTEGER,
    error_message TEXT,
    check_type VARCHAR(50) NOT NULL,
    check_details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load Distribution table
CREATE TABLE IF NOT EXISTS load_distribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    response_time_avg DECIMAL(10,2) DEFAULT 0,
    response_time_min INTEGER DEFAULT 0,
    response_time_max INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100,
    cpu_usage DECIMAL(5,2) DEFAULT 0,
    memory_usage DECIMAL(5,2) DEFAULT 0,
    load_factor DECIMAL(5,2) DEFAULT 0,
    collection_interval VARCHAR(20) DEFAULT '1m',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circuit Breaker table
CREATE TABLE IF NOT EXISTS circuit_breaker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'closed',
    failure_count INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 5,
    timeout INTEGER DEFAULT 60000,
    last_failure_time TIMESTAMP WITH TIME ZONE,
    next_attempt_time TIMESTAMP WITH TIME ZONE,
    total_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_name, service_type)
);

-- Auto Scaling Events table
CREATE TABLE IF NOT EXISTS auto_scaling_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_value DECIMAL(10,2) NOT NULL,
    threshold_value DECIMAL(10,2) NOT NULL,
    action_taken VARCHAR(100) NOT NULL,
    target_service VARCHAR(100),
    scaling_factor INTEGER DEFAULT 1,
    current_instances INTEGER,
    new_instances INTEGER,
    event_details JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- High Availability table
CREATE TABLE IF NOT EXISTS high_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'available',
    uptime_percentage DECIMAL(5,2) DEFAULT 100,
    last_downtime TIMESTAMP WITH TIME ZONE,
    downtime_duration INTEGER DEFAULT 0,
    failover_count INTEGER DEFAULT 0,
    last_failover_time TIMESTAMP WITH TIME ZONE,
    backup_service VARCHAR(100),
    health_check_url VARCHAR(255),
    monitoring_enabled BOOLEAN DEFAULT true,
    alert_threshold INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Mesh table
CREATE TABLE IF NOT EXISTS service_mesh (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id VARCHAR(255) NOT NULL,
    span_id VARCHAR(255) NOT NULL,
    parent_span_id VARCHAR(255),
    service_name VARCHAR(100) NOT NULL,
    operation_name VARCHAR(100) NOT NULL,
    request_id VARCHAR(255),
    client_ip INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    request_headers JSONB DEFAULT '{}',
    request_body_size INTEGER DEFAULT 0,
    response_status_code INTEGER,
    response_headers JSONB DEFAULT '{}',
    response_body_size INTEGER DEFAULT 0,
    duration INTEGER NOT NULL,
    error_message TEXT,
    tags JSONB DEFAULT '{}',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load Balancer Statistics table
CREATE TABLE IF NOT EXISTS load_balancer_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    algorithm VARCHAR(50) NOT NULL,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    average_response_time DECIMAL(10,2) DEFAULT 0,
    requests_per_second DECIMAL(10,2) DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    peak_connections INTEGER DEFAULT 0,
    connection_errors INTEGER DEFAULT 0,
    health_check_failures INTEGER DEFAULT 0,
    circuit_breaker_trips INTEGER DEFAULT 0,
    auto_scaling_events INTEGER DEFAULT 0,
    collection_period VARCHAR(20) DEFAULT '1h',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database Connection Pool table
CREATE TABLE IF NOT EXISTS database_pool_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_name VARCHAR(100) NOT NULL,
    total_connections INTEGER NOT NULL,
    active_connections INTEGER NOT NULL,
    idle_connections INTEGER NOT NULL,
    waiting_connections INTEGER DEFAULT 0,
    max_connections INTEGER NOT NULL,
    min_connections INTEGER NOT NULL,
    connection_wait_time DECIMAL(10,2) DEFAULT 0,
    connection_errors INTEGER DEFAULT 0,
    query_count INTEGER DEFAULT 0,
    slow_query_count INTEGER DEFAULT 0,
    avg_query_time DECIMAL(10,2) DEFAULT 0,
    pool_utilization DECIMAL(5,2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redis Cluster table
CREATE TABLE IF NOT EXISTS redis_cluster_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_name VARCHAR(100) NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'connected',
    memory_used BIGINT DEFAULT 0,
    memory_peak BIGINT DEFAULT 0,
    memory_limit BIGINT DEFAULT 0,
    keyspace_hits BIGINT DEFAULT 0,
    keyspace_misses BIGINT DEFAULT 0,
    hit_rate DECIMAL(5,2) DEFAULT 0,
    connected_clients INTEGER DEFAULT 0,
    blocked_clients INTEGER DEFAULT 0,
    total_commands_processed BIGINT DEFAULT 0,
    total_connections_received BIGINT DEFAULT 0,
    total_net_input_bytes BIGINT DEFAULT 0,
    total_net_output_bytes BIGINT DEFAULT 0,
    instantaneous_ops_per_sec INTEGER DEFAULT 0,
    instantaneous_input_kbps DECIMAL(10,2) DEFAULT 0,
    instantaneous_output_kbps DECIMAL(10,2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Graceful Degradation table
CREATE TABLE IF NOT EXISTS graceful_degradation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    degradation_level VARCHAR(20) NOT NULL,
    trigger_condition VARCHAR(100) NOT NULL,
    trigger_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    actions_taken JSONB DEFAULT '[]',
    features_disabled JSONB DEFAULT '[]',
    performance_impact DECIMAL(5,2) DEFAULT 0,
    user_experience_impact VARCHAR(20) DEFAULT 'minimal',
    recovery_threshold DECIMAL(10,2),
    recovery_actions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_registry_service_id ON service_registry(service_id);
CREATE INDEX IF NOT EXISTS idx_service_registry_service_type ON service_registry(service_type);
CREATE INDEX IF NOT EXISTS idx_service_registry_health_status ON service_registry(health_status);
CREATE INDEX IF NOT EXISTS idx_service_registry_last_seen ON service_registry(last_seen);

CREATE INDEX IF NOT EXISTS idx_health_monitoring_service_id ON health_monitoring(service_id);
CREATE INDEX IF NOT EXISTS idx_health_monitoring_service_type ON health_monitoring(service_type);
CREATE INDEX IF NOT EXISTS idx_health_monitoring_health_status ON health_monitoring(health_status);
CREATE INDEX IF NOT EXISTS idx_health_monitoring_timestamp ON health_monitoring(timestamp);

CREATE INDEX IF NOT EXISTS idx_load_distribution_service_id ON load_distribution(service_id);
CREATE INDEX IF NOT EXISTS idx_load_distribution_timestamp ON load_distribution(timestamp);
CREATE INDEX IF NOT EXISTS idx_load_distribution_load_factor ON load_distribution(load_factor);

CREATE INDEX IF NOT EXISTS idx_circuit_breaker_service_name ON circuit_breaker(service_name);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_status ON circuit_breaker(status);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_last_failure_time ON circuit_breaker(last_failure_time);

CREATE INDEX IF NOT EXISTS idx_auto_scaling_events_event_type ON auto_scaling_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auto_scaling_events_trigger_type ON auto_scaling_events(trigger_type);
CREATE INDEX IF NOT EXISTS idx_auto_scaling_events_created_at ON auto_scaling_events(created_at);

CREATE INDEX IF NOT EXISTS idx_high_availability_service_name ON high_availability(service_name);
CREATE INDEX IF NOT EXISTS idx_high_availability_availability_status ON high_availability(availability_status);

CREATE INDEX IF NOT EXISTS idx_service_mesh_trace_id ON service_mesh(trace_id);
CREATE INDEX IF NOT EXISTS idx_service_mesh_span_id ON service_mesh(span_id);
CREATE INDEX IF NOT EXISTS idx_service_mesh_service_name ON service_mesh(service_name);
CREATE INDEX IF NOT EXISTS idx_service_mesh_start_time ON service_mesh(start_time);

CREATE INDEX IF NOT EXISTS idx_load_balancer_stats_algorithm ON load_balancer_stats(algorithm);
CREATE INDEX IF NOT EXISTS idx_load_balancer_stats_timestamp ON load_balancer_stats(timestamp);

CREATE INDEX IF NOT EXISTS idx_database_pool_stats_pool_name ON database_pool_stats(pool_name);
CREATE INDEX IF NOT EXISTS idx_database_pool_stats_timestamp ON database_pool_stats(timestamp);

CREATE INDEX IF NOT EXISTS idx_redis_cluster_stats_cluster_name ON redis_cluster_stats(cluster_name);
CREATE INDEX IF NOT EXISTS idx_redis_cluster_stats_node_type ON redis_cluster_stats(node_type);
CREATE INDEX IF NOT EXISTS idx_redis_cluster_stats_timestamp ON redis_cluster_stats(timestamp);

CREATE INDEX IF NOT EXISTS idx_graceful_degradation_service_name ON graceful_degradation(service_name);
CREATE INDEX IF NOT EXISTS idx_graceful_degradation_degradation_level ON graceful_degradation(degradation_level);
CREATE INDEX IF NOT EXISTS idx_graceful_degradation_started_at ON graceful_degradation(started_at);

-- Row Level Security (RLS) policies
ALTER TABLE service_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_balancer_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_scaling_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_mesh ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_balancer_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_pool_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE redis_cluster_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE graceful_degradation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_registry
CREATE POLICY service_registry_admin_policy ON service_registry
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for load_balancer_config
CREATE POLICY load_balancer_config_admin_policy ON load_balancer_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for health_monitoring
CREATE POLICY health_monitoring_admin_policy ON health_monitoring
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for load_distribution
CREATE POLICY load_distribution_admin_policy ON load_distribution
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for circuit_breaker
CREATE POLICY circuit_breaker_admin_policy ON circuit_breaker
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for auto_scaling_events
CREATE POLICY auto_scaling_events_admin_policy ON auto_scaling_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for high_availability
CREATE POLICY high_availability_admin_policy ON high_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for service_mesh
CREATE POLICY service_mesh_admin_policy ON service_mesh
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for load_balancer_stats
CREATE POLICY load_balancer_stats_admin_policy ON load_balancer_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for database_pool_stats
CREATE POLICY database_pool_stats_admin_policy ON database_pool_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for redis_cluster_stats
CREATE POLICY redis_cluster_stats_admin_policy ON redis_cluster_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for graceful_degradation
CREATE POLICY graceful_degradation_admin_policy ON graceful_degradation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- Functions for scalability and load balancing

-- Function to register service
CREATE OR REPLACE FUNCTION register_service(
    service_id_param VARCHAR,
    service_type_param VARCHAR,
    worker_id_param VARCHAR,
    instance_id_param VARCHAR,
    host_param VARCHAR,
    port_param INTEGER,
    capabilities_param JSONB DEFAULT '[]',
    load_metrics_param JSONB DEFAULT '{}',
    metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    service_uuid UUID;
BEGIN
    INSERT INTO service_registry (
        service_id, service_type, worker_id, instance_id, host, port,
        capabilities, load_metrics, metadata
    ) VALUES (
        service_id_param, service_type_param, worker_id_param, instance_id_param,
        host_param, port_param, capabilities_param, load_metrics_param, metadata_param
    )
    ON CONFLICT (service_id) DO UPDATE SET
        service_type = EXCLUDED.service_type,
        worker_id = EXCLUDED.worker_id,
        instance_id = EXCLUDED.instance_id,
        host = EXCLUDED.host,
        port = EXCLUDED.port,
        capabilities = EXCLUDED.capabilities,
        load_metrics = EXCLUDED.load_metrics,
        metadata = EXCLUDED.metadata,
        last_seen = NOW(),
        updated_at = NOW()
    RETURNING id INTO service_uuid;

    RETURN service_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update service health
CREATE OR REPLACE FUNCTION update_service_health(
    service_id_param VARCHAR,
    health_status_param VARCHAR,
    response_time_param INTEGER DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE service_registry 
    SET 
        health_status = health_status_param,
        last_seen = NOW(),
        updated_at = NOW()
    WHERE service_id = service_id_param;

    INSERT INTO health_monitoring (
        service_id, service_type, health_status, response_time, error_message, check_type
    ) VALUES (
        service_id_param,
        (SELECT service_type FROM service_registry WHERE service_id = service_id_param),
        health_status_param,
        response_time_param,
        error_message_param,
        'health_check'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record load distribution
CREATE OR REPLACE FUNCTION record_load_distribution(
    service_id_param VARCHAR,
    request_count_param INTEGER,
    active_connections_param INTEGER,
    response_time_avg_param DECIMAL,
    cpu_usage_param DECIMAL,
    memory_usage_param DECIMAL
)
RETURNS UUID AS $$
DECLARE
    load_id UUID;
BEGIN
    INSERT INTO load_distribution (
        service_id, request_count, active_connections, response_time_avg,
        cpu_usage, memory_usage, load_factor
    ) VALUES (
        service_id_param, request_count_param, active_connections_param,
        response_time_avg_param, cpu_usage_param, memory_usage_param,
        (cpu_usage_param + memory_usage_param) / 2
    ) RETURNING id INTO load_id;

    RETURN load_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update circuit breaker
CREATE OR REPLACE FUNCTION update_circuit_breaker(
    service_name_param VARCHAR,
    service_type_param VARCHAR,
    status_param VARCHAR,
    failure_count_param INTEGER DEFAULT 0,
    total_requests_param INTEGER DEFAULT 0,
    failed_requests_param INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO circuit_breaker (
        service_name, service_type, status, failure_count, total_requests, failed_requests,
        success_rate, last_failure_time, next_attempt_time
    ) VALUES (
        service_name_param, service_type_param, status_param, failure_count_param,
        total_requests_param, failed_requests_param,
        CASE WHEN total_requests_param > 0 
             THEN ((total_requests_param - failed_requests_param)::DECIMAL / total_requests_param * 100)
             ELSE 100 
        END,
        CASE WHEN status_param = 'open' THEN NOW() ELSE NULL END,
        CASE WHEN status_param = 'open' THEN NOW() + INTERVAL '1 minute' ELSE NULL END
    )
    ON CONFLICT (service_name, service_type) DO UPDATE SET
        status = EXCLUDED.status,
        failure_count = EXCLUDED.failure_count,
        total_requests = EXCLUDED.total_requests,
        failed_requests = EXCLUDED.failed_requests,
        success_rate = EXCLUDED.success_rate,
        last_failure_time = EXCLUDED.last_failure_time,
        next_attempt_time = EXCLUDED.next_attempt_time,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record auto scaling event
CREATE OR REPLACE FUNCTION record_auto_scaling_event(
    event_type_param VARCHAR,
    trigger_type_param VARCHAR,
    trigger_value_param DECIMAL,
    threshold_value_param DECIMAL,
    action_taken_param VARCHAR,
    target_service_param VARCHAR,
    scaling_factor_param INTEGER,
    current_instances_param INTEGER,
    new_instances_param INTEGER,
    event_details_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO auto_scaling_events (
        event_type, trigger_type, trigger_value, threshold_value, action_taken,
        target_service, scaling_factor, current_instances, new_instances, event_details,
        status, executed_at
    ) VALUES (
        event_type_param, trigger_type_param, trigger_value_param, threshold_value_param,
        action_taken_param, target_service_param, scaling_factor_param,
        current_instances_param, new_instances_param, event_details_param,
        'executed', NOW()
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record service mesh trace
CREATE OR REPLACE FUNCTION record_service_mesh_trace(
    trace_id_param VARCHAR,
    span_id_param VARCHAR,
    parent_span_id_param VARCHAR,
    service_name_param VARCHAR,
    operation_name_param VARCHAR,
    request_id_param VARCHAR,
    client_ip_param INET,
    user_agent_param TEXT,
    request_method_param VARCHAR,
    request_path_param TEXT,
    request_headers_param JSONB,
    request_body_size_param INTEGER,
    response_status_code_param INTEGER,
    response_headers_param JSONB,
    response_body_size_param INTEGER,
    duration_param INTEGER,
    error_message_param TEXT,
    tags_param JSONB,
    start_time_param TIMESTAMP WITH TIME ZONE,
    end_time_param TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    trace_id UUID;
BEGIN
    INSERT INTO service_mesh (
        trace_id, span_id, parent_span_id, service_name, operation_name,
        request_id, client_ip, user_agent, request_method, request_path,
        request_headers, request_body_size, response_status_code, response_headers,
        response_body_size, duration, error_message, tags, start_time, end_time
    ) VALUES (
        trace_id_param, span_id_param, parent_span_id_param, service_name_param,
        operation_name_param, request_id_param, client_ip_param, user_agent_param,
        request_method_param, request_path_param, request_headers_param,
        request_body_size_param, response_status_code_param, response_headers_param,
        response_body_size_param, duration_param, error_message_param, tags_param,
        start_time_param, end_time_param
    ) RETURNING id INTO trace_id;

    RETURN trace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get service statistics
CREATE OR REPLACE FUNCTION get_service_statistics(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
    total_services INTEGER,
    healthy_services INTEGER,
    unhealthy_services INTEGER,
    avg_response_time DECIMAL(10,2),
    total_requests BIGINT,
    success_rate DECIMAL(5,2),
    circuit_breaker_trips INTEGER,
    auto_scaling_events INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT sr.service_id)::INTEGER as total_services,
        COUNT(DISTINCT sr.service_id) FILTER (WHERE sr.health_status = 'healthy')::INTEGER as healthy_services,
        COUNT(DISTINCT sr.service_id) FILTER (WHERE sr.health_status = 'unhealthy')::INTEGER as unhealthy_services,
        AVG(hm.response_time)::DECIMAL(10,2) as avg_response_time,
        SUM(ld.request_count)::BIGINT as total_requests,
        (COUNT(*) FILTER (WHERE hm.health_status = 'healthy')::DECIMAL / COUNT(*) * 100)::DECIMAL(5,2) as success_rate,
        COUNT(*) FILTER (WHERE cb.status = 'open')::INTEGER as circuit_breaker_trips,
        COUNT(ase.id)::INTEGER as auto_scaling_events
    FROM service_registry sr
    LEFT JOIN health_monitoring hm ON sr.service_id = hm.service_id 
        AND hm.timestamp > NOW() - (hours_back || ' hours')::INTERVAL
    LEFT JOIN load_distribution ld ON sr.service_id = ld.service_id 
        AND ld.timestamp > NOW() - (hours_back || ' hours')::INTERVAL
    LEFT JOIN circuit_breaker cb ON sr.service_id = cb.service_name
    LEFT JOIN auto_scaling_events ase ON ase.created_at > NOW() - (hours_back || ' hours')::INTERVAL
    WHERE sr.last_seen > NOW() - (hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_scalability_data(
    service_registry_days INTEGER DEFAULT 7,
    health_monitoring_days INTEGER DEFAULT 3,
    load_distribution_days INTEGER DEFAULT 1,
    service_mesh_days INTEGER DEFAULT 1,
    auto_scaling_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old service registry entries
    DELETE FROM service_registry 
    WHERE last_seen < NOW() - (service_registry_days || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Clean up old health monitoring data
    DELETE FROM health_monitoring 
    WHERE timestamp < NOW() - (health_monitoring_days || ' days')::INTERVAL;

    -- Clean up old load distribution data
    DELETE FROM load_distribution 
    WHERE timestamp < NOW() - (load_distribution_days || ' days')::INTERVAL;

    -- Clean up old service mesh data
    DELETE FROM service_mesh 
    WHERE start_time < NOW() - (service_mesh_days || ' days')::INTERVAL;

    -- Clean up old auto scaling events
    DELETE FROM auto_scaling_events 
    WHERE created_at < NOW() - (auto_scaling_days || ' days')::INTERVAL;

    -- Clean up old load balancer stats
    DELETE FROM load_balancer_stats 
    WHERE timestamp < NOW() - INTERVAL '7 days';

    -- Clean up old database pool stats
    DELETE FROM database_pool_stats 
    WHERE timestamp < NOW() - INTERVAL '7 days';

    -- Clean up old Redis cluster stats
    DELETE FROM redis_cluster_stats 
    WHERE timestamp < NOW() - INTERVAL '7 days';

    -- Clean up old graceful degradation data
    DELETE FROM graceful_degradation 
    WHERE started_at < NOW() - INTERVAL '30 days'
    AND ended_at IS NOT NULL;

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

CREATE TRIGGER update_service_registry_updated_at
    BEFORE UPDATE ON service_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_load_balancer_config_updated_at
    BEFORE UPDATE ON load_balancer_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_breaker_updated_at
    BEFORE UPDATE ON circuit_breaker
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_high_availability_updated_at
    BEFORE UPDATE ON high_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled jobs

-- Clean up old scalability data every day at 3 AM
SELECT cron.schedule(
    'cleanup-scalability-data',
    '0 3 * * *',
    'SELECT cleanup_scalability_data(7, 3, 1, 1, 30);'
);

-- Update service health every 5 minutes
SELECT cron.schedule(
    'update-service-health',
    '*/5 * * * *',
    'SELECT update_service_health(''system'', ''healthy'', 50);'
);

-- Views for scalability monitoring

-- View for service overview
CREATE OR REPLACE VIEW service_overview AS
SELECT 
    sr.service_id,
    sr.service_type,
    sr.worker_id,
    sr.instance_id,
    sr.host,
    sr.port,
    sr.health_status,
    sr.capabilities,
    sr.load_metrics,
    sr.registered_at,
    sr.last_seen,
    EXTRACT(EPOCH FROM (NOW() - sr.last_seen))::INTEGER as seconds_since_last_seen,
    CASE WHEN sr.last_seen > NOW() - INTERVAL '5 minutes' THEN 'active' ELSE 'inactive' END as activity_status
FROM service_registry sr
WHERE sr.is_active = true
ORDER BY sr.last_seen DESC;

-- View for load balancer overview
CREATE OR REPLACE VIEW load_balancer_overview AS
SELECT 
    lbc.config_name,
    lbc.algorithm,
    lbc.health_check_interval,
    lbc.max_connections,
    lbc.connection_timeout,
    lbc.retry_attempts,
    lbc.circuit_breaker_threshold,
    lbc.circuit_breaker_timeout,
    lbc.sticky_session_enabled,
    lbc.is_active,
    COUNT(sr.id) as registered_services,
    COUNT(sr.id) FILTER (WHERE sr.health_status = 'healthy') as healthy_services
FROM load_balancer_config lbc
LEFT JOIN service_registry sr ON sr.is_active = true
GROUP BY lbc.id, lbc.config_name, lbc.algorithm, lbc.health_check_interval,
         lbc.max_connections, lbc.connection_timeout, lbc.retry_attempts,
         lbc.circuit_breaker_threshold, lbc.circuit_breaker_timeout,
         lbc.sticky_session_enabled, lbc.is_active;

-- View for circuit breaker status
CREATE OR REPLACE VIEW circuit_breaker_status AS
SELECT 
    service_name,
    service_type,
    status,
    failure_count,
    threshold,
    total_requests,
    failed_requests,
    success_rate,
    last_failure_time,
    next_attempt_time,
    CASE 
        WHEN status = 'open' AND next_attempt_time <= NOW() THEN 'ready_for_retry'
        WHEN status = 'open' THEN 'blocked'
        WHEN status = 'half-open' THEN 'testing'
        ELSE 'operational'
    END as operational_status
FROM circuit_breaker
ORDER BY last_failure_time DESC NULLS LAST;

-- Insert default load balancer configuration
INSERT INTO load_balancer_config (config_name, algorithm, health_check_interval, max_connections) VALUES
('default', 'round_robin', 30000, 1000),
('high_performance', 'least_connections', 15000, 2000),
('fault_tolerant', 'ip_hash', 60000, 500)
ON CONFLICT DO NOTHING;

-- Insert default high availability configuration
INSERT INTO high_availability (service_name, availability_status, health_check_url) VALUES
('api_gateway', 'available', '/health'),
('database_service', 'available', '/health'),
('cache_service', 'available', '/health'),
('authentication_service', 'available', '/health')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medspasync_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO medspasync_user;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO medspasync_user;

-- Comments for documentation
COMMENT ON TABLE service_registry IS 'Service discovery and registration for load balancing';
COMMENT ON TABLE load_balancer_config IS 'Load balancer configuration and settings';
COMMENT ON TABLE health_monitoring IS 'Service health monitoring and status tracking';
COMMENT ON TABLE load_distribution IS 'Load distribution metrics and statistics';
COMMENT ON TABLE circuit_breaker IS 'Circuit breaker pattern implementation';
COMMENT ON TABLE auto_scaling_events IS 'Auto-scaling events and triggers';
COMMENT ON TABLE high_availability IS 'High availability configuration and monitoring';
COMMENT ON TABLE service_mesh IS 'Service mesh tracing and monitoring';
COMMENT ON TABLE load_balancer_stats IS 'Load balancer performance statistics';
COMMENT ON TABLE database_pool_stats IS 'Database connection pool monitoring';
COMMENT ON TABLE redis_cluster_stats IS 'Redis cluster monitoring and statistics';
COMMENT ON TABLE graceful_degradation IS 'Graceful degradation configuration and events';

COMMENT ON FUNCTION register_service(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, JSONB, JSONB, JSONB) IS 'Register or update service in service registry';
COMMENT ON FUNCTION update_service_health(VARCHAR, VARCHAR, INTEGER, TEXT) IS 'Update service health status and record monitoring data';
COMMENT ON FUNCTION record_load_distribution(VARCHAR, INTEGER, INTEGER, DECIMAL, DECIMAL, DECIMAL) IS 'Record load distribution metrics for a service';
COMMENT ON FUNCTION update_circuit_breaker(VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER) IS 'Update circuit breaker status and metrics';
COMMENT ON FUNCTION record_auto_scaling_event(VARCHAR, VARCHAR, DECIMAL, DECIMAL, VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER, JSONB) IS 'Record auto-scaling event';
COMMENT ON FUNCTION record_service_mesh_trace(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INET, TEXT, VARCHAR, TEXT, JSONB, INTEGER, INTEGER, JSONB, INTEGER, INTEGER, TEXT, JSONB, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Record service mesh trace data';
COMMENT ON FUNCTION get_service_statistics(INTEGER) IS 'Get comprehensive service statistics';
COMMENT ON FUNCTION cleanup_scalability_data(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Clean up old scalability data'; 