require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression= require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const authRoutes     = require('./routes/auth');
const paperRoutes    = require('./routes/papers');
const generateRoutes = require('./routes/generate');
const bankRoutes     = require('./routes/bank');
const dashRoutes     = require('./routes/dashboard');

const app = express();

// ─── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.CLIENT_URL,           // your Vercel URL
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limit
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please slow down.' },
}));

// Strict limit for generation (expensive AI calls)
app.use('/api/generate', rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Generation rate limit reached. Wait 1 minute.' },
}));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/papers',    paperRoutes);
app.use('/api/generate',  generateRoutes);
app.use('/api/bank',      bankRoutes);
app.use('/api/dashboard', dashRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// ─── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';
  res.status(status).json({ success: false, message });
});

// ─── MongoDB + Start ─────────────────────────────────────────────────────────
const PORT    = process.env.PORT    || 5000;
const MONGO   = process.env.MONGODB_URI || 'mongodb://localhost:27017/examgen';

mongoose.connect(MONGO)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
