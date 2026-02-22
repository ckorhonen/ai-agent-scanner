# AI Agent Scanner - MVP Specification

**Target:** Cloudflare Pages + Workers deployment  
**Timeline:** 6-8 hours autonomous build  
**Deliverable:** Working, deploy-ready application

## Tech Stack (Non-Negotiable)

- **Frontend:** Remix on Cloudflare Pages
- **Backend:** Cloudflare Workers
- **Browser:** Cloudflare Browser Rendering API (Puppeteer)
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Validation:** Zod
- **Deployment:** `wrangler deploy` one-command

## Core Features (MVP Scope)

### 1. URL Input + Multi-Site Scanning

**Landing Page (`app/routes/_index.tsx`):**
- Hero: "AI Agent Readiness Scanner"
- Tagline: "Assess your website for AI agent compatibility"
- Form:
  - Primary URL (required)
  - Up to 3 competitor URLs (optional)
  - Submit button
- Value props section
- Example results preview

**Scanning:**
- Accept 1-4 URLs
- Validate URLs (Zod)
- Queue parallel scans
- Show loading state

### 2. Scanning Engine

**Six Analysis Categories:**

#### A. Agent Usability (30 points)
**File:** `lib/analyzers/usability.ts`

Check:
- Forms have `<label>` for every `<input>`
- Buttons are semantic `<button>` not `<div onclick>`
- Clear CTAs
- Error messages present
- Success states detectable

Deduct for:
- Infinite scroll without pagination
- CAPTCHAs without bypass
- Login walls without clear flow

#### B. WebMCP Support (25 points)
**File:** `lib/analyzers/webmcp.ts`

**CRITICAL:** Must use Cloudflare Browser Rendering API

```typescript
import puppeteer from '@cloudflare/puppeteer';

export async function detectWebMCP(url: string, env: Env) {
  const browser = await puppeteer.launch(env.MYBROWSER);
  const page = await browser.newPage();
  await page.goto(url);
  
  const webmcp = await page.evaluate(() => {
    // @ts-ignore (browser context)
    if (typeof navigator.modelContext === 'undefined') {
      return null;
    }
    
    return {
      available: true,
      // @ts-ignore
      tools: navigator.modelContext.getRegisteredTools(),
      declarative: document.querySelectorAll('[mcp-tool]').length
    };
  });
  
  await browser.close();
  return webmcp;
}
```

Score based on:
- WebMCP available: +10 points
- Number of tools: +1 point per tool (max +10)
- Quality of schemas: +5 points if well-documented

#### C. Semantic Structure (20 points)
**File:** `lib/analyzers/semantic.ts`

Check:
- HTML5 semantic tags (`<header>`, `<main>`, `<article>`, etc.)
- Heading hierarchy (h1→h6, no skips)
- ARIA labels where appropriate
- Landmark roles
- Lists use `<ul>/<ol>`

Deduct for:
- Div soup
- Tables for layout
- Skipped heading levels

#### D. Structured Data (15 points)
**File:** `lib/analyzers/schema.ts`

Extract:
- JSON-LD blocks
- Microdata
- Schema.org types (Product, Article, LocalBusiness, etc.)

Score:
- Presence: +5
- Relevant types: +5
- Complete fields: +5

#### E. Crawlability (5 points)
**File:** `lib/analyzers/crawlability.ts`

Check:
- `/robots.txt` exists
- Allows AI crawlers (GPTBot, Claude-Web, PerplexityBot, etc.)
- `/sitemap.xml` exists
- Clean URLs

#### F. Content Accessibility (5 points)
**File:** `lib/analyzers/content.ts`

Check:
- Images have alt text
- Not image-heavy without descriptions
- Text content vs. media ratio

### 3. Scoring Engine

**File:** `lib/scoring.ts`

```typescript
export function calculateScore(scanData: ScanData): ScoreResult {
  const weights = {
    usability: 0.30,
    webmcp: 0.25,
    semantic: 0.20,
    structured: 0.15,
    crawlability: 0.05,
    content: 0.05
  };
  
  const total = 
    scanData.usability * weights.usability +
    scanData.webmcp * weights.webmcp +
    scanData.semantic * weights.semantic +
    scanData.structured * weights.structured +
    scanData.crawlability * weights.crawlability +
    scanData.content * weights.content;
  
  return {
    overall: Math.round(total),
    grade: getGrade(total),
    categories: scanData,
    recommendations: generateRecommendations(scanData)
  };
}
```

**Grades:**
- 90-100: A (Excellent)
- 75-89: B (Good)
- 60-74: C (Fair)
- 40-59: D (Poor)
- 0-39: F (Critical)

### 4. Competitor Comparison

**Implementation:**
- Run all scans in parallel: `Promise.all([scan(url1), scan(url2), ...])`
- Compare scores side-by-side
- Highlight winner in each category
- Show ranking: "You rank #2 of 4"

### 5. Results Page

**Route:** `app/routes/scan.$url.tsx`

**Layout:**

```
┌─────────────────────────────────────┐
│  Overall Score: 78/100 (B)          │
│  [Circular gauge visualization]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Category Breakdown                 │
│  ├─ Usability:     85/100 ████░     │
│  ├─ WebMCP:         0/100 ░░░░░     │
│  ├─ Semantic:      92/100 █████     │
│  ├─ Structured:    70/100 ███░░     │
│  ├─ Crawlability:  80/100 ████░     │
│  └─ Content:       90/100 ████░     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Top Recommendations                │
│  1. Add WebMCP support (+25 pts)    │
│  2. Improve structured data (+5)    │
│  3. Fix form accessibility (+3)     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Competitor Comparison              │
│  [Table with 4 sites side-by-side]  │
└─────────────────────────────────────┘
```

Use Recharts for visualizations.

### 6. Deployment Configuration

**wrangler.toml:**
```toml
name = "ai-agent-scanner"
main = "build/index.js"
compatibility_date = "2024-01-01"

[[routes]]
pattern = "*"
custom_domain = true

[site]
bucket = "./public"

[browser]
binding = "MYBROWSER"
```

**Environment Variables:**
None required for MVP (all client-side, no API keys)

## File Structure

```
ai-agent-scanner/
├── app/
│   ├── routes/
│   │   ├── _index.tsx          # Landing page
│   │   └── scan.$url.tsx        # Results page
│   ├── components/
│   │   ├── score-gauge.tsx      # Circular score viz
│   │   ├── category-bars.tsx    # Category breakdown
│   │   └── competitor-table.tsx # Comparison table
│   └── root.tsx
├── lib/
│   ├── analyzers/
│   │   ├── usability.ts
│   │   ├── webmcp.ts            # Puppeteer-based
│   │   ├── semantic.ts
│   │   ├── schema.ts
│   │   ├── crawlability.ts
│   │   └── content.ts
│   ├── scoring.ts
│   └── types.ts
├── workers/
│   └── scanner.ts               # CF Worker endpoint
├── public/
│   └── assets/
├── wrangler.toml
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Testing Requirements

**Before declaring done:**

1. Test on 5 real websites:
   - cdd.dev (should score well)
   - amazon.com (good structured data)
   - hacker news (minimal but semantic)
   - stripe.com (excellent docs/API)
   - random blog (poor)

2. Verify all scores make sense

3. Test competitor comparison with 4 URLs

4. Test WebMCP detection (even if no sites have it yet)

5. Verify `wrangler deploy` works

## Success Criteria

✅ All 7 GitHub issues closed  
✅ `wrangler dev` runs locally  
✅ `wrangler deploy` deploys to CF  
✅ Landing page loads and looks good  
✅ Can scan a URL and get results  
✅ All 6 categories score correctly  
✅ WebMCP detection works (returns null for non-MCP sites)  
✅ Competitor comparison shows 4 sites  
✅ Results page is mobile-responsive  
✅ README has complete setup instructions  

## Wake Notification

When COMPLETELY DONE and VERIFIED working:

```bash
clawdbot gateway wake --text "✅ AI Agent Scanner MVP COMPLETE

- 7/7 issues closed
- All tests passing
- Deployed to Cloudflare: [URL]
- Verified on 5 real websites

Ready for Chris to review!" --mode now
```

**DO NOT wake until:**
- Everything works locally
- Everything works deployed
- You've personally tested it
- README is complete

## Research Reference

See `~/clawd/AI-AGENT-SCANNER-RESEARCH.md` for:
- Category definitions
- Scoring rationale
- WebMCP technical details
- Competitor analysis

Good luck! This is your first big autonomous build for the new executor-code role. 🚀
