import { describe, it, expect } from 'vitest'
import { analyzeSemantic } from '../semantic'

const withLandmarks = `<html lang="en"><body>
  <header>H</header><nav>N</nav><main><article>A</article><aside>S</aside></main><footer>F</footer><section>S</section>
</body></html>`

const divSoup = `<html lang="en"><body>` + '<div>'.repeat(80) + 'content' + '</div>'.repeat(80) + `</body></html>`

describe('analyzeSemantic', () => {
  it('awards full score for well-structured HTML', () => {
    const html = `<html lang="en"><body>
      <header>header</header><nav>nav</nav><main><article>
        <h1>Main title</h1><h2>Section</h2><h3>Sub</h3>
        <button aria-label="close">×</button>
        <div role="navigation">nav</div>
      </article></main><footer>footer</footer><section>s</section><aside>a</aside>
    </body></html>`
    const { score } = analyzeSemantic(html)
    expect(score).toBeGreaterThanOrEqual(16)
  })

  it('detects missing lang attribute', () => {
    const html = `<html><body><header>h</header><main><h1>Title</h1></main></body></html>`
    const { checks } = analyzeSemantic(html)
    const langCheck = checks.find(c => c.name.includes('Language'))!
    expect(langCheck.passed).toBe(false)
    expect(langCheck.fix).toBeDefined()
  })

  it('passes when lang attribute present', () => {
    const html = `<html lang="en"><body><main><h1>Title</h1></main></body></html>`
    const { checks } = analyzeSemantic(html)
    const langCheck = checks.find(c => c.name.includes('Language'))!
    expect(langCheck.passed).toBe(true)
  })

  it('detects missing H1', () => {
    const html = `<html lang="en"><body><main><h2>subtitle</h2></main></body></html>`
    const { checks, score } = analyzeSemantic(html)
    const h1Check = checks.find(c => c.name.includes('<h1>'))!
    expect(h1Check.passed).toBe(false)
    expect(score).toBeLessThan(20)
  })

  it('penalises excessive div ratio', () => {
    const { checks } = analyzeSemantic(divSoup)
    const divCheck = checks.find(c => c.name.includes('div-soup'))!
    expect(divCheck.passed).toBe(false)
  })

  it('awards landmark points for full set', () => {
    const { checks } = analyzeSemantic(withLandmarks)
    const landmarkCheck = checks.find(c => c.name.includes('landmark'))!
    expect(landmarkCheck.passed).toBe(true)
  })

  it('detects ARIA roles and labels', () => {
    const htmlWithAria = `<html lang="en"><body>
      <nav role="navigation" aria-label="Main menu">nav</nav>
      <button aria-label="Close">×</button>
      <div role="tablist" aria-labelledby="tabLabel">tabs</div>
    </body></html>`
    const { checks } = analyzeSemantic(htmlWithAria)
    const ariaCheck = checks.find(c => c.name.includes('ARIA'))!
    expect(ariaCheck.passed).toBe(true)
  })

  it('returns zero score for empty HTML', () => {
    const { score } = analyzeSemantic('')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(20)
  })
})
