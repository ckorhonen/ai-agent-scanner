import type { CheckResult } from '../types'

export function analyzeSemantic(html: string): { score: number; checks: CheckResult[] } {
  const checks: CheckResult[] = []
  let score = 20
  const doc = html.toLowerCase()

  // ── Language attribute ────────────────────────────────────────────────────
  const hasLang = /html[^>]+lang=["'][a-z]/i.test(html)
  if (!hasLang) score -= 2
  checks.push({
    name: 'Language attribute (lang="…")',
    passed: hasLang,
    impact: 'medium',
    detail: hasLang
      ? 'lang attribute found on <html> — NLP models correctly identify language'
      : 'No lang attribute on <html> — language models must guess the language',
    fix: hasLang ? undefined : 'Add lang="en" (or the appropriate language code) to your <html> element',
    example: hasLang ? undefined : `<html lang="en">`,
  })

  // ── Semantic HTML5 landmarks ──────────────────────────────────────────────
  const landmarks = ['<header', '<main', '<footer', '<article', '<section', '<nav', '<aside']
  const foundLandmarks = landmarks.filter(t => doc.includes(t))
  const landmarkPassed = foundLandmarks.length >= 5
  if (foundLandmarks.length < 3) score -= 6
  else if (foundLandmarks.length < 5) score -= 3
  checks.push({
    name: 'Semantic HTML5 landmark elements',
    passed: landmarkPassed,
    impact: 'high',
    detail: foundLandmarks.length === 0
      ? 'No semantic landmark elements found — agents see undifferentiated content'
      : `${foundLandmarks.length}/7 landmarks: ${foundLandmarks.map(t => `<${t.slice(1)}`).join(', ')}`,
    fix: landmarkPassed ? undefined : `Missing: ${landmarks.filter(t => !foundLandmarks.includes(t)).map(t => `<${t.slice(1)}`).join(', ')}`,
    example: landmarkPassed ? undefined :
`<body>
  <header>Site name, logo, top nav</header>
  <nav aria-label="Main navigation">…</nav>
  <main>
    <article>Primary page content</article>
    <aside>Related content, ads</aside>
  </main>
  <footer>Contact, legal, social links</footer>
</body>`,
  })

  // ── H1 presence ──────────────────────────────────────────────────────────
  const hasH1 = doc.includes('<h1')
  if (!hasH1) score -= 3
  checks.push({
    name: 'Single <h1> heading',
    passed: hasH1,
    impact: 'high',
    detail: hasH1
      ? '<h1> found — agents immediately understand the page topic'
      : 'No <h1> — the first thing agents read to understand a page is missing',
    fix: hasH1 ? undefined : 'Add exactly one <h1> clearly describing the page\'s purpose',
    example: hasH1 ? undefined : '<h1>Product Catalog — Shop 10,000+ items</h1>',
  })

  // ── Heading hierarchy ─────────────────────────────────────────────────────
  const hasH2 = doc.includes('<h2')
  if (!hasH2) score -= 2
  checks.push({
    name: 'Heading hierarchy (h1 → h2 → h3)',
    passed: hasH1 && hasH2,
    impact: 'medium',
    detail: !hasH1
      ? 'No headings at all — agents cannot navigate content sections'
      : !hasH2
        ? 'Only h1 found — use h2 for section titles, h3 for subsections'
        : 'Heading hierarchy present — agents can navigate section by section',
    fix: hasH2 ? undefined : 'Use h2 for section titles and h3 for sub-sections',
  })

  // ── Div ratio ────────────────────────────────────────────────────────────
  const divCount = (html.match(/<div/gi) || []).length
  const totalTags = (html.match(/<[a-z]/gi) || []).length
  const divRatio = divCount / (totalTags || 1)
  const divPassed = divRatio <= 0.45
  if (!divPassed) score -= 5
  checks.push({
    name: 'Low div-soup ratio',
    passed: divPassed,
    impact: 'medium',
    detail: `<div> elements are ${Math.round(divRatio * 100)}% of all tags (target: ≤45%)`,
    fix: divPassed
      ? undefined
      : 'Replace generic <div> wrappers with <section>, <article>, <aside>, <nav>, <header>, <footer>',
  })

  // ── ARIA roles ────────────────────────────────────────────────────────────
  const ariaRoleCount = (html.match(/\brole=["'][a-z]/gi) || []).length
  const ariaLabelCount = (html.match(/\baria-label(ledby)?=["']/gi) || []).length
  const ariaTotal = ariaRoleCount + ariaLabelCount
  const ariaPassed = ariaTotal >= 3
  if (!ariaPassed) score -= 2
  checks.push({
    name: 'ARIA roles and labels',
    passed: ariaPassed,
    impact: 'medium',
    detail: ariaTotal === 0
      ? 'No ARIA roles or aria-label attributes found'
      : `${ariaRoleCount} role attribute(s), ${ariaLabelCount} aria-label(ledby) attribute(s)`,
    fix: ariaPassed ? undefined : 'Add role="navigation", aria-label="…", and aria-labelledby to interactive elements',
    example: ariaPassed ? undefined :
`<!-- Landmark roles -->
<nav role="navigation" aria-label="Main menu">…</nav>
<main role="main">…</main>

<!-- Interactive elements -->
<button aria-label="Close dialog">×</button>
<div role="tablist" aria-label="Account sections">…</div>`,
  })

  // ── Layout tables ─────────────────────────────────────────────────────────
  const tables = (html.match(/<table/gi) || []).length
  const markedPresentational = (html.match(/role=["'](presentation|none)["']/gi) || []).length
  const tablePassed = tables <= 2 || markedPresentational > 0
  if (!tablePassed) score -= 1
  checks.push({
    name: 'Tables used for data, not layout',
    passed: tablePassed,
    impact: 'low',
    detail: tables === 0
      ? 'No tables found'
      : `${tables} table(s) — ${markedPresentational > 0 ? 'layout tables marked correctly' : 'verify these are data tables, not layout'}`,
    fix: tablePassed ? undefined : 'Add role="presentation" to layout tables, or use CSS Grid instead',
  })

  return { score: Math.max(0, score), checks }
}
