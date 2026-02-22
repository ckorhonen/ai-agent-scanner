# AI Agent Readiness Scanner

**Is your website ready for AI agents?**

A free, open-source tool that scores websites on how well they work with AI agents — WebMCP support, semantic HTML, structured data, llms.txt, crawlability, and more. Get a grade, a readiness level, and a prioritised fix list in seconds.

🌐 **Live:** [scanner.v1be.codes](https://scanner.v1be.codes)

---

## What It Checks (100 points)

| Category | Max | What's Measured |
|---|---|---|
| ⚡ Agent Usability | 30 | Form labels, semantic buttons, CAPTCHA walls, login friction, pagination |
| 🤖 WebMCP Support | 25 | `mcp-tool`, `mcp-param`, `mcp-description` attrs; OpenAPI / `ai-plugin.json` |
| 🏗️ Semantic HTML | 20 | HTML5 landmarks, heading hierarchy, `lang` attr, ARIA roles, div-soup ratio |
| 📊 Structured Data | 15 | JSON-LD blocks, rich Schema.org types (Product, FAQ, SearchAction…) |
| 🔍 AI Discoverability | 5 | HTTPS, `robots.txt`, `sitemap.xml`, **`llms.txt`** (844k+ sites adopting) |
| 📝 Content Quality | 5 | Image alt text coverage, link descriptiveness |

### The 5 Readiness Levels

| Level | Range | Label | Meaning |
|---|---|---|---|
| 🔴 1 | 0–20 | Invisible | AI agents can't meaningfully access the site |
| 🟠 2 | 21–40 | Crawlable | Agents can read text but not understand structure |
| 🟡 3 | 41–60 | Discoverable | Structured data helps agents understand content |
| 🟢 4 | 61–80 | Operable | Agents can navigate and take actions |
| 🔵 5 | 81–100 | AI-Native | Full WebMCP, llms.txt, agent-optimised — top ~3% of the web |

---

## Features

- **Free, no login** — scan any public URL instantly
- **Competitor comparison** — scan up to 4 sites side-by-side
- **Per-check detail** — every failed check shows exactly what's wrong and how to fix it, with copy-paste code examples
- **Educational notes** — each category explains *why* it matters for AI agents
- **Natural language summary** — plain-English interpretation of your score
- **"Path to next grade" banner** — shows the lowest-effort fixes to reach the next letter grade
- **Share button** — copy the scan URL to share results
- **Response time badge** — flags slow pages that frustrate agents
- **robots.txt + sitemap.xml** — the scanner itself is agent-ready

---

## Tech Stack

- **Runtime:** [Cloudflare Workers](https://workers.cloudflare.com/) via [Cloudflare Pages](https://pages.cloudflare.com/)
- **Framework:** [Remix](https://remix.run/) (SSR, loader-based scanning)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Deployment:** `wrangler pages deploy` with custom `_worker.js` entry

### Architecture

```
Request → Cloudflare Pages (_worker.js)
  ├── Static assets (/assets/*) → ASSETS binding (direct serve)
  └── Dynamic routes → Remix createRequestHandler
        ├── GET /           → Landing page
        ├── GET /scan?url=… → Parallel scanner execution
        │     ├── analyzers/usability.ts
        │     ├── analyzers/webmcp.ts
        │     ├── analyzers/semantic.ts
        │     ├── analyzers/schema.ts
        │     ├── analyzers/crawlability.ts   ← HTTP fetches: robots.txt, sitemap, llms.txt
        │     └── analyzers/content.ts
        ├── GET /robots.txt → Dynamic robots.txt
        └── GET /sitemap.xml → Dynamic sitemap
```

---

## Development

```bash
# Install
npm install

# Dev server (localhost:5173)
npm run dev

# Production build
npm run build

# Deploy to Cloudflare Pages
npm run build
node_modules/.bin/esbuild worker-entry.js \
  --bundle --platform=browser --target=esnext --format=esm \
  --external:__STATIC_CONTENT_MANIFEST \
  --conditions=worker,browser \
  --outfile=build/client/_worker.js

CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<account> \
  npx wrangler pages deploy build/client \
  --project-name ai-agent-scanner \
  --no-bundle
```

### Key Files

```
app/
├── lib/
│   ├── types.ts          # ScanResult, CategoryDetail, ReadinessLevel interfaces
│   ├── scanner.ts        # Orchestrates all analyzers → ScanResult
│   ├── scoring.ts        # Grade/level calculation, generateRecommendations()
│   └── analyzers/
│       ├── usability.ts  # Form labels, buttons, CAPTCHA, pagination
│       ├── webmcp.ts     # WebMCP attribute detection
│       ├── semantic.ts   # HTML5 landmarks, headings, ARIA, lang attr
│       ├── schema.ts     # JSON-LD, microdata, rich types
│       ├── crawlability.ts # robots.txt, sitemap, llms.txt, HTTPS
│       └── content.ts    # Alt text, link quality
├── routes/
│   ├── _index.tsx        # Landing page (educational + scan form)
│   ├── scan.tsx          # Results page (grade ring, category cards, recs)
│   ├── robots[.]txt.ts   # Dynamic robots.txt
│   └── sitemap[.]xml.ts  # Dynamic sitemap
└── root.tsx              # HTML shell, SEO meta, JSON-LD structured data
```

---

## Adding a New Check

1. Find the right analyzer in `app/lib/analyzers/`
2. Add a `CheckResult` to the `checks` array with `name`, `passed`, `impact`, `detail`, `fix`, and optionally `example`
3. Adjust `score` within the category's max (check `app/lib/scanner.ts` for maxes)
4. Optionally add a `Recommendation` in `app/lib/scoring.ts` → `generateRecommendations()`

```ts
// Example check in semantic.ts
const hasLang = /html[^>]+lang=["'][a-z]/i.test(html)
if (!hasLang) score -= 2
checks.push({
  name: 'Language attribute (lang="…")',
  passed: hasLang,
  impact: 'medium',
  detail: hasLang ? '…' : 'No lang attr — NLP models must guess the language',
  fix: 'Add lang="en" to your <html> element',
  example: '<html lang="en">',
})
```

---

## Contributing

PRs welcome. Things that would make this better:

- [ ] More WebMCP checks (mcp-endpoint, mcp-auth detection)
- [ ] `llms-full.txt` detection (verbose variant)
- [ ] Performance/Core Web Vitals via headless fetch timing
- [ ] JSON Feed / RSS detection (agents love structured content feeds)
- [ ] OpenGraph completeness scoring
- [ ] Shareable OG image generation per scan result
- [ ] Historical score tracking (D1 database)

---

## License

[MIT](./LICENSE) — Chris Korhonen

---

## See Also

- [WebMCP specification](https://webmcp.ai)
- [llmstxt.org](https://llmstxt.org) — The llms.txt community standard
- [Schema.org](https://schema.org) — Structured data vocabulary
- [v1be.codes](https://v1be.codes) — More experiments
