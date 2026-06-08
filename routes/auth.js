// routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
], ctrl.register);

router.post('/login',          ctrl.login);
router.get('/me',   protect,   ctrl.getMe);
router.put('/me',   protect,   ctrl.updateProfile);
router.put('/password', protect, ctrl.changePassword);

module.exports = router;
