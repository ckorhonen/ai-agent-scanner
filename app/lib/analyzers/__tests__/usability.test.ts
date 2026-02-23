import { describe, it, expect } from 'vitest'
import { analyzeUsability } from '../usability'

const makeHtml = (body: string) => `<html lang="en"><body>${body}</body></html>`

describe('analyzeUsability', () => {
  it('returns max score for fully accessible page', () => {
    const html = makeHtml(`
      <label for="q">Search</label>
      <input id="q" type="search" name="q" />
      <button type="submit">Go</button>
    `)
    const { score } = analyzeUsability(html)
    expect(score).toBe(30)
  })

  it('penalises unlabelled inputs', () => {
    const html = makeHtml(`
      <input type="text" name="name" />
      <input type="email" name="email" />
    `)
    const { score, checks } = analyzeUsability(html)
    const labelCheck = checks.find(c => c.name.includes('labels'))!
    expect(labelCheck.passed).toBe(false)
    expect(labelCheck.fix).toBeDefined()
    expect(score).toBeLessThan(30)
  })

  it('passes label check when ratio is ≥80%', () => {
    // 2 inputs, 2 labels → 100%
    const html = makeHtml(`
      <label for="a">A</label><input id="a" type="text" />
      <label for="b">B</label><input id="b" type="text" />
    `)
    const { checks } = analyzeUsability(html)
    const labelCheck = checks.find(c => c.name.includes('labels'))!
    expect(labelCheck.passed).toBe(true)
  })

  it('ignores hidden inputs in label ratio', () => {
    // Only one visible input, labelled
    const html = makeHtml(`
      <label for="v">Visible</label>
      <input id="v" type="text" />
      <input type="hidden" name="csrf" />
    `)
    const { checks } = analyzeUsability(html)
    const labelCheck = checks.find(c => c.name.includes('labels'))!
    expect(labelCheck.passed).toBe(true)
  })

  it('detects real CAPTCHA implementation (class=g-recaptcha)', () => {
    const html = makeHtml(`<div class="g-recaptcha" data-sitekey="abc123"></div>`)
    const { checks, score } = analyzeUsability(html)
    const captchaCheck = checks.find(c => c.name.includes('CAPTCHA'))!
    expect(captchaCheck.passed).toBe(false)
    expect(score).toBeLessThan(30)
  })

  it('detects reCAPTCHA via data-sitekey', () => {
    const html = makeHtml(`<div data-sitekey="6Ldxxx"></div>`)
    const { checks } = analyzeUsability(html)
    const captchaCheck = checks.find(c => c.name.includes('CAPTCHA'))!
    expect(captchaCheck.passed).toBe(false)
  })

  it('detects reCAPTCHA via script src', () => {
    const html = `<html><head><script src="https://www.google.com/recaptcha/api.js"></script></head><body></body></html>`
    const { checks } = analyzeUsability(html)
    const captchaCheck = checks.find(c => c.name.includes('CAPTCHA'))!
    expect(captchaCheck.passed).toBe(false)
  })

  it('does NOT flag the word "captcha" in text as CAPTCHA', () => {
    const html = makeHtml(`<p>We don't use captcha on this form.</p>`)
    const { checks } = analyzeUsability(html)
    const captchaCheck = checks.find(c => c.name.includes('CAPTCHA'))!
    expect(captchaCheck.passed).toBe(true)
  })

  it('detects CAPTCHA via hCaptcha', () => {
    const html = makeHtml(`<div class="h-captcha" data-sitekey="xxx"></div>`)
    const { checks } = analyzeUsability(html)
    const captchaCheck = checks.find(c => c.name.includes('CAPTCHA'))!
    expect(captchaCheck.passed).toBe(false)
  })

  it('penalises div/span onclick handlers', () => {
    const html = makeHtml(`
      <div onclick="doA()">A</div>
      <div onclick="doB()">B</div>
      <div onclick="doC()">C</div>
    `)
    const { checks } = analyzeUsability(html)
    const btnCheck = checks.find(c => c.name.includes('<button>'))!
    expect(btnCheck.passed).toBe(false)
  })

  it('allows up to 2 div/span onclicks without penalty', () => {
    const html = makeHtml(`
      <div onclick="doA()">A</div>
      <span onclick="doB()">B</span>
    `)
    const { checks } = analyzeUsability(html)
    const btnCheck = checks.find(c => c.name.includes('<button>'))!
    expect(btnCheck.passed).toBe(true)
  })

  it('detects login-only wall (login without signup)', () => {
    const html = makeHtml(`<a href="/login">Sign in</a>`)
    const { checks } = analyzeUsability(html)
    const authCheck = checks.find(c => c.name.includes('authentication'))!
    expect(authCheck.passed).toBe(false)
  })

  it('passes auth check when both login and signup present', () => {
    const html = makeHtml(`
      <a href="/login">Sign in</a>
      <a href="/signup">Create account</a>
    `)
    const { checks } = analyzeUsability(html)
    const authCheck = checks.find(c => c.name.includes('authentication'))!
    expect(authCheck.passed).toBe(true)
  })

  it('returns score between 0 and 30', () => {
    const { score } = analyzeUsability('')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(30)
  })
})
