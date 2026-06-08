// models/Order.js
const mongoose = require('mongoose');

// ── Sub-schema: individual item in an order ────
const orderItemSchema = new mongoose.Schema({
  itemType : {
    type: String,
    enum: ['product', 'service'],
    required: true,
  },
  product  : { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  service  : { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  name     : { type: String, required: true },   // snapshot at time of order
  quantity : { type: Number, required: true, min: 1, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  customization: {
    text        : String,
    designNotes : String,
    size        : String,
    color       : String,
  },
  uploadedFiles: [
    {
      url      : String,
      publicId : String,
      filename : String,
    }
  ],
}, { _id: false });

// ── Main Order schema ──────────────────────────
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },
  customer: {
    // for logged-in users
    userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // for guest / walk-in orders (no account needed)
    name   : { type: String, required: true },
    phone  : { type: String, required: true },
    email  : String,
  },
  items        : [orderItemSchema],
  deliveryInfo : {
    type: {
      type: String,
      enum: ['pickup', 'local-delivery', 'courier'],
      default: 'pickup',
    },
    address : {
      street  : String,
      area    : String,
      city    : { type: String, default: 'Lucknow' },
      pincode : String,
    },
    estimatedDelivery : Date,
  },
  pricing: {
    subtotal       : { type: Number, required: true },
    deliveryCharge : { type: Number, default: 0 },
    discount       : { type: Number, default: 0 },
    total          : { type: Number, required: true },
  },
  payment: {
    method   : {
      type: String,
      enum: ['cash', 'upi', 'card', 'razorpay', 'pending'],
      default: 'pending',
    },
    status   : {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId   : String,
    razorpayPaymentId : String,
    razorpaySignature : String,
    paidAt            : Date,
  },
  status: {
    type: String,
    enum: [
      'pending',      // just received
      'confirmed',    // shop confirmed
      'processing',   // being worked on
      'ready',        // ready for pickup / dispatch
      'dispatched',   // sent for delivery
      'delivered',    // customer received
      'cancelled',    // cancelled
    ],
    default: 'pending',
  },
  statusHistory: [
    {
      status    : String,
      note      : String,
      changedAt : { type: Date, default: Date.now },
      changedBy : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }
  ],
  specialInstructions : String,
  internalNotes       : String,   // admin-only notes
  cancelReason        : String,
  isUrgent            : { type: Boolean, default: false },
}, {
  timestamps: true,
});

// ── Auto-generate order number before save ─────
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date    = new Date();
    const yy      = String(date.getFullYear()).slice(-2);
    const mm      = String(date.getMonth() + 1).padStart(2,'0');
    const dd      = String(date.getDate()).padStart(2,'0');
    const random  = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `PZ${yy}${mm}${dd}-${random}`;
  }
  next();
});

// ── Indexes ─────────────────────────────────────
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
