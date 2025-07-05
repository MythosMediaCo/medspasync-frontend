-- Enhanced Registration System Migration
-- Implements HIPAA-compliant client registration with autonomous AI capabilities

-- Enable Row Level Security
ALTER DATABASE medspa_prod SET row_security = on;

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenant isolation function
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_tenant', true)::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  domain varchar(255) UNIQUE NOT NULL,
  subscription_tier varchar(50) DEFAULT 'CORE',
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  
  -- Subscription limits
  client_limit integer DEFAULT 500,
  user_limit integer DEFAULT 5,
  location_limit integer DEFAULT 1,
  api_call_limit integer DEFAULT 10000,
  
  -- Usage tracking
  current_clients integer DEFAULT 0,
  current_users integer DEFAULT 0,
  current_api_calls integer DEFAULT 0,
  
  -- Subscription metadata
  subscription_status varchar(50) DEFAULT 'INACTIVE',
  trial_end_date timestamp,
  current_period_start timestamp,
  current_period_end timestamp,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create Clients table with encryption support
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  
  -- Encrypted PHI fields
  encrypted_first_name bytea NOT NULL,
  encrypted_last_name bytea NOT NULL,
  encrypted_email bytea NOT NULL,
  encrypted_phone bytea,
  encrypted_date_of_birth bytea,
  encrypted_medical_history bytea,
  encrypted_emergency_contact bytea,
  encrypted_allergies bytea,
  encrypted_medications bytea,
  
  -- Non-PHI searchable fields
  first_name_hash text NOT NULL,
  email_hash text UNIQUE NOT NULL,
  phone_hash text,
  
  -- Registration metadata
  registration_source text DEFAULT 'web',
  registration_status varchar(50) DEFAULT 'PENDING',
  autonomous_registration boolean DEFAULT false,
  confidence_score decimal(5,4),
  bias_score decimal(5,4),
  
  -- Subscription context
  created_under_tier varchar(50) NOT NULL,
  
  -- HIPAA compliance
  hipaa_consent boolean DEFAULT false,
  privacy_policy_consent boolean DEFAULT false,
  marketing_consent boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  deleted_at timestamp,
  
  -- Audit fields
  created_by uuid,
  updated_by uuid,
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create Subscription Usage table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  resource_type text NOT NULL,
  usage_count bigint DEFAULT 0,
  period_start timestamp NOT NULL,
  period_end timestamp NOT NULL,
  tier varchar(50) NOT NULL,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT unique_tenant_resource_period UNIQUE (tenant_id, resource_type, period_start)
);

-- Create Registration Audit Log table
CREATE TABLE IF NOT EXISTS registration_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  client_id uuid,
  action text NOT NULL,
  user_id uuid,
  
  -- Decision metadata
  autonomous_decision boolean NOT NULL,
  confidence_score decimal(5,4),
  bias_score decimal(5,4),
  processing_time_ms integer,
  
  -- Request context
  ip_address inet,
  user_agent text,
  session_id text,
  
  -- Compliance fields
  phi_accessed boolean DEFAULT false,
  audit_timestamp timestamp DEFAULT now(),
  blockchain_hash text,
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Autonomous Decisions table
CREATE TABLE IF NOT EXISTS autonomous_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  client_id uuid,
  
  -- Decision metadata
  decision_type varchar(50) NOT NULL,
  confidence_score decimal(5,4) NOT NULL,
  bias_score decimal(5,4),
  processing_time_ms integer NOT NULL,
  
  -- AI model information
  model_version text NOT NULL,
  model_features jsonb NOT NULL,
  decision_reasoning text NOT NULL,
  
  -- Bias detection
  bias_detection_status varchar(50) DEFAULT 'SAFE',
  bias_mitigation_applied boolean DEFAULT false,
  
  -- Performance tracking
  latency_ms integer NOT NULL,
  throughput_tps integer NOT NULL,
  
  created_at timestamp DEFAULT now(),
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Create Row Level Security Policies
CREATE POLICY tenant_isolation_clients ON clients
  FOR ALL USING (tenant_id = get_current_tenant());

CREATE POLICY tenant_isolation_usage ON subscription_usage
  FOR ALL USING (tenant_id = get_current_tenant());

CREATE POLICY tenant_isolation_audit ON registration_audit_log
  FOR ALL USING (tenant_id = get_current_tenant());

CREATE POLICY tenant_isolation_decisions ON autonomous_decisions
  FOR ALL USING (tenant_id = get_current_tenant());

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_decisions ENABLE ROW LEVEL SECURITY;

-- Create optimized indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_tenant_created 
  ON clients (tenant_id, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_email_hash
  ON clients (email_hash) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_autonomous
  ON clients (tenant_id, autonomous_registration, confidence_score DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_registration_status
  ON clients (tenant_id, registration_status)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_tenant_period
  ON subscription_usage (tenant_id, period_start DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tenant_timestamp
  ON registration_audit_log (tenant_id, audit_timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_client
  ON registration_audit_log (client_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_autonomous
  ON registration_audit_log (autonomous_decision);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decisions_tenant_created
  ON autonomous_decisions (tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decisions_type
  ON autonomous_decisions (decision_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decisions_confidence
  ON autonomous_decisions (confidence_score DESC);

-- Create partitioned audit log for performance
CREATE TABLE IF NOT EXISTS registration_audit_log_y2025m01 PARTITION OF registration_audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS registration_audit_log_y2025m02 PARTITION OF registration_audit_log
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS registration_audit_log_y2025m03 PARTITION OF registration_audit_log
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at 
  BEFORE UPDATE ON subscription_usage 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for usage tracking
CREATE OR REPLACE FUNCTION track_usage(
  p_tenant_id uuid,
  p_resource_type text,
  p_amount bigint DEFAULT 1
)
RETURNS void AS $$
BEGIN
  INSERT INTO subscription_usage (
    tenant_id, 
    resource_type, 
    usage_count, 
    period_start, 
    period_end, 
    tier
  )
  VALUES (
    p_tenant_id,
    p_resource_type,
    p_amount,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month' - interval '1 day',
    (SELECT subscription_tier FROM tenants WHERE id = p_tenant_id)
  )
  ON CONFLICT (tenant_id, resource_type, period_start)
  DO UPDATE SET 
    usage_count = subscription_usage.usage_count + p_amount,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create function for audit logging
CREATE OR REPLACE FUNCTION log_registration_audit(
  p_tenant_id uuid,
  p_client_id uuid,
  p_action text,
  p_user_id uuid,
  p_autonomous boolean,
  p_confidence decimal,
  p_bias_score decimal,
  p_processing_time integer,
  p_ip_address inet,
  p_user_agent text,
  p_session_id text
)
RETURNS uuid AS $$
DECLARE
  v_audit_id uuid;
BEGIN
  INSERT INTO registration_audit_log (
    tenant_id,
    client_id,
    action,
    user_id,
    autonomous_decision,
    confidence_score,
    bias_score,
    processing_time_ms,
    ip_address,
    user_agent,
    session_id,
    phi_accessed,
    blockchain_hash
  )
  VALUES (
    p_tenant_id,
    p_client_id,
    p_action,
    p_user_id,
    p_autonomous,
    p_confidence,
    p_bias_score,
    p_processing_time,
    p_ip_address,
    p_user_agent,
    p_session_id,
    true,
    encode(sha256(concat(p_tenant_id::text, p_client_id::text, now()::text)::bytea), 'hex')
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for autonomous decision tracking
CREATE OR REPLACE FUNCTION track_autonomous_decision(
  p_tenant_id uuid,
  p_client_id uuid,
  p_decision_type text,
  p_confidence decimal,
  p_bias_score decimal,
  p_processing_time integer,
  p_model_version text,
  p_model_features jsonb,
  p_decision_reasoning text,
  p_bias_status text,
  p_bias_mitigation boolean,
  p_latency integer,
  p_throughput integer
)
RETURNS uuid AS $$
DECLARE
  v_decision_id uuid;
BEGIN
  INSERT INTO autonomous_decisions (
    tenant_id,
    client_id,
    decision_type,
    confidence_score,
    bias_score,
    processing_time_ms,
    model_version,
    model_features,
    decision_reasoning,
    bias_detection_status,
    bias_mitigation_applied,
    latency_ms,
    throughput_tps
  )
  VALUES (
    p_tenant_id,
    p_client_id,
    p_decision_type,
    p_confidence,
    p_bias_score,
    p_processing_time,
    p_model_version,
    p_model_features,
    p_decision_reasoning,
    p_bias_status,
    p_bias_mitigation,
    p_latency,
    p_throughput
  )
  RETURNING id INTO v_decision_id;
  
  RETURN v_decision_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default tenant for testing
INSERT INTO tenants (name, domain, subscription_tier, subscription_status, client_limit, user_limit, api_call_limit)
VALUES (
  'Default Medical Spa',
  'default.medspasync.com',
  'PROFESSIONAL',
  'ACTIVE',
  2500,
  25,
  100000
) ON CONFLICT (domain) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants TO medspa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO medspa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_usage TO medspa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON registration_audit_log TO medspa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON autonomous_decisions TO medspa_app;

GRANT EXECUTE ON FUNCTION get_current_tenant() TO medspa_app;
GRANT EXECUTE ON FUNCTION track_usage(uuid, text, bigint) TO medspa_app;
GRANT EXECUTE ON FUNCTION log_registration_audit(uuid, uuid, text, uuid, boolean, decimal, decimal, integer, inet, text, text) TO medspa_app;
GRANT EXECUTE ON FUNCTION track_autonomous_decision(uuid, uuid, text, decimal, decimal, integer, text, jsonb, text, text, boolean, integer, integer) TO medspa_app;

-- Create comments for documentation
COMMENT ON TABLE tenants IS 'Tenant information with subscription details';
COMMENT ON TABLE clients IS 'HIPAA-compliant client records with encrypted PHI';
COMMENT ON TABLE subscription_usage IS 'Usage tracking for subscription limits';
COMMENT ON TABLE registration_audit_log IS 'HIPAA compliance audit trail';
COMMENT ON TABLE autonomous_decisions IS 'Autonomous AI decision tracking';

COMMENT ON COLUMN clients.encrypted_first_name IS 'AES-256-GCM encrypted first name';
COMMENT ON COLUMN clients.first_name_hash IS 'SHA-256 hash for searchable first name';
COMMENT ON COLUMN clients.autonomous_registration IS 'Whether registration was processed autonomously';
COMMENT ON COLUMN clients.confidence_score IS 'AI confidence score (0.0000-1.0000)';
COMMENT ON COLUMN clients.bias_score IS 'Bias detection score (0.0000-1.0000)';

-- Migration complete
SELECT 'Enhanced Registration System migration completed successfully' as status; 