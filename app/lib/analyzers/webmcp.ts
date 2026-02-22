// WebMCP is a browser-side API (Chrome 146+), so we detect via HTML attributes
// Full detection would require Cloudflare Browser Rendering (Puppeteer)
export function analyzeWebMCP(html: string): { score: number; details: string[] } {
  let score = 0
  const details: string[] = []

  // Declarative API: mcp-tool attributes on forms
  const mcpTools = (html.match(/mcp-tool=/gi) || []).length
  const mcpParams = (html.match(/mcp-param=/gi) || []).length
  const mcpDescriptions = (html.match(/mcp-description=/gi) || []).length

  if (mcpTools > 0) {
    score += 10
    details.push(`${mcpTools} MCP tool(s) declared`)
  }
  if (mcpParams > 0) {
    score += Math.min(5, mcpParams)
    details.push(`${mcpParams} MCP parameter(s) defined`)
  }
  if (mcpDescriptions > 0) {
    score += 5
    details.push('MCP descriptions present (agent-friendly)')
  }

  // OpenAPI / well-known agent hints
  if (html.includes('/.well-known/ai-plugin.json') || html.includes('openapi')) {
    score += 5
    details.push('OpenAPI/ai-plugin hints detected')
  }

  if (details.length === 0) {
    details.push('No WebMCP support detected')
  }

  return { score: Math.min(25, score), details }
}
