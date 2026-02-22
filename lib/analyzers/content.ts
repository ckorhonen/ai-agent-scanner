export function analyzeContent(html: string): number {
  let score = 5

  // Images without alt text
  const imgTotal = (html.match(/<img/gi) || []).length
  const imgWithAlt = (html.match(/<img[^>]+alt="[^"]+"/gi) || []).length
  if (imgTotal > 0) {
    const altRatio = imgWithAlt / imgTotal
    if (altRatio < 0.5) score -= 3
    else if (altRatio < 0.8) score -= 1
  }

  // Text vs media ratio
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length
  if (textContent < 500) score -= 2

  return Math.max(0, score)
}
