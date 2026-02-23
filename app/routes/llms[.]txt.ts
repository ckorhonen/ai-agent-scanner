export async function loader() {
  const content = `# AI Agent Readiness Scanner
> scanner.v1be.codes — Free. No signup. Open source (MIT).

Score any website's readiness for AI agents: WebMCP, llms.txt, structured data, semantic HTML, crawlability, and content quality. Results in ~8 seconds.

## What this tool does

The AI Agent Readiness Scanner checks how well a website works with AI agents — tools like ChatGPT plugins, Claude's computer use, Perplexity, and browser-use automation. It checks 6 categories totalling 100 points and returns a grade (A–F), a readiness level (1–5), and a prioritised fix list with copy-paste code examples.

**Scoring categories:**
- WebMCP (25 pts): Chrome 146+ W3C incubation standard — exposes site functions as callable tools
- Agent Usability (30 pts): Form labels, semantic buttons, CAPTCHA walls, infinite scroll
- Semantic HTML (20 pts): Landmark elements, heading hierarchy, ARIA roles, lang attribute
- Structured Data (15 pts): JSON-LD, Schema.org vocabulary (WebSite, SearchAction, Product, FAQPage)
- AI Discoverability (5 pts): robots.txt AI crawler rules, sitemap.xml, llms.txt
- Content Quality (5 pts): Image alt text, link descriptiveness, text density

## The 5 Readiness Levels

1. **Invisible** (0–19): Agents can't access or understand the site
2. **Crawlable** (20–39): Agents read text but can't understand structure
3. **Discoverable** (40–59): Structured data helps agents understand content
4. **Operable** (60–79): Agents can discover, understand, and take actions on the site
5. **AI-Native** (80–100): WebMCP, llms.txt, agent-first design throughout

## Key pages

- [Scanner](https://scanner.v1be.codes/): Scan any URL
- [API](https://scanner.v1be.codes/api/v1/scan?url=https://example.com): JSON API (no auth required)
- [Leaderboard](https://scanner.v1be.codes/leaderboard): Ranked sites by score
- [Industry Report 2026](https://scanner.v1be.codes/report): 16 major sites analysed
- [Monitor](https://scanner.v1be.codes/monitor): Email alerts when your score drops
- [GitHub](https://github.com/ckorhonen/ai-agent-scanner): Source (MIT)

## JSON API

Scan any site programmatically:

  curl "https://scanner.v1be.codes/api/v1/scan?url=https://stripe.com"

Returns: score, grade, level, per-category scores, full recommendation list with issues + fix steps.
No authentication required. Results cached for 5 minutes. Please be reasonable with volume.

## Industry Report highlights (Feb 2026)

- Average score across 16 major sites: 48/100 (Grade D)
- WebMCP adoption: 0% (no major site has implemented it yet)
- Only 2 of 16 sites score Grade C or better
- Stripe.com: 63/100 — highest score (has llms.txt)
- GitHub.com: 38/100 — actively rejects llms.txt with HTTP 406
- OpenAI.com: 53/100 — no llms.txt, no JSON-LD structured data

## Data handling

Scan results are saved to a persistent store (Cloudflare KV + D1) to power:
- Shareable scan URLs (e.g. scanner.v1be.codes/scan?id=XXXX)
- The leaderboard (best score per domain)

We do not track users, require sign-up, or share scan data with third parties.

## Technical stack

Remix v2 + Cloudflare Workers (edge-deployed). Scan latency ~3–8 seconds depending on target site response time. HTML cap: 500KB. Scans run live; results cached by scan ID.

## Self-score

scanner.v1be.codes scores **92/100 (Grade A, Level 5: AI-Native)** as of Feb 23, 2026.
We started at 44/100 (Grade D) on Saturday and improved to Grade A by following our own recommendations.
Breakdown: usability 30/30, WebMCP 22/25, semantic 20/20, structured 10/15, crawlability 5/5, content 5/5.
We track our own score publicly — if we drop, you'll see it in the leaderboard.
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
