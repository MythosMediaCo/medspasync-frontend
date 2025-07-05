module.exports = function requireProfessionalTier(req, res, next) {
  if (req.user?.subscriptionTier !== 'professional') {
    return res.status(403).json({ error: 'Professional plan required' });
  }
  next();
};
