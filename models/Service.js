// models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    unique: true,
    trim: true,
  },
  description : { type: String, required: true },
  icon        : { type: String, default: '🖨️' },
  category: {
    type: String,
    enum: ['printing', 'digital', 'financial', 'photography'],
    required: true,
  },
  pricing: {
    startingFrom : { type: Number, required: true },
    unit         : { type: String, default: 'per page' },
    notes        : String,   // e.g. "B&W ₹2, Color ₹10"
  },
  estimatedTime : { type: String, default: '1-2 hours' },
  isAvailable   : { type: Boolean, default: true },
  sortOrder     : { type: Number, default: 0 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Service', serviceSchema);
