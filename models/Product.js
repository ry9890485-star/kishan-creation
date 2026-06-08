// models/Product.js
const mongoose = require('mongoose');
const slugify  = require('slugify');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Name too long'],
  },
  slug: { type: String, unique: true },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description too long'],
  },
  category: {
    type: String,
    required: true,
    enum: [
      'tshirt', 'mug', 'banner', 'poster', 'wedding-card',
      'visiting-card', 'photo-frame', 'calendar', 'other'
    ],
  },
  price: {
    base    : { type: Number, required: true, min: 0 },  // minimum / starting price
    unit    : { type: String, default: 'per piece' },    // "per sq.ft", "per 100 pcs"
  },
  images: [
    {
      url       : { type: String, required: true },
      publicId  : String,   // cloudinary public_id for deletion
      alt       : String,
    }
  ],
  customizable : { type: Boolean, default: true  },
  inStock      : { type: Boolean, default: true  },
  featured     : { type: Boolean, default: false },
  minQuantity  : { type: Number, default: 1  },
  maxQuantity  : { type: Number, default: 10000 },
  deliveryDays : { type: Number, default: 2 },  // estimated days
  tags         : [String],
  rating: {
    average : { type: Number, default: 0, min: 0, max: 5 },
    count   : { type: Number, default: 0 },
  },
  totalOrders  : { type: Number, default: 0 },
  isActive     : { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ── Auto-generate slug from name ───────────────
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// ── Text index for search ──────────────────────
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, inStock: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
