// ══════════════════════════════════════════════
//  Kishan Creation Backend  —  server.js
// ══════════════════════════════════════════════
require('dotenv').config();
require('express-async-errors');

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB     = require('./config/database');
const errorHandler  = require('./middleware/errorHandler');
const notFound      = require('./middleware/notFound');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const serviceRoutes = require('./routes/services');
const orderRoutes   = require('./routes/orders');
const adminRoutes   = require('./routes/admin');
const contactRoutes = require('./routes/contact');

const app = express();
connectDB();

// Trust Render's proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS — allow ALL origins (fixes Netlify access)
app.use(cors());
app.options('*', cors());

// Rate limiter
app.use(rateLimit({
  windowMs      : 15 * 60 * 1000,
  max           : 100,
  message       : { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders : false,
}));

// Auth stricter limiter
const authLimiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 10,
  message  : { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Serve static files (index.html, admin.html, Images folder)
app.use(express.static(__dirname));

// API Routes
app.use('/api/v1/auth',     authLimiter, authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/orders',   orderRoutes);
app.use('/api/v1/admin',    adminRoutes);
app.use('/api/v1/contact',  contactRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success : true,
    message : 'Kishan Creation API is running!',
    version : '1.0.0',
    env     : process.env.NODE_ENV,
    time    : new Date().toISOString(),
  });
});

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Kishan Creation API running on port ${PORT}`);
});

module.exports = app;
