// controllers/adminController.js
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Service = require('../models/Service');
const User    = require('../models/User');

// ── Dashboard Stats ────────────────────────────
exports.getDashboard = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalOrders,
    todayOrders,
    monthOrders,
    pendingOrders,
    totalRevenue,
    monthRevenue,
    totalCustomers,
    totalProducts,
    recentOrders,
    ordersByStatus,
    revenueByDay,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: thisMonth } }),
    Order.countDocuments({ status: { $in: ['pending','confirmed','processing'] } }),

    // Total revenue (paid orders only)
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),

    // This month's revenue
    Order.aggregate([
      { $match: { 'payment.status': 'paid', createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),

    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),

    // Last 10 orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber customer.name customer.phone status pricing.total createdAt isUrgent'),

    // Orders grouped by status
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Revenue last 7 days
    Order.aggregate([
      {
        $match: {
          'payment.status': 'paid',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }
      },
      {
        $group: {
          _id  : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$pricing.total' },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      orders: {
        total   : totalOrders,
        today   : todayOrders,
        month   : monthOrders,
        pending : pendingOrders,
      },
      revenue: {
        total : totalRevenue[0]?.total  || 0,
        month : monthRevenue[0]?.total  || 0,
      },
      customers    : totalCustomers,
      products     : totalProducts,
      ordersByStatus,
      revenueByDay,
    },
    recentOrders,
  });
};

// ── Manage Users (admin) ───────────────────────
exports.getUsers = async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const query = {};
  if (role)   query.role = role;
  if (search) {
    query.$or = [
      { name  : { $regex: search, $options: 'i' } },
      { email : { $regex: search, $options: 'i' } },
      { phone : { $regex: search, $options: 'i' } },
    ];
  }

  const skip  = (page - 1) * limit;
  const total = await User.countDocuments(query);
  const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

  res.json({ success: true, total, users });
};

exports.toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
};

// ── Service management (admin) ─────────────────
exports.createService = async (req, res) => {
  const Service = require('../models/Service');
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, service });
};

exports.updateService = async (req, res) => {
  const Service = require('../models/Service');
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  res.json({ success: true, service });
};

exports.deleteService = async (req, res) => {
  const Service = require('../models/Service');
  await Service.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Service deleted.' });
};

// ── Contact messages (admin) ───────────────────
exports.getMessages = async (req, res) => {
  const Contact = require('../models/Contact');
  const { isRead, page = 1, limit = 20 } = req.query;
  const query = {};
  if (isRead !== undefined) query.isRead = isRead === 'true';

  const skip     = (page - 1) * limit;
  const total    = await Contact.countDocuments(query);
  const messages = await Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
  res.json({ success: true, total, messages });
};

exports.markMessageRead = async (req, res) => {
  const Contact = require('../models/Contact');
  const msg = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  res.json({ success: true, message: msg });
};
