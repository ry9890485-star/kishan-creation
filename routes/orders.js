// routes/orders.js
const express = require('express');
const ctrl = require('../controllers/orderController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Public — guest can place order
router.post('/', optionalAuth, ctrl.createOrder);

// Public — guest order tracking by phone
router.get('/track/:phone', ctrl.trackByPhone);

// Customer — my orders
router.get('/my', protect, ctrl.getMyOrders);

// Admin — all orders
router.get('/', protect, adminOnly, ctrl.getAllOrders);
router.get('/:id', protect, ctrl.getOrder);
router.patch('/:id/status',  protect, adminOnly, ctrl.updateOrderStatus);
router.patch('/:id/payment', protect, adminOnly, ctrl.updatePaymentStatus);
router.patch('/:id/note',    protect, adminOnly, ctrl.addNote);

module.exports = router;
