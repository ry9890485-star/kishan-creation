// routes/contact.js
const express = require('express');
const Contact = require('../models/Contact');
const emailService = require('../utils/email');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Strict rate limit for contact form
const contactLimit = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
});

router.post('/', contactLimit, async (req, res) => {
  const { name, phone, email, subject, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ success: false, message: 'Name and message are required.' });
  }

  const contact = await Contact.create({ name, phone, email, subject, message });

  // Notify admin email
  await emailService.sendContactAlert(contact).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Message received! We will get back to you soon.',
  });
});

module.exports = router;
