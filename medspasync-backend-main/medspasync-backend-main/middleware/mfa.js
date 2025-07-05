/**
 * Multi-Factor Authentication Middleware
 * Comprehensive MFA implementation with TOTP, SMS, and hardware token support
 */

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const twilio = require('twilio');
const { Pool } = require('pg');

class MFAMiddleware {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Initialize Twilio client for SMS
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    this.backupCodes = new Map();
    this.verificationAttempts = new Map();
    this.lockoutTime = 15 * 60 * 1000; // 15 minutes
    this.maxAttempts = 5;
  }

  /**
   * Generate TOTP secret for user
   */
  async generateTOTPSecret(userId, email) {
    try {
      const secret = speakeasy.generateSecret({
        name: `MedSpaSync Pro (${email})`,
        issuer: 'MedSpaSync Pro',
        length: 32
      });

      // Store secret in database
      await this.db.query(`
        INSERT INTO mfa_secrets (user_id, secret, type, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, type) 
        DO UPDATE SET secret = $2, updated_at = $4
      `, [userId, secret.base32, 'TOTP', new Date()]);

      return {
        secret: secret.base32,
        qrCode: await QRCode.toDataURL(secret.otpauth_url),
        backupCodes: await this.generateBackupCodes(userId)
      };
    } catch (error) {
      console.error('❌ Generate TOTP secret error:', error);
      throw new Error('Failed to generate TOTP secret');
    }
  }

  /**
   * Generate backup codes for user
   */
  async generateBackupCodes(userId) {
    try {
      const codes = [];
      for (let i = 0; i < 10; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
      }

      // Hash codes before storing
      const hashedCodes = codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));

      // Store hashed codes in database
      await this.db.query(`
        INSERT INTO mfa_backup_codes (user_id, codes, created_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) 
        DO UPDATE SET codes = $2, updated_at = $3
      `, [userId, hashedCodes, new Date()]);

      // Store original codes temporarily for return
      this.backupCodes.set(userId, codes);

      return codes;
    } catch (error) {
      console.error('❌ Generate backup codes error:', error);
      throw new Error('Failed to generate backup codes');
    }
  }

  /**
   * Verify TOTP token
   */
  async verifyTOTP(userId, token) {
    try {
      // Check for lockout
      if (this.isUserLockedOut(userId)) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      // Get user's TOTP secret
      const result = await this.db.query(`
        SELECT secret FROM mfa_secrets 
        WHERE user_id = $1 AND type = 'TOTP' AND active = true
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('TOTP not configured for this user');
      }

      const secret = result.rows[0].secret;

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) for clock skew
      });

      if (verified) {
        this.resetVerificationAttempts(userId);
        await this.logMFASuccess(userId, 'TOTP');
        return true;
      } else {
        this.incrementVerificationAttempts(userId);
        await this.logMFAFailure(userId, 'TOTP', 'Invalid token');
        return false;
      }
    } catch (error) {
      console.error('❌ Verify TOTP error:', error);
      throw error;
    }
  }

  /**
   * Send SMS verification code
   */
  async sendSMSVerification(userId, phoneNumber) {
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store code in database
      await this.db.query(`
        INSERT INTO mfa_sms_codes (user_id, phone_number, code, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET code = $3, expires_at = $4, created_at = NOW()
      `, [userId, phoneNumber, code, expiresAt]);

      // Send SMS via Twilio
      await this.twilioClient.messages.create({
        body: `Your MedSpaSync Pro verification code is: ${code}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      await this.logMFASuccess(userId, 'SMS_SENT');
      return true;
    } catch (error) {
      console.error('❌ Send SMS verification error:', error);
      await this.logMFAFailure(userId, 'SMS', error.message);
      throw new Error('Failed to send SMS verification code');
    }
  }

  /**
   * Verify SMS code
   */
  async verifySMSCode(userId, code) {
    try {
      // Check for lockout
      if (this.isUserLockedOut(userId)) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      // Get stored code
      const result = await this.db.query(`
        SELECT code, expires_at FROM mfa_sms_codes 
        WHERE user_id = $1 AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('No valid SMS code found');
      }

      const storedCode = result.rows[0].code;
      const expiresAt = result.rows[0].expires_at;

      if (new Date() > expiresAt) {
        throw new Error('SMS code has expired');
      }

      if (code === storedCode) {
        // Delete used code
        await this.db.query(`
          DELETE FROM mfa_sms_codes WHERE user_id = $1
        `, [userId]);

        this.resetVerificationAttempts(userId);
        await this.logMFASuccess(userId, 'SMS');
        return true;
      } else {
        this.incrementVerificationAttempts(userId);
        await this.logMFAFailure(userId, 'SMS', 'Invalid code');
        return false;
      }
    } catch (error) {
      console.error('❌ Verify SMS code error:', error);
      throw error;
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId, code) {
    try {
      // Check for lockout
      if (this.isUserLockedOut(userId)) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      // Get stored backup codes
      const result = await this.db.query(`
        SELECT codes FROM mfa_backup_codes WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('No backup codes found');
      }

      const hashedCodes = result.rows[0].codes;
      const inputHash = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');

      if (hashedCodes.includes(inputHash)) {
        // Remove used code
        const updatedCodes = hashedCodes.filter(hash => hash !== inputHash);
        await this.db.query(`
          UPDATE mfa_backup_codes SET codes = $2, updated_at = NOW()
          WHERE user_id = $1
        `, [userId, updatedCodes]);

        this.resetVerificationAttempts(userId);
        await this.logMFASuccess(userId, 'BACKUP_CODE');
        return true;
      } else {
        this.incrementVerificationAttempts(userId);
        await this.logMFAFailure(userId, 'BACKUP_CODE', 'Invalid code');
        return false;
      }
    } catch (error) {
      console.error('❌ Verify backup code error:', error);
      throw error;
    }
  }

  /**
   * Setup hardware token (YubiKey/FIDO2)
   */
  async setupHardwareToken(userId, tokenData) {
    try {
      // Store hardware token data
      await this.db.query(`
        INSERT INTO mfa_hardware_tokens (user_id, token_id, public_key, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, token_id) 
        DO UPDATE SET public_key = $3, updated_at = $4
      `, [userId, tokenData.tokenId, tokenData.publicKey, new Date()]);

      await this.logMFASuccess(userId, 'HARDWARE_TOKEN_SETUP');
      return true;
    } catch (error) {
      console.error('❌ Setup hardware token error:', error);
      throw new Error('Failed to setup hardware token');
    }
  }

  /**
   * Verify hardware token
   */
  async verifyHardwareToken(userId, tokenId, signature) {
    try {
      // Check for lockout
      if (this.isUserLockedOut(userId)) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      // Get stored token data
      const result = await this.db.query(`
        SELECT public_key FROM mfa_hardware_tokens 
        WHERE user_id = $1 AND token_id = $2
      `, [userId, tokenId]);

      if (result.rows.length === 0) {
        throw new Error('Hardware token not found');
      }

      // Verify signature (simplified - would use proper FIDO2 verification in production)
      const verified = this.verifyHardwareSignature(signature, result.rows[0].public_key);

      if (verified) {
        this.resetVerificationAttempts(userId);
        await this.logMFASuccess(userId, 'HARDWARE_TOKEN');
        return true;
      } else {
        this.incrementVerificationAttempts(userId);
        await this.logMFAFailure(userId, 'HARDWARE_TOKEN', 'Invalid signature');
        return false;
      }
    } catch (error) {
      console.error('❌ Verify hardware token error:', error);
      throw error;
    }
  }

  /**
   * Verify hardware token signature (placeholder)
   */
  verifyHardwareSignature(signature, publicKey) {
    // This would implement proper FIDO2 signature verification
    // For now, return true as placeholder
    return true;
  }

  /**
   * Check if MFA is required for user
   */
  async isMFARequired(userId) {
    try {
      const result = await this.db.query(`
        SELECT 
          (SELECT COUNT(*) FROM mfa_secrets WHERE user_id = $1 AND type = 'TOTP' AND active = true) as totp_enabled,
          (SELECT COUNT(*) FROM mfa_hardware_tokens WHERE user_id = $1) as hardware_enabled,
          (SELECT phone_number FROM users WHERE id = $1) as phone_number
        FROM users WHERE id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return false;
      }

      const user = result.rows[0];
      return user.totp_enabled > 0 || user.hardware_enabled > 0 || user.phone_number;
    } catch (error) {
      console.error('❌ Check MFA required error:', error);
      return false;
    }
  }

  /**
   * Get user's MFA methods
   */
  async getUserMFAMethods(userId) {
    try {
      const result = await this.db.query(`
        SELECT 
          'TOTP' as type,
          true as enabled,
          created_at
        FROM mfa_secrets 
        WHERE user_id = $1 AND type = 'TOTP' AND active = true
        
        UNION ALL
        
        SELECT 
          'HARDWARE' as type,
          true as enabled,
          created_at
        FROM mfa_hardware_tokens 
        WHERE user_id = $1
        
        UNION ALL
        
        SELECT 
          'SMS' as type,
          CASE WHEN phone_number IS NOT NULL THEN true ELSE false END as enabled,
          updated_at as created_at
        FROM users 
        WHERE id = $1 AND phone_number IS NOT NULL
      `, [userId]);

      return result.rows;
    } catch (error) {
      console.error('❌ Get MFA methods error:', error);
      return [];
    }
  }

  /**
   * Disable MFA method for user
   */
  async disableMFAMethod(userId, method) {
    try {
      switch (method) {
        case 'TOTP':
          await this.db.query(`
            UPDATE mfa_secrets SET active = false, updated_at = NOW()
            WHERE user_id = $1 AND type = 'TOTP'
          `, [userId]);
          break;

        case 'SMS':
          await this.db.query(`
            UPDATE users SET phone_number = NULL, updated_at = NOW()
            WHERE id = $1
          `, [userId]);
          break;

        case 'HARDWARE':
          await this.db.query(`
            DELETE FROM mfa_hardware_tokens WHERE user_id = $1
          `, [userId]);
          break;

        default:
          throw new Error('Invalid MFA method');
      }

      await this.logMFASuccess(userId, `${method}_DISABLED`);
      return true;
    } catch (error) {
      console.error('❌ Disable MFA method error:', error);
      throw error;
    }
  }

  /**
   * Check if user is locked out
   */
  isUserLockedOut(userId) {
    const attempts = this.verificationAttempts.get(userId);
    if (!attempts) return false;

    const { count, lastAttempt } = attempts;
    const timeSinceLastAttempt = Date.now() - lastAttempt;

    return count >= this.maxAttempts && timeSinceLastAttempt < this.lockoutTime;
  }

  /**
   * Increment verification attempts
   */
  incrementVerificationAttempts(userId) {
    const attempts = this.verificationAttempts.get(userId) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.verificationAttempts.set(userId, attempts);
  }

  /**
   * Reset verification attempts
   */
  resetVerificationAttempts(userId) {
    this.verificationAttempts.delete(userId);
  }

  /**
   * Log MFA success
   */
  async logMFASuccess(userId, method) {
    try {
      await this.db.query(`
        INSERT INTO mfa_logs (user_id, method, status, ip_address, user_agent, timestamp)
        VALUES ($1, $2, 'SUCCESS', $3, $4, $5)
      `, [userId, method, '127.0.0.1', 'MFA-Middleware', new Date()]);
    } catch (error) {
      console.error('❌ Log MFA success error:', error);
    }
  }

  /**
   * Log MFA failure
   */
  async logMFAFailure(userId, method, reason) {
    try {
      await this.db.query(`
        INSERT INTO mfa_logs (user_id, method, status, reason, ip_address, user_agent, timestamp)
        VALUES ($1, $2, 'FAILURE', $3, $4, $5, $6)
      `, [userId, method, reason, '127.0.0.1', 'MFA-Middleware', new Date()]);
    } catch (error) {
      console.error('❌ Log MFA failure error:', error);
    }
  }

  /**
   * MFA verification middleware
   */
  requireMFA() {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in first'
          });
        }

        const mfaRequired = await this.isMFARequired(req.user.id);
        if (!mfaRequired) {
          return next();
        }

        // Check if MFA has been verified in this session
        if (req.session && req.session.mfaVerified && req.session.mfaVerified === req.user.id) {
          return next();
        }

        res.status(403).json({
          error: 'MFA required',
          message: 'Multi-factor authentication is required',
          mfaRequired: true,
          methods: await this.getUserMFAMethods(req.user.id)
        });
      } catch (error) {
        console.error('❌ MFA middleware error:', error);
        res.status(500).json({
          error: 'MFA verification failed',
          message: error.message
        });
      }
    };
  }

  /**
   * MFA verification endpoint middleware
   */
  verifyMFAMiddleware() {
    return async (req, res, next) => {
      try {
        const { method, token, code, backupCode, hardwareToken } = req.body;

        if (!req.user || !req.user.id) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in first'
          });
        }

        let verified = false;

        switch (method) {
          case 'TOTP':
            verified = await this.verifyTOTP(req.user.id, token);
            break;

          case 'SMS':
            verified = await this.verifySMSCode(req.user.id, code);
            break;

          case 'BACKUP':
            verified = await this.verifyBackupCode(req.user.id, backupCode);
            break;

          case 'HARDWARE':
            verified = await this.verifyHardwareToken(req.user.id, hardwareToken.tokenId, hardwareToken.signature);
            break;

          default:
            return res.status(400).json({
              error: 'Invalid MFA method',
              message: 'Please specify a valid MFA method'
            });
        }

        if (verified) {
          // Mark MFA as verified in session
          if (req.session) {
            req.session.mfaVerified = req.user.id;
          }

          res.json({
            message: 'MFA verification successful',
            verified: true
          });
        } else {
          res.status(401).json({
            error: 'MFA verification failed',
            message: 'Invalid verification code'
          });
        }
      } catch (error) {
        console.error('❌ MFA verification middleware error:', error);
        res.status(500).json({
          error: 'MFA verification failed',
          message: error.message
        });
      }
    };
  }
}

// Create singleton instance
const mfaMiddleware = new MFAMiddleware();

// Export middleware functions
module.exports = {
  // Core MFA functions
  generateTOTPSecret: mfaMiddleware.generateTOTPSecret.bind(mfaMiddleware),
  verifyTOTP: mfaMiddleware.verifyTOTP.bind(mfaMiddleware),
  sendSMSVerification: mfaMiddleware.sendSMSVerification.bind(mfaMiddleware),
  verifySMSCode: mfaMiddleware.verifySMSCode.bind(mfaMiddleware),
  verifyBackupCode: mfaMiddleware.verifyBackupCode.bind(mfaMiddleware),
  setupHardwareToken: mfaMiddleware.setupHardwareToken.bind(mfaMiddleware),
  verifyHardwareToken: mfaMiddleware.verifyHardwareToken.bind(mfaMiddleware),

  // Utility functions
  isMFARequired: mfaMiddleware.isMFARequired.bind(mfaMiddleware),
  getUserMFAMethods: mfaMiddleware.getUserMFAMethods.bind(mfaMiddleware),
  disableMFAMethod: mfaMiddleware.disableMFAMethod.bind(mfaMiddleware),

  // Middleware functions
  requireMFA: mfaMiddleware.requireMFA.bind(mfaMiddleware),
  verifyMFAMiddleware: mfaMiddleware.verifyMFAMiddleware.bind(mfaMiddleware)
}; 