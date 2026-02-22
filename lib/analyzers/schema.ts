export function analyzeStructuredData(html: string): { score: number; types: string[] } {
  let score = 0
  const types: string[] = []

  // JSON-LD blocks
  const jsonLdMatches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of jsonLdMatches) {
    try {
      const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
      const data = JSON.parse(content)
      const schemaType = (data['@type'] || data.type || 'Unknown') as string
      types.push(schemaType)
      score += 5
    } catch {}
  }

  // Microdata
  const microdataTypes = (html.match(/itemtype="[^"]+"/gi) || [])
  if (microdataTypes.length > 0) {
    score += 3
    const typeNames = microdataTypes.map(t => t.replace(/itemtype="|"/g, '').split('/').pop() || '?')
    types.push(...typeNames)
  }

  // Completeness bonus: more types = better
  if (types.length >= 3) score += 5
  else if (types.length >= 1) score += 2

  return { score: Math.min(15, score), types }
}
