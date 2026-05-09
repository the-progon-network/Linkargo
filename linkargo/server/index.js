require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes   = require('./routes/auth');
const jobRoutes    = require('./routes/jobs');
const quoteRoutes  = require('./routes/quotes');
const statsRoutes  = require('./routes/stats');

const app = express();

// ── Middleware ───────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

app.use('/api/auth',     authRoutes);
app.use('/api',          jobRoutes);    // handles /api/jobs/*
app.use('/api',          quoteRoutes);  // handles /api/jobs/:id/quotes AND /api/quotes/*
app.use('/api/stats',    statsRoutes);
app.use('/api/profiles', statsRoutes);  // profiles are on same router

// ── Error handler ─────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Start ─────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Linkargo API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
