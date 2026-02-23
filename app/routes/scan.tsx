import { json } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { useState } from "react";
import { z } from "zod";

// Validate URLs: must be http/https, no private IP ranges
const ScanUrlSchema = z.string().url().refine((url) => {
  try {
    const { hostname, protocol } = new URL(url);
    if (!['http:', 'https:'].includes(protocol)) return false;
    const privateRanges = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|0\.0\.0\.0)/;
    return !privateRanges.test(hostname);
  } catch {
    return false;
  }
}, { message: 'Must be a public http/https URL' });

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  const params = new URLSearchParams(location.search);
  const urls = params.getAll("url").filter(Boolean);

  if (!data || urls.length === 0) {
    return [{ title: "Scan Results — AI Agent Readiness Scanner" }];
  }

  let hostname = urls[0];
  try { hostname = new URL(urls[0]).hostname; } catch {}

  const result = data.results?.[0];
  const grade = result?.grade ?? "?";
  const level = result?.level?.label ?? "";
  const score = result?.overall ?? 0;

  if (urls.length === 1) {
    return [
      { title: `${hostname} — Grade ${grade} (${score}/100) · AI Agent Readiness Scanner` },
      { name: "description", content: `${hostname} scored ${score}/100 (Grade ${grade}) for AI agent readiness. Level: ${level}. See the full breakdown and prioritised fixes.` },
      { property: "og:title", content: `${hostname} AI Agent Readiness: Grade ${grade}` },
      { property: "og:description", content: `${hostname} scored ${score}/100. Level: ${level}. Check your website's AI agent readiness score — free tool.` },
      { name: "robots", content: "noindex, follow" }, // don't index scan result pages
    ];
  }

  const domains = urls.map(u => { try { return new URL(u).hostname; } catch { return u; } });
  return [
    { title: `Comparing ${domains.join(" vs ")} — AI Agent Readiness Scanner` },
    { name: "description", content: `Side-by-side AI agent readiness comparison: ${domains.join(", ")}. Scored on WebMCP, llms.txt, structured data, semantic HTML, and crawlability.` },
    { name: "robots", content: "noindex, follow" },
  ];
};
import { scanUrl } from "~/lib/scanner";
import type { ScanResult, CategoryDetail, CheckResult, Recommendation, ReadinessLevel } from "~/lib/types";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // ── Load persisted scan by ID ────────────────────────────────────────────
  const scanId = url.searchParams.get("id");
  if (scanId) {
    try {
      const kv = context?.cloudflare?.env?.SCAN_KV as KVNamespace | undefined;
      if (kv) {
        const { loadScan } = await import('../lib/scan-store');
        const stored = await loadScan(kv, scanId);
        if (stored) {
          const ageMs = Date.now() - stored.createdAt;
          const ageLabel = ageMs < 60_000 ? 'just now'
            : ageMs < 3_600_000 ? `${Math.round(ageMs / 60_000)}m ago`
            : ageMs < 86_400_000 ? `${Math.round(ageMs / 3_600_000)}h ago`
            : `${Math.round(ageMs / 86_400_000)}d ago`;
          return json({ results: stored.results, error: null, scanId, ageLabel });
        }
      }
    } catch { /* fall through to fresh scan */ }
  }

  // ── Fresh scan ────────────────────────────────────────────────────────────
  const rawUrls = url.searchParams
    .getAll("url")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (rawUrls.length === 0) {
    return json({ results: [] as ScanResult[], error: "No URLs provided", scanId: null, ageLabel: null });
  }

  // Validate each URL
  const validUrls: string[] = [];
  const validationErrors: string[] = [];
  for (const raw of rawUrls) {
    const parsed = ScanUrlSchema.safeParse(raw);
    if (parsed.success) {
      validUrls.push(parsed.data);
    } else {
      validationErrors.push(`${raw}: ${parsed.error.issues[0]?.message ?? 'Invalid URL'}`);
    }
  }

  if (validUrls.length === 0) {
    return json({ results: [] as ScanResult[], error: `Invalid URL(s): ${validationErrors.join('; ')}`, scanId: null, ageLabel: null });
  }

  const results = await Promise.all(validUrls.map((u) => scanUrl(u)));

  // ── Persist results to KV ─────────────────────────────────────────────────
  let newScanId: string | null = null;
  try {
    const kv = context?.cloudflare?.env?.SCAN_KV as KVNamespace | undefined;
    if (kv) {
      const { saveScan } = await import('../lib/scan-store');
      newScanId = await saveScan(kv, results);
    }
  } catch { /* non-fatal — scan still works without persistence */ }

  return json({ results, error: null, scanId: newScanId, ageLabel: null });
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", F: "#ef4444",
};
const GRADE_BG: Record<string, string> = {
  A: "rgba(34,197,94,0.12)", B: "rgba(132,204,22,0.12)",
  C: "rgba(234,179,8,0.12)", D: "rgba(249,115,22,0.12)", F: "rgba(239,68,68,0.12)",
};

const CATEGORY_MAX: Record<string, number> = {
  usability: 30, webmcp: 25, semantic: 20, structured: 15, crawlability: 5, content: 5,
};

const CATEGORY_ICON: Record<string, string> = {
  usability: "⚡", webmcp: "🤖", semantic: "🏗️", structured: "📊", crawlability: "🔍", content: "📝",
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
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
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

function LevelBadge({ level }: { level: ReadinessLevel }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{ background: `${level.color}15`, color: level.color, border: `1px solid ${level.color}30` }}
    >
      <span>{level.emoji}</span>
      <span>Level {level.level}: {level.label}</span>
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
        <span className={`mt-0.5 text-base shrink-0 ${check.passed ? "text-green-400" : "text-red-400"}`}>
          {check.passed ? "✓" : "✗"}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${check.passed ? "text-gray-300" : "text-white"}`}>
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
          <span className="text-gray-600 text-xs shrink-0 mt-0.5">{open ? "▲" : "▼"}</span>
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
  const passedChecks = detail.checks.filter(c => c.passed).length;
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
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
              {failedChecks} issue{failedChecks !== 1 ? "s" : ""}
            </span>
          )}
          {failedChecks === 0 && passedChecks > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
              ✓ all clear
            </span>
          )}
          <span className="text-gray-600 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-800">
          {/* Educational note */}
          <div className="px-5 py-3 bg-blue-500/5 border-b border-blue-500/10">
            <p className="text-xs text-blue-300/80 leading-relaxed">
              💡 {detail.educationalNote}
            </p>
          </div>

          {/* Checks */}
          <div>
            {detail.checks.map((check) => (
              <CheckRow key={check.name} check={check} />
            ))}
          </div>
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
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
          style={{
            background: rank === 1 ? "rgba(234,179,8,0.2)" : "rgba(107,114,128,0.2)",
            color: rank === 1 ? "#eab308" : "#6b7280",
          }}
        >
          {rank === 1 ? "★" : rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <span className="text-sm font-semibold text-white leading-snug">{rec.title}</span>
            <span className="text-green-400 font-bold text-xs shrink-0 mt-0.5 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
              +{rec.points}pts
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-2">{rec.description}</p>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${EFFORT_PILL[rec.effort]}`}>
              {rec.effort} effort
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${IMPACT_PILL[rec.impact]}`}>
              {rec.impact} impact
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-gray-700/50 text-gray-500">
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
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2.5 font-semibold">Code example</p>
          <pre className="text-xs text-green-300 leading-relaxed overflow-x-auto bg-gray-950 rounded-lg p-3 border border-gray-800">
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
    structured: "📊 Structured", crawlability: "🔍 AI Discovery", content: "📝 Content",
  };

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
        <span className="text-base">⚔️</span>
        <h2 className="font-semibold text-white text-sm">Side-by-side Comparison</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                Category
              </th>
              {results.map((r) => {
                let host = r.url
                try { host = new URL(r.url).hostname } catch {}
                return (
                  <th key={r.url} className="text-left px-4 py-3 min-w-[130px]">
                    <span className="text-xs font-semibold text-gray-300 block truncate max-w-[140px]">{host}</span>
                    <span className="text-[10px] text-gray-600">{r.overall} pts · Grade {r.grade} · {r.level.label}</span>
                  </th>
                )
              })}
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
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className={`text-xs font-semibold ${isWinner ? "text-green-400" : "text-gray-500"}`}>
                            {v}/{max}{isWinner ? " 👑" : ""}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="bg-gray-800/20">
              <td className="px-5 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Overall</td>
              {results.map((r) => {
                const isWinner = r.overall === Math.max(...results.map(x => x.overall));
                const color = GRADE_COLOR[r.grade];
                return (
                  <td key={r.url} className="px-4 py-4">
                    <span className="font-black text-xl" style={{ color }}>{r.overall}</span>
                    <span className="text-gray-500 text-xs ml-1.5 font-medium">({r.grade}){isWinner ? " 🏆" : ""}</span>
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

function PersistentLinkButton({ scanId }: { scanId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://scanner.v1be.codes/scan?id=${scanId}`;
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition text-xs font-medium"
    >
      {copied ? "✓ Copied!" : "🔗 Shareable link"}
    </button>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition"
    >
      {copied ? "✓ Copied!" : "⎘ Share scan"}
    </button>
  );
}

function NextGradeBanner({ result }: { result: ScanResult }) {
  const grade = result.grade;
  if (grade === "A") return null;

  const nextGradeThresholds: Record<string, number> = { F: 40, D: 60, C: 75, B: 90 };
  const nextGrade: Record<string, string> = { F: "D", D: "C", C: "B", B: "A" };
  const needed = nextGradeThresholds[grade] - result.overall;

  // Find quickest wins
  const quickWins = result.recommendations
    .filter(r => r.effort === "low")
    .slice(0, 3);

  if (needed <= 0 || quickWins.length === 0) return null;

  return (
    <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-400 text-sm font-bold">
          🎯 {needed} points to Grade {nextGrade[grade]}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Quick wins (low effort) that would get you there fastest:
      </p>
      <div className="space-y-1">
        {quickWins.map(w => (
          <div key={w.title} className="flex items-center gap-2 text-xs">
            <span className="text-green-400 shrink-0">+{w.points}pts</span>
            <span className="text-gray-300">{w.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScanResults() {
  const { results, error, scanId, ageLabel } = useLoaderData<typeof loader>();

  if (error || results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
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
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── Nav ── */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <span>←</span> <span>New scan</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {ageLabel && (
              <span className="text-xs text-gray-600">Cached · {ageLabel}</span>
            )}
            {!ageLabel && (
              <span className="text-xs text-gray-600">
                {new Date(results[0].timestamp).toLocaleString(undefined, {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </span>
            )}
            {scanId && <PersistentLinkButton scanId={scanId} />}
            <ShareButton />
          </div>
        </div>

        {/* ── Result cards ── */}
        <div className={`grid gap-8 ${!isSingle ? "lg:grid-cols-2" : "max-w-2xl mx-auto w-full"}`}>
          {results.map((r) => {
            let hostname = r.url
            try { hostname = new URL(r.url).hostname } catch {}

            return (
              <div key={r.url} className="space-y-4">

                {/* Header card */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6">
                  <p className="text-xs text-gray-600 font-mono truncate mb-4" title={r.url}>{hostname}</p>

                  {r.error ? (
                    <div className="space-y-2">
                      <p className="text-red-400 text-sm font-medium">⚠️ Scan failed</p>
                      <p className="text-xs text-gray-500">{r.error}</p>
                    </div>
                  ) : (
                    <>
                      {/* Score + bars */}
                      <div className="flex items-center justify-between gap-4 mb-5">
                        <GradeRing score={r.overall} grade={r.grade} />
                        <div className="flex-1 space-y-2">
                          {Object.entries(r.scores).map(([cat, val]) => {
                            const max = CATEGORY_MAX[cat] ?? 10;
                            const pct = Math.round((val / max) * 100);
                            const barColor = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
                            return (
                              <div key={cat} className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500 w-4 shrink-0">{CATEGORY_ICON[cat]}</span>
                                <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                                </div>
                                <span className="text-gray-500 tabular-nums w-10 text-right shrink-0">
                                  {val}/{max}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Level badge + response time */}
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                        <LevelBadge level={r.level} />
                        {r.responseTimeMs != null && r.responseTimeMs > 0 && (
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-mono ${
                            r.responseTimeMs < 1000
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : r.responseTimeMs < 3000
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            ⏱ {r.responseTimeMs < 1000
                              ? `${r.responseTimeMs}ms`
                              : `${(r.responseTimeMs / 1000).toFixed(1)}s`}
                          </span>
                        )}
                      </div>

                      {/* Natural language summary */}
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50">
                        <p className="text-xs text-gray-300 leading-relaxed">{r.summary}</p>
                      </div>
                    </>
                  )}
                </div>

                {!r.error && (
                  <>
                    {/* Path to next grade */}
                    <NextGradeBanner result={r} />

                    {/* Category breakdown */}
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold px-1">
                        Category Breakdown
                        <span className="ml-2 normal-case text-gray-600 font-normal">click any row for details + fixes</span>
                      </h3>
                      {r.categoryDetails.map((detail) => (
                        <CategoryCard key={detail.category} detail={detail} />
                      ))}
                    </div>

                    {/* Recommendations */}
                    {r.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold px-1">
                          Prioritised Fixes
                          <span className="ml-2 normal-case text-gray-600 font-normal">
                            highest impact, lowest effort first
                          </span>
                        </h3>
                        {r.recommendations.map((rec, i) => (
                          <RecommendationCard key={rec.title} rec={rec} rank={i + 1} />
                        ))}
                      </div>
                    )}

                    {/* Badge embed */}
                    {isSingle && (
                      <div className="rounded-xl border border-gray-800 p-5 text-xs space-y-3">
                        <p className="font-semibold text-gray-400 text-sm">🏷️ Embed badge</p>
                        <p className="text-gray-500">Add this to your README or site to show your AI agent readiness score:</p>
                        <div className="space-y-2">
                          <p className="text-gray-600 uppercase tracking-wide text-[10px] font-medium">Markdown</p>
                          <div className="bg-gray-900 rounded-lg p-3 font-mono text-gray-300 text-[11px] break-all select-all">
                            {`![AI Readiness: ${results[0].overall}/100](https://scanner.v1be.codes/badge/${(() => { try { return new URL(results[0].url).hostname } catch { return results[0].url } })()})`}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-gray-600 uppercase tracking-wide text-[10px] font-medium">HTML</p>
                          <div className="bg-gray-900 rounded-lg p-3 font-mono text-gray-300 text-[11px] break-all select-all">
                            {`<img src="https://scanner.v1be.codes/badge/${(() => { try { return new URL(results[0].url).hostname } catch { return results[0].url } })()}" alt="AI Readiness: ${results[0].overall}/100">`}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Educational footer */}
                    <div className="rounded-xl border border-gray-800 p-5 text-xs text-gray-500 space-y-2">
                      <p className="font-semibold text-gray-400">📖 Learn more</p>
                      <ul className="space-y-1 list-none">
                        <li>→ <a href="https://webmcp.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-400 transition">WebMCP specification</a> — W3C standard for AI-native HTML</li>
                        <li>→ <a href="https://llmstxt.org" target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-400 transition">llmstxt.org</a> — The llms.txt community standard</li>
                        <li>→ <a href="https://schema.org" target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-400 transition">Schema.org</a> — Structured data vocabulary</li>
                        <li>→ <a href="https://github.com/ckorhonen/ai-agent-scanner" target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-400 transition">GitHub</a> — Contribute checks, report issues</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Competitor comparison */}
        {results.length > 1 && !results.every(r => r.error) && (
          <ComparisonTable results={results.filter(r => !r.error)} />
        )}

      </div>
    </div>
  );
}
