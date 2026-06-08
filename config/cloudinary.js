// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

// ── Order Design File Uploads ──────────────────
const orderStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder        : 'printzone/orders',
    allowed_formats: ['jpg','jpeg','png','pdf','svg','ai','psd'],
    resource_type : file.mimetype === 'application/pdf' ? 'raw' : 'image',
    public_id     : `order_${Date.now()}_${file.originalname.replace(/\s+/g,'_')}`,
  }),
});

// ── Product Image Uploads ──────────────────────
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder         : 'printzone/products',
    allowed_formats: ['jpg','jpeg','png','webp'],
    transformation : [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// File filter — block dangerous file types
const fileFilter = (req, file, cb) => {
  const blocked = ['.exe','.bat','.sh','.js','.php','.py'];
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();
  if (blocked.includes(ext)) {
    return cb(new Error('File type not allowed'), false);
  }
  cb(null, true);
};

const uploadOrderFiles  = multer({ storage: orderStorage,   fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB
const uploadProductImage = multer({ storage: productStorage, fileFilter, limits: { fileSize: 5  * 1024 * 1024 } }); // 5MB

module.exports = { cloudinary, uploadOrderFiles, uploadProductImage };
