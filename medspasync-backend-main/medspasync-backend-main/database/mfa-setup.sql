-- Multi-Factor Authentication Database Setup
-- Comprehensive MFA schema for MedSpaSync Pro

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- MFA Secrets table (TOTP)
CREATE TABLE IF NOT EXISTS mfa_secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'TOTP',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, type)
);

-- MFA Backup Codes table
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    codes TEXT[] NOT NULL, -- Array of hashed backup codes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- MFA SMS Codes table
CREATE TABLE IF NOT EXISTS mfa_sms_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- MFA Hardware Tokens table (YubiKey/FIDO2)
CREATE TABLE IF NOT EXISTS mfa_hardware_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
    token_type VARCHAR(20) DEFAULT 'FIDO2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_id)
);

-- MFA Logs table
CREATE TABLE IF NOT EXISTS mfa_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(10) NOT NULL, -- SUCCESS, FAILURE
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MFA Settings table
CREATE TABLE IF NOT EXISTS mfa_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    totp_enabled BOOLEAN DEFAULT false,
    sms_enabled BOOLEAN DEFAULT false,
    hardware_enabled BOOLEAN DEFAULT false,
    backup_codes_enabled BOOLEAN DEFAULT true,
    require_mfa_for_login BOOLEAN DEFAULT true,
    require_mfa_for_sensitive_actions BOOLEAN DEFAULT true,
    lockout_threshold INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- MFA Recovery Codes table
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mfa_secrets_user_id ON mfa_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_secrets_type ON mfa_secrets(type);
CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user_id ON mfa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_sms_codes_user_id ON mfa_sms_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_sms_codes_expires ON mfa_sms_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_hardware_tokens_user_id ON mfa_hardware_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_logs_user_id ON mfa_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_logs_timestamp ON mfa_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_mfa_logs_method ON mfa_logs(method);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_user_id ON mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id ON mfa_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_used ON mfa_recovery_codes(used);

-- Row Level Security (RLS) policies
ALTER TABLE mfa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_sms_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_hardware_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mfa_secrets
CREATE POLICY mfa_secrets_user_policy ON mfa_secrets
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY mfa_secrets_admin_policy ON mfa_secrets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for mfa_backup_codes
CREATE POLICY mfa_backup_codes_user_policy ON mfa_backup_codes
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY mfa_backup_codes_admin_policy ON mfa_backup_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for mfa_sms_codes
CREATE POLICY mfa_sms_codes_user_policy ON mfa_sms_codes
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY mfa_sms_codes_admin_policy ON mfa_sms_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for mfa_hardware_tokens
CREATE POLICY mfa_hardware_tokens_user_policy ON mfa_hardware_tokens
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY mfa_hardware_tokens_admin_policy ON mfa_hardware_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for mfa_logs
CREATE POLICY mfa_logs_user_policy ON mfa_logs
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY mfa_logs_admin_policy ON mfa_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for mfa_settings
CREATE POLICY mfa_settings_user_policy ON mfa_settings
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY mfa_settings_admin_policy ON mfa_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- RLS Policies for mfa_recovery_codes
CREATE POLICY mfa_recovery_codes_user_policy ON mfa_recovery_codes
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY mfa_recovery_codes_admin_policy ON mfa_recovery_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role = 'ADMIN'
        )
    );

-- Functions for MFA operations

-- Function to create MFA settings for new user
CREATE OR REPLACE FUNCTION create_mfa_settings_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mfa_settings (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user MFA status
CREATE OR REPLACE FUNCTION get_user_mfa_status(user_uuid UUID)
RETURNS TABLE(
    totp_enabled BOOLEAN,
    sms_enabled BOOLEAN,
    hardware_enabled BOOLEAN,
    backup_codes_enabled BOOLEAN,
    methods_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ms.totp_enabled, false) as totp_enabled,
        COALESCE(ms.sms_enabled, false) as sms_enabled,
        COALESCE(ms.hardware_enabled, false) as hardware_enabled,
        COALESCE(ms.backup_codes_enabled, true) as backup_codes_enabled,
        (
            CASE WHEN EXISTS(SELECT 1 FROM mfa_secrets WHERE user_id = user_uuid AND type = 'TOTP' AND active = true) THEN 1 ELSE 0 END +
            CASE WHEN EXISTS(SELECT 1 FROM mfa_hardware_tokens WHERE user_id = user_uuid) THEN 1 ELSE 0 END +
            CASE WHEN EXISTS(SELECT 1 FROM users WHERE id = user_uuid AND phone_number IS NOT NULL) THEN 1 ELSE 0 END
        ) as methods_count
    FROM mfa_settings ms
    WHERE ms.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log MFA event
CREATE OR REPLACE FUNCTION log_mfa_event(
    user_uuid UUID,
    method_name VARCHAR(20),
    event_status VARCHAR(10),
    event_reason TEXT DEFAULT NULL,
    client_ip INET DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mfa_logs (user_id, method, status, reason, ip_address, user_agent)
    VALUES (user_uuid, method_name, event_status, event_reason, client_ip, client_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired SMS codes
CREATE OR REPLACE FUNCTION cleanup_expired_sms_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM mfa_sms_codes 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get MFA statistics
CREATE OR REPLACE FUNCTION get_mfa_statistics()
RETURNS TABLE(
    total_users INTEGER,
    mfa_enabled_users INTEGER,
    totp_users INTEGER,
    sms_users INTEGER,
    hardware_users INTEGER,
    recent_failures INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM mfa_settings WHERE totp_enabled OR sms_enabled OR hardware_enabled) as mfa_enabled_users,
        (SELECT COUNT(*) FROM mfa_secrets WHERE type = 'TOTP' AND active = true) as totp_users,
        (SELECT COUNT(*) FROM users WHERE phone_number IS NOT NULL) as sms_users,
        (SELECT COUNT(*) FROM mfa_hardware_tokens) as hardware_users,
        (SELECT COUNT(*) FROM mfa_logs WHERE status = 'FAILURE' AND timestamp > NOW() - INTERVAL '24 hours') as recent_failures;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic operations

-- Trigger to create MFA settings when user is created
CREATE OR REPLACE FUNCTION trigger_create_mfa_settings()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_mfa_settings_for_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_mfa_settings_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_mfa_settings();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mfa_secrets_updated_at
    BEFORE UPDATE ON mfa_secrets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_backup_codes_updated_at
    BEFORE UPDATE ON mfa_backup_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_hardware_tokens_updated_at
    BEFORE UPDATE ON mfa_hardware_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_settings_updated_at
    BEFORE UPDATE ON mfa_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled job to clean up expired SMS codes (runs every hour)
SELECT cron.schedule(
    'cleanup-expired-sms-codes',
    '0 * * * *', -- Every hour
    'SELECT cleanup_expired_sms_codes();'
);

-- Views for reporting

-- View for MFA usage statistics
CREATE OR REPLACE VIEW mfa_usage_stats AS
SELECT 
    DATE(timestamp) as date,
    method,
    status,
    COUNT(*) as count
FROM mfa_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), method, status
ORDER BY date DESC, method, status;

-- View for user MFA status
CREATE OR REPLACE VIEW user_mfa_status AS
SELECT 
    u.id,
    u.email,
    u.role,
    COALESCE(ms.totp_enabled, false) as totp_enabled,
    COALESCE(ms.sms_enabled, false) as sms_enabled,
    COALESCE(ms.hardware_enabled, false) as hardware_enabled,
    u.phone_number,
    (SELECT COUNT(*) FROM mfa_logs ml WHERE ml.user_id = u.id AND ml.status = 'FAILURE' AND ml.timestamp > NOW() - INTERVAL '24 hours') as recent_failures
FROM users u
LEFT JOIN mfa_settings ms ON u.id = ms.user_id
ORDER BY u.created_at DESC;

-- Insert default MFA settings for existing users
INSERT INTO mfa_settings (user_id, totp_enabled, sms_enabled, hardware_enabled, backup_codes_enabled)
SELECT 
    id,
    false,
    false,
    false,
    true
FROM users
WHERE id NOT IN (SELECT user_id FROM mfa_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medspasync_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO medspasync_user;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO medspasync_user;

-- Comments for documentation
COMMENT ON TABLE mfa_secrets IS 'Stores TOTP secrets for user authentication';
COMMENT ON TABLE mfa_backup_codes IS 'Stores hashed backup codes for account recovery';
COMMENT ON TABLE mfa_sms_codes IS 'Stores temporary SMS verification codes';
COMMENT ON TABLE mfa_hardware_tokens IS 'Stores hardware token information (YubiKey/FIDO2)';
COMMENT ON TABLE mfa_logs IS 'Audit log for all MFA events';
COMMENT ON TABLE mfa_settings IS 'User-specific MFA configuration settings';
COMMENT ON TABLE mfa_recovery_codes IS 'Stores recovery codes for account access';

COMMENT ON FUNCTION get_user_mfa_status(UUID) IS 'Returns comprehensive MFA status for a user';
COMMENT ON FUNCTION log_mfa_event(UUID, VARCHAR, VARCHAR, TEXT, INET, TEXT) IS 'Logs MFA events for audit purposes';
COMMENT ON FUNCTION cleanup_expired_sms_codes() IS 'Removes expired SMS verification codes';
COMMENT ON FUNCTION get_mfa_statistics() IS 'Returns system-wide MFA usage statistics'; 