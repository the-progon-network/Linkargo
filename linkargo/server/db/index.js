const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Run this once: node db/setup.js
async function setup() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Database schema created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) setup();

module.exports = pool;
