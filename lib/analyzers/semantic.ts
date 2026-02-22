export function analyzeSemantic(html: string): number {
  let score = 20
  const doc = html.toLowerCase()

  // Semantic HTML5 tags
  const semanticTags = ['<header', '<main', '<footer', '<article', '<section', '<nav', '<aside']
  const found = semanticTags.filter(t => doc.includes(t)).length
  if (found < 3) score -= 6
  else if (found < 5) score -= 3

  // Heading hierarchy
  const hasH1 = doc.includes('<h1')
  const hasH2 = doc.includes('<h2')
  if (!hasH1) score -= 4
  if (!hasH2) score -= 2

  // Div soup detection
  const divCount = (html.match(/<div/gi) || []).length
  const totalTags = (html.match(/<[a-z]/gi) || []).length
  const divRatio = divCount / (totalTags || 1)
  if (divRatio > 0.5) score -= 5

  // Tables for layout (non-data tables)
  const tables = (html.match(/<table/gi) || []).length
  const tdRole = (html.match(/role="(grid|presentation)"/gi) || []).length
  if (tables > 2 && tdRole === 0) score -= 3

  return Math.max(0, score)
}
