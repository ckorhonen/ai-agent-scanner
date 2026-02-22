export function analyzeUsability(html: string): number {
  let score = 30
  const doc = html.toLowerCase()

  // Forms: check for label/input pairing
  const inputCount = (html.match(/<input/gi) || []).length
  const labelCount = (html.match(/<label/gi) || []).length
  if (inputCount > 0 && labelCount < inputCount * 0.5) score -= 8

  // Semantic buttons vs div/span onclick
  const divOnclick = (html.match(/div[^>]*onclick/gi) || []).length
  const spanOnclick = (html.match(/span[^>]*onclick/gi) || []).length
  if (divOnclick + spanOnclick > 3) score -= 5

  // CAPTCHA penalty
  if (doc.includes('captcha') || doc.includes('recaptcha')) score -= 5

  // Login wall without clear flow
  if (doc.includes('login') && !doc.includes('signup') && !doc.includes('register')) {
    score -= 3
  }

  // Infinite scroll without pagination  
  if (doc.includes('infinite') && !html.match(/pagination|page=\d/i)) score -= 4

  return Math.max(0, score)
}
