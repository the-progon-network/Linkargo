const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/jobs  — shipper posts a load
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'shipper') {
    return res.status(403).json({ error: 'Only shippers can post jobs' });
  }

  const {
    pickup_city, pickup_address, dropoff_city, dropoff_address,
    goods_type, weight_kg, description, vehicle_type,
    required_date, addons, budget_min, budget_max
  } = req.body;

  if (!pickup_city || !dropoff_city || !goods_type || !weight_kg || !vehicle_type || !required_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await db.query(
      `INSERT INTO jobs
       (shipper_id, pickup_city, pickup_address, dropoff_city, dropoff_address,
        goods_type, weight_kg, description, vehicle_type, required_date,
        addons, budget_min, budget_max)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [req.user.id, pickup_city, pickup_address || null, dropoff_city, dropoff_address || null,
       goods_type, weight_kg, description || null, vehicle_type, required_date,
       addons || [], budget_min || null, budget_max || null]
    );

    res.status(201).json({ job: result.rows[0] });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// GET /api/jobs  — carriers browse open jobs
router.get('/', auth, async (req, res) => {
  const { vehicle_type, city } = req.query;

  let whereClause = `WHERE j.status = 'open'`;
  const params = [];

  if (vehicle_type) {
    params.push(`%${vehicle_type}%`);
    whereClause += ` AND j.vehicle_type ILIKE $${params.length}`;
  }
  if (city) {
    params.push(`%${city}%`);
    whereClause += ` AND (j.pickup_city ILIKE $${params.length} OR j.dropoff_city ILIKE $${params.length})`;
  }

  try {
    const result = await db.query(
      `SELECT j.*,
              u.name as shipper_name, u.company_name,
              COUNT(q.id)::int as quote_count
       FROM jobs j
       JOIN users u ON j.shipper_id = u.id
       LEFT JOIN quotes q ON q.job_id = j.id
       ${whereClause}
       GROUP BY j.id, u.name, u.company_name
       ORDER BY j.created_at DESC
       LIMIT 50`,
      params
    );

    res.json({ jobs: result.rows });
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/my  — shipper's own jobs
router.get('/my', auth, async (req, res) => {
  if (req.user.role !== 'shipper') {
    return res.status(403).json({ error: 'Only shippers can view their jobs' });
  }

  try {
    const result = await db.query(
      `SELECT j.*, COUNT(q.id)::int as quote_count
       FROM jobs j
       LEFT JOIN quotes q ON q.job_id = j.id AND q.status = 'pending'
       WHERE j.shipper_id = $1
       GROUP BY j.id
       ORDER BY j.created_at DESC`,
      [req.user.id]
    );

    res.json({ jobs: result.rows });
  } catch (err) {
    console.error('My jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch your jobs' });
  }
});

// GET /api/jobs/:id  — single job detail
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT j.*, u.name as shipper_name, u.phone as shipper_phone
       FROM jobs j JOIN users u ON j.shipper_id = u.id
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json({ job: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// PATCH /api/jobs/:id/cancel
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const job = await db.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (!job.rows[0]) return res.status(404).json({ error: 'Job not found' });
    if (job.rows[0].shipper_id !== req.user.id) return res.status(403).json({ error: 'Not your job' });

    await db.query(`UPDATE jobs SET status = 'cancelled' WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

module.exports = router;
