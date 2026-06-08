// controllers/paymentController.js
const crypto  = require('crypto');
const Razorpay = require('razorpay');
const Order    = require('../models/Order');

// Initialize Razorpay only when keys exist
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured. Add them to .env');
  }
  return new Razorpay({
    key_id    : process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ── Create Razorpay order ──────────────────────
exports.createRazorpayOrder = async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (order.payment.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Order already paid.' });
  }

  const razorpay = getRazorpay();
  const rpOrder  = await razorpay.orders.create({
    amount   : Math.round(order.pricing.total * 100),  // paise
    currency : 'INR',
    receipt  : order.orderNumber,
    notes    : {
      orderNumber   : order.orderNumber,
      customerName  : order.customer.name,
      customerPhone : order.customer.phone,
    },
  });

  // Save razorpay order id on our order
  order.payment.razorpayOrderId = rpOrder.id;
  await order.save();

  res.json({
    success: true,
    razorpayOrderId : rpOrder.id,
    amount          : rpOrder.amount,
    currency        : rpOrder.currency,
    key             : process.env.RAZORPAY_KEY_ID,
    order: {
      id          : order._id,
      orderNumber : order.orderNumber,
      customerName: order.customer.name,
      customerPhone:order.customer.phone,
    },
  });
};

// ── Verify payment signature (called after payment) ─
exports.verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  // Signature verification
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expected !== razorpaySignature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
  }

  // Update order as paid
  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      'payment.status'            : 'paid',
      'payment.method'            : 'razorpay',
      'payment.razorpayPaymentId' : razorpayPaymentId,
      'payment.razorpaySignature' : razorpaySignature,
      'payment.paidAt'            : new Date(),
      status                      : 'confirmed',
      $push: {
        statusHistory: {
          status: 'confirmed',
          note  : `Payment received via Razorpay. Payment ID: ${razorpayPaymentId}`,
        }
      }
    },
    { new: true }
  );

  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  res.json({
    success: true,
    message: 'Payment verified and order confirmed!',
    order: {
      id          : order._id,
      orderNumber : order.orderNumber,
      status      : order.status,
      paymentStatus: order.payment.status,
    },
  });
};

// ── UPI / Cash payment confirmation (admin marks paid) ─
exports.confirmManualPayment = async (req, res) => {
  const { orderId, method, transactionRef } = req.body;

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      'payment.status' : 'paid',
      'payment.method' : method || 'cash',
      'payment.paidAt' : new Date(),
      status           : 'confirmed',
      $push: {
        statusHistory: {
          status : 'confirmed',
          note   : `Manual payment confirmed. Method: ${method}. Ref: ${transactionRef || 'N/A'}`,
          changedBy: req.user._id,
        }
      }
    },
    { new: true }
  );

  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  res.json({ success: true, message: 'Payment confirmed.', order });
};

// ── Get Razorpay key for frontend ─────────────
exports.getRazorpayKey = (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
};
