// controllers/orderController.js
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Service = require('../models/Service');
const emailService = require('../utils/email');

// ── Create Order (Guest or Logged-in) ──────────
exports.createOrder = async (req, res) => {
  const {
    customerName, customerPhone, customerEmail,
    items, deliveryInfo, specialInstructions, isUrgent,
    paymentMethod,
  } = req.body;

  if (!customerName || !customerPhone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required.' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one item is required.' });
  }

  // ── Build items with pricing ───────────────
  let subtotal = 0;
  const enrichedItems = [];

  for (const item of items) {
    let unitPrice = item.unitPrice || 0;
    let name      = item.name;

    if (item.itemType === 'product' && item.productId) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }
      unitPrice = unitPrice || product.price.base;
      name      = name      || product.name;
    }

    if (item.itemType === 'service' && item.serviceId) {
      const service = await Service.findById(item.serviceId);
      if (!service || !service.isAvailable) {
        return res.status(400).json({ success: false, message: `Service not found: ${item.serviceId}` });
      }
      unitPrice = unitPrice || service.pricing.startingFrom;
      name      = name      || service.name;
    }

    const quantity   = item.quantity || 1;
    const totalPrice = unitPrice * quantity;
    subtotal        += totalPrice;

    enrichedItems.push({
      itemType    : item.itemType,
      product     : item.itemType === 'product' ? item.productId : undefined,
      service     : item.itemType === 'service' ? item.serviceId : undefined,
      name,
      quantity,
      unitPrice,
      totalPrice,
      customization : item.customization || {},
      uploadedFiles : item.uploadedFiles  || [],
    });
  }

  const deliveryCharge = deliveryInfo?.type === 'local-delivery' ? 50 : 0;
  const total          = subtotal + deliveryCharge;

  const order = await Order.create({
    customer: {
      userId : req.user?._id,
      name   : customerName,
      phone  : customerPhone,
      email  : customerEmail,
    },
    items        : enrichedItems,
    deliveryInfo : deliveryInfo || { type: 'pickup' },
    pricing      : { subtotal, deliveryCharge, total },
    payment      : { method: paymentMethod || 'pending', status: 'pending' },
    specialInstructions,
    isUrgent     : isUrgent || false,
    statusHistory: [{ status: 'pending', note: 'Order placed by customer' }],
  });

  // Send confirmation email if email provided
  if (customerEmail) {
    await emailService.sendOrderConfirmation(order).catch(() => {}); // non-blocking
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully! We will contact you shortly.',
    order: {
      id          : order._id,
      orderNumber : order.orderNumber,
      status      : order.status,
      total       : order.pricing.total,
    },
  });
};

// ── Get all orders (admin) ─────────────────────
exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20, search, from, to } = req.query;

  const query = {};
  if (status)  query.status = status;
  if (search) {
    query.$or = [
      { orderNumber              : { $regex: search, $options: 'i' } },
      { 'customer.name'          : { $regex: search, $options: 'i' } },
      { 'customer.phone'         : { $regex: search, $options: 'i' } },
    ];
  }
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to)   query.createdAt.$lte = new Date(to);
  }

  const skip  = (page - 1) * limit;
  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('customer.userId', 'name email phone');

  res.json({
    success: true,
    total,
    page   : Number(page),
    pages  : Math.ceil(total / limit),
    orders,
  });
};

// ── Get single order ───────────────────────────
exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer.userId', 'name email phone')
    .populate('items.product', 'name images')
    .populate('items.service', 'name');

  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  // Customers can only see their own orders
  if (req.user?.role !== 'admin') {
    const isOwner = order.customer.userId?.toString() === req.user?._id?.toString()
                 || order.customer.phone === req.user?.phone;
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
    }
  }

  res.json({ success: true, order });
};

// ── Get orders by phone (for guest tracking) ───
exports.trackByPhone = async (req, res) => {
  const { phone } = req.params;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number required.' });

  const orders = await Order.find({ 'customer.phone': phone })
    .sort({ createdAt: -1 })
    .select('orderNumber status pricing.total createdAt deliveryInfo.type isUrgent');

  res.json({ success: true, count: orders.length, orders });
};

// ── Update order status (admin) ────────────────
exports.updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['pending','confirmed','processing','ready','dispatched','delivered','cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  order.status = status;
  order.statusHistory.push({ status, note: note || '', changedBy: req.user._id });

  if (status === 'cancelled' && req.body.cancelReason) {
    order.cancelReason = req.body.cancelReason;
  }

  await order.save();

  // Notify customer by email if available
  if (order.customer.email) {
    await emailService.sendStatusUpdate(order).catch(() => {});
  }

  res.json({ success: true, message: `Order status updated to "${status}".`, order });
};

// ── Update payment status (admin) ─────────────
exports.updatePaymentStatus = async (req, res) => {
  const { status, method, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  order.payment.status = status;
  if (method) order.payment.method = method;
  if (status === 'paid') order.payment.paidAt = new Date();

  await order.save();
  res.json({ success: true, message: 'Payment status updated.', order });
};

// ── My orders (logged-in customer) ────────────
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ 'customer.userId': req.user._id })
    .sort({ createdAt: -1 })
    .select('orderNumber status pricing items.name createdAt deliveryInfo.type');

  res.json({ success: true, count: orders.length, orders });
};

// ── Add internal note (admin) ──────────────────
exports.addNote = async (req, res) => {
  const { note } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { internalNotes: note },
    { new: true }
  );
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  res.json({ success: true, message: 'Note saved.', order });
};
