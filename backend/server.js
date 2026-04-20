require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');

// Route imports
const authRoutes     = require('./src/routes/auth');
const productRoutes  = require('./src/routes/products');
const orderRoutes    = require('./src/routes/orders');
const paymentRoutes  = require('./src/routes/payments');
const adminRoutes    = require('./src/routes/admin');
const reviewRoutes   = require('./src/routes/reviews');
const logoRoutes     = require('./src/routes/logos');
const faqRoutes      = require('./src/routes/faqs');
const mediaRoutes    = require('./src/routes/media');
const settingsRoutes = require('./src/routes/settings');
const categoryRoutes = require('./src/routes/categories');
const policyRoutes      = require('./src/routes/policies');
const newsletterRoutes  = require('./src/routes/newsletter');
const subscribeRoutes   = require('./src/routes/subscribe');

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL    || 'http://localhost:5174',
];

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? '*' : allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so controllers can emit events
app.set('io', io);

io.on('connection', (socket) => {
  // Admin joins a private room to receive live-count updates
  socket.on('join:admin', () => socket.join('admin'));
  socket.on('disconnect', () => {});
});

// Helper exported so controllers can emit without importing io
app.emitAdminEvent = (event, data) => io.to('admin').emit(event, data);

// Connect to MongoDB then ensure permanent admin exists
const User = require('./src/models/User');

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      await User.findByIdAndUpdate(existing._id, { role: 'admin' });
      console.log(`✅ Admin role enforced for ${email}`);
    }
  } else {
    await User.create({ name: 'Admin', email, password, role: 'admin', isVerified: true });
    console.log(`✅ Admin user created: ${email}`);
  }
}

connectDB().then(ensureAdmin).catch(console.error);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Static uploads
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/coupons',    require('./src/routes/coupons'));
app.use('/api/logos',      logoRoutes);
app.use('/api/faqs',       faqRoutes);
app.use('/api/media',      mediaRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/policies',    policyRoutes);
app.use('/api/newsletter',  newsletterRoutes);
app.use('/api',             subscribeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Only start the HTTP server locally (not on Vercel serverless)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`\n Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]\n`);
  });
  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n Port ${PORT} is already in use. Run: npx kill-port ${PORT}\n`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
}

module.exports = app;
