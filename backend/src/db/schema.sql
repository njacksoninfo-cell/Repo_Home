-- Driver Intercom — PostgreSQL schema
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
