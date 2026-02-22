import type { CheckResult } from '../types'

export function analyzeUsability(html: string): { score: number; checks: CheckResult[] } {
  const checks: CheckResult[] = []
  let score = 30

  // ── Label/input pairing ──────────────────────────────────────────────────
  const inputCount = (html.match(/<input(?![^>]*type=["']hidden["'])[^>]*>/gi) || []).length
  const labelCount = (html.match(/<label/gi) || []).length
  const labelRatio = inputCount > 0 ? labelCount / inputCount : 1
  const labelPassed = inputCount === 0 || labelRatio >= 0.8
  if (!labelPassed) score -= 8
  checks.push({
    name: 'Form labels paired with inputs',
    passed: labelPassed,
    impact: 'high',
    detail: inputCount === 0
      ? 'No form inputs found'
      : `${labelCount}/${inputCount} inputs have associated labels`,
    fix: labelPassed ? undefined : 'Add <label for="fieldId"> for every <input id="fieldId">',
    example: labelPassed ? undefined :
`<!-- Before -->
<input type="email" name="email" />

<!-- After -->
<label for="email">Email address</label>
<input type="email" id="email" name="email" />`,
  })

  // ── Semantic buttons ─────────────────────────────────────────────────────
  const divOnclick = (html.match(/div[^>]*onclick/gi) || []).length
  const spanOnclick = (html.match(/span[^>]*onclick/gi) || []).length
  const badButtons = divOnclick + spanOnclick
  const buttonPassed = badButtons <= 2
  if (!buttonPassed) score -= 5
  checks.push({
    name: 'Semantic <button> elements',
    passed: buttonPassed,
    impact: 'high',
    detail: badButtons === 0
      ? 'No div/span onclick handlers found'
      : `${badButtons} div or span element(s) using onclick instead of <button>`,
    fix: buttonPassed ? undefined : 'Replace <div onclick> and <span onclick> with <button type="button">',
    example: buttonPassed ? undefined :
`<!-- Before -->
<div onclick="submit()">Submit</div>

<!-- After -->
<button type="button" onclick="submit()">Submit</button>`,
  })

  // ── CAPTCHA ──────────────────────────────────────────────────────────────
  // Look for actual CAPTCHA implementations: iframes, script sources, and
  // well-known captcha element class/id patterns — NOT just the word "captcha"
  // in text content or data attributes (which would be false positives).
  const hasCaptcha = (
    /src=["'][^"']*(?:recaptcha|hcaptcha|captcha\.js|challenge\.cloudflare)/i.test(html) ||
    /class=["'][^"']*(?:g-recaptcha|h-captcha|cf-turnstile)/i.test(html) ||
    /data-sitekey=/i.test(html) ||
    /<iframe[^>]+(?:recaptcha|hcaptcha)/i.test(html)
  )
  if (hasCaptcha) score -= 5
  checks.push({
    name: 'No CAPTCHA friction',
    passed: !hasCaptcha,
    impact: 'high',
    detail: hasCaptcha
      ? 'CAPTCHA detected — blocks AI agents from form submission'
      : 'No CAPTCHA detected',
    fix: hasCaptcha
      ? 'Use honeypot fields or server-side rate limiting instead of CAPTCHA for API/agent flows'
      : undefined,
  })

  // ── Login wall ───────────────────────────────────────────────────────────
  const hasLogin = /login|sign.?in/i.test(html)
  const hasSignup = /sign.?up|register|create.?account/i.test(html)
  const hasLoginWall = hasLogin && !hasSignup
  if (hasLoginWall) score -= 3
  checks.push({
    name: 'Clear authentication flow',
    passed: !hasLoginWall,
    impact: 'medium',
    detail: hasLoginWall
      ? 'Login required with no visible signup/register path'
      : hasLogin
        ? 'Login and signup both present'
        : 'No authentication wall detected',
    fix: hasLoginWall
      ? 'Expose a public API endpoint or guest mode; surface signup alongside login'
      : undefined,
  })

  // ── Infinite scroll ──────────────────────────────────────────────────────
  const hasInfiniteScroll = /infinite.?scroll|infinitescroll/i.test(html)
  const hasPagination = /pagination|page=\d|\bprev(ious)?\b|\bnext\b/i.test(html)
  const scrollPassed = !hasInfiniteScroll || hasPagination
  if (!scrollPassed) score -= 4
  checks.push({
    name: 'Paginated content (no infinite scroll only)',
    passed: scrollPassed,
    impact: 'medium',
    detail: hasInfiniteScroll && !hasPagination
      ? 'Infinite scroll with no pagination fallback — agents cannot traverse pages'
      : 'Content is paginated or no infinite scroll found',
    fix: scrollPassed ? undefined : 'Add page= query params and <a rel="next"> links alongside infinite scroll',
  })

  return { score: Math.max(0, score), checks }
}
