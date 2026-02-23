/**
 * JSON API — /api/v1/scan
 *
 * GET /api/v1/scan?url=https://example.com
 *
 * Returns the full ScanResult as JSON with CORS headers.
 * No auth required. Rate-limited by Cloudflare at the edge.
 *
 * Example:
 *   curl "https://scanner.v1be.codes/api/v1/scan?url=https://stripe.com"
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { json } from '@remix-run/cloudflare'

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url)

  // ── CORS — allow all origins for the public API ─────────────────────────
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // ── Validate input ───────────────────────────────────────────────────────
  const rawUrl = url.searchParams.get('url')
  if (!rawUrl) {
    return json(
      { error: 'missing_url', message: 'Provide ?url=https://example.com', docs: 'https://scanner.v1be.codes' },
      { status: 400, headers: corsHeaders }
    )
  }

  let targetUrl: string
  try {
    // Accept bare domains (e.g. "stripe.com") by prepending https://
    const normalized = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
    const parsed = new URL(normalized)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol')
    targetUrl = normalized
  } catch {
    return json(
      { error: 'invalid_url', message: `Cannot parse URL: ${rawUrl}` },
      { status: 400, headers: corsHeaders }
    )
  }

  // ── Rate limiting hint (Cloudflare handles true rate limiting at edge) ───
  // We add a hint header — actual limiting is configured in CF dashboard
  const ua = request.headers.get('user-agent') ?? ''
  const isBot = /bot|crawler|spider|curl|wget|python|java/i.test(ua)

  // ── Run scan ─────────────────────────────────────────────────────────────
  try {
    const { scanUrl } = await import('../lib/scanner')
    const result = await scanUrl(targetUrl)

    // ── Optionally persist to D1 ────────────────────────────────────────
    let scanId: string | undefined
    try {
      const db = context?.cloudflare?.env?.DB as D1Database | undefined
      if (db) {
        const { saveScanToDb } = await import('../lib/db')
        scanId = await saveScanToDb(db, result)
      }
    } catch { /* non-fatal */ }

    return json(
      {
        ok: true,
        scanId,
        scanUrl: scanId ? `https://scanner.v1be.codes/scan?id=${scanId}` : undefined,
        result,
        meta: {
          version: '1',
          generatedAt: new Date().toISOString(),
          note: isBot ? 'Please be gentle — this scanner runs serverless at the edge.' : undefined,
          docs: 'https://scanner.v1be.codes',
          source: 'https://github.com/ckorhonen/ai-agent-scanner',
        },
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300, s-maxage=300',  // 5-min cache
        },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json(
      { error: 'scan_failed', message, url: targetUrl },
      { status: 500, headers: corsHeaders }
    )
  }
}
