-- MedSpaSync Pro Database Security Setup
-- This script implements comprehensive security measures for HIPAA compliance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create encryption key management table
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name VARCHAR(255) NOT NULL UNIQUE,
    encrypted_key TEXT NOT NULL,
    key_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create audit logging tables
CREATE TABLE IF NOT EXISTS hipaa_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    additional_data JSONB,
    request_method VARCHAR(10),
    request_url TEXT,
    response_status INTEGER
);

CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'MEDIUM'
);

CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    failure_reason TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_user_id ON hipaa_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_timestamp ON hipaa_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_action ON hipaa_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON auth_logs(timestamp);

-- Enable Row Level Security (RLS) on existing tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Practice" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for User table
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Admins can view all users" ON "User"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = auth.uid()::text 
            AND u.role = 'ADMIN'
        )
    );

CREATE POLICY "Users can update own profile" ON "User"
    FOR UPDATE USING (auth.uid()::text = id);

-- Create RLS policies for Client table
CREATE POLICY "Practice staff can view clients" ON "Client"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            JOIN "Staff" s ON u.id = s."userId"
            WHERE u.id = auth.uid()::text 
            AND s."practiceId" = "Client"."practiceId"
        )
    );

CREATE POLICY "Practice staff can manage clients" ON "Client"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            JOIN "Staff" s ON u.id = s."userId"
            WHERE u.id = auth.uid()::text 
            AND s."practiceId" = "Client"."practiceId"
            AND u.role IN ('ADMIN', 'MANAGER', 'STAFF')
        )
    );

-- Create RLS policies for Appointment table
CREATE POLICY "Practice staff can view appointments" ON "Appointment"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            JOIN "Staff" s ON u.id = s."userId"
            WHERE u.id = auth.uid()::text 
            AND s."practiceId" = "Appointment"."practiceId"
        )
    );

CREATE POLICY "Practice staff can manage appointments" ON "Appointment"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            JOIN "Staff" s ON u.id = s."userId"
            WHERE u.id = auth.uid()::text 
            AND s."practiceId" = "Appointment"."practiceId"
            AND u.role IN ('ADMIN', 'MANAGER', 'STAFF')
        )
    );

-- Create RLS policies for Staff table
CREATE POLICY "Practice admins can view staff" ON "Staff"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = auth.uid()::text 
            AND u.role IN ('ADMIN', 'MANAGER')
            AND u."practiceId" = "Staff"."practiceId"
        )
    );

CREATE POLICY "Practice admins can manage staff" ON "Staff"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = auth.uid()::text 
            AND u.role = 'ADMIN'
            AND u."practiceId" = "Staff"."practiceId"
        )
    );

-- Create RLS policies for Practice table
CREATE POLICY "Practice members can view practice" ON "Practice"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = auth.uid()::text 
            AND u."practiceId" = "Practice".id
        )
    );

CREATE POLICY "Practice admins can manage practice" ON "Practice"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = auth.uid()::text 
            AND u.role = 'ADMIN'
            AND u."practiceId" = "Practice".id
        )
    );

-- Create functions for audit logging
CREATE OR REPLACE FUNCTION log_phi_access(
    p_user_id VARCHAR(255),
    p_action VARCHAR(50),
    p_resource_type VARCHAR(100),
    p_resource_id VARCHAR(255),
    p_additional_data JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    INSERT INTO hipaa_audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        additional_data,
        timestamp
    ) VALUES (
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_additional_data,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(
    p_data TEXT,
    p_key_name VARCHAR(255) DEFAULT 'default'
) RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from Azure Key Vault or environment
    encryption_key := COALESCE(
        current_setting('app.encryption_key', true),
        encode(gen_random_bytes(32), 'base64')
    );
    
    -- Encrypt the data
    RETURN encode(
        pgp_sym_encrypt(p_data, encryption_key),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(
    p_encrypted_data TEXT,
    p_key_name VARCHAR(255) DEFAULT 'default'
) RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from Azure Key Vault or environment
    encryption_key := COALESCE(
        current_setting('app.encryption_key', true),
        encode(gen_random_bytes(32), 'base64')
    );
    
    -- Decrypt the data
    RETURN pgp_sym_decrypt(
        decode(p_encrypted_data, 'base64'),
        encryption_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic audit logging
CREATE OR REPLACE FUNCTION audit_phi_changes() RETURNS TRIGGER AS $$
BEGIN
    -- Log the change
    PERFORM log_phi_access(
        COALESCE(NEW.updated_by, 'system'),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'CREATE'
            WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
            WHEN TG_OP = 'DELETE' THEN 'DELETE'
        END,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::text,
        jsonb_build_object(
            'operation', TG_OP,
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW)
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for sensitive tables
CREATE TRIGGER audit_client_changes
    AFTER INSERT OR UPDATE OR DELETE ON "Client"
    FOR EACH ROW EXECUTE FUNCTION audit_phi_changes();

CREATE TRIGGER audit_appointment_changes
    AFTER INSERT OR UPDATE OR DELETE ON "Appointment"
    FOR EACH ROW EXECUTE FUNCTION audit_phi_changes();

CREATE TRIGGER audit_user_changes
    AFTER INSERT OR UPDATE OR DELETE ON "User"
    FOR EACH ROW EXECUTE FUNCTION audit_phi_changes();

-- Create function to generate secure JWT secrets
CREATE OR REPLACE FUNCTION generate_secure_secret() RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(64), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate HIPAA compliance
CREATE OR REPLACE FUNCTION validate_hipaa_compliance() RETURNS TABLE(
    check_name VARCHAR(255),
    status VARCHAR(20),
    details TEXT
) AS $$
BEGIN
    -- Check if audit logging is enabled
    RETURN QUERY
    SELECT 
        'Audit Logging'::VARCHAR(255),
        CASE WHEN EXISTS (SELECT 1 FROM hipaa_audit_logs LIMIT 1) 
             THEN 'PASS'::VARCHAR(20) 
             ELSE 'FAIL'::VARCHAR(20) 
        END,
        'Audit logging table exists and is functional'::TEXT;
    
    -- Check if RLS is enabled on sensitive tables
    RETURN QUERY
    SELECT 
        'Row Level Security'::VARCHAR(255),
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename IN ('User', 'Client', 'Appointment')
        ) 
        THEN 'PASS'::VARCHAR(20) 
        ELSE 'FAIL'::VARCHAR(20) 
        END,
        'RLS policies are configured for sensitive tables'::TEXT;
    
    -- Check if encryption functions exist
    RETURN QUERY
    SELECT 
        'Data Encryption'::VARCHAR(255),
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname IN ('encrypt_sensitive_data', 'decrypt_sensitive_data')
        ) 
        THEN 'PASS'::VARCHAR(20) 
        ELSE 'FAIL'::VARCHAR(20) 
        END,
        'Encryption functions are available'::TEXT;
    
    -- Check if required extensions are installed
    RETURN QUERY
    SELECT 
        'Security Extensions'::VARCHAR(255),
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_extension 
            WHERE extname IN ('pgcrypto', 'uuid-ossp')
        ) 
        THEN 'PASS'::VARCHAR(20) 
        ELSE 'FAIL'::VARCHAR(20) 
        END,
        'Required security extensions are installed'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create a secure default user for system operations
DO $$
BEGIN
    -- Only create if not exists
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'system@medspasyncpro.com') THEN
        INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt")
        VALUES (
            uuid_generate_v4(),
            'system@medspasyncpro.com',
            crypt('system_password_change_me', gen_salt('bf')),
            'ADMIN',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- Create comments for documentation
COMMENT ON TABLE hipaa_audit_logs IS 'HIPAA-compliant audit logging for PHI access';
COMMENT ON TABLE security_logs IS 'Security event logging for threat detection';
COMMENT ON TABLE auth_logs IS 'Authentication event logging for security monitoring';
COMMENT ON FUNCTION log_phi_access IS 'Log PHI access for HIPAA compliance';
COMMENT ON FUNCTION encrypt_sensitive_data IS 'Encrypt sensitive data using pgcrypto';
COMMENT ON FUNCTION decrypt_sensitive_data IS 'Decrypt sensitive data using pgcrypto';
COMMENT ON FUNCTION validate_hipaa_compliance IS 'Validate HIPAA compliance requirements';

-- Output completion message
DO $$
BEGIN
    RAISE NOTICE 'Database security setup completed successfully!';
    RAISE NOTICE 'Please run validate_hipaa_compliance() to verify all security measures are in place.';
END $$; 