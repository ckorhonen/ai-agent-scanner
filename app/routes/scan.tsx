import { json } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { scanUrl } from "~/lib/scanner";
import type { ScanResult } from "~/lib/types";

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

const GRADE_COLOR: Record<string, string> = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

const CATEGORY_LABELS: Record<string, string> = {
  usability: "Usability",
  webmcp: "WebMCP",
  semantic: "Semantic",
  structured: "Struct. Data",
  crawlability: "Crawlability",
  content: "Content",
};

const CATEGORY_MAX: Record<string, number> = {
  usability: 30,
  webmcp: 25,
  semantic: 20,
  structured: 15,
  crawlability: 5,
  content: 5,
};

function GradeCircle({ score, grade }: { score: number; grade: string }) {
  const color = GRADE_COLOR[grade] ?? "#6b7280";
  const pct = score / 100;
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="55" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold">
          {score}
        </text>
        <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="11">
          / 100
        </text>
      </svg>
      <span className="text-xl font-bold" style={{ color }}>
        Grade {grade}
      </span>
    </div>
  );
}

function CategoryBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.round((value / max) * 100);
  const color =
    pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-16 text-right text-gray-300">
        {value}
        <span className="text-gray-600">/{max}</span>
      </span>
    </div>
  );
}

export default function ScanResults() {
  const { results, error } = useLoaderData<typeof loader>();

  if (error || results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error ?? "No results"}</p>
          <Link to="/" className="text-blue-400 hover:underline">
            ← Back to scanner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="text-gray-400 hover:text-white text-sm">
          ← New scan
        </Link>
        <h1 className="text-xl font-bold">Scan Results</h1>
        <span className="text-xs text-gray-500">
          {new Date(results[0].timestamp).toLocaleString()}
        </span>
      </div>

      {/* Result cards */}
      <div
        className={`grid gap-6 ${
          results.length > 1 ? "lg:grid-cols-2" : "max-w-lg mx-auto"
        }`}
      >
        {results.map((r) => (
          <div
            key={r.url}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <p className="text-sm text-gray-400 truncate mb-4">{r.url}</p>
            {r.error ? (
              <p className="text-red-400 text-sm">{r.error}</p>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <GradeCircle score={r.overall} grade={r.grade} />
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                    Category breakdown
                  </p>
                  {Object.entries(r.scores).map(([key, val]) => (
                    <CategoryBar
                      key={key}
                      label={CATEGORY_LABELS[key] ?? key}
                      value={val}
                      max={CATEGORY_MAX[key] ?? 10}
                    />
                  ))}
                </div>

                {r.recommendations.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                      Top recommendations
                    </p>
                    <ul className="space-y-3">
                      {r.recommendations.slice(0, 3).map((rec) => (
                        <li key={rec.title} className="flex items-start gap-2 text-sm">
                          <span className="text-green-400 font-bold mt-0.5 shrink-0">
                            +{rec.points}
                          </span>
                          <div>
                            <p className="text-white font-medium">{rec.title}</p>
                            <p className="text-gray-400 text-xs line-clamp-2">
                              {rec.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Competitor comparison table */}
      {results.length > 1 && (
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold">Competitor Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-800">
                  <th className="text-left px-4 py-3">Category</th>
                  {results.map((r) => (
                    <th key={r.url} className="text-left px-4 py-3 max-w-[140px] truncate">
                      {new URL(r.url).hostname}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(results[0].scores).map((cat) => {
                  const vals = results.map(
                    (r) => r.scores[cat as keyof typeof r.scores]
                  );
                  const maxVal = Math.max(...vals);
                  return (
                    <tr key={cat} className="border-b border-gray-800/50">
                      <td className="px-4 py-3 text-gray-300">
                        {CATEGORY_LABELS[cat]}
                      </td>
                      {vals.map((v, i) => (
                        <td
                          key={i}
                          className={`px-4 py-3 font-medium ${
                            v === maxVal ? "text-green-400" : "text-gray-300"
                          }`}
                        >
                          {v}
                          <span className="text-gray-600">
                            /{CATEGORY_MAX[cat]}
                          </span>
                          {v === maxVal &&
                            vals.filter((x) => x === maxVal).length === 1 && (
                              <span className="ml-1 text-xs">👑</span>
                            )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="bg-gray-800/40">
                  <td className="px-4 py-3 font-semibold">Overall</td>
                  {results.map((r) => {
                    const isWinner =
                      r.overall === Math.max(...results.map((x) => x.overall));
                    return (
                      <td
                        key={r.url}
                        className={`px-4 py-3 font-bold text-lg ${
                          isWinner ? "text-green-400" : "text-gray-300"
                        }`}
                      >
                        {r.overall}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          ({r.grade})
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
