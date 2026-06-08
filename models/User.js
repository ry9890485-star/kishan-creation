// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [60, 'Name cannot exceed 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,   // never returned in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
  address: {
    street   : String,
    city     : { type: String, default: 'Lucknow' },
    state    : { type: String, default: 'Uttar Pradesh' },
    pincode  : String,
  },
  isVerified : { type: Boolean, default: false },
  isActive   : { type: Boolean, default: true  },
  resetPasswordToken  : String,
  resetPasswordExpire : Date,
  lastLogin : Date,
}, {
  timestamps: true,  // createdAt, updatedAt
});

// ── Hash password before saving ────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare passwords ─────────
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: generate JWT ──────────────
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

// ── Virtual: full address string ───────────────
userSchema.virtual('fullAddress').get(function() {
  const a = this.address;
  if (!a) return '';
  return [a.street, a.city, a.state, a.pincode].filter(Boolean).join(', ');
});

module.exports = mongoose.model('User', userSchema);
