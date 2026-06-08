// routes/uploads.js
const express = require('express');
const { uploadOrderFiles, cloudinary } = require('../config/cloudinary');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Upload design files for an order (up to 5 files)
router.post('/order-files', optionalAuth, uploadOrderFiles.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  const uploaded = req.files.map(f => ({
    url      : f.path,
    publicId : f.filename,
    filename : f.originalname,
  }));

  res.json({ success: true, message: `${uploaded.length} file(s) uploaded.`, files: uploaded });
});

// Delete a file (cleanup)
router.delete('/:publicId', async (req, res) => {
  const { publicId } = req.params;
  await cloudinary.uploader.destroy(publicId).catch(() => {});
  res.json({ success: true, message: 'File deleted.' });
});

module.exports = router;
