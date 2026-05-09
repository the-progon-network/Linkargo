-- ╔══════════════════════════════════════════════════════╗
-- ║          LINKARGO DATABASE SCHEMA v1.0               ║
-- ║   Run this file once to set up your entire database  ║
-- ╚══════════════════════════════════════════════════════╝

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS TABLE ─────────────────────────────────────────
-- Stores both shippers and carriers
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('shipper', 'carrier')),
  name            VARCHAR(255) NOT NULL,
  phone           VARCHAR(50),
  company_name    VARCHAR(255),          -- for shippers
  vehicle_type    VARCHAR(100),          -- for carriers
  license_plate   VARCHAR(50),           -- for carriers
  verified        BOOLEAN DEFAULT FALSE,
  rating          NUMERIC(3,2) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  is_online       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOBS TABLE ──────────────────────────────────────────
-- Every load posted by a shipper
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipper_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_city     VARCHAR(100) NOT NULL,
  pickup_address  VARCHAR(255),
  dropoff_city    VARCHAR(100) NOT NULL,
  dropoff_address VARCHAR(255),
  goods_type      VARCHAR(100) NOT NULL,
  weight_kg       NUMERIC(10,2) NOT NULL,
  description     TEXT,
  vehicle_type    VARCHAR(100) NOT NULL,
  required_date   DATE NOT NULL,
  addons          TEXT[],                 -- array of addon strings
  budget_min      NUMERIC(12,2),
  budget_max      NUMERIC(12,2),
  status          VARCHAR(30) DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  accepted_quote_id UUID,                 -- set when shipper accepts a quote
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUOTES TABLE ────────────────────────────────────────
-- Carrier bids on a job
CREATE TABLE IF NOT EXISTS quotes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  carrier_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  eta_hours       INTEGER,
  note            TEXT,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, carrier_id)              -- one quote per carrier per job
);

-- ── MESSAGES TABLE ──────────────────────────────────────
-- Chat between shipper and carrier on a job
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVIEWS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id),
  reviewer_id     UUID NOT NULL REFERENCES users(id),
  reviewee_id     UUID NOT NULL REFERENCES users(id),
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, reviewer_id)
);

-- ── INDEXES ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_shipper    ON jobs(shipper_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status     ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_vehicle    ON jobs(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_quotes_job      ON quotes(job_id);
CREATE INDEX IF NOT EXISTS idx_quotes_carrier  ON quotes(carrier_id);
CREATE INDEX IF NOT EXISTS idx_messages_job    ON messages(job_id);

-- ── AUTO-UPDATE updated_at ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_jobs_updated
  BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_quotes_updated
  BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
