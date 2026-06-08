// routes/payments.js
const express = require('express');
const ctrl = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/key',                       ctrl.getRazorpayKey);
router.post('/razorpay/create',  protect, ctrl.createRazorpayOrder);
router.post('/razorpay/verify',  protect, ctrl.verifyPayment);
router.post('/manual/confirm', protect, adminOnly, ctrl.confirmManualPayment);

module.exports = router;
