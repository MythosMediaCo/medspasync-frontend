const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../../../models');
const Practice = require('../../../models/Practice');
const authenticateToken = require('../../../middleware/authenticateToken');
const {
  loginValidation,
  registerValidation,
  validateRequest
} = require('../../../middleware/validation');

const REFRESH_COOKIE_NAME = 'refreshToken';

// 🔧 Helpers
const normalizeEmail = (email) => email.trim().toLowerCase();


const generateJWT = (user, isSubscribed = false) => {
  return jwt.sign({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    practiceId: user.practiceId || null,
    isSubscribed
  }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

// 🔐 Login Route
router.post('/login', loginValidation, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const practice = user.practiceId ? await Practice.findOne({ practiceId: user.practiceId }) : null;
    const isSubscribed = practice && ['professional', 'enterprise'].includes(practice.subscriptionTier);

    const token = generateJWT(user, isSubscribed);
    const refreshToken = generateRefreshToken(user);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh'
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        practiceId: user.practiceId,
        businessName: user.businessName,
        isSubscribed
      }
    });
  } catch (err) {
    console.error('[LOGIN_ERROR]', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// 📝 Register Route
router.post('/register', registerValidation, validateRequest, async (req, res) => {
  try {
    const { email, spaName } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Generate a random password for trial users
    const generatedPassword = Math.random().toString(36).slice(-10); // Simple random string
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    // Create a new Practice (Medical Spa)
    const newPractice = await Practice.create({
      name: spaName.trim(),
      // Add any other default practice fields here
    });

    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: 'Trial', // Default first name
      lastName: 'User',  // Default last name
      practiceId: newPractice._id, // Associate user with the new practice
      businessName: spaName.trim(),
      role: 'ADMIN', // Assign admin role for trial
    });

    const token = generateJWT(newUser, false);
    const refreshToken = generateRefreshToken(newUser);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh'
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        practiceId: newUser.practiceId,
        businessName: newUser.businessName,
        isSubscribed: false,
        role: newUser.role,
      }
    });
  } catch (err) {
    console.error('[REGISTER_ERROR]', err);
    if (err.code === 11000) return res.status(400).json({ message: 'User already exists' });
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// 🔍 Me Route
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const practice = user.practiceId ? await Practice.findOne({ practiceId: user.practiceId }) : null;
    const isSubscribed = practice && ['professional', 'enterprise'].includes(practice.subscriptionTier);

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      practiceId: user.practiceId,
      businessName: user.businessName,
      createdAt: user.createdAt,
      isSubscribed
    });
  } catch (err) {
    console.error('[ME_ERROR]', err);
    res.status(500).json({ message: 'Failed to retrieve user info' });
  }
});

// 🔄 Refresh Token Route
router.post('/refresh', (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err) {
      console.error('[REFRESH_ERROR]', err);
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const practice = user.practiceId ? await Practice.findOne({ practiceId: user.practiceId }) : null;
      const isSubscribed = practice && ['professional', 'enterprise'].includes(practice.subscriptionTier);
      const accessToken = generateJWT(user, isSubscribed);
      res.json({ token: accessToken });
    } catch (error) {
      console.error('[REFRESH_ERROR]', error);
      res.status(500).json({ message: 'Failed to refresh token' });
    }
  });
});

module.exports = router;
