/**
 * D1 database helpers for scanner results.
 *
 * Schema: see migrations/0001_init.sql
 */

import type { ScanResult } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ScanRow {
  id: string
  url: string
  domain: string
  score: number
  grade: string
  level: number
  level_name: string
  scores_json: string
  result_json: string
  created_at: number
}

export interface LeaderboardEntry {
  domain: string
  scan_id: string
  score: number
  grade: string
  level: number
  level_name: string
  updated_at: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function nanoid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let id = ''
  for (const b of bytes) id += chars[b % chars.length]
  return id
}

// ─────────────────────────────────────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist a scan result to D1.
 * Also upserts domain_best if this is the highest score for the domain.
 * Returns the generated scan ID.
 */
export async function saveScanToDb(db: D1Database, result: ScanResult): Promise<string> {
  const id = nanoid()
  let domain = result.url
  try { domain = new URL(result.url).hostname } catch {}

  const now = Date.now()

  await db.batch([
    // Insert full scan record
    db.prepare(
      `INSERT INTO scans (id, url, domain, score, grade, level, level_name, scores_json, result_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      result.url,
      domain,
      result.overall,
      result.grade,
      result.level.level,
      result.level.label,
      JSON.stringify(result.scores),
      JSON.stringify(result),
      now
    ),

    // Upsert domain_best (only update if score is higher)
    db.prepare(
      `INSERT INTO domain_best (domain, scan_id, score, grade, level, level_name, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(domain) DO UPDATE SET
         scan_id    = CASE WHEN excluded.score > score THEN excluded.scan_id    ELSE scan_id    END,
         score      = CASE WHEN excluded.score > score THEN excluded.score      ELSE score      END,
         grade      = CASE WHEN excluded.score > score THEN excluded.grade      ELSE grade      END,
         level      = CASE WHEN excluded.score > score THEN excluded.level      ELSE level      END,
         level_name = CASE WHEN excluded.score > score THEN excluded.level_name ELSE level_name END,
         updated_at = CASE WHEN excluded.score > score THEN excluded.updated_at ELSE updated_at END`
    ).bind(
      domain,
      id,
      result.overall,
      result.grade,
      result.level.level,
      result.level.label,
      now
    ),
  ])

  return id
}

// ─────────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load a full ScanResult by ID.
 */
export async function getScanFromDb(db: D1Database, id: string): Promise<ScanResult | null> {
  if (!/^[A-Za-z0-9]{6,12}$/.test(id)) return null
  const row = await db.prepare(
    `SELECT result_json FROM scans WHERE id = ?`
  ).bind(id).first<{ result_json: string }>()
  if (!row) return null
  try { return JSON.parse(row.result_json) as ScanResult } catch { return null }
}

/**
 * Get leaderboard: top N unique domains by best score.
 */
export async function getLeaderboard(
  db: D1Database,
  limit = 50
): Promise<LeaderboardEntry[]> {
  const { results } = await db.prepare(
    `SELECT domain, scan_id, score, grade, level, level_name, updated_at
     FROM domain_best
     ORDER BY score DESC
     LIMIT ?`
  ).bind(limit).all<LeaderboardEntry>()
  return results
}

/**
 * Get recent scans (for a "Recent activity" feed).
 */
export async function getRecentScans(
  db: D1Database,
  limit = 20
): Promise<ScanRow[]> {
  const { results } = await db.prepare(
    `SELECT id, url, domain, score, grade, level, level_name, created_at
     FROM scans
     ORDER BY created_at DESC
     LIMIT ?`
  ).bind(limit).all<ScanRow>()
  return results
}
