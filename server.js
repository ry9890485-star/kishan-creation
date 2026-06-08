// ══════════════════════════════════════════════
//  PrintZone Backend  —  server.js
//  Entry point: loads config, connects DB, starts
// ══════════════════════════════════════════════
require('dotenv').config();
require('express-async-errors');

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const connectDB      = require('./config/database');
const errorHandler   = require('./middleware/errorHandler');
const notFound       = require('./middleware/notFound');

// ── Route imports ──────────────────────────────
const authRoutes      = require('./routes/auth');
const productRoutes   = require('./routes/products');
const serviceRoutes   = require('./routes/services');
const orderRoutes     = require('./routes/orders');
const paymentRoutes   = require('./routes/payments');
const uploadRoutes    = require('./routes/uploads');
const adminRoutes     = require('./routes/admin');
const contactRoutes   = require('./routes/contact');

// ── App setup ──────────────────────────────────
const app = express();
connectDB();

// ── Security Middleware ────────────────────────
app.use(helmet());

// CORS — allow frontend origin
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5500',   // live-server
    'http://127.0.0.1:5500',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Global rate limiter (100 req/15min per IP)
app.use(rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 100,
  message  : { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders  : false,
}));

// Auth-specific stricter limiter (10 req/15min)
const authLimiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 10,
  message  : { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

// ── Body Parsing ───────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── API Routes ─────────────────────────────────
app.use('/api/v1/auth',     authLimiter, authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/orders',   orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/upload',   uploadRoutes);
app.use('/api/v1/admin',    adminRoutes);
app.use('/api/v1/contact',  contactRoutes);

// ── Health check ───────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({
    success : true,
    message : '🟢 PrintZone API is running',
    version : '1.0.0',
    env     : process.env.NODE_ENV,
    time    : new Date().toISOString(),
  });
});

// ── 404 & Error handlers ──────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 PrintZone API running on port ${PORT}`);
  console.log(`   Mode  : ${process.env.NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/api/v1/health\n`);
});

module.exports = app;
