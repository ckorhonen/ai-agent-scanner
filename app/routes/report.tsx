import type { MetaFunction } from '@remix-run/cloudflare'
import { Link } from '@remix-run/react'

export const meta: MetaFunction = () => [
  { title: 'AI Agent Readiness Report 2026 — scanner.v1be.codes' },
  { name: 'description', content: 'We scanned the most popular developer tools, AI companies, and SaaS platforms for AI agent readiness. Here\'s what we found.' },
  { property: 'og:title', content: 'AI Agent Readiness Report 2026' },
  { property: 'og:description', content: 'OpenAI scores 53/100. Stripe scores 63/100. WebMCP adoption: 0%. See who\'s ready for the agent era.' },
]

interface SiteDatum {
  domain: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  category: string
  measured: boolean   // true = live scan, false = estimate
  highlight?: string
}

const DATA: SiteDatum[] = [
  // AI Companies
  { domain: 'anthropic.com',   score: 56, grade: 'D', category: 'AI',           measured: true,  highlight: 'No WebMCP, no JSON-LD' },
  { domain: 'openai.com',      score: 53, grade: 'D', category: 'AI',           measured: true,  highlight: 'No llms.txt — returns 403' },
  { domain: 'huggingface.co',  score: 55, grade: 'D', category: 'AI',           measured: false, highlight: 'Rich model metadata, but no WebMCP' },
  { domain: 'mistral.ai',      score: 44, grade: 'D', category: 'AI',           measured: false },
  { domain: 'cohere.com',      score: 41, grade: 'D', category: 'AI',           measured: false },
  // Payments
  { domain: 'stripe.com',      score: 63, grade: 'C', category: 'Payments',     measured: true,  highlight: 'Best in class — has llms.txt ✓' },
  { domain: 'paypal.com',      score: 32, grade: 'F', category: 'Payments',     measured: false, highlight: 'Legacy HTML, blocks AI crawlers' },
  { domain: 'square.com',      score: 38, grade: 'F', category: 'Payments',     measured: false },
  // Developer Tools
  { domain: 'scanner.v1be.codes', score: 84, grade: 'B', category: 'Dev Tools', measured: true,  highlight: 'AI-Native 🔵 — went from 44/D → 84/B in one weekend' },
  { domain: 'vercel.com',      score: 48, grade: 'D', category: 'Dev Tools',    measured: true,  highlight: 'Has llms.txt ✓' },
  { domain: 'netlify.com',     score: 50, grade: 'D', category: 'Dev Tools',    measured: false },
  { domain: 'railway.app',     score: 45, grade: 'D', category: 'Dev Tools',    measured: false },
  { domain: 'github.com',      score: 38, grade: 'F', category: 'Dev Tools',    measured: true,  highlight: 'Actively rejects llms.txt (406)' },
  // Productivity
  { domain: 'linear.app',      score: 46, grade: 'D', category: 'Productivity', measured: true,  highlight: 'Has llms.txt ✓' },
  { domain: 'notion.so',       score: 42, grade: 'D', category: 'Productivity', measured: false },
  { domain: 'slack.com',       score: 35, grade: 'F', category: 'Productivity', measured: false, highlight: 'Blocks most AI crawlers' },
]

const GRADE_COLOR: Record<string, string> = {
  A: 'text-blue-400',  B: 'text-green-400',
  C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400',
}
const GRADE_BG: Record<string, string> = {
  A: 'bg-blue-500/10 border-blue-500/20',   B: 'bg-green-500/10 border-green-500/20',
  C: 'bg-yellow-500/10 border-yellow-500/20', D: 'bg-orange-500/10 border-orange-500/20',
  F: 'bg-red-500/10 border-red-500/20',
}

const CATEGORIES = [...new Set(DATA.map(d => d.category))]

const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100)
  const color = score >= 75 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function Report() {
  const measured = DATA.filter(d => d.measured)
  const avgScore = avg(DATA.map(d => d.score))
  const avgMeasured = avg(measured.map(d => d.score))
  const gradeC = DATA.filter(d => d.score >= 60).length
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="mb-14 text-center">
          <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition mb-6 inline-block">
            ← Back to scanner
          </Link>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs px-3 py-1.5 rounded-full mb-5 border border-blue-500/20 font-medium uppercase tracking-wide">
            📊 Industry Report · February 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            The State of AI Agent<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Readiness, 2026
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            We scanned {DATA.length} popular websites across AI, payments, developer tools, and
            productivity to see how ready the web is for AI agents.
          </p>
          <p className="text-gray-600 text-xs mt-3">
            {measured.length} live scans · {DATA.length - measured.length} estimated · WebMCP adoption: 0%
          </p>
        </div>

        {/* Key findings */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-6">Key findings</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                stat: `${avgScore}/100`,
                label: 'Average readiness score',
                sub: 'Grade D across all sites tested',
                color: 'text-orange-400',
              },
              {
                stat: '0%',
                label: 'WebMCP adoption',
                sub: 'Standard ships in Chrome 146, zero uptake so far',
                color: 'text-red-400',
              },
              {
                stat: `${gradeC}/${DATA.length}`,
                label: 'Sites at Grade C or above',
                sub: 'Only Stripe and our own scanner clear the bar',
                color: 'text-yellow-400',
              },
              {
                stat: `${avgMeasured}/100`,
                label: 'Avg across live scans',
                sub: `${measured.length} sites measured with live scanner`,
                color: 'text-blue-400',
              },
            ].map(f => (
              <div key={f.label} className="rounded-xl border border-gray-800 bg-gray-900/30 p-5">
                <div className={`text-3xl font-black mb-1 ${f.color}`}>{f.stat}</div>
                <div className="font-semibold text-sm text-white">{f.label}</div>
                <div className="text-xs text-gray-500 mt-1">{f.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Category breakdown */}
        {CATEGORIES.map(cat => {
          const sites = DATA.filter(d => d.category === cat).sort((a, b) => b.score - a.score)
          const catAvg = avg(sites.map(s => s.score))
          return (
            <section key={cat} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold">{cat}</h2>
                <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">avg {catAvg}/100</span>
              </div>
              <div className="space-y-2">
                {sites.map(site => (
                  <div key={site.domain} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-800 bg-gray-900/20 hover:bg-gray-900/50 transition group">
                    <div className={`w-10 shrink-0 text-center font-bold text-sm px-1.5 py-0.5 rounded-lg border ${GRADE_BG[site.grade]} ${GRADE_COLOR[site.grade]}`}>
                      {site.grade}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{site.domain}</span>
                        {!site.measured && (
                          <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full">est.</span>
                        )}
                        {site.highlight && (
                          <span className="text-[10px] text-gray-500 hidden sm:block">{site.highlight}</span>
                        )}
                      </div>
                      <ScoreBar score={site.score} />
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{site.score}<span className="text-gray-600 font-normal">/100</span></span>
                      <a
                        href={`/scan?url=https://${site.domain}`}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-400 hover:text-blue-300 transition"
                      >
                        Scan →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* Narrative insights */}
        <section className="mb-14 space-y-6">
          <h2 className="text-xl font-bold">What this means</h2>
          {[
            {
              title: 'AI companies aren\'t eating their own dog food',
              body: 'OpenAI scores 53/100. Anthropic scores 56/100. Both build tools for AI agents but haven\'t made their own sites agent-accessible. OpenAI\'s llms.txt returns 403 — it actively blocks AI crawlers from reading its own AI documentation.',
            },
            {
              title: 'Stripe is the outlier',
              body: 'Stripe (63/100, Grade C) is the highest-scoring site we tested. They have llms.txt, proper semantic HTML, fast response times, and well-structured forms. This isn\'t accidental — Stripe has long prioritised developer experience, and agent-readiness is its natural extension.',
            },
            {
              title: 'WebMCP is a greenfield opportunity',
              body: 'Not a single site we tested has implemented WebMCP — the W3C-incubating standard that shipped in Chrome 146 in January 2026. Sites that move first will have a significant advantage when AI agents start preferring agent-native interfaces over scraped HTML.',
            },
            {
              title: 'The agent web is coming regardless',
              body: 'ChatGPT plugins, Claude computer use, and browser automation agents are already in production. Sites that aren\'t ready won\'t be found, won\'t be usable, and will lose traffic as AI-mediated browsing grows. The window to get ahead is now.',
            },
          ].map(insight => (
            <div key={insight.title} className="rounded-xl border border-gray-800 bg-gray-900/20 p-6">
              <h3 className="font-bold text-white mb-2">{insight.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{insight.body}</p>
            </div>
          ))}
        </section>

        {/* Methodology */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-4">Methodology</h2>
          <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-6 text-sm text-gray-400 space-y-3">
            <p>
              Scores are based on 6 weighted categories: Agent Usability (30pts), WebMCP (25pts),
              Semantic HTML (20pts), Structured Data (15pts), AI Discoverability (5pts), Content Quality (5pts).
            </p>
            <p>
              <strong className="text-gray-300">Live scans ({measured.length} sites)</strong> were run via
              scanner.v1be.codes in February 2026. These fetch the live HTML and run all checks server-side.
            </p>
            <p>
              <strong className="text-gray-300">Estimates ({DATA.length - measured.length} sites)</strong> are
              based on manual review of publicly known characteristics (robots.txt, llms.txt availability,
              framework type, observable structured data). Marked with "est." on each row.
            </p>
            <p>
              All scores are point-in-time — sites change continuously. Scan any site yourself at{' '}
              <Link to="/" className="text-blue-400 hover:text-blue-300 transition">scanner.v1be.codes</Link>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Where does your site rank?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Free scan · No signup · Under 10 seconds
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition text-sm">
              ⚡ Scan your site
            </Link>
            <Link to="/leaderboard" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition text-sm">
              🏆 Leaderboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
