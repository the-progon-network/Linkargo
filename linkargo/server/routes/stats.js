const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/carrier
router.get('/carrier', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'pending') as pending_quotes,
         COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'completed') as completed_jobs,
         COALESCE(SUM(q.amount) FILTER (WHERE q.status = 'accepted'), 0) as total_revenue,
         ROUND(
           100.0 * COUNT(q.id) FILTER (WHERE q.status = 'accepted') /
           NULLIF(COUNT(q.id), 0)
         ) as acceptance_rate,
         u.rating, u.review_count
       FROM users u
       LEFT JOIN quotes q ON q.carrier_id = u.id
       LEFT JOIN jobs j ON j.accepted_quote_id IN (SELECT id FROM quotes WHERE carrier_id = u.id)
       WHERE u.id = $1
       GROUP BY u.id, u.rating, u.review_count`,
      [req.user.id]
    );

    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Carrier stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/stats/shipper
router.get('/shipper', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(j.id)::int as total_jobs,
         COUNT(j.id) FILTER (WHERE j.status = 'open')::int as active_jobs,
         COUNT(j.id) FILTER (WHERE j.status = 'completed')::int as completed_jobs,
         COALESCE(SUM(q.amount) FILTER (WHERE q.status = 'accepted'), 0) as total_spent,
         COUNT(q.id) FILTER (WHERE q.status = 'pending')::int as pending_quotes
       FROM jobs j
       LEFT JOIN quotes q ON q.job_id = j.id
       WHERE j.shipper_id = $1
       GROUP BY j.shipper_id`,
      [req.user.id]
    );

    res.json(result.rows[0] || { total_jobs: 0, active_jobs: 0, completed_jobs: 0, total_spent: 0, pending_quotes: 0 });
  } catch (err) {
    console.error('Shipper stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/profiles/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, phone, company_name, vehicle_type, license_plate,
              verified, rating, review_count, created_at
       FROM users WHERE id = $1`,
      [req.params.userId]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profiles/me
router.put('/me', auth, async (req, res) => {
  const { name, phone, company_name } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       company_name = COALESCE($3, company_name)
       WHERE id = $4 RETURNING id, name, email, role, phone, company_name, vehicle_type`,
      [name, phone, company_name, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
