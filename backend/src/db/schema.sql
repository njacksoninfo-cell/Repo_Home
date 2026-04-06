-- Proximity — PostgreSQL schema
-- Only persistent (social graph) data lives here.
-- Live session state lives in Redis.

CREATE TABLE IF NOT EXISTS drive_encounters (
  id               BIGSERIAL PRIMARY KEY,
  session_id       TEXT NOT NULL,
  encountered_id   TEXT NOT NULL,
  room_id          TEXT NOT NULL,
  started_at       BIGINT NOT NULL,       -- unix ms
  ended_at         BIGINT,                -- unix ms, NULL if still ongoing
  duration_seconds INT NOT NULL DEFAULT 0,

  -- Index for "who have I encountered?" lookups
  CONSTRAINT uq_encounter UNIQUE (session_id, encountered_id, started_at)
);

CREATE INDEX IF NOT EXISTS idx_enc_session    ON drive_encounters (session_id);
CREATE INDEX IF NOT EXISTS idx_enc_encountered ON drive_encounters (encountered_id);
CREATE INDEX IF NOT EXISTS idx_enc_started     ON drive_encounters (started_at);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waves (
  id             BIGSERIAL PRIMARY KEY,
  from_session   TEXT NOT NULL,
  to_session     TEXT NOT NULL,
  sent_at        BIGINT NOT NULL,         -- unix ms

  CONSTRAINT uq_wave UNIQUE (from_session, to_session)
);

CREATE INDEX IF NOT EXISTS idx_wave_to ON waves (to_session);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS connections (
  id            BIGSERIAL PRIMARY KEY,
  session_a     TEXT NOT NULL,
  session_b     TEXT NOT NULL,
  connected_at  BIGINT NOT NULL,          -- unix ms
  wave_count    INT NOT NULL DEFAULT 1,

  -- Canonical order: session_a < session_b (enforced by app layer)
  CONSTRAINT uq_connection UNIQUE (session_a, session_b)
);

CREATE INDEX IF NOT EXISTS idx_conn_a ON connections (session_a);
CREATE INDEX IF NOT EXISTS idx_conn_b ON connections (session_b);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS abuse_reports (
  id              BIGSERIAL PRIMARY KEY,
  reporter_id     TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  reason          TEXT,
  reported_at     BIGINT NOT NULL          -- unix ms
);

CREATE INDEX IF NOT EXISTS idx_report_target ON abuse_reports (target_id, reported_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Subscriptions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  session_id   TEXT PRIMARY KEY,
  tier         TEXT NOT NULL DEFAULT 'free',   -- 'free' | 'pro' | 'fleet'
  platform     TEXT,                            -- 'ios' | 'android' | 'web'
  product_id   TEXT,
  receipt_data TEXT,                            -- raw receipt for server-side validation
  expires_at   BIGINT,                          -- unix ms, NULL = active indefinitely
  created_at   BIGINT NOT NULL,
  updated_at   BIGINT NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Fleets / Car Clubs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fleets (
  id              TEXT PRIMARY KEY,             -- uuid
  name            TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL DEFAULT 'car_club',  -- 'car_club' | 'fleet_business'
  admin_session   TEXT NOT NULL,
  invite_code     TEXT NOT NULL UNIQUE,
  room_id         TEXT NOT NULL UNIQUE,         -- persistent LiveKit room
  created_at      BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fleet_admin   ON fleets (admin_session);
CREATE INDEX IF NOT EXISTS idx_fleet_invite  ON fleets (invite_code);

CREATE TABLE IF NOT EXISTS fleet_members (
  fleet_id    TEXT NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',   -- 'admin' | 'member'
  joined_at   BIGINT NOT NULL,
  PRIMARY KEY (fleet_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_members_session ON fleet_members (session_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Ad impressions (lightweight analytics)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ad_impressions (
  id            BIGSERIAL PRIMARY KEY,
  session_id    TEXT NOT NULL,
  ad_id         TEXT NOT NULL,
  advertiser    TEXT NOT NULL,
  category      TEXT NOT NULL,
  shown_at      BIGINT NOT NULL,
  clicked       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ad_session ON ad_impressions (session_id, shown_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Insurance leads
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurance_leads (
  id            BIGSERIAL PRIMARY KEY,
  session_id    TEXT NOT NULL,
  vehicle_json  JSONB NOT NULL,
  zip_code      TEXT,
  partner       TEXT NOT NULL,
  submitted_at  BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_session ON insurance_leads (session_id);
