-- AI Agent Scanner — D1 schema
-- Run: npx wrangler d1 execute scanner-results --file=migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS scans (
  id          TEXT PRIMARY KEY,          -- nanoid (8 chars)
  url         TEXT NOT NULL,
  domain      TEXT NOT NULL,             -- extracted hostname
  score       INTEGER NOT NULL,          -- 0-100
  grade       TEXT NOT NULL,             -- A/B/C/D/F
  level       INTEGER NOT NULL,          -- 1-5
  level_name  TEXT NOT NULL,
  scores_json TEXT NOT NULL,             -- JSON: CategoryScores
  result_json TEXT NOT NULL,             -- full ScanResult JSON
  created_at  INTEGER NOT NULL           -- Unix ms timestamp
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scans_score ON scans(score DESC);
CREATE INDEX IF NOT EXISTS idx_scans_domain ON scans(domain);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);

-- One row per domain, kept up to date (upsert)
CREATE TABLE IF NOT EXISTS domain_best (
  domain      TEXT PRIMARY KEY,
  scan_id     TEXT NOT NULL,
  score       INTEGER NOT NULL,
  grade       TEXT NOT NULL,
  level       INTEGER NOT NULL,
  level_name  TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_domain_best_score ON domain_best(score DESC);
