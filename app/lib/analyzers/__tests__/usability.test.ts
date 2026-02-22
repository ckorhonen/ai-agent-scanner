import { describe, it, expect } from 'vitest'
import { analyzeUsability } from '../usability'

describe('analyzeUsability', () => {
  it('returns max score for simple page with no forms', () => {
    const { score, checks } = analyzeUsability('<html><body><p>Hello world</p></body></html>')
    expect(score).toBe(30)
    const labelCheck = checks.find(c => c.name.includes('labels'))!
    expect(labelCheck.passed).toBe(true)
    expect(labelCheck.detail).toMatch(/No form inputs/)
  })

  it('detects unlabelled inputs', () => {
    const html = `<form>
      <input type="text" name="name" />
      <input type="email" name="email" />
      <input type="password" name="pass" />
    </form>`
    const { score, checks } = analyzeUsability(html)
    const labelCheck = checks.find(c => c.name.includes('labels'))!
    expect(labelCheck.passed).toBe(false)
    expect(score).toBeLessThan(30)
    expect(labelCheck.example).toBeDefined()
  })

  it('passes when label ratio >= 80%', () => {
    const html = `<form>
      <label for="a">Name</label><input id="a" type="text" />
      <label for="b">Email</label><input id="b" type="email" />
      <input type="hidden" name="csrf" />
    </form>`
    const { checks } = analyzeUsability(html)
    const labelCheck = checks.find(c => c.name.includes('labels'))!
    expect(labelCheck.passed).toBe(true)
  })

  it('ignores hidden inputs in label ratio', () => {
    const html = `<form>
      <label for="a">Name</label><input id="a" type="text" />
      <input type="hidden" name="csrf" value="token" />
      <input type="hidden" name="state" value="xyz" />
    </form>`
    const { checks } = analyzeUsability(html)
    const labelCheck = checks.find(c => c.name.includes('labels'))!
    expect(labelCheck.passed).toBe(true)
  })

  it('detects div/span onclick buttons', () => {
    const html = `<div onclick="doSomething()">Click me</div>
      <span onclick="other()">Also click</span>
      <span onclick="third()">Third</span>`
    const { checks, score } = analyzeUsability(html)
    const buttonCheck = checks.find(c => c.name.includes('button'))!
    expect(buttonCheck.passed).toBe(false)
    expect(score).toBeLessThan(30)
  })

  it('passes with proper <button> usage', () => {
    const html = `<button type="submit">Submit</button><button type="button">Cancel</button>`
    const { checks } = analyzeUsability(html)
    const buttonCheck = checks.find(c => c.name.includes('button'))!
    expect(buttonCheck.passed).toBe(true)
  })

  it('detects CAPTCHA', () => {
    const html = `<div class="g-recaptcha" data-sitekey="xxx"></div>`
    const { checks, score } = analyzeUsability(html)
    const captchaCheck = checks.find(c => c.name.includes('CAPTCHA'))!
    expect(captchaCheck.passed).toBe(false)
    expect(score).toBeLessThan(30)
    expect(captchaCheck.fix).toBeDefined()
  })

  it('detects login wall without signup', () => {
    const html = `<a href="/login">Sign in</a>`
    const { checks } = analyzeUsability(html)
    const authCheck = checks.find(c => c.name.includes('authentication'))!
    expect(authCheck.passed).toBe(false)
  })

  it('passes when both login and signup present', () => {
    const html = `<a href="/login">Sign in</a> <a href="/signup">Create account</a>`
    const { checks } = analyzeUsability(html)
    const authCheck = checks.find(c => c.name.includes('authentication'))!
    expect(authCheck.passed).toBe(true)
  })

  it('detects infinite scroll without pagination', () => {
    const html = `<div class="infinite-scroll">content</div>`
    const { checks } = analyzeUsability(html)
    const paginationCheck = checks.find(c => c.name.includes('Paginated'))!
    expect(paginationCheck.passed).toBe(false)
  })

  it('passes when infinite scroll has pagination fallback', () => {
    const html = `<div class="infinite-scroll">content</div>
      <a href="?page=2" rel="next">Next page</a>`
    const { checks } = analyzeUsability(html)
    const paginationCheck = checks.find(c => c.name.includes('Paginated'))!
    expect(paginationCheck.passed).toBe(true)
  })

  it('score never goes below 0', () => {
    const worst = `<div onclick="a()"></div><div onclick="b()"></div><div onclick="c()"></div>
      <div class="recaptcha"></div>
      <input /><input /><input /><input /><input />
      <a href="/login">Login</a>
      <div class="infinite-scroll">x</div>`
    const { score } = analyzeUsability(worst)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})
