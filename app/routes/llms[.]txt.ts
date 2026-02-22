export async function loader() {
  const content = `# AI Agent Readiness Scanner

> Free tool to score any website's readiness for AI agents. Get a score, grade, and actionable fixes — in seconds.

## What this tool is

The AI Agent Readiness Scanner checks how well a website works with AI agents — tools like ChatGPT plugins, Claude's computer use, and browser automation. It checks 6 categories totalling 100 points:

- **WebMCP** (25 pts): Chrome 146+ W3C standard for agent-native websites
- **Agent Usability** (30 pts): Form labels, semantic buttons, CAPTCHA walls
- **Semantic HTML** (20 pts): Landmark elements, heading hierarchy, ARIA roles
- **Structured Data** (15 pts): JSON-LD, Schema.org vocabulary
- **AI Discoverability** (5 pts): robots.txt, sitemap.xml, llms.txt
- **Content Quality** (5 pts): Image alt text, link quality

## Key pages

- [Homepage](https://scanner.v1be.codes/): Scan any URL — free, no login
- [Scan results](https://scanner.v1be.codes/scan?url=https://example.com): Per-category breakdown with fix guides
- [GitHub](https://github.com/ckorhonen/ai-agent-scanner): Open source, MIT license

## The 5 Readiness Levels

1. Invisible (0–20): Agents can't access or understand the site
2. Crawlable (21–40): Agents read text but can't understand structure
3. Discoverable (41–60): Structured data helps agents understand content
4. Operable (61–80): Agents can discover, understand, and take actions
5. AI-Native (81–100): WebMCP, llms.txt, agent-first design

## Technical details

Stack: Remix + Cloudflare Workers (edge-deployed, ~100ms response).
Every check returns a pass/fail result with the specific issue, a fix recommendation, and a copy-paste code example.

## What we don't do

We don't store scan results, track users, or require sign-up. Scans run live each time.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
