import { json } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { useState } from "react";
import { scanUrl } from "~/lib/scanner";
import type { ScanResult, CategoryDetail, CheckResult, Recommendation } from "~/lib/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const rawUrls = url.searchParams
    .getAll("url")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (rawUrls.length === 0) {
    return json({ results: [] as ScanResult[], error: "No URLs provided" });
  }

  const results = await Promise.all(rawUrls.map((u) => scanUrl(u)));
  return json({ results, error: null });
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", F: "#ef4444",
};
const GRADE_BG: Record<string, string> = {
  A: "rgba(34,197,94,0.12)", B: "rgba(132,204,22,0.12)",
  C: "rgba(234,179,8,0.12)",  D: "rgba(249,115,22,0.12)", F: "rgba(239,68,68,0.12)",
};

const CATEGORY_MAX: Record<string, number> = {
  usability: 30, webmcp: 25, semantic: 20, structured: 15, crawlability: 5, content: 5,
};

const CATEGORY_ICON: Record<string, string> = {
  usability: "⚡", webmcp: "🤖", semantic: "🏗️", structured: "📊", crawlability: "🕷️", content: "📝",
};

const IMPACT_PILL: Record<string, string> = {
  high:   "bg-red-500/20 text-red-300 border border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  low:    "bg-blue-500/20 text-blue-300 border border-blue-500/30",
};

const EFFORT_PILL: Record<string, string> = {
  low:    "bg-green-500/20 text-green-300 border border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  high:   "bg-red-500/20 text-red-300 border border-red-500/30",
};

// ── Components ───────────────────────────────────────────────────────────────

function GradeRing({ score, grade }: { score: number; grade: string }) {
  const color = GRADE_COLOR[grade] ?? "#6b7280";
  const bg    = GRADE_BG[grade] ?? "transparent";
  const r = 52, circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: "absolute" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-full"
          style={{ background: bg }}
        >
          <span className="text-3xl font-black" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-500 -mt-1">/ 100</span>
        </div>
      </div>
      <div
        className="px-4 py-1 rounded-full text-sm font-bold tracking-wide"
        style={{ background: bg, color, border: `1px solid ${color}40` }}
      >
        Grade {grade}
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: CheckResult }) {
  const [open, setOpen] = useState(false);
  const hasExtra = check.fix || check.example;

  return (
    <div className="border-b border-gray-800/60 last:border-0">
      <button
        onClick={() => hasExtra && setOpen(!open)}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${hasExtra ? "hover:bg-gray-800/40 cursor-pointer" : "cursor-default"}`}
      >
        {/* Pass/fail icon */}
        <span className={`mt-0.5 text-base shrink-0 ${check.passed ? "text-green-400" : "text-red-400"}`}>
          {check.passed ? "✓" : "✗"}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${check.passed ? "text-gray-200" : "text-white"}`}>
              {check.name}
            </span>
            {!check.passed && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${IMPACT_PILL[check.impact]}`}>
                {check.impact} impact
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{check.detail}</p>
        </div>

        {hasExtra && (
          <span className="text-gray-600 text-xs shrink-0 mt-0.5">
            {open ? "▲" : "▼"}
          </span>
        )}
      </button>

      {open && hasExtra && (
        <div className="px-4 pb-4 space-y-3 bg-gray-900/60">
          {check.fix && (
            <div className="flex gap-2 mt-2">
              <span className="text-blue-400 text-xs shrink-0 mt-0.5">→</span>
              <p className="text-xs text-blue-300 leading-relaxed">{check.fix}</p>
            </div>
          )}
          {check.example && (
            <pre className="text-xs bg-gray-950 rounded-lg p-3 overflow-x-auto text-green-300 leading-relaxed border border-gray-800">
              <code>{check.example}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ detail }: { detail: CategoryDetail }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((detail.score / detail.max) * 100);
  const failedChecks = detail.checks.filter(c => !c.passed).length;
  const barColor = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-800/40 transition-colors text-left"
      >
        <span className="text-xl shrink-0">{CATEGORY_ICON[detail.category]}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-white">{detail.label}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
              {detail.score}<span className="text-gray-600 font-normal text-xs">/{detail.max}</span>
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 4px ${barColor}60` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {failedChecks > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              {failedChecks} fix{failedChecks !== 1 ? "es" : ""}
            </span>
          )}
          <span className="text-gray-600 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 divide-y divide-gray-800/0">
          {detail.checks.map((check) => (
            <CheckRow key={check.name} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors text-left"
      >
        <div className="shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400 mt-0.5">
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <span className="text-sm font-semibold text-white leading-snug">{rec.title}</span>
            <span className="text-green-400 font-bold text-sm shrink-0">+{rec.points} pts</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-2">{rec.description}</p>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${EFFORT_PILL[rec.effort]}`}>
              {rec.effort} effort
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${IMPACT_PILL[rec.impact]}`}>
              {rec.impact} impact
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-gray-700/50 text-gray-400">
              {rec.category}
            </span>
          </div>
        </div>

        {rec.example && (
          <span className="text-gray-600 text-xs shrink-0 mt-1">{open ? "▲" : "▼"}</span>
        )}
      </button>

      {open && rec.example && (
        <div className="border-t border-gray-800 px-5 py-4 bg-gray-950/60">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Code example</p>
          <pre className="text-xs text-green-300 leading-relaxed overflow-x-auto">
            <code>{rec.example}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function ComparisonTable({ results }: { results: ScanResult[] }) {
  const categories = Object.keys(results[0].scores) as Array<keyof typeof results[0]["scores"]>;
  const labels: Record<string, string> = {
    usability: "⚡ Usability", webmcp: "🤖 WebMCP", semantic: "🏗️ Semantic",
    structured: "📊 Structured", crawlability: "🕷️ Crawlability", content: "📝 Content",
  };

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
        <span className="text-base">⚔️</span>
        <h2 className="font-semibold text-white">Competitor Comparison</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                Category
              </th>
              {results.map((r) => (
                <th key={r.url} className="text-left px-4 py-3 min-w-[120px]">
                  <span className="text-xs font-semibold text-gray-300 block truncate max-w-[140px]">
                    {new URL(r.url).hostname}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {r.overall} pts · {r.grade}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const vals = results.map((r) => r.scores[cat]);
              const max = CATEGORY_MAX[cat] ?? 10;
              const winner = Math.max(...vals);
              return (
                <tr key={cat} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="px-5 py-3 text-gray-400 text-xs">{labels[cat]}</td>
                  {vals.map((v, i) => {
                    const pct = Math.round((v / max) * 100);
                    const isWinner = v === winner && vals.filter(x => x === winner).length === 1;
                    const barColor = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
                    return (
                      <td key={i} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-gray-800 rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className={`text-xs font-semibold ${isWinner ? "text-green-400" : "text-gray-400"}`}>
                            {v}/{max}{isWinner && " 👑"}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="bg-gray-800/30">
              <td className="px-5 py-4 font-semibold text-gray-200 text-xs uppercase tracking-wider">Overall</td>
              {results.map((r) => {
                const isWinner = r.overall === Math.max(...results.map(x => x.overall));
                const color = GRADE_COLOR[r.grade];
                return (
                  <td key={r.url} className="px-4 py-4">
                    <span className="font-black text-lg" style={{ color }}>{r.overall}</span>
                    <span className="text-gray-500 text-xs ml-1 font-medium">({r.grade}){isWinner && " 🏆"}</span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScanResults() {
  const { results, error } = useLoaderData<typeof loader>();

  if (error || results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-5xl">😕</p>
          <p className="text-red-400 font-medium">{error ?? "No results"}</p>
          <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2">
            ← Back to scanner
          </Link>
        </div>
      </div>
    );
  }

  const isSingle = results.length === 1;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

      {/* ── Nav ── */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <span>←</span> <span>New scan</span>
        </Link>
        <span className="text-xs text-gray-600">
          {new Date(results[0].timestamp).toLocaleString(undefined, {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          })}
        </span>
      </div>

      {/* ── Result cards ── */}
      <div className={`grid gap-8 ${!isSingle ? "lg:grid-cols-2" : "max-w-2xl mx-auto"}`}>
        {results.map((r) => (
          <div key={r.url} className="space-y-6">

            {/* Header */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6">
              <p className="text-xs text-gray-500 font-mono truncate mb-5">{r.url}</p>

              {r.error ? (
                <p className="text-red-400 text-sm">⚠️ {r.error}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <GradeRing score={r.overall} grade={r.grade} />

                    {/* Quick stats */}
                    <div className="flex-1 space-y-2">
                      {Object.entries(r.scores).slice(0, 6).map(([cat, val]) => {
                        const max = CATEGORY_MAX[cat] ?? 10;
                        const pct = Math.round((val / max) * 100);
                        const barColor = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
                        return (
                          <div key={cat} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 w-4">{CATEGORY_ICON[cat]}</span>
                            <div className="flex-1 h-1 bg-gray-800 rounded-full">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                            </div>
                            <span className="text-gray-500 tabular-nums w-10 text-right">
                              {val}/{max}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex gap-2 mt-5 flex-wrap">
                    {r.categoryDetails.filter(d => d.checks.filter(c => !c.passed).length > 0).map(d => (
                      <span key={d.category} className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">
                        {CATEGORY_ICON[d.category]} {d.checks.filter(c => !c.passed).length} {d.label} issue{d.checks.filter(c => !c.passed).length !== 1 ? "s" : ""}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {!r.error && (
              <>
                {/* Category breakdown */}
                <div className="space-y-2">
                  <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold px-1">
                    Category Breakdown
                    <span className="ml-2 normal-case text-gray-600 font-normal">click to expand</span>
                  </h3>
                  {r.categoryDetails.map((detail) => (
                    <CategoryCard key={detail.category} detail={detail} />
                  ))}
                </div>

                {/* Recommendations */}
                {r.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold px-1">
                      Recommended Fixes
                      <span className="ml-2 normal-case text-gray-600 font-normal">ranked by impact</span>
                    </h3>
                    {r.recommendations.map((rec, i) => (
                      <RecommendationCard key={rec.title} rec={rec} rank={i + 1} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Competitor comparison */}
      {results.length > 1 && <ComparisonTable results={results} />}

    </div>
  );
}
