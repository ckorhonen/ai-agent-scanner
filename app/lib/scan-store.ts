/**
 * Persistent scan result storage via Cloudflare KV.
 * Gives every scan a shareable URL with a 7-day TTL.
 */

import type { ScanResult } from './types'

const TTL_SECONDS = 60 * 60 * 24 * 7  // 7 days

/** Generate a random 8-char alphanumeric ID */
function nanoid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  // crypto.getRandomValues is available in CF Workers
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  for (const b of bytes) id += chars[b % chars.length]
  return id
}

export type StoredScan = {
  id: string
  results: ScanResult[]
  createdAt: number
}

/** Save scan results to KV, returns the shareable ID */
export async function saveScan(kv: KVNamespace, results: ScanResult[]): Promise<string> {
  const id = nanoid()
  const data: StoredScan = { id, results, createdAt: Date.now() }
  await kv.put(`scan:${id}`, JSON.stringify(data), { expirationTtl: TTL_SECONDS })
  return id
}

/** Load scan results from KV by ID, returns null if not found/expired */
export async function loadScan(kv: KVNamespace, id: string): Promise<StoredScan | null> {
  // Sanitise: only alphanumeric IDs
  if (!/^[A-Za-z0-9]{6,12}$/.test(id)) return null
  const raw = await kv.get(`scan:${id}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredScan
  } catch {
    return null
  }
}
