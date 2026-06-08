// controllers/productController.js
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// ── Get all products ───────────────────────────
exports.getProducts = async (req, res) => {
  const { category, featured, search, page = 1, limit = 12, sort } = req.query;

  const query = { isActive: true };
  if (category) query.category = category;
  if (featured === 'true') query.featured = true;
  if (search) query.$text = { $search: search };

  const sortOptions = {
    newest   : { createdAt: -1 },
    price_low: { 'price.base': 1 },
    price_high:{ 'price.base': -1 },
    popular  : { totalOrders: -1 },
    rating   : { 'rating.average': -1 },
  };
  const sortBy = sortOptions[sort] || sortOptions.newest;

  const skip  = (page - 1) * limit;
  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit))
    .select('-__v');

  res.json({
    success: true,
    total,
    page   : Number(page),
    pages  : Math.ceil(total / limit),
    products,
  });
};

// ── Get single product ─────────────────────────
exports.getProduct = async (req, res) => {
  const product = await Product.findOne({
    $or: [
      { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      { slug: req.params.id },
    ]
  });

  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  res.json({ success: true, product });
};

// ── Create product (admin) ─────────────────────
exports.createProduct = async (req, res) => {
  const images = req.files?.map(f => ({
    url      : f.path,
    publicId : f.filename,
    alt      : req.body.name,
  })) || [];

  const product = await Product.create({ ...req.body, images });
  res.status(201).json({ success: true, product });
};

// ── Update product (admin) ─────────────────────
exports.updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  // New images uploaded?
  if (req.files?.length > 0) {
    const newImages = req.files.map(f => ({
      url: f.path, publicId: f.filename, alt: req.body.name || product.name,
    }));
    req.body.images = [...product.images, ...newImages];
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  res.json({ success: true, product: updated });
};

// ── Delete product (admin) ─────────────────────
exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  // Delete images from Cloudinary
  for (const img of product.images) {
    if (img.publicId) {
      await cloudinary.uploader.destroy(img.publicId).catch(() => {});
    }
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted.' });
};

// ── Delete single product image (admin) ────────
exports.deleteProductImage = async (req, res) => {
  const { productId, publicId } = req.params;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  await cloudinary.uploader.destroy(publicId).catch(() => {});
  product.images = product.images.filter(img => img.publicId !== publicId);
  await product.save();

  res.json({ success: true, message: 'Image removed.' });
};

// ── Get product categories with counts ─────────
exports.getCategories = async (req, res) => {
  const cats = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, categories: cats });
};
