// models/Contact.js
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name    : { type: String, required: true, trim: true },
  phone   : { type: String, trim: true },
  email   : { type: String, trim: true, lowercase: true },
  subject : { type: String, trim: true },
  message : { type: String, required: true },
  isRead  : { type: Boolean, default: false },
  repliedAt: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Contact', contactSchema);
