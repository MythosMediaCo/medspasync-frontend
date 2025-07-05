const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER,
    // Support both EMAIL_PASS and EMAIL_PASSWORD for compatibility
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
  }
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendEmailWithAttachment = async (
  { to, subject, text, attachmentBuffer, filename },
  maxRetries = 3
) => {
  const mailOptions = {
    // Use EMAIL_FROM if provided, otherwise fall back to EMAIL_USER
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    attachments: [
      {
        filename,
        content: attachmentBuffer
      }
    ]
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`Email send attempt ${attempt} failed. Retrying...`, err);
      await delay(1000);
    }
  }
};

module.exports = { sendEmailWithAttachment };
