import type { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { scanUrl } from '../lib/scanner'

// Color scale matching the site's grade palette
function gradeColor(score: number): string {
  if (score >= 90) return '#3b82f6'  // blue  — AI-Native
  if (score >= 75) return '#22c55e'  // green — Operable
  if (score >= 60) return '#eab308'  // yellow — Discoverable
  if (score >= 40) return '#f97316'  // orange — Crawlable
  return '#ef4444'                   // red   — Invisible
}

function letterGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function makeSvg(score: number | null, domain: string): string {
  const label = 'AI Ready'
  const value = score !== null ? `${score}/100 ${letterGrade(score)}` : 'error'
  const color = score !== null ? gradeColor(score) : '#6b7280'

  // Approximate character widths for layout
  const labelWidth = label.length * 6.5 + 12
  const valueWidth = value.length * 6.5 + 12
  const totalWidth = Math.round(labelWidth + valueWidth)
  const height = 20
  const labelX = Math.round(labelWidth / 2)
  const valueX = Math.round(labelWidth + valueWidth / 2)

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${height}" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value} — ${domain}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${Math.round(labelWidth)}" height="${height}" fill="#555"/>
    <rect x="${Math.round(labelWidth)}" width="${Math.round(valueWidth)}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelX}" y="15" fill="#010101" fill-opacity=".3" aria-hidden="true">${label}</text>
    <text x="${labelX}" y="14">${label}</text>
    <text x="${valueX}" y="15" fill="#010101" fill-opacity=".3" aria-hidden="true">${value}</text>
    <text x="${valueX}" y="14">${value}</text>
  </g>
</svg>`
}

export async function loader({ params }: LoaderFunctionArgs) {
  const domain = params.domain ?? ''

  if (!domain || domain.includes(' ')) {
    return new Response(makeSvg(null, domain), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
    })
  }

  // Normalise: add https:// if missing
  const url = domain.startsWith('http') ? domain : `https://${domain}`

  try {
    const result = await scanUrl(url)
    const score = result.overall ?? 0

    return new Response(makeSvg(score, domain), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',  // cache 24h
        'X-Score': String(score),
      },
    })
  } catch {
    return new Response(makeSvg(null, domain), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
    })
  }
}
