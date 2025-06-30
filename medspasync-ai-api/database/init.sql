-- AI Kingdom Database Schema
-- The Kingdom's Memory

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (Kingdom's Citizens)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    practice_id UUID,
    practice_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation Jobs (Kingdom's Tasks)
CREATE TABLE reconciliation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reward_transactions_count INTEGER DEFAULT 0,
    pos_transactions_count INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    processed_transactions INTEGER DEFAULT 0,
    matches_found INTEGER DEFAULT 0,
    threshold DECIMAL(3,2) DEFAULT 0.95,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    performance_metrics JSONB
);

-- Transaction Records (Kingdom's Data)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES reconciliation_jobs(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'reward' or 'pos'
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    service VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    transaction_date DATE,
    provider VARCHAR(100),
    location VARCHAR(255),
    transaction_id VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation Results (Kingdom's Decisions)
CREATE TABLE reconciliation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES reconciliation_jobs(id),
    reward_transaction_id UUID REFERENCES transactions(id),
    pos_transaction_id UUID REFERENCES transactions(id),
    result VARCHAR(50) NOT NULL, -- 'match', 'no_match', 'review_required', 'error'
    confidence DECIMAL(5,4) NOT NULL,
    confidence_level VARCHAR(20) NOT NULL,
    recommendation VARCHAR(50) NOT NULL,
    component_scores JSONB,
    processing_time_ms INTEGER,
    threshold_used DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model Training Data (Kingdom's Knowledge)
CREATE TABLE training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_transaction JSONB NOT NULL,
    pos_transaction JSONB NOT NULL,
    is_match BOOLEAN NOT NULL,
    confidence DECIMAL(5,4),
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model Versions (Kingdom's Evolution)
CREATE TABLE model_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    accuracy DECIMAL(5,4),
    training_samples INTEGER,
    features_used JSONB,
    model_path VARCHAR(500),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP
);

-- Performance Metrics (Kingdom's Analytics)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES reconciliation_jobs(id),
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Health Logs (Kingdom's Vital Signs)
CREATE TABLE health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(20) NOT NULL,
    cpu_percent DECIMAL(5,2),
    memory_percent DECIMAL(5,2),
    memory_available_gb DECIMAL(8,2),
    disk_percent DECIMAL(5,2),
    disk_free_gb DECIMAL(8,2),
    active_jobs INTEGER,
    model_loaded BOOLEAN,
    error_message TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Access Logs (Kingdom's Visitors)
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_reconciliation_jobs_user_id ON reconciliation_jobs(user_id);
CREATE INDEX idx_reconciliation_jobs_status ON reconciliation_jobs(status);
CREATE INDEX idx_reconciliation_jobs_created_at ON reconciliation_jobs(created_at);
CREATE INDEX idx_transactions_job_id ON transactions(job_id);
CREATE INDEX idx_transactions_customer_name ON transactions USING gin(customer_name gin_trgm_ops);
CREATE INDEX idx_reconciliation_results_job_id ON reconciliation_results(job_id);
CREATE INDEX idx_reconciliation_results_result ON reconciliation_results(result);
CREATE INDEX idx_health_logs_recorded_at ON health_logs(recorded_at);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_data_updated_at BEFORE UPDATE ON training_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, subscription_tier)
VALUES (
    'admin@medspa-ai.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2', -- password: kingdom_secure_2024
    'AI',
    'King',
    'admin',
    'enterprise'
);

-- Insert default model version
INSERT INTO model_versions (version, model_type, accuracy, training_samples, is_active)
VALUES (
    '2.0.0',
    'RandomForest',
    0.95,
    1000,
    true
);

-- Create views for analytics
CREATE VIEW reconciliation_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
    AVG(matches_found) as avg_matches,
    SUM(matches_found) as total_matches
FROM reconciliation_jobs
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE VIEW performance_summary AS
SELECT 
    DATE(recorded_at) as date,
    AVG(metric_value) as avg_processing_time,
    MAX(metric_value) as max_processing_time,
    COUNT(*) as total_requests
FROM performance_metrics
WHERE metric_type = 'processing_time_ms'
GROUP BY DATE(recorded_at)
ORDER BY date DESC; 