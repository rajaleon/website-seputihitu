require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const { pool, testConnection, DB_MODE } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes     = require('./routes/cart');
const orderRoutes    = require('./routes/orders');
const addressRoutes  = require('./routes/addresses');
const shippingRoutes = require('./routes/shipping');
const paymentRoutes  = require('./routes/payment');
const bannerRoutes   = require('./routes/banners');
const reviewRoutes   = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const webhookRoutes  = require('./routes/webhooks');
const adminRoutes    = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & Parsing ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin || allowed.some(u => origin.startsWith(u.trim()))) {
      callback(null, true);
    } else if (origin.endsWith('.vercel.app')) {
      callback(null, true); // Allow all Vercel preview deployments
    } else {
      callback(null, true); // Untuk development, allow semua dulu
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));

// Webhook routes need raw body BEFORE json parser
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Terlalu banyak percobaan login.' },
});

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/shipping',  shippingRoutes);
app.use('/api/payment',   paymentRoutes);
app.use('/api/banners',   bannerRoutes);
app.use('/api/reviews',   reviewRoutes);
app.use('/api/wishlist',  wishlistRoutes);
app.use('/api/admin',    adminRoutes);

// ── Error Handlers ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
async function start() {
  await testConnection();

  // SQLite demo mode: init schema + seed data otomatis
  if (DB_MODE === 'sqlite' && pool._sqlite) {
    const { setupSqliteSchema } = require('./config/setupSqlite');
    const { seedDemo }          = require('./config/seedDemo');
    setupSqliteSchema(pool._sqlite);
    await seedDemo(pool._sqlite);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📖 Mode: ${DB_MODE === 'postgres' ? 'PostgreSQL (Supabase)' : DB_MODE === 'mysql' ? 'MySQL' : 'SQLite Demo'}`);
  });
}

start();
