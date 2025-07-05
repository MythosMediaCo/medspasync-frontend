// middleware/requireSubscription.js

const User = require('../models/User');

const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID found in token' });
    }

    const user = await User.findById(userId).select('isSubscribed');

    if (!user || !user.isSubscribed) {
      return res.status(403).json({
        message: 'Subscription required to access this feature. Please upgrade your account.'
      });
    }

    next();
  } catch (error) {
    console.error('[SUBSCRIPTION_MIDDLEWARE] Failed to verify subscription:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = requireSubscription;
