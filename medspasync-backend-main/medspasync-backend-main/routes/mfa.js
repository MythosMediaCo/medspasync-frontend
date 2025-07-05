/**
 * Multi-Factor Authentication Routes
 * Complete MFA implementation with TOTP, SMS, and hardware token support
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole');
const mfaMiddleware = require('../middleware/mfa');
const enhancedRateLimiter = require('../middleware/enhanced-rate-limiter');
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * @route   GET /api/mfa/status
 * @desc    Get user's MFA status and methods
 * @access  Authenticated users
 */
router.get('/status', 
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [mfaMethods, mfaSettings] = await Promise.all([
        mfaMiddleware.getUserMFAMethods(userId),
        db.query('SELECT * FROM mfa_settings WHERE user_id = $1', [userId])
      ]);

      const status = {
        userId: userId,
        methods: mfaMethods,
        settings: mfaSettings.rows[0] || {},
        required: await mfaMiddleware.isMFARequired(userId),
        lastUsed: null
      };

      // Get last successful MFA usage
      const lastUsage = await db.query(`
        SELECT method, timestamp FROM mfa_logs 
        WHERE user_id = $1 AND status = 'SUCCESS' 
        ORDER BY timestamp DESC LIMIT 1
      `, [userId]);

      if (lastUsage.rows.length > 0) {
        status.lastUsed = lastUsage.rows[0];
      }

      res.json(status);
    } catch (error) {
      console.error('❌ Get MFA status error:', error);
      res.status(500).json({
        error: 'Failed to get MFA status',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/totp/setup
 * @desc    Setup TOTP for user
 * @access  Authenticated users
 */
router.post('/totp/setup', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      // Check if TOTP is already enabled
      const existingSecret = await db.query(`
        SELECT id FROM mfa_secrets 
        WHERE user_id = $1 AND type = 'TOTP' AND active = true
      `, [userId]);

      if (existingSecret.rows.length > 0) {
        return res.status(400).json({
          error: 'TOTP already enabled',
          message: 'TOTP is already configured for this account'
        });
      }

      // Generate TOTP secret and QR code
      const totpData = await mfaMiddleware.generateTOTPSecret(userId, userEmail);

      // Update MFA settings
      await db.query(`
        UPDATE mfa_settings 
        SET totp_enabled = true, updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);

      res.json({
        message: 'TOTP setup successful',
        secret: totpData.secret,
        qrCode: totpData.qrCode,
        backupCodes: totpData.backupCodes,
        instructions: [
          '1. Install Google Authenticator or similar TOTP app',
          '2. Scan the QR code or enter the secret manually',
          '3. Enter the 6-digit code from your app to verify setup',
          '4. Save your backup codes in a secure location'
        ]
      });
    } catch (error) {
      console.error('❌ TOTP setup error:', error);
      res.status(500).json({
        error: 'Failed to setup TOTP',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/totp/verify
 * @desc    Verify TOTP setup
 * @access  Authenticated users
 */
router.post('/totp/verify', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { token } = req.body;
      const userId = req.user.id;

      if (!token) {
        return res.status(400).json({
          error: 'Token required',
          message: 'Please provide the TOTP token'
        });
      }

      const verified = await mfaMiddleware.verifyTOTP(userId, token);

      if (verified) {
        // Mark TFA as verified in session
        if (req.session) {
          req.session.mfaVerified = userId;
        }

        res.json({
          message: 'TOTP verification successful',
          verified: true
        });
      } else {
        res.status(401).json({
          error: 'Invalid token',
          message: 'The provided TOTP token is invalid'
        });
      }
    } catch (error) {
      console.error('❌ TOTP verification error:', error);
      res.status(500).json({
        error: 'TOTP verification failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/sms/setup
 * @desc    Setup SMS verification
 * @access  Authenticated users
 */
router.post('/sms/setup', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const userId = req.user.id;

      if (!phoneNumber) {
        return res.status(400).json({
          error: 'Phone number required',
          message: 'Please provide a valid phone number'
        });
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
        return res.status(400).json({
          error: 'Invalid phone number',
          message: 'Please provide a valid phone number in international format'
        });
      }

      // Update user's phone number
      await db.query(`
        UPDATE users SET phone_number = $2, updated_at = NOW()
        WHERE id = $1
      `, [userId, phoneNumber]);

      // Update MFA settings
      await db.query(`
        UPDATE mfa_settings 
        SET sms_enabled = true, updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);

      // Send verification SMS
      await mfaMiddleware.sendSMSVerification(userId, phoneNumber);

      res.json({
        message: 'SMS verification setup successful',
        phoneNumber: phoneNumber,
        instructions: [
          '1. Check your phone for the verification code',
          '2. Enter the 6-digit code to complete setup',
          '3. The code expires in 10 minutes'
        ]
      });
    } catch (error) {
      console.error('❌ SMS setup error:', error);
      res.status(500).json({
        error: 'Failed to setup SMS verification',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/sms/verify
 * @desc    Verify SMS code
 * @access  Authenticated users
 */
router.post('/sms/verify', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user.id;

      if (!code) {
        return res.status(400).json({
          error: 'Verification code required',
          message: 'Please provide the SMS verification code'
        });
      }

      const verified = await mfaMiddleware.verifySMSCode(userId, code);

      if (verified) {
        // Mark MFA as verified in session
        if (req.session) {
          req.session.mfaVerified = userId;
        }

        res.json({
          message: 'SMS verification successful',
          verified: true
        });
      } else {
        res.status(401).json({
          error: 'Invalid code',
          message: 'The provided SMS code is invalid or expired'
        });
      }
    } catch (error) {
      console.error('❌ SMS verification error:', error);
      res.status(500).json({
        error: 'SMS verification failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/sms/resend
 * @desc    Resend SMS verification code
 * @access  Authenticated users
 */
router.post('/sms/resend', 
  authMiddleware,
  enhancedRateLimiter.burst,
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Get user's phone number
      const userResult = await db.query(`
        SELECT phone_number FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0 || !userResult.rows[0].phone_number) {
        return res.status(400).json({
          error: 'No phone number configured',
          message: 'Please setup SMS verification first'
        });
      }

      const phoneNumber = userResult.rows[0].phone_number;

      // Send new verification SMS
      await mfaMiddleware.sendSMSVerification(userId, phoneNumber);

      res.json({
        message: 'SMS verification code resent',
        phoneNumber: phoneNumber
      });
    } catch (error) {
      console.error('❌ Resend SMS error:', error);
      res.status(500).json({
        error: 'Failed to resend SMS code',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/backup/verify
 * @desc    Verify backup code
 * @access  Authenticated users
 */
router.post('/backup/verify', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { backupCode } = req.body;
      const userId = req.user.id;

      if (!backupCode) {
        return res.status(400).json({
          error: 'Backup code required',
          message: 'Please provide a backup code'
        });
      }

      const verified = await mfaMiddleware.verifyBackupCode(userId, backupCode);

      if (verified) {
        // Mark MFA as verified in session
        if (req.session) {
          req.session.mfaVerified = userId;
        }

        res.json({
          message: 'Backup code verification successful',
          verified: true
        });
      } else {
        res.status(401).json({
          error: 'Invalid backup code',
          message: 'The provided backup code is invalid or already used'
        });
      }
    } catch (error) {
      console.error('❌ Backup code verification error:', error);
      res.status(500).json({
        error: 'Backup code verification failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/hardware/setup
 * @desc    Setup hardware token (YubiKey/FIDO2)
 * @access  Authenticated users
 */
router.post('/hardware/setup', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { tokenId, publicKey, tokenType = 'FIDO2' } = req.body;
      const userId = req.user.id;

      if (!tokenId || !publicKey) {
        return res.status(400).json({
          error: 'Token data required',
          message: 'Please provide token ID and public key'
        });
      }

      // Setup hardware token
      await mfaMiddleware.setupHardwareToken(userId, {
        tokenId,
        publicKey,
        tokenType
      });

      // Update MFA settings
      await db.query(`
        UPDATE mfa_settings 
        SET hardware_enabled = true, updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);

      res.json({
        message: 'Hardware token setup successful',
        tokenId: tokenId,
        tokenType: tokenType,
        instructions: [
          '1. Your hardware token has been registered',
          '2. Use your hardware token for future MFA verification',
          '3. Keep your hardware token secure'
        ]
      });
    } catch (error) {
      console.error('❌ Hardware token setup error:', error);
      res.status(500).json({
        error: 'Failed to setup hardware token',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/hardware/verify
 * @desc    Verify hardware token
 * @access  Authenticated users
 */
router.post('/hardware/verify', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { tokenId, signature } = req.body;
      const userId = req.user.id;

      if (!tokenId || !signature) {
        return res.status(400).json({
          error: 'Token verification data required',
          message: 'Please provide token ID and signature'
        });
      }

      const verified = await mfaMiddleware.verifyHardwareToken(userId, tokenId, signature);

      if (verified) {
        // Mark MFA as verified in session
        if (req.session) {
          req.session.mfaVerified = userId;
        }

        res.json({
          message: 'Hardware token verification successful',
          verified: true
        });
      } else {
        res.status(401).json({
          error: 'Invalid hardware token',
          message: 'Hardware token verification failed'
        });
      }
    } catch (error) {
      console.error('❌ Hardware token verification error:', error);
      res.status(500).json({
        error: 'Hardware token verification failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/verify
 * @desc    General MFA verification endpoint
 * @access  Authenticated users
 */
router.post('/verify', 
  mfaMiddleware.verifyMFAMiddleware()
);

/**
 * @route   DELETE /api/mfa/method/:method
 * @desc    Disable MFA method
 * @access  Authenticated users
 */
router.delete('/method/:method', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { method } = req.params;
      const userId = req.user.id;

      const validMethods = ['TOTP', 'SMS', 'HARDWARE'];
      if (!validMethods.includes(method.toUpperCase())) {
        return res.status(400).json({
          error: 'Invalid method',
          message: 'Please specify a valid MFA method'
        });
      }

      await mfaMiddleware.disableMFAMethod(userId, method.toUpperCase());

      res.json({
        message: `${method} MFA method disabled successfully`,
        method: method.toUpperCase()
      });
    } catch (error) {
      console.error('❌ Disable MFA method error:', error);
      res.status(500).json({
        error: 'Failed to disable MFA method',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/backup/generate
 * @desc    Generate new backup codes
 * @access  Authenticated users
 */
router.post('/backup/generate', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const backupCodes = await mfaMiddleware.generateBackupCodes(userId);

      res.json({
        message: 'New backup codes generated',
        backupCodes: backupCodes,
        instructions: [
          '1. Save these codes in a secure location',
          '2. Each code can only be used once',
          '3. Use these codes if you lose access to your MFA methods'
        ]
      });
    } catch (error) {
      console.error('❌ Generate backup codes error:', error);
      res.status(500).json({
        error: 'Failed to generate backup codes',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/mfa/logs
 * @desc    Get user's MFA logs
 * @access  Authenticated users
 */
router.get('/logs', 
  authMiddleware,
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const logs = await db.query(`
        SELECT method, status, reason, ip_address, user_agent, timestamp
        FROM mfa_logs 
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3
      `, [userId, parseInt(limit), parseInt(offset)]);

      const total = await db.query(`
        SELECT COUNT(*) as count FROM mfa_logs WHERE user_id = $1
      `, [userId]);

      res.json({
        logs: logs.rows,
        total: parseInt(total.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('❌ Get MFA logs error:', error);
      res.status(500).json({
        error: 'Failed to get MFA logs',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/mfa/statistics
 * @desc    Get MFA statistics (admin only)
 * @access  Admin only
 */
router.get('/statistics', 
  authMiddleware,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const stats = await db.query('SELECT * FROM get_mfa_statistics()');
      
      const usageStats = await db.query(`
        SELECT * FROM mfa_usage_stats 
        ORDER BY date DESC, method, status
        LIMIT 100
      `);

      res.json({
        statistics: stats.rows[0],
        usageStats: usageStats.rows,
        generated: new Date()
      });
    } catch (error) {
      console.error('❌ Get MFA statistics error:', error);
      res.status(500).json({
        error: 'Failed to get MFA statistics',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/mfa/users/status
 * @desc    Get all users MFA status (admin only)
 * @access  Admin only
 */
router.get('/users/status', 
  authMiddleware,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;

      const users = await db.query(`
        SELECT * FROM user_mfa_status
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), parseInt(offset)]);

      const total = await db.query(`
        SELECT COUNT(*) as count FROM user_mfa_status
      `);

      res.json({
        users: users.rows,
        total: parseInt(total.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('❌ Get users MFA status error:', error);
      res.status(500).json({
        error: 'Failed to get users MFA status',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/mfa/enforce
 * @desc    Enforce MFA for user (admin only)
 * @access  Admin only
 */
router.post('/enforce', 
  authMiddleware,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { userId, requireMFA } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID required',
          message: 'Please provide a user ID'
        });
      }

      await db.query(`
        UPDATE mfa_settings 
        SET require_mfa_for_login = $2, updated_at = NOW()
        WHERE user_id = $1
      `, [userId, requireMFA]);

      res.json({
        message: `MFA enforcement ${requireMFA ? 'enabled' : 'disabled'} for user`,
        userId: userId,
        requireMFA: requireMFA
      });
    } catch (error) {
      console.error('❌ Enforce MFA error:', error);
      res.status(500).json({
        error: 'Failed to enforce MFA',
        message: error.message
      });
    }
  }
);

module.exports = router; 