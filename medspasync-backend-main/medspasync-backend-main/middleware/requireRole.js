const User = require('../models/User');

/**
 * Role-based access control middleware
 * Ensures users have the required role(s) to access protected routes
 */

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Check if user has any of the required roles
      const userRole = req.user.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: userRole
        });
      }

      // Log access for audit purposes
      console.log(`[AUDIT] User ${req.user.id} (${userRole}) accessed ${req.method} ${req.path}`);

      next();
    } catch (error) {
      console.error('Role verification error:', error);
      return res.status(500).json({
        error: 'Internal server error during role verification',
        code: 'ROLE_VERIFICATION_ERROR'
      });
    }
  };
};

module.exports = requireRole;
