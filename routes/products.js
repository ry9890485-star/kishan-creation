// routes/products.js
const express = require('express');
const ctrl = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadProductImage } = require('../config/cloudinary');
const router = express.Router();

router.get('/',            ctrl.getProducts);
router.get('/categories',  ctrl.getCategories);
router.get('/:id',         ctrl.getProduct);

// Admin only
router.post('/',   protect, adminOnly, uploadProductImage.array('images', 8), ctrl.createProduct);
router.put('/:id', protect, adminOnly, uploadProductImage.array('images', 8), ctrl.updateProduct);
router.delete('/:id', protect, adminOnly, ctrl.deleteProduct);
router.delete('/:productId/images/:publicId', protect, adminOnly, ctrl.deleteProductImage);

module.exports = router;
