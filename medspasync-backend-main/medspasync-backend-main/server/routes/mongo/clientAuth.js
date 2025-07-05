// routes/clientAuth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Client = require('../../../models/Client');
const authenticateToken = require('../../../middleware/authenticateToken');

const JWT_SECRET = process.env.JWT_SECRET || 'clientsecret';

// 🔐 POST /api/client-auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, accessCode } = req.body;

    if (!email || !accessCode) {
      return res.status(400).json({ message: 'Email and access code are required.' });
    }

    const client = await Client.findOne({ email: email.toLowerCase().trim() }).select('+accessCode');
    if (!client || !(await client.verifyAccessCode(accessCode))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: client._id, type: 'client' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email
      }
    });
  } catch (err) {
    console.error('[CLIENT_LOGIN_ERROR]', err);
    res.status(500).json({ message: 'Server error during client login' });
  }
});

// 🔒 GET /api/client-auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const client = await Client.findById(req.user.id).select('-accessCode');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.json({ success: true, client });
  } catch (err) {
    console.error('[CLIENT_ME_ERROR]', err);
    res.status(500).json({ success: false, message: 'Server error fetching client info' });
  }
});

module.exports = router;
