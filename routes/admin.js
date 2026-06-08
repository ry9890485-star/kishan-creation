// routes/admin.js
const express = require('express');
const ctrl  = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, adminOnly);

router.get('/dashboard', ctrl.getDashboard);

// Users
router.get('/users',               ctrl.getUsers);
router.patch('/users/:id/toggle',  ctrl.toggleUserStatus);

// Services
router.post('/services',       ctrl.createService);
router.put('/services/:id',    ctrl.updateService);
router.delete('/services/:id', ctrl.deleteService);

// Contact messages
router.get('/messages',              ctrl.getMessages);
router.patch('/messages/:id/read',   ctrl.markMessageRead);

module.exports = router;
