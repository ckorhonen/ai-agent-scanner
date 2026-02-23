import type { CategoryScores, CategoryDetail, Grade, Recommendation, ReadinessLevel } from './types'

export function calculateGrade(score: number): Grade {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export function calculateOverall(scores: CategoryScores): number {
  return Math.round(
    scores.usability +
    scores.webmcp +
    scores.semantic +
    scores.structured +
    scores.crawlability +
    scores.content
  )
}

// ── Readiness Level System ─────────────────────────────────────────────────
// Five levels of AI agent readiness — from invisible to AI-native

export function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 80) return {
    level: 5,
    label: 'AI-Native',
    emoji: '🔵',
    color: '#3b82f6',
    description: 'Fully optimised for AI agents — WebMCP, llms.txt, semantic HTML, structured data.',
  }
  if (score >= 60) return {
    level: 4,
    label: 'Operable',
    emoji: '🟢',
    color: '#22c55e',
    description: 'AI agents can discover, read, and take actions on your site.',
  }
  if (score >= 40) return {
    level: 3,
    label: 'Discoverable',
    emoji: '🟡',
    color: '#eab308',
    description: 'Agents can understand your content but cannot perform actions.',
  }
  if (score >= 20) return {
    level: 2,
    label: 'Crawlable',
    emoji: '🟠',
    color: '#f97316',
    description: 'Agents can read your text but struggle to understand structure.',
  }
  return {
    level: 1,
    label: 'Invisible',
    emoji: '🔴',
    color: '#ef4444',
    description: 'AI agents cannot meaningfully access or understand this site.',
  }
}

// ── Natural Language Summary ───────────────────────────────────────────────

export function generateSummary(
  url: string,
  score: number,
  level: ReadinessLevel,
  scores: CategoryScores,
  details: CategoryDetail[],
): string {
  let hostname = url
  try { hostname = new URL(url).hostname } catch {}

  const biggestGap = Object.entries(scores)
    .map(([cat, val]) => {
      const d = details.find(d => d.category === cat)
      const max = d?.max ?? 10
      return { cat, gap: max - val, pct: val / max }
    })
    .sort((a, b) => b.gap - a.gap)[0]

  const catLabels: Record<string, string> = {
    usability: 'agent usability',
    webmcp: 'WebMCP support',
    semantic: 'semantic HTML',
    structured: 'structured data',
    crawlability: 'AI discoverability',
    content: 'content quality',
  }

  const gapLabel = catLabels[biggestGap?.cat] ?? 'overall readiness'

  if (level.level === 5) {
    return `${hostname} is in the top tier for AI agent readiness. You support all the key standards — WebMCP, structured data, semantic HTML. Keep your llms.txt current as the standard evolves.`
  }
  if (level.level === 4) {
    return `${hostname} works well with AI agents. Your forms are accessible and your content is well-structured. Adding WebMCP support would push you into the AI-native tier — the top ${scores.webmcp < 5 ? '3%' : '10%'} of the web.`
  }
  if (level.level === 3) {
    return `${hostname} is discoverable by AI agents but they can't take actions on your site. Your biggest opportunity is ${gapLabel} — improving this alone could push you to Level 4 (Operable).`
  }
  if (level.level === 2) {
    return `AI agents can read ${hostname} but struggle to understand its structure. Semantic HTML and structured data would give agents the context they need. Focus on ${gapLabel} first.`
  }
  return `AI agents have significant difficulty with ${hostname}. Start with the basics: unblock AI crawlers in robots.txt, add semantic HTML landmarks, and create a JSON-LD block describing your site.`
}

// ── Recommendations ────────────────────────────────────────────────────────

export function generateRecommendations(
  scores: CategoryScores,
  details: CategoryDetail[]
): Recommendation[] {
  const recs: Recommendation[] = []
  const byCategory = Object.fromEntries(details.map(d => [d.category, d]))

  // ── llms.txt — highest educational value, almost nobody has it ────────────
  const llmsCheck = byCategory['crawlability']?.checks.find(c => c.name.includes('llms.txt') && !c.passed)
  if (llmsCheck) {
    recs.push({
      category: 'crawlability',
      title: 'Create llms.txt — the AI content guide',
      description: 'llms.txt is a Markdown file at your site root that gives LLMs a curated, accurate summary of your site. Over 844,000 sites have adopted it. Takes 10 minutes to create.',
      points: 1,
      effort: 'low',
      impact: 'high',
      example: llmsCheck.example,
      issues: ['No /llms.txt or /.well-known/llms.txt found'],
      steps: [
        'Create /llms.txt at your domain root',
        'Describe your site purpose in 2–3 sentences using Markdown',
        'List your 5–10 most important pages with links and descriptions',
        'Add a "Not permitted" section if you restrict AI training',
        'Reference it in robots.txt: `# See /llms.txt for AI guidance`',
      ],
    })
  }

  // ── WebMCP — highest point value, rarely implemented ─────────────────────
  if (scores.webmcp < 10) {
    const check = byCategory['webmcp']?.checks.find(c => c.name.includes('mcp-tool') && !c.passed)
    recs.push({
      category: 'webmcp',
      title: 'Implement WebMCP declarative API',
      description: 'Add mcp-tool, mcp-param, and mcp-description attributes to your forms. Chrome 146+ exposes these as callable tools for AI agents — enabling them to search, submit, and navigate without scraping.',
      points: 25 - scores.webmcp,
      effort: 'low',
      impact: 'high',
      example: check?.example,
      issues: [
        'No mcp-tool attributes found on any interactive elements',
        'No mcp-param attributes on form inputs',
        'No mcp-description context for AI agents',
      ],
      steps: [
        'Add mcp-tool="action-name" to your primary form (e.g. search, checkout)',
        'Add mcp-param="fieldName" to each input inside the form',
        'Add mcp-description="Plain English description" to the form and each param',
        'Test: open DevTools → document.querySelectorAll(\'[mcp-tool]\').length',
        'Read the spec: https://webmcp.dev',
      ],
    })
  }

  if (scores.webmcp >= 10 && scores.webmcp < 20) {
    recs.push({
      category: 'webmcp',
      title: 'Add OpenAPI spec / ai-plugin.json',
      description: 'Link to your API spec via /.well-known/ai-plugin.json so agents can discover your full API surface automatically — not just the HTML forms.',
      points: 5,
      effort: 'medium',
      impact: 'medium',
      example: `// /.well-known/ai-plugin.json
{
  "schema_version": "v1",
  "name_for_human": "My API",
  "description_for_human": "...",
  "api": {
    "type": "openapi",
    "url": "https://example.com/openapi.json"
  }
}`,
      issues: ['No /.well-known/ai-plugin.json or OpenAPI spec reference found'],
      steps: [
        'Create /.well-known/ai-plugin.json with your API metadata',
        'Write or generate an OpenAPI 3.0 spec for your main endpoints',
        'Host the spec at /openapi.json',
        'Add <link rel="ai-plugin" href="/.well-known/ai-plugin.json"> to <head>',
        'Test: curl https://yoursite.com/.well-known/ai-plugin.json',
      ],
    })
  }

  // ── Structured data — high ROI ─────────────────────────────────────────────
  if (scores.structured < 8) {
    const check = byCategory['structured']?.checks.find(c => c.name.includes('JSON-LD') && !c.passed)
    recs.push({
      category: 'structured',
      title: 'Add JSON-LD structured data',
      description: 'JSON-LD lets agents instantly understand your content type. A WebSite + SearchAction block is the minimum; add Product, FAQPage, or Article for richer context.',
      points: 15 - scores.structured,
      effort: 'low',
      impact: 'high',
      example: check?.example,
      issues: [
        'No JSON-LD <script type="application/ld+json"> blocks found',
        'No microdata or RDFa structured data detected',
      ],
      steps: [
        'Add a <script type="application/ld+json"> block in your <head>',
        'Start with WebSite + SearchAction schema (covers most homepage use cases)',
        'Add Organization schema with contact info and social profiles',
        'For content pages: add Article, Product, or FAQPage as appropriate',
        'Validate: https://search.google.com/test/rich-results',
      ],
    })
  }

  // ── HTTPS ──────────────────────────────────────────────────────────────────
  const httpsCheck = byCategory['crawlability']?.checks.find(c => c.name.includes('HTTPS') && !c.passed)
  if (httpsCheck) {
    recs.push({
      category: 'crawlability',
      title: 'Enable HTTPS',
      description: 'Most AI agents reject HTTP-only sites. HTTPS is a baseline requirement for agent access — and it\'s free via Let\'s Encrypt.',
      points: 1,
      effort: 'low',
      impact: 'high',
      issues: ['Site is served over HTTP (not HTTPS)'],
      steps: [
        'Get a free TLS certificate from Let\'s Encrypt via Certbot',
        'Enable HTTPS on your web server (nginx/Apache config)',
        'Add HSTS header: Strict-Transport-Security: max-age=31536000',
        'Set up HTTP → HTTPS redirect (301)',
        'Update all internal links to use https://',
      ],
    })
  }

  // ── Form labels ────────────────────────────────────────────────────────────
  const labelCheck = byCategory['usability']?.checks.find(c => c.name.includes('labels') && !c.passed)
  if (labelCheck) {
    recs.push({
      category: 'usability',
      title: 'Add labels to all form inputs',
      description: 'Every <input> needs an associated <label>. Agents use labels to understand what data a field expects — unlabeled inputs are indistinguishable to an agent.',
      points: 8,
      effort: 'low',
      impact: 'high',
      example: labelCheck.example,
      issues: [labelCheck.detail],
      steps: [
        'Add a unique id to every <input> (e.g. id="email")',
        'Add <label for="email">Email address</label> before each input',
        'For icon-only inputs, use aria-label="..." instead',
        'For grouped radio/checkbox, wrap in <fieldset> + <legend>',
        'Test with: document.querySelectorAll(\'input:not([id])\')',
      ],
    })
  }

  // ── CAPTCHA ────────────────────────────────────────────────────────────────
  const captchaCheck = byCategory['usability']?.checks.find(c => c.name.includes('CAPTCHA') && !c.passed)
  if (captchaCheck) {
    recs.push({
      category: 'usability',
      title: 'Remove CAPTCHA from agent-accessible flows',
      description: 'CAPTCHAs block AI agents completely. Use honeypot fields, server-side rate limiting, or API keys instead — and expose a CAPTCHA-free endpoint for agent access.',
      points: 5,
      effort: 'medium',
      impact: 'high',
      issues: ['CAPTCHA detected on primary form — blocks all AI agents'],
      steps: [
        'Add a honeypot field (hidden input that bots fill but humans ignore)',
        'Implement server-side rate limiting per IP/session instead',
        'Create a separate API endpoint with token auth for agent access',
        'Consider Cloudflare Turnstile (CAPTCHA-free bot detection)',
        'If you must keep CAPTCHA, expose a bypass key for trusted agents',
      ],
    })
  }

  // ── Semantic HTML ──────────────────────────────────────────────────────────
  if (scores.semantic < 12) {
    const landmarkCheck = byCategory['semantic']?.checks.find(c => c.name.includes('landmark') && !c.passed)
    const failedChecks = byCategory['semantic']?.checks.filter(c => !c.passed) ?? []
    recs.push({
      category: 'semantic',
      title: 'Add semantic HTML5 landmark elements',
      description: 'Replace generic <div> wrappers with <header>, <main>, <nav>, <article>, <section>, <aside>, <footer>. Agents navigate by these landmarks — without them they\'re in an unlabelled maze.',
      points: 20 - scores.semantic,
      effort: 'medium',
      impact: 'medium',
      example: landmarkCheck?.example,
      issues: failedChecks.map(c => c.detail),
      steps: [
        'Wrap your page header in <header>, footer in <footer>',
        'Wrap your primary content in <main> (only one per page)',
        'Wrap navigation links in <nav>',
        'Use <article> for self-contained content (blog posts, cards)',
        'Replace decorative <div> containers with <section> where appropriate',
      ],
    })
  }

  // ── H1 ─────────────────────────────────────────────────────────────────────
  const h1Check = byCategory['semantic']?.checks.find(c => c.name.includes('<h1>') && !c.passed)
  if (h1Check) {
    recs.push({
      category: 'semantic',
      title: 'Add a descriptive <h1> heading',
      description: 'The <h1> is the first thing agents read. It should clearly describe the page\'s purpose — a good <h1> is the fastest way to help agents understand what you do.',
      points: 3,
      effort: 'low',
      impact: 'high',
      example: h1Check.example,
      issues: [h1Check.detail],
      steps: [
        'Add exactly one <h1> per page (multiple h1s confuse agents)',
        'Make it descriptive: "Acme Invoice Automation" not "Welcome"',
        'Place it near the top of <main>',
        'Don\'t hide it — visible h1 is both good SEO and good for agents',
      ],
    })
  }

  // ── Language attribute ─────────────────────────────────────────────────────
  const langCheck = byCategory['semantic']?.checks.find(c => c.name.includes('Language') && !c.passed)
  if (langCheck) {
    recs.push({
      category: 'semantic',
      title: 'Add lang attribute to <html>',
      description: 'NLP models use the lang attribute to correctly parse your content. Without it they must guess — leading to mistranslations, wrong tokenisation, and missed content.',
      points: 2,
      effort: 'low',
      impact: 'medium',
      example: langCheck.example,
      issues: ['No lang attribute on <html> element'],
      steps: [
        'Add lang="en" (or your language code) to your <html> tag',
        'For multilingual pages, add lang attributes to individual sections too',
        'Use BCP 47 codes: en, fr, de, zh-Hans, pt-BR, etc.',
      ],
    })
  }

  // ── AI crawlers ────────────────────────────────────────────────────────────
  const robotsCheck = byCategory['crawlability']?.checks.find(c => c.name.includes('robots.txt exists') && !c.passed)
  if (robotsCheck) {
    recs.push({
      category: 'crawlability',
      title: 'Create robots.txt with AI crawler allowances',
      description: 'A missing robots.txt is ambiguous. Explicitly allow GPTBot, Claude-Web, and PerplexityBot so your content appears in AI search results and LLM training data.',
      points: 1,
      effort: 'low',
      impact: 'medium',
      example: robotsCheck.example,
      issues: ['No robots.txt found at /robots.txt'],
      steps: [
        'Create /robots.txt at your domain root',
        'Add User-agent: * / Allow: / to permit all crawlers by default',
        'Explicitly add rules for GPTBot, Claude-Web, anthropic-ai',
        'Add Sitemap: https://yoursite.com/sitemap.xml at the bottom',
        'Test: curl https://yoursite.com/robots.txt',
      ],
    })
  }

  const aiBotsCheck = byCategory['crawlability']?.checks.find(c => c.name.includes('AI crawlers') && !c.passed)
  if (aiBotsCheck && !robotsCheck) {
    recs.push({
      category: 'crawlability',
      title: 'Unblock AI crawlers in robots.txt',
      description: 'GPTBot, Claude-Web, or PerplexityBot are being blocked. Your content won\'t appear in ChatGPT, Claude, or Perplexity results — significant and growing traffic loss.',
      points: 1,
      effort: 'low',
      impact: 'high',
      example: aiBotsCheck.example,
      issues: [aiBotsCheck.detail],
      steps: [
        'Open /robots.txt and find the Disallow rules blocking AI crawlers',
        'Remove or change Disallow: / to Allow: / for GPTBot, Claude-Web',
        'Optionally add explicit Allow rules for each AI crawler',
        'Test with: robots-checker.io or curl -A "GPTBot" https://yoursite.com',
      ],
    })
  }

  // ── Alt text ───────────────────────────────────────────────────────────────
  const altCheck = byCategory['content']?.checks.find(c => c.name.includes('alt text') && !c.passed)
  if (altCheck) {
    recs.push({
      category: 'content',
      title: 'Add descriptive alt text to all images',
      description: 'Agents are completely blind to images without alt text. Be specific — "Blue ceramic mug, 12oz, with lid" not "product image". Alt text is your images\' voice.',
      points: 3,
      effort: 'low',
      impact: 'medium',
      example: altCheck.example,
      issues: [altCheck.detail],
      steps: [
        'Find all <img> tags missing alt attributes: document.querySelectorAll(\'img:not([alt])\')',
        'Write descriptive alt text (what the image shows, not just "image")',
        'For decorative images, use alt="" (empty string) to skip them',
        'For complex charts/graphs, add a text summary below the image',
        'For CMS sites: make alt text a required field in your media library',
      ],
    })
  }

  // Sort: high impact low effort first, then by points
  const impactOrder = { high: 0, medium: 1, low: 2 }
  const effortOrder = { low: 0, medium: 1, high: 2 }

  return recs
    .sort((a, b) => {
      const scoreA = impactOrder[a.impact] * 3 + effortOrder[a.effort]
      const scoreB = impactOrder[b.impact] * 3 + effortOrder[b.effort]
      if (scoreA !== scoreB) return scoreA - scoreB
      return b.points - a.points
    })
    .slice(0, 8)
}
