const authenticate = require('./authenticateToken');
const requireRole = require('./requireRole');

module.exports = { 
  authenticateToken: authenticate,
  requireRole 
};
