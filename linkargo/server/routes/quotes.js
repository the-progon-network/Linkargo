const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/jobs/:jobId/quotes  — carrier submits a quote
router.post('/jobs/:jobId/quotes', auth, async (req, res) => {
  if (req.user.role !== 'carrier') {
    return res.status(403).json({ error: 'Only carriers can submit quotes' });
  }

  const { amount, eta_hours, note } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'A valid price is required' });
  }

  try {
    // Check job exists and is open
    const job = await db.query(`SELECT * FROM jobs WHERE id = $1 AND status = 'open'`, [req.params.jobId]);
    if (!job.rows[0]) return res.status(404).json({ error: 'Job not found or no longer accepting quotes' });

    // Carrier can't quote their own... n/a here since carrier can't post jobs
    // One quote per carrier per job (enforced by UNIQUE constraint)
    const result = await db.query(
      `INSERT INTO quotes (job_id, carrier_id, amount, eta_hours, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (job_id, carrier_id)
       DO UPDATE SET amount = $3, eta_hours = $4, note = $5, updated_at = NOW()
       RETURNING *`,
      [req.params.jobId, req.user.id, amount, eta_hours || null, note || null]
    );

    res.status(201).json({ quote: result.rows[0] });
  } catch (err) {
    console.error('Submit quote error:', err);
    res.status(500).json({ error: 'Failed to submit quote' });
  }
});

// GET /api/jobs/:jobId/quotes  — shipper views all quotes for their job
router.get('/jobs/:jobId/quotes', auth, async (req, res) => {
  try {
    // Verify this shipper owns the job (or it's a carrier viewing their own)
    const job = await db.query('SELECT * FROM jobs WHERE id = $1', [req.params.jobId]);
    if (!job.rows[0]) return res.status(404).json({ error: 'Job not found' });

    if (req.user.role === 'shipper' && job.rows[0].shipper_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your job' });
    }

    const result = await db.query(
      `SELECT q.*,
              u.name, u.phone, u.rating, u.review_count as trips_completed,
              u.vehicle_type, u.license_plate, u.verified
       FROM quotes q
       JOIN users u ON q.carrier_id = u.id
       WHERE q.job_id = $1
       ORDER BY q.amount ASC`,
      [req.params.jobId]
    );

    // Shape each quote to include carrier as nested object
    const quotes = result.rows.map(q => ({
      id: q.id,
      job_id: q.job_id,
      amount: q.amount,
      eta_hours: q.eta_hours,
      note: q.note,
      status: q.status,
      created_at: q.created_at,
      carrier: {
        id: q.carrier_id,
        name: q.name,
        phone: q.phone,
        rating: q.rating,
        trips_completed: q.trips_completed,
        vehicle_type: q.vehicle_type,
        license_plate: q.license_plate,
        verified: q.verified,
      }
    }));

    res.json({ quotes });
  } catch (err) {
    console.error('List quotes error:', err);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// PATCH /api/quotes/:id/accept  — shipper accepts a quote
router.patch('/:id/accept', auth, async (req, res) => {
  if (req.user.role !== 'shipper') {
    return res.status(403).json({ error: 'Only shippers can accept quotes' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Fetch the quote + job
    const qResult = await client.query(
      `SELECT q.*, j.shipper_id FROM quotes q JOIN jobs j ON q.job_id = j.id WHERE q.id = $1`,
      [req.params.id]
    );
    const quote = qResult.rows[0];
    if (!quote) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Quote not found' }); }
    if (quote.shipper_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Not your job' }); }

    // Accept this quote
    await client.query(`UPDATE quotes SET status = 'accepted' WHERE id = $1`, [req.params.id]);
    // Reject all other quotes for this job
    await client.query(`UPDATE quotes SET status = 'rejected' WHERE job_id = $1 AND id != $2`, [quote.job_id, req.params.id]);
    // Mark job as in_progress
    await client.query(`UPDATE jobs SET status = 'in_progress', accepted_quote_id = $1 WHERE id = $2`, [req.params.id, quote.job_id]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Accept quote error:', err);
    res.status(500).json({ error: 'Failed to accept quote' });
  } finally {
    client.release();
  }
});

// PATCH /api/quotes/:id/reject
router.patch('/:id/reject', auth, async (req, res) => {
  if (req.user.role !== 'shipper') {
    return res.status(403).json({ error: 'Only shippers can reject quotes' });
  }

  try {
    const qResult = await db.query(
      `SELECT q.*, j.shipper_id FROM quotes q JOIN jobs j ON q.job_id = j.id WHERE q.id = $1`,
      [req.params.id]
    );
    const quote = qResult.rows[0];
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.shipper_id !== req.user.id) return res.status(403).json({ error: 'Not your job' });

    await db.query(`UPDATE quotes SET status = 'rejected' WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject quote' });
  }
});

// GET /api/quotes/my  — carrier's own submitted quotes
router.get('/my', auth, async (req, res) => {
  if (req.user.role !== 'carrier') {
    return res.status(403).json({ error: 'Carriers only' });
  }

  try {
    const result = await db.query(
      `SELECT q.*,
              json_build_object(
                'pickup_city', j.pickup_city,
                'dropoff_city', j.dropoff_city,
                'goods_type', j.goods_type,
                'weight_kg', j.weight_kg
              ) as job
       FROM quotes q
       JOIN jobs j ON q.job_id = j.id
       WHERE q.carrier_id = $1
       ORDER BY q.created_at DESC`,
      [req.user.id]
    );

    res.json({ quotes: result.rows });
  } catch (err) {
    console.error('My quotes error:', err);
    res.status(500).json({ error: 'Failed to fetch your quotes' });
  }
});

module.exports = router;
