-- Compliance & Audit Database Setup
-- HIPAA compliance framework, security audit automation, and regulatory compliance for MedSpaSync Pro
-- Designed to integrate seamlessly with reporting infrastructure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Compliance Events table
CREATE TABLE IF NOT EXISTS compliance_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_data JSONB NOT NULL,
    compliance_checks JSONB NOT NULL,
    violations JSONB DEFAULT '[]',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    framework_results JSONB,
    remediation_required BOOLEAN DEFAULT false,
    remediation_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Violations table
CREATE TABLE IF NOT EXISTS compliance_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_type VARCHAR(100) NOT NULL,
    rule VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'OPEN',
    remediation_required BOOLEAN DEFAULT true,
    remediation_actions JSONB DEFAULT '[]',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Frameworks table
CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_name VARCHAR(100) NOT NULL,
    framework_version VARCHAR(20),
    framework_type VARCHAR(50) NOT NULL,
    description TEXT,
    requirements JSONB NOT NULL,
    controls JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_assessment TIMESTAMP WITH TIME ZONE,
    next_assessment TIMESTAMP WITH TIME ZONE,
    compliance_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(framework_name, framework_version)
);

-- Compliance Assessments table
CREATE TABLE IF NOT EXISTS compliance_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scope JSONB NOT NULL,
    methodology TEXT,
    findings JSONB NOT NULL,
    recommendations JSONB,
    compliance_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Trails table
CREATE TABLE IF NOT EXISTS audit_trails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    resource_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    request_body JSONB,
    response_status INTEGER,
    response_body JSONB,
    execution_time INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Breach Incidents table
CREATE TABLE IF NOT EXISTS breach_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    affected_individuals INTEGER,
    affected_records INTEGER,
    phi_involved BOOLEAN DEFAULT false,
    pii_involved BOOLEAN DEFAULT false,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'DETECTED',
    risk_assessment JSONB,
    notification_required BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    notification_date TIMESTAMP WITH TIME ZONE,
    regulatory_reporting JSONB,
    remediation_actions JSONB,
    lessons_learned TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    report_period VARCHAR(20) NOT NULL,
    report_data JSONB NOT NULL,
    report_summary TEXT,
    compliance_score DECIMAL(5,2),
    violations_count INTEGER DEFAULT 0,
    recommendations JSONB,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_url TEXT,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remediation Actions table
CREATE TABLE IF NOT EXISTS remediation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_id UUID REFERENCES compliance_violations(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    action_status VARCHAR(20) DEFAULT 'PENDING',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    verification_required BOOLEAN DEFAULT true,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Metrics table
CREATE TABLE IF NOT EXISTS compliance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    framework VARCHAR(50),
    period VARCHAR(20) DEFAULT 'daily',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags JSONB DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'compliance_system'
);

-- Regulatory Requirements table
CREATE TABLE IF NOT EXISTS regulatory_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regulation_name VARCHAR(100) NOT NULL,
    regulation_version VARCHAR(20),
    requirement_id VARCHAR(100) NOT NULL,
    requirement_title VARCHAR(255) NOT NULL,
    requirement_description TEXT,
    requirement_type VARCHAR(50),
    compliance_status VARCHAR(20) DEFAULT 'NOT_ASSESSED',
    last_assessment TIMESTAMP WITH TIME ZONE,
    next_assessment TIMESTAMP WITH TIME ZONE,
    assessment_frequency VARCHAR(20),
    responsible_party UUID REFERENCES users(id) ON DELETE SET NULL,
    documentation_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(regulation_name, requirement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_events_timestamp ON compliance_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_compliance_events_user_id ON compliance_events(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_framework ON compliance_events USING GIN (framework_results);
CREATE INDEX IF NOT EXISTS idx_compliance_events_violations ON compliance_events USING GIN (violations);

CREATE INDEX IF NOT EXISTS idx_compliance_violations_type ON compliance_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_status ON compliance_violations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_detected_at ON compliance_violations(detected_at);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_assigned_to ON compliance_violations(assigned_to);

CREATE INDEX IF NOT EXISTS idx_compliance_frameworks_name ON compliance_frameworks(framework_name);
CREATE INDEX IF NOT EXISTS idx_compliance_frameworks_type ON compliance_frameworks(framework_type);
CREATE INDEX IF NOT EXISTS idx_compliance_frameworks_active ON compliance_frameworks(is_active);

CREATE INDEX IF NOT EXISTS idx_compliance_assessments_framework_id ON compliance_assessments(framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_date ON compliance_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_status ON compliance_assessments(status);

CREATE INDEX IF NOT EXISTS idx_audit_trails_user_id ON audit_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_timestamp ON audit_trails(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trails_action ON audit_trails(action);
CREATE INDEX IF NOT EXISTS idx_audit_trails_resource ON audit_trails(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_success ON audit_trails(success);

CREATE INDEX IF NOT EXISTS idx_breach_incidents_type ON breach_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_breach_incidents_severity ON breach_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_breach_incidents_status ON breach_incidents(status);
CREATE INDEX IF NOT EXISTS idx_breach_incidents_detected_at ON breach_incidents(detected_at);
CREATE INDEX IF NOT EXISTS idx_breach_incidents_phi ON breach_incidents(phi_involved);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_framework ON compliance_reports(framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_at ON compliance_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_archived ON compliance_reports(is_archived);

CREATE INDEX IF NOT EXISTS idx_remediation_actions_violation_id ON remediation_actions(violation_id);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_status ON remediation_actions(action_status);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_assigned_to ON remediation_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_due_date ON remediation_actions(due_date);

CREATE INDEX IF NOT EXISTS idx_compliance_metrics_name_timestamp ON compliance_metrics(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_compliance_metrics_framework ON compliance_metrics(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_metrics_period ON compliance_metrics(period);

CREATE INDEX IF NOT EXISTS idx_regulatory_requirements_name ON regulatory_requirements(regulation_name);
CREATE INDEX IF NOT EXISTS idx_regulatory_requirements_status ON regulatory_requirements(compliance_status);
CREATE INDEX IF NOT EXISTS idx_regulatory_requirements_active ON regulatory_requirements(is_active);

-- Row Level Security (RLS) policies
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE breach_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_events
CREATE POLICY compliance_events_admin_policy ON compliance_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for compliance_violations
CREATE POLICY compliance_violations_admin_policy ON compliance_violations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY compliance_violations_assigned_policy ON compliance_violations
    FOR SELECT USING (assigned_to = current_setting('app.current_user_id')::UUID);

-- RLS Policies for compliance_frameworks
CREATE POLICY compliance_frameworks_admin_policy ON compliance_frameworks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for compliance_assessments
CREATE POLICY compliance_assessments_admin_policy ON compliance_assessments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY compliance_assessments_assessor_policy ON compliance_assessments
    FOR SELECT USING (assessor_id = current_setting('app.current_user_id')::UUID);

-- RLS Policies for audit_trails
CREATE POLICY audit_trails_admin_policy ON audit_trails
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY audit_trails_user_policy ON audit_trails
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

-- RLS Policies for breach_incidents
CREATE POLICY breach_incidents_admin_policy ON breach_incidents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY breach_incidents_assigned_policy ON breach_incidents
    FOR SELECT USING (assigned_to = current_setting('app.current_user_id')::UUID);

-- RLS Policies for compliance_reports
CREATE POLICY compliance_reports_admin_policy ON compliance_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY compliance_reports_generated_policy ON compliance_reports
    FOR SELECT USING (generated_by = current_setting('app.current_user_id')::UUID);

-- RLS Policies for remediation_actions
CREATE POLICY remediation_actions_admin_policy ON remediation_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY remediation_actions_assigned_policy ON remediation_actions
    FOR SELECT USING (assigned_to = current_setting('app.current_user_id')::UUID);

-- RLS Policies for compliance_metrics
CREATE POLICY compliance_metrics_admin_policy ON compliance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for regulatory_requirements
CREATE POLICY regulatory_requirements_admin_policy ON regulatory_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY regulatory_requirements_responsible_policy ON regulatory_requirements
    FOR SELECT USING (responsible_party = current_setting('app.current_user_id')::UUID);

-- Functions for compliance and audit

-- Function to log compliance event
CREATE OR REPLACE FUNCTION log_compliance_event(
    event_data JSONB,
    compliance_checks JSONB,
    violations JSONB DEFAULT '[]',
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    framework_results JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO compliance_events (
        event_data, compliance_checks, violations, user_id, 
        ip_address, framework_results, remediation_required
    ) VALUES (
        event_data, compliance_checks, violations, user_uuid,
        ip_addr, framework_results, 
        CASE WHEN jsonb_array_length(violations) > 0 THEN true ELSE false END
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail(
    user_uuid UUID,
    audit_action VARCHAR,
    resource_type VARCHAR DEFAULT NULL,
    resource_id VARCHAR DEFAULT NULL,
    resource_name VARCHAR DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_text TEXT DEFAULT NULL,
    request_method VARCHAR DEFAULT NULL,
    request_url TEXT DEFAULT NULL,
    request_body JSONB DEFAULT NULL,
    response_status INTEGER DEFAULT NULL,
    response_body JSONB DEFAULT NULL,
    execution_time INTEGER DEFAULT NULL,
    success_flag BOOLEAN DEFAULT true,
    error_msg TEXT DEFAULT NULL,
    audit_metadata JSONB DEFAULT NULL,
    session_uuid VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_trails (
        user_id, action, resource_type, resource_id, resource_name,
        ip_address, user_agent, request_method, request_url, request_body,
        response_status, response_body, execution_time, success, error_message,
        metadata, session_id
    ) VALUES (
        user_uuid, audit_action, resource_type, resource_id, resource_name,
        ip_addr, user_agent_text, request_method, request_url, request_body,
        response_status, response_body, execution_time, success_flag, error_msg,
        audit_metadata, session_uuid
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create compliance violation
CREATE OR REPLACE FUNCTION create_compliance_violation(
    violation_type_name VARCHAR,
    rule_name VARCHAR,
    severity_level VARCHAR,
    violation_description TEXT,
    assigned_user_uuid UUID DEFAULT NULL,
    priority_level VARCHAR DEFAULT 'MEDIUM',
    violation_tags JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    violation_id UUID;
BEGIN
    INSERT INTO compliance_violations (
        violation_type, rule, severity, description, assigned_to, priority, tags
    ) VALUES (
        violation_type_name, rule_name, severity_level, violation_description,
        assigned_user_uuid, priority_level, violation_tags
    ) RETURNING id INTO violation_id;

    RETURN violation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get compliance statistics
CREATE OR REPLACE FUNCTION get_compliance_statistics(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
    total_events INTEGER,
    compliant_events INTEGER,
    non_compliant_events INTEGER,
    total_violations INTEGER,
    open_violations INTEGER,
    hipaa_compliance_rate DECIMAL(5,2),
    nist_compliance_rate DECIMAL(5,2),
    iso27001_compliance_rate DECIMAL(5,2),
    overall_compliance_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_events,
        COUNT(*) FILTER (WHERE framework_results->>'hipaa' = 'true' AND framework_results->>'nist' = 'true' AND framework_results->>'iso27001' = 'true')::INTEGER as compliant_events,
        COUNT(*) FILTER (WHERE NOT (framework_results->>'hipaa' = 'true' AND framework_results->>'nist' = 'true' AND framework_results->>'iso27001' = 'true'))::INTEGER as non_compliant_events,
        (SELECT COUNT(*) FROM compliance_violations WHERE detected_at > NOW() - (hours_back || ' hours')::INTERVAL)::INTEGER as total_violations,
        (SELECT COUNT(*) FROM compliance_violations WHERE status = 'OPEN')::INTEGER as open_violations,
        AVG(CASE WHEN framework_results->>'hipaa' = 'true' THEN 100 ELSE 0 END)::DECIMAL(5,2) as hipaa_compliance_rate,
        AVG(CASE WHEN framework_results->>'nist' = 'true' THEN 100 ELSE 0 END)::DECIMAL(5,2) as nist_compliance_rate,
        AVG(CASE WHEN framework_results->>'iso27001' = 'true' THEN 100 ELSE 0 END)::DECIMAL(5,2) as iso27001_compliance_rate,
        AVG(CASE WHEN framework_results->>'hipaa' = 'true' AND framework_results->>'nist' = 'true' AND framework_results->>'iso27001' = 'true' THEN 100 ELSE 0 END)::DECIMAL(5,2) as overall_compliance_rate
    FROM compliance_events 
    WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate compliance report
CREATE OR REPLACE FUNCTION generate_compliance_report(
    report_type_name VARCHAR,
    framework_uuid UUID DEFAULT NULL,
    report_period_name VARCHAR DEFAULT '24h',
    report_name_text VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    report_id UUID;
    report_data JSONB;
    compliance_score DECIMAL(5,2);
    violations_count INTEGER;
BEGIN
    -- Generate report data based on type
    CASE report_type_name
        WHEN 'hipaa' THEN
            SELECT 
                jsonb_build_object(
                    'framework', 'HIPAA',
                    'period', report_period_name,
                    'total_events', COUNT(*),
                    'compliant_events', COUNT(*) FILTER (WHERE framework_results->>'hipaa' = 'true'),
                    'non_compliant_events', COUNT(*) FILTER (WHERE framework_results->>'hipaa' = 'false'),
                    'violations', COUNT(*) FILTER (WHERE violations != '[]')
                ),
                AVG(CASE WHEN framework_results->>'hipaa' = 'true' THEN 100 ELSE 0 END),
                COUNT(*) FILTER (WHERE violations != '[]')
            INTO report_data, compliance_score, violations_count
            FROM compliance_events
            WHERE timestamp > CASE 
                WHEN report_period_name = '24h' THEN NOW() - INTERVAL '24 hours'
                WHEN report_period_name = '7d' THEN NOW() - INTERVAL '7 days'
                WHEN report_period_name = '30d' THEN NOW() - INTERVAL '30 days'
                ELSE NOW() - INTERVAL '24 hours'
            END;
            
        WHEN 'nist' THEN
            SELECT 
                jsonb_build_object(
                    'framework', 'NIST',
                    'period', report_period_name,
                    'total_events', COUNT(*),
                    'compliant_events', COUNT(*) FILTER (WHERE framework_results->>'nist' = 'true'),
                    'non_compliant_events', COUNT(*) FILTER (WHERE framework_results->>'nist' = 'false'),
                    'violations', COUNT(*) FILTER (WHERE violations != '[]')
                ),
                AVG(CASE WHEN framework_results->>'nist' = 'true' THEN 100 ELSE 0 END),
                COUNT(*) FILTER (WHERE violations != '[]')
            INTO report_data, compliance_score, violations_count
            FROM compliance_events
            WHERE timestamp > CASE 
                WHEN report_period_name = '24h' THEN NOW() - INTERVAL '24 hours'
                WHEN report_period_name = '7d' THEN NOW() - INTERVAL '7 days'
                WHEN report_period_name = '30d' THEN NOW() - INTERVAL '30 days'
                ELSE NOW() - INTERVAL '24 hours'
            END;
            
        WHEN 'iso27001' THEN
            SELECT 
                jsonb_build_object(
                    'framework', 'ISO 27001',
                    'period', report_period_name,
                    'total_events', COUNT(*),
                    'compliant_events', COUNT(*) FILTER (WHERE framework_results->>'iso27001' = 'true'),
                    'non_compliant_events', COUNT(*) FILTER (WHERE framework_results->>'iso27001' = 'false'),
                    'violations', COUNT(*) FILTER (WHERE violations != '[]')
                ),
                AVG(CASE WHEN framework_results->>'iso27001' = 'true' THEN 100 ELSE 0 END),
                COUNT(*) FILTER (WHERE violations != '[]')
            INTO report_data, compliance_score, violations_count
            FROM compliance_events
            WHERE timestamp > CASE 
                WHEN report_period_name = '24h' THEN NOW() - INTERVAL '24 hours'
                WHEN report_period_name = '7d' THEN NOW() - INTERVAL '7 days'
                WHEN report_period_name = '30d' THEN NOW() - INTERVAL '30 days'
                ELSE NOW() - INTERVAL '24 hours'
            END;
            
        ELSE
            -- Default summary report
            SELECT 
                jsonb_build_object(
                    'framework', 'ALL',
                    'period', report_period_name,
                    'total_events', COUNT(*),
                    'compliant_events', COUNT(*) FILTER (WHERE framework_results->>'hipaa' = 'true' AND framework_results->>'nist' = 'true' AND framework_results->>'iso27001' = 'true'),
                    'non_compliant_events', COUNT(*) FILTER (WHERE NOT (framework_results->>'hipaa' = 'true' AND framework_results->>'nist' = 'true' AND framework_results->>'iso27001' = 'true')),
                    'violations', COUNT(*) FILTER (WHERE violations != '[]')
                ),
                AVG(CASE WHEN framework_results->>'hipaa' = 'true' AND framework_results->>'nist' = 'true' AND framework_results->>'iso27001' = 'true' THEN 100 ELSE 0 END),
                COUNT(*) FILTER (WHERE violations != '[]')
            INTO report_data, compliance_score, violations_count
            FROM compliance_events
            WHERE timestamp > CASE 
                WHEN report_period_name = '24h' THEN NOW() - INTERVAL '24 hours'
                WHEN report_period_name = '7d' THEN NOW() - INTERVAL '7 days'
                WHEN report_period_name = '30d' THEN NOW() - INTERVAL '30 days'
                ELSE NOW() - INTERVAL '24 hours'
            END;
    END CASE;

    INSERT INTO compliance_reports (
        report_type, report_name, framework_id, report_period, 
        report_data, compliance_score, violations_count
    ) VALUES (
        report_type_name,
        COALESCE(report_name_text, report_type_name || ' Compliance Report'),
        framework_uuid,
        report_period_name,
        report_data,
        compliance_score,
        violations_count
    ) RETURNING id INTO report_id;

    RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old compliance data
CREATE OR REPLACE FUNCTION cleanup_compliance_data(
    events_days INTEGER DEFAULT 90,
    violations_days INTEGER DEFAULT 365,
    audit_days INTEGER DEFAULT 180
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old compliance events
    DELETE FROM compliance_events 
    WHERE timestamp < NOW() - (events_days || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Clean up old violations
    DELETE FROM compliance_violations 
    WHERE detected_at < NOW() - (violations_days || ' days')::INTERVAL
    AND status = 'RESOLVED';

    -- Clean up old audit trails
    DELETE FROM audit_trails 
    WHERE timestamp < NOW() - (audit_days || ' days')::INTERVAL;

    -- Archive old reports
    UPDATE compliance_reports 
    SET is_archived = true, archived_at = NOW()
    WHERE generated_at < NOW() - INTERVAL '1 year'
    AND is_archived = false;

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

CREATE TRIGGER update_compliance_violations_updated_at
    BEFORE UPDATE ON compliance_violations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_frameworks_updated_at
    BEFORE UPDATE ON compliance_frameworks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_assessments_updated_at
    BEFORE UPDATE ON compliance_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breach_incidents_updated_at
    BEFORE UPDATE ON breach_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_remediation_actions_updated_at
    BEFORE UPDATE ON remediation_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulatory_requirements_updated_at
    BEFORE UPDATE ON regulatory_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled jobs

-- Clean up old compliance data every day at 3 AM
SELECT cron.schedule(
    'cleanup-compliance-data',
    '0 3 * * *',
    'SELECT cleanup_compliance_data(90, 365, 180);'
);

-- Generate compliance reports every day at 6 AM
SELECT cron.schedule(
    'generate-compliance-reports',
    '0 6 * * *',
    'SELECT generate_compliance_report(''summary'', NULL, ''24h'', ''Daily Compliance Summary'');'
);

-- Update compliance metrics every hour
SELECT cron.schedule(
    'update-compliance-metrics',
    '0 * * * *',
    'INSERT INTO compliance_metrics (metric_name, metric_value, metric_unit, framework, period)
     SELECT 
         ''compliance_rate'',
         AVG(CASE WHEN framework_results->>''hipaa'' = ''true'' THEN 100 ELSE 0 END),
         ''percentage'',
         ''hipaa'',
         ''hourly''
     FROM compliance_events 
     WHERE timestamp > NOW() - INTERVAL ''1 hour'';'
);

-- Views for reporting integration

-- View for compliance summary
CREATE OR REPLACE VIEW compliance_summary AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE framework_results->>'hipaa' = 'true') as hipaa_compliant,
    COUNT(*) FILTER (WHERE framework_results->>'nist' = 'true') as nist_compliant,
    COUNT(*) FILTER (WHERE framework_results->>'iso27001' = 'true') as iso27001_compliant,
    COUNT(*) FILTER (WHERE violations != '[]') as total_violations,
    AVG(CASE WHEN framework_results->>'hipaa' = 'true' THEN 100 ELSE 0 END) as hipaa_rate,
    AVG(CASE WHEN framework_results->>'nist' = 'true' THEN 100 ELSE 0 END) as nist_rate,
    AVG(CASE WHEN framework_results->>'iso27001' = 'true' THEN 100 ELSE 0 END) as iso27001_rate
FROM compliance_events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- View for violation trends
CREATE OR REPLACE VIEW violation_trends AS
SELECT 
    DATE(detected_at) as date,
    violation_type,
    COUNT(*) as violation_count,
    AVG(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) * 100 as critical_rate,
    AVG(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) * 100 as high_rate,
    AVG(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) * 100 as open_rate
FROM compliance_violations
WHERE detected_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(detected_at), violation_type
ORDER BY date DESC, violation_count DESC;

-- View for audit activity
CREATE OR REPLACE VIEW audit_activity AS
SELECT 
    DATE(timestamp) as date,
    action,
    resource_type,
    COUNT(*) as action_count,
    AVG(execution_time) as avg_execution_time,
    AVG(CASE WHEN success = true THEN 1 ELSE 0 END) * 100 as success_rate
FROM audit_trails
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), action, resource_type
ORDER BY date DESC, action_count DESC;

-- Insert default compliance frameworks
INSERT INTO compliance_frameworks (framework_name, framework_version, framework_type, description, requirements, controls) VALUES
('HIPAA Privacy Rule', '2023', 'REGULATORY', 'Health Insurance Portability and Accountability Act Privacy Rule', 
 '{"phi_access": "Minimum necessary access", "phi_disclosure": "Authorized disclosure only", "patient_rights": "Patient rights to PHI"}',
 '{"access_control": "Unique user identification", "audit_logging": "Record and examine activity", "encryption": "Encrypt PHI in transit and at rest"}'),
('HIPAA Security Rule', '2023', 'REGULATORY', 'Health Insurance Portability and Accountability Act Security Rule',
 '{"access_control": "Unique user identification", "audit_controls": "Hardware and software mechanisms", "integrity": "Authenticate ePHI", "transmission_security": "Technical security measures"}',
 '{"unique_identification": "Assign unique user IDs", "emergency_access": "Emergency access procedures", "automatic_logoff": "Automatic logoff", "encryption_decryption": "Encryption and decryption"}'),
('NIST Cybersecurity Framework', '2.0', 'FRAMEWORK', 'National Institute of Standards and Technology Cybersecurity Framework',
 '{"identify": "Develop organizational understanding", "protect": "Develop and implement safeguards", "detect": "Identify cybersecurity events", "respond": "Take action regarding events", "recover": "Maintain resilience"}',
 '{"asset_management": "Inventory and manage assets", "access_control": "Identity management and access control", "awareness_training": "Awareness and training", "data_security": "Data security and protection"}'),
('ISO 27001', '2022', 'STANDARD', 'Information Security Management System',
 '{"information_security_policies": "Management direction", "organization": "Organizational structure", "human_resources": "Security responsibilities", "asset_management": "Inventory and classification"}',
 '{"policy_framework": "Information security policy", "internal_organization": "Internal organization", "screening": "Background verification", "asset_inventory": "Asset inventory"}')
ON CONFLICT (framework_name, framework_version) DO NOTHING;

-- Insert default regulatory requirements
INSERT INTO regulatory_requirements (regulation_name, regulation_version, requirement_id, requirement_title, requirement_description, requirement_type) VALUES
('HIPAA', '2023', '164.308(a)(1)', 'Security Management Process', 'Implement policies and procedures to prevent, detect, contain, and correct security violations.', 'ADMINISTRATIVE'),
('HIPAA', '2023', '164.308(a)(2)', 'Assigned Security Responsibility', 'Identify the security official who is responsible for the development and implementation of the policies and procedures.', 'ADMINISTRATIVE'),
('HIPAA', '2023', '164.308(a)(3)', 'Workforce Security', 'Implement policies and procedures to ensure that all members of its workforce have appropriate access to electronic protected health information.', 'ADMINISTRATIVE'),
('HIPAA', '2023', '164.308(a)(4)', 'Information Access Management', 'Implement policies and procedures for authorizing access to electronic protected health information.', 'ADMINISTRATIVE'),
('HIPAA', '2023', '164.308(a)(5)', 'Security Awareness and Training Program', 'Implement a security awareness and training program for all members of its workforce.', 'ADMINISTRATIVE'),
('HIPAA', '2023', '164.312(a)(1)', 'Access Control', 'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information.', 'TECHNICAL'),
('HIPAA', '2023', '164.312(a)(2)', 'Audit Controls', 'Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems.', 'TECHNICAL'),
('HIPAA', '2023', '164.312(a)(3)', 'Integrity', 'Implement policies and procedures to protect electronic protected health information from improper alteration or destruction.', 'TECHNICAL'),
('HIPAA', '2023', '164.312(a)(4)', 'Person or Entity Authentication', 'Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed.', 'TECHNICAL'),
('HIPAA', '2023', '164.312(a)(5)', 'Transmission Security', 'Implement technical security measures to guard against unauthorized access to electronic protected health information.', 'TECHNICAL')
ON CONFLICT (regulation_name, requirement_id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medspasync_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO medspasync_user;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO medspasync_user;

-- Comments for documentation
COMMENT ON TABLE compliance_events IS 'Comprehensive compliance event logging and tracking';
COMMENT ON TABLE compliance_violations IS 'Compliance violations tracking and remediation';
COMMENT ON TABLE compliance_frameworks IS 'Compliance frameworks and standards management';
COMMENT ON TABLE compliance_assessments IS 'Compliance assessment and audit results';
COMMENT ON TABLE audit_trails IS 'Comprehensive audit trail for all system activities';
COMMENT ON TABLE breach_incidents IS 'Security breach incident tracking and management';
COMMENT ON TABLE compliance_reports IS 'Compliance reports and documentation';
COMMENT ON TABLE remediation_actions IS 'Remediation actions for compliance violations';
COMMENT ON TABLE compliance_metrics IS 'Compliance performance metrics and KPIs';
COMMENT ON TABLE regulatory_requirements IS 'Regulatory requirements and compliance tracking';

COMMENT ON FUNCTION log_compliance_event(JSONB, JSONB, JSONB, UUID, INET, JSONB) IS 'Log compliance event with comprehensive data';
COMMENT ON FUNCTION log_audit_trail(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INET, TEXT, VARCHAR, TEXT, JSONB, INTEGER, JSONB, INTEGER, BOOLEAN, TEXT, JSONB, VARCHAR) IS 'Log comprehensive audit trail for all activities';
COMMENT ON FUNCTION create_compliance_violation(VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR, JSONB) IS 'Create compliance violation record';
COMMENT ON FUNCTION get_compliance_statistics(INTEGER) IS 'Get comprehensive compliance statistics';
COMMENT ON FUNCTION generate_compliance_report(VARCHAR, UUID, VARCHAR, VARCHAR) IS 'Generate compliance reports for different frameworks';
COMMENT ON FUNCTION cleanup_compliance_data(INTEGER, INTEGER, INTEGER) IS 'Clean up old compliance and audit data'; 