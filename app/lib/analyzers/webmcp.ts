import type { CheckResult } from '../types'

export function analyzeWebMCP(html: string): { score: number; checks: CheckResult[] } {
  const checks: CheckResult[] = []
  let score = 0

  // ── mcp-tool declarations ────────────────────────────────────────────────
  const mcpTools = (html.match(/mcp-tool=/gi) || []).length
  const toolPassed = mcpTools > 0
  if (toolPassed) score += 10
  checks.push({
    name: 'WebMCP mcp-tool declarations',
    passed: toolPassed,
    impact: 'high',
    detail: toolPassed
      ? `${mcpTools} mcp-tool declaration(s) found`
      : 'No mcp-tool attributes detected (Chrome 146+ WebMCP API)',
    fix: toolPassed ? undefined : 'Add mcp-tool="tool-name" attribute to actionable forms',
    example: toolPassed ? undefined :
`<form mcp-tool="search-products"
      mcp-description="Search the product catalog">
  <input mcp-param="query"
         mcp-description="Search keywords"
         name="q" type="search" />
</form>`,
  })

  // ── mcp-param definitions ────────────────────────────────────────────────
  const mcpParams = (html.match(/mcp-param=/gi) || []).length
  const paramPassed = mcpParams > 0
  if (paramPassed) score += Math.min(5, mcpParams)
  checks.push({
    name: 'WebMCP mcp-param definitions',
    passed: paramPassed,
    impact: 'high',
    detail: paramPassed
      ? `${mcpParams} mcp-param attribute(s) defined`
      : 'No mcp-param attributes — agents cannot identify input fields',
    fix: paramPassed ? undefined : 'Add mcp-param="paramName" to each input within an mcp-tool form',
  })

  // ── mcp-description richness ─────────────────────────────────────────────
  const mcpDescriptions = (html.match(/mcp-description=/gi) || []).length
  const descPassed = mcpDescriptions > 0
  if (descPassed) score += 5
  checks.push({
    name: 'Agent-readable descriptions (mcp-description)',
    passed: descPassed,
    impact: 'medium',
    detail: descPassed
      ? `${mcpDescriptions} mcp-description attribute(s) found`
      : 'No mcp-description attributes — agents lack context for tools/params',
    fix: descPassed ? undefined : 'Add mcp-description="Plain English description" to each mcp-tool and mcp-param',
  })

  // ── OpenAPI / ai-plugin.json ──────────────────────────────────────────────
  const hasOpenApi = /\/.well-known\/ai-plugin\.json|openapi\.json|openapi\.yaml|swagger/i.test(html)
  if (hasOpenApi) score += 5
  checks.push({
    name: 'OpenAPI / ai-plugin.json hint',
    passed: hasOpenApi,
    impact: 'medium',
    detail: hasOpenApi
      ? 'OpenAPI spec or ai-plugin.json reference detected'
      : 'No OpenAPI or /.well-known/ai-plugin.json reference found',
    fix: hasOpenApi ? undefined : 'Add /.well-known/ai-plugin.json and link to your OpenAPI spec in HTML',
    example: hasOpenApi ? undefined :
`<!-- In <head> -->
<link rel="ai-plugin"
      href="/.well-known/ai-plugin.json" />`,
  })

  // ── Agent-friendly meta tags ──────────────────────────────────────────────
  const hasAgentMeta = /name=["']description["']|name=["']robots["']/i.test(html)
  if (hasAgentMeta) score += Math.min(0, 0) // informational only, no extra points
  checks.push({
    name: 'Agent-readable meta tags (description, robots)',
    passed: hasAgentMeta,
    impact: 'low',
    detail: hasAgentMeta
      ? 'Meta description and/or robots tag present'
      : 'No meta description found — agents lack page context',
    fix: hasAgentMeta ? undefined : 'Add <meta name="description" content="..."> to every page',
    example: hasAgentMeta ? undefined :
`<meta name="description"
      content="Product catalog for XYZ — search, filter, buy." />`,
  })

  return { score: Math.min(25, score), checks }
}
