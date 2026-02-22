import type { CheckResult } from '../types'

export function analyzeStructuredData(html: string): { score: number; checks: CheckResult[]; types: string[] } {
  const checks: CheckResult[] = []
  const types: string[] = []
  let score = 0

  // ── JSON-LD blocks ────────────────────────────────────────────────────────
  const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  let validJsonLd = 0

  for (const block of jsonLdMatches) {
    try {
      const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
      const data = JSON.parse(content)
      const schemaType = (data['@type'] || data.type || 'Unknown') as string
      types.push(schemaType)
      validJsonLd++
      score += 5
    } catch {}
  }

  const jsonLdPassed = validJsonLd > 0
  checks.push({
    name: 'JSON-LD structured data',
    passed: jsonLdPassed,
    impact: 'high',
    detail: validJsonLd === 0
      ? 'No valid JSON-LD blocks found'
      : `${validJsonLd} JSON-LD block(s): ${types.slice(0, 3).join(', ')}`,
    fix: jsonLdPassed ? undefined : 'Add a JSON-LD <script> block in <head> describing your page content',
    example: jsonLdPassed ? undefined :
`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "My Site",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://example.com/search?q={query}",
    "query-input": "required name=query"
  }
}
</script>`,
  })

  // ── Microdata ─────────────────────────────────────────────────────────────
  const microdataItems = (html.match(/itemtype=["'][^"']+["']/gi) || [])
  const microdataPassed = microdataItems.length > 0
  if (microdataPassed) {
    score += 3
    const mdTypes = microdataItems.map(t =>
      t.replace(/itemtype=["']/, '').replace(/["']$/, '').split('/').pop() ?? '?'
    )
    types.push(...mdTypes)
  }
  checks.push({
    name: 'Microdata (itemscope/itemtype)',
    passed: microdataPassed,
    impact: 'medium',
    detail: microdataPassed
      ? `${microdataItems.length} microdata type(s): ${microdataItems.slice(0, 2).map(t => t.split('/').pop()?.replace(/["']/, '')).join(', ')}`
      : 'No microdata found (less preferred than JSON-LD, but valid)',
    fix: microdataPassed || jsonLdPassed ? undefined : 'Prefer JSON-LD over microdata for new implementations',
  })

  // ── Type coverage ────────────────────────────────────────────────────────
  const richTypes = ['Product', 'Article', 'FAQPage', 'HowTo', 'SearchAction', 'BreadcrumbList', 'Organization', 'WebSite']
  const foundRich = richTypes.filter(t => types.some(found => found.includes(t)))
  const richPassed = foundRich.length > 0
  if (types.length >= 3) score += 5
  else if (types.length >= 1) score += 2
  checks.push({
    name: 'Rich schema types (Product, FAQ, SearchAction…)',
    passed: richPassed,
    impact: 'medium',
    detail: foundRich.length > 0
      ? `Rich types found: ${foundRich.join(', ')}`
      : `Only basic types found: ${types.slice(0, 3).join(', ') || 'none'}`,
    fix: richPassed ? undefined : `Add high-value types like SearchAction, FAQPage, or BreadcrumbList to help agents navigate your content`,
    example: richPassed ? undefined :
`{
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How do I use the API?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Send a POST request to /api/v1/..."
    }
  }]
}`,
  })

  return { score: Math.min(15, score), checks, types }
}
