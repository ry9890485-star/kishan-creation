// routes/services.js
const express = require('express');
const Service = require('../models/Service');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const services = await Service.find({ isAvailable: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, services });
});

router.get('/:id', async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  res.json({ success: true, service });
});

// Admin routes are exposed via /api/v1/admin/services
module.exports = router;
