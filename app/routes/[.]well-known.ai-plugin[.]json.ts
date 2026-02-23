/**
 * /.well-known/ai-plugin.json
 *
 * ChatGPT / OpenAI plugin manifest — also detected by the WebMCP analyzer
 * as an "agent-friendly API hint" (+5 pts in WebMCP category).
 */

export async function loader() {
  const manifest = {
    schema_version: 'v1',
    name_for_human: 'AI Agent Readiness Scanner',
    name_for_model: 'ai_agent_readiness_scanner',
    description_for_human: 'Score any website for AI agent readiness. Checks WebMCP, llms.txt, structured data, semantic HTML, and more.',
    description_for_model:
      'Scan any URL to assess its AI agent readiness. Returns a score 0–100, grade A–F, readiness level 1–5 (Invisible to AI-Native), per-category scores, and a prioritised list of actionable fixes. Use when a user wants to know if a website works well with AI agents, browsers, or automation tools.',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: 'https://scanner.v1be.codes/.well-known/openapi.yaml',
    },
    logo_url: 'https://scanner.v1be.codes/favicon.ico',
    contact_email: 'chris@v1be.codes',
    legal_info_url: 'https://scanner.v1be.codes',
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
