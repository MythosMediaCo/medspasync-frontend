// backend/routes/contact.js
const express = require('express');
const router = express.Router();
const nodemailer = require('../utils/mailer');
const ContactLog = require('../models/ContactLog');

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await nodemailer.sendEmailWithAttachment({
      to: 'support@mythosmedia.co',
      subject: `Contact Form: ${name || 'No Name'}`,
      text: `Email: ${email}\n\nMessage:\n${message}`,
    });

    await ContactLog.create({ name, email, message });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;


// backend/models/ContactLog.js
const mongoose = require('mongoose');

const ContactLogSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactLog', ContactLogSchema);
