import type { MetaFunction } from '@remix-run/cloudflare'
import { Link } from '@remix-run/react'

export const meta: MetaFunction = () => [
  { title: 'AI Agent Readiness Leaderboard — scanner.v1be.codes' },
  { name: 'description', content: 'How well do the web\'s top sites work with AI agents? See who\'s leading and who\'s falling behind in AI agent readiness.' },
  { property: 'og:title', content: 'AI Agent Readiness Leaderboard' },
  { property: 'og:description', content: 'Ranked: the web\'s top sites by AI agent readiness score.' },
]

interface SiteEntry {
  domain: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  level: number
  levelName: string
  category: string
  notes?: string
  scannedAt: string
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  B: 'text-green-400 bg-green-500/10 border-green-500/20',
  C: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  D: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  F: 'text-red-400 bg-red-500/10 border-red-500/20',
}

const LEVEL_EMOJI: Record<number, string> = {
  1: '🔴', 2: '🟠', 3: '🟡', 4: '🟢', 5: '🔵',
}

// Seeded data — updated Feb 22, 2026
// These are real scan results from scanner.v1be.codes
const LEADERBOARD: SiteEntry[] = [
  { domain: 'stripe.com',          score: 63, grade: 'C', level: 4, levelName: 'Operable',      category: 'Payments',       notes: 'Has llms.txt ✓',      scannedAt: '2026-02-22' },
  { domain: 'scanner.v1be.codes',  score: 62, grade: 'C', level: 4, levelName: 'Operable',      category: 'Developer Tools', notes: 'WebMCP pending',      scannedAt: '2026-02-22' },
  { domain: 'anthropic.com',       score: 56, grade: 'D', level: 3, levelName: 'Discoverable',  category: 'AI',             notes: 'No WebMCP, no JSON-LD', scannedAt: '2026-02-22' },
  { domain: 'openai.com',          score: 53, grade: 'D', level: 3, levelName: 'Discoverable',  category: 'AI',             notes: 'No llms.txt (ironic)', scannedAt: '2026-02-22' },
  { domain: 'vercel.com',          score: 48, grade: 'D', level: 3, levelName: 'Discoverable',  category: 'Developer Tools', notes: 'Has llms.txt ✓',     scannedAt: '2026-02-22' },
  { domain: 'linear.app',          score: 46, grade: 'D', level: 3, levelName: 'Discoverable',  category: 'Productivity',   notes: 'Has llms.txt ✓',      scannedAt: '2026-02-22' },
  { domain: 'github.com',          score: 38, grade: 'F', level: 2, levelName: 'Crawlable',     category: 'Developer Tools', notes: 'Rejects llms.txt (406)', scannedAt: '2026-02-22' },
]

const SHAME_LIST = LEADERBOARD.filter(s => s.score < 50).sort((a, b) => a.score - b.score)
const TOP_LIST   = LEADERBOARD.filter(s => s.score >= 50).sort((a, b) => b.score - a.score)

function ScoreBar({ score }: { score: number }) {
  const width = `${score}%`
  const color = score >= 75 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width }} />
    </div>
  )
}

function SiteRow({ entry, rank }: { entry: SiteEntry; rank: number }) {
  const gradeStyle = GRADE_COLORS[entry.grade] ?? GRADE_COLORS.F
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/30 hover:bg-gray-900/60 transition group">
      <div className="w-8 text-center text-gray-600 font-mono text-sm font-bold shrink-0">
        {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : `#${rank}`}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <a
            href={`https://scanner.v1be.codes/scan?url=https://${entry.domain}`}
            className="font-semibold text-white hover:text-blue-400 transition text-sm truncate"
          >
            {entry.domain}
          </a>
          <span className="text-gray-600 text-xs shrink-0">{entry.category}</span>
        </div>
        <ScoreBar score={entry.score} />
        {entry.notes && (
          <p className="text-gray-600 text-xs mt-1">{entry.notes}</p>
        )}
      </div>

      <div className="shrink-0 text-right space-y-1">
        <div className="flex items-center gap-2 justify-end">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${gradeStyle}`}>
            {entry.grade}
          </span>
          <span className="text-white font-bold text-sm">{entry.score}<span className="text-gray-500 font-normal">/100</span></span>
        </div>
        <div className="text-xs text-gray-600">
          {LEVEL_EMOJI[entry.level]} Level {entry.level}: {entry.levelName}
        </div>
      </div>
    </div>
  )
}

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition mb-6 inline-block">
            ← Back to scanner
          </Link>
          <h1 className="text-4xl font-black mb-3">
            AI Agent Readiness<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            How well do the web&rsquo;s top sites work with AI agents?
            Scores based on WebMCP support, semantic HTML, structured data, and agent usability.
          </p>
          <p className="text-gray-600 text-xs mt-3">Last updated Feb 22, 2026 · WebMCP adoption: 0% across all sites</p>
        </div>

        {/* Top performers */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold">🏆 Top Performers</h2>
            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">{TOP_LIST.length} sites</span>
          </div>
          <div className="space-y-3">
            {TOP_LIST.map((entry, i) => (
              <SiteRow key={entry.domain} entry={entry} rank={i + 1} />
            ))}
          </div>
        </section>

        {/* Hall of shame */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold">😬 Hall of Shame</h2>
            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">Notable underperformers</span>
          </div>
          <div className="space-y-3">
            {SHAME_LIST.map((entry, i) => (
              <SiteRow key={entry.domain} entry={entry} rank={i + 1} />
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-3 text-center">
            🤔 OpenAI and GitHub both score below 55 — despite building tools for AI agents.
          </p>
        </section>

        {/* Stats strip */}
        <section className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Average score', value: `${Math.round(LEADERBOARD.reduce((s, e) => s + e.score, 0) / LEADERBOARD.length)}/100` },
            { label: 'WebMCP adoption', value: '0%' },
            { label: 'Sites at Grade C+', value: `${LEADERBOARD.filter(e => e.score >= 60).length}/${LEADERBOARD.length}` },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Where does your site rank?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Free scan in under 10 seconds. Get your score, grade, and a prioritised list of fixes.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition text-sm"
          >
            ⚡ Scan your site
          </Link>
          <p className="text-gray-600 text-xs mt-4">
            Want your site featured? Scan it and share the results on Twitter/X tagging{' '}
            <a href="https://x.com/ckorhonen" className="text-gray-500 hover:text-gray-400 transition">@ckorhonen</a>
          </p>
        </div>

      </div>
    </div>
  )
}
