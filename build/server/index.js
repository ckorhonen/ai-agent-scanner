import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, useNavigation, Form, useLoaderData, Link } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { useState } from "react";
import { json } from "@remix-run/cloudflare";
async function handleRequest(request, responseStatusCode, responseHeaders, remixContext, _loadContext) {
  const body = await renderToReadableStream(
    /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url }),
    {
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      }
    }
  );
  if (isbot(request.headers.get("user-agent") || "")) {
    await body.allReady;
  }
  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const stylesheet = "/assets/tailwind-Bf45aAgq.css";
const links = () => [
  { rel: "stylesheet", href: stylesheet }
];
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", className: "min-h-screen bg-gray-950 text-white", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
function Index() {
  const navigation = useNavigation();
  const [urls, setUrls] = useState(["", "", "", ""]);
  const isSubmitting = navigation.state === "submitting";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center px-4 py-16", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-10 max-w-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-sm px-3 py-1 rounded-full mb-4 border border-blue-500/20", children: [
        /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-blue-400 animate-pulse" }),
        "WebMCP · Schema.org · Agent Usability"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-5xl font-bold mb-4 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent", children: "AI Agent Readiness Scanner" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-lg", children: "Assess how well your website works with AI agents — WebMCP support, semantic structure, structured data and more. Compare up to 4 sites." })
    ] }),
    /* @__PURE__ */ jsxs(Form, { method: "GET", action: "/scan", className: "w-full max-w-xl space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: "url0", className: "block text-sm text-gray-400 mb-1", children: [
          "Your website ",
          /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "url0",
            name: "url",
            type: "url",
            required: true,
            placeholder: "https://example.com",
            value: urls[0],
            onChange: (e) => setUrls((u) => {
              const n = [...u];
              n[0] = e.target.value;
              return n;
            }),
            className: "w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
          }
        )
      ] }),
      [1, 2, 3].map((i) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: `url${i}`, className: "block text-sm text-gray-500 mb-1", children: [
          "Competitor ",
          i,
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "(optional)" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: `url${i}`,
            name: "url",
            type: "url",
            placeholder: "https://competitor.com",
            value: urls[i],
            onChange: (e) => setUrls((u) => {
              const n = [...u];
              n[i] = e.target.value;
              return n;
            }),
            className: "w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
          }
        )
      ] }, i)),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: isSubmitting,
          className: "w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg font-semibold transition text-white",
          children: isSubmitting ? "Scanning..." : "⚡ Scan Now"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 mt-12 max-w-2xl text-sm text-gray-400", children: [
      ["🔌", "WebMCP Detection", "W3C standard, Chrome 146+"],
      ["🏗️", "Semantic Analysis", "HTML5 structure & a11y"],
      ["📋", "Structured Data", "Schema.org & JSON-LD"],
      ["🤖", "Crawler Readiness", "robots.txt & sitemaps"],
      ["⚖️", "Competitor Compare", "Side-by-side scoring"],
      ["💡", "Recommendations", "Actionable improvements"]
    ].map(([icon, title, desc]) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "bg-gray-900/50 rounded-lg p-3 border border-gray-800",
        children: [
          /* @__PURE__ */ jsx("div", { className: "text-lg mb-1", children: icon }),
          /* @__PURE__ */ jsx("div", { className: "font-medium text-white text-xs", children: title }),
          /* @__PURE__ */ jsx("div", { className: "text-xs mt-1 text-gray-500", children: desc })
        ]
      },
      title
    )) })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index
}, Symbol.toStringTag, { value: "Module" }));
function analyzeUsability(html) {
  let score = 30;
  const doc = html.toLowerCase();
  const inputCount = (html.match(/<input/gi) || []).length;
  const labelCount = (html.match(/<label/gi) || []).length;
  if (inputCount > 0 && labelCount < inputCount * 0.5) score -= 8;
  const divOnclick = (html.match(/div[^>]*onclick/gi) || []).length;
  const spanOnclick = (html.match(/span[^>]*onclick/gi) || []).length;
  if (divOnclick + spanOnclick > 3) score -= 5;
  if (doc.includes("captcha") || doc.includes("recaptcha")) score -= 5;
  if (doc.includes("login") && !doc.includes("signup") && !doc.includes("register")) {
    score -= 3;
  }
  if (doc.includes("infinite") && !html.match(/pagination|page=\d/i)) score -= 4;
  return Math.max(0, score);
}
function analyzeWebMCP(html) {
  let score = 0;
  const details = [];
  const mcpTools = (html.match(/mcp-tool=/gi) || []).length;
  const mcpParams = (html.match(/mcp-param=/gi) || []).length;
  const mcpDescriptions = (html.match(/mcp-description=/gi) || []).length;
  if (mcpTools > 0) {
    score += 10;
    details.push(`${mcpTools} MCP tool(s) declared`);
  }
  if (mcpParams > 0) {
    score += Math.min(5, mcpParams);
    details.push(`${mcpParams} MCP parameter(s) defined`);
  }
  if (mcpDescriptions > 0) {
    score += 5;
    details.push("MCP descriptions present (agent-friendly)");
  }
  if (html.includes("/.well-known/ai-plugin.json") || html.includes("openapi")) {
    score += 5;
    details.push("OpenAPI/ai-plugin hints detected");
  }
  if (details.length === 0) {
    details.push("No WebMCP support detected");
  }
  return { score: Math.min(25, score), details };
}
function analyzeSemantic(html) {
  let score = 20;
  const doc = html.toLowerCase();
  const semanticTags = ["<header", "<main", "<footer", "<article", "<section", "<nav", "<aside"];
  const found = semanticTags.filter((t) => doc.includes(t)).length;
  if (found < 3) score -= 6;
  else if (found < 5) score -= 3;
  const hasH1 = doc.includes("<h1");
  const hasH2 = doc.includes("<h2");
  if (!hasH1) score -= 4;
  if (!hasH2) score -= 2;
  const divCount = (html.match(/<div/gi) || []).length;
  const totalTags = (html.match(/<[a-z]/gi) || []).length;
  const divRatio = divCount / (totalTags || 1);
  if (divRatio > 0.5) score -= 5;
  const tables = (html.match(/<table/gi) || []).length;
  const tdRole = (html.match(/role="(grid|presentation)"/gi) || []).length;
  if (tables > 2 && tdRole === 0) score -= 3;
  return Math.max(0, score);
}
function analyzeStructuredData(html) {
  let score = 0;
  const types = [];
  const jsonLdMatches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdMatches) {
    try {
      const content = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      const data = JSON.parse(content);
      const schemaType = data["@type"] || data.type || "Unknown";
      types.push(schemaType);
      score += 5;
    } catch {
    }
  }
  const microdataTypes = html.match(/itemtype="[^"]+"/gi) || [];
  if (microdataTypes.length > 0) {
    score += 3;
    const typeNames = microdataTypes.map((t) => t.replace(/itemtype="|"/g, "").split("/").pop() || "?");
    types.push(...typeNames);
  }
  if (types.length >= 3) score += 5;
  else if (types.length >= 1) score += 2;
  return { score: Math.min(15, score), types };
}
async function analyzeCrawlability(url) {
  let score = 0;
  const origin = new URL(url).origin;
  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(3e3) });
    if (robotsRes.ok) {
      score += 2;
      const robotsTxt = await robotsRes.text();
      const lower = robotsTxt.toLowerCase();
      const aiCrawlers = ["gptbot", "claude-web", "perplexitybot", "anthropic-ai", "googlebot"];
      const allowsAI = aiCrawlers.some((bot) => {
        const idx = lower.indexOf(bot);
        if (idx === -1) return false;
        const around = lower.substring(Math.max(0, idx - 50), idx + 50);
        return !around.includes("disallow: /");
      });
      if (allowsAI) score += 1;
    }
  } catch {
  }
  try {
    const sitemapRes = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(3e3) });
    if (sitemapRes.ok) score += 2;
  } catch {
  }
  return Math.min(5, score);
}
function analyzeContent(html) {
  let score = 5;
  const imgTotal = (html.match(/<img/gi) || []).length;
  const imgWithAlt = (html.match(/<img[^>]+alt="[^"]+"/gi) || []).length;
  if (imgTotal > 0) {
    const altRatio = imgWithAlt / imgTotal;
    if (altRatio < 0.5) score -= 3;
    else if (altRatio < 0.8) score -= 1;
  }
  const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  if (textContent < 500) score -= 2;
  return Math.max(0, score);
}
function calculateGrade(score) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}
function calculateOverall(scores) {
  return Math.round(
    scores.usability + scores.webmcp + scores.semantic + scores.structured + scores.crawlability + scores.content
  );
}
function generateRecommendations(scores) {
  const recs = [];
  if (scores.webmcp < 10) {
    recs.push({
      category: "webmcp",
      title: "Add WebMCP support",
      description: "Implement Web Model Context Protocol to let AI agents interact with your forms natively. Add mcp-tool and mcp-param attributes to key forms.",
      points: 25 - scores.webmcp
    });
  }
  if (scores.usability < 20) {
    recs.push({
      category: "usability",
      title: "Improve form accessibility",
      description: "Ensure all form inputs have associated <label> elements. Replace div/span onclick handlers with semantic <button> elements.",
      points: 30 - scores.usability
    });
  }
  if (scores.structured < 8) {
    recs.push({
      category: "structured",
      title: "Add structured data (Schema.org)",
      description: "Add JSON-LD structured data blocks to help AI agents understand your content type and extract key information.",
      points: 15 - scores.structured
    });
  }
  if (scores.semantic < 12) {
    recs.push({
      category: "semantic",
      title: "Use semantic HTML5 elements",
      description: "Replace generic <div> containers with semantic <header>, <main>, <article>, <nav>, and <section> elements.",
      points: 20 - scores.semantic
    });
  }
  if (scores.crawlability < 4) {
    recs.push({
      category: "crawlability",
      title: "Update robots.txt for AI crawlers",
      description: "Explicitly allow AI crawlers (GPTBot, Claude-Web, PerplexityBot) in robots.txt and add a sitemap.xml.",
      points: 5 - scores.crawlability
    });
  }
  return recs.sort((a, b) => b.points - a.points).slice(0, 5);
}
async function scanUrl(url) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  let html = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AI-Agent-Scanner/1.0 (ai-agent-scanner.pages.dev)" },
      signal: AbortSignal.timeout(8e3)
    });
    html = await res.text();
  } catch (err) {
    return {
      url,
      timestamp,
      scores: { usability: 0, webmcp: 0, semantic: 0, structured: 0, crawlability: 0, content: 0 },
      overall: 0,
      grade: "F",
      recommendations: [],
      error: `Failed to fetch: ${String(err)}`
    };
  }
  const [crawlability] = await Promise.all([analyzeCrawlability(url)]);
  const usability = analyzeUsability(html);
  const { score: webmcp } = analyzeWebMCP(html);
  const semantic = analyzeSemantic(html);
  const { score: structured } = analyzeStructuredData(html);
  const content = analyzeContent(html);
  const scores = { usability, webmcp, semantic, structured, crawlability, content };
  const overall = calculateOverall(scores);
  const grade = calculateGrade(overall);
  const recommendations = generateRecommendations(scores);
  return { url, timestamp, scores, overall, grade, recommendations };
}
async function loader({ request }) {
  const url = new URL(request.url);
  const rawUrls = url.searchParams.getAll("url").map((u) => u.trim()).filter(Boolean).slice(0, 4);
  if (rawUrls.length === 0) {
    return json({ results: [], error: "No URLs provided" });
  }
  const results = await Promise.all(rawUrls.map((u) => scanUrl(u)));
  return json({ results, error: null });
}
const GRADE_COLOR = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444"
};
const CATEGORY_LABELS = {
  usability: "Usability",
  webmcp: "WebMCP",
  semantic: "Semantic",
  structured: "Struct. Data",
  crawlability: "Crawlability",
  content: "Content"
};
const CATEGORY_MAX = {
  usability: 30,
  webmcp: 25,
  semantic: 20,
  structured: 15,
  crawlability: 5,
  content: 5
};
function GradeCircle({ score, grade }) {
  const color = GRADE_COLOR[grade] ?? "#6b7280";
  const pct = score / 100;
  const r = 44;
  const circ = 2 * Math.PI * r;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
    /* @__PURE__ */ jsxs("svg", { width: "120", height: "120", viewBox: "0 0 120 120", children: [
      /* @__PURE__ */ jsx("circle", { cx: "60", cy: "60", r, fill: "none", stroke: "#1f2937", strokeWidth: "10" }),
      /* @__PURE__ */ jsx(
        "circle",
        {
          cx: "60",
          cy: "60",
          r,
          fill: "none",
          stroke: color,
          strokeWidth: "10",
          strokeDasharray: circ,
          strokeDashoffset: circ * (1 - pct),
          strokeLinecap: "round",
          transform: "rotate(-90 60 60)"
        }
      ),
      /* @__PURE__ */ jsx("text", { x: "60", y: "55", textAnchor: "middle", fill: color, fontSize: "22", fontWeight: "bold", children: score }),
      /* @__PURE__ */ jsx("text", { x: "60", y: "72", textAnchor: "middle", fill: "#6b7280", fontSize: "11", children: "/ 100" })
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold", style: { color }, children: [
      "Grade ",
      grade
    ] })
  ] });
}
function CategoryBar({
  label,
  value,
  max
}) {
  const pct = Math.round(value / max * 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
    /* @__PURE__ */ jsx("span", { className: "w-24 text-gray-400 shrink-0", children: label }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 bg-gray-800 rounded-full h-2", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: "h-2 rounded-full transition-all",
        style: { width: `${pct}%`, background: color }
      }
    ) }),
    /* @__PURE__ */ jsxs("span", { className: "w-16 text-right text-gray-300", children: [
      value,
      /* @__PURE__ */ jsxs("span", { className: "text-gray-600", children: [
        "/",
        max
      ] })
    ] })
  ] });
}
function ScanResults() {
  const { results, error } = useLoaderData();
  if (error || results.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-red-400 mb-4", children: error ?? "No results" }),
      /* @__PURE__ */ jsx(Link, { to: "/", className: "text-blue-400 hover:underline", children: "← Back to scanner" })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto px-4 py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "text-gray-400 hover:text-white text-sm", children: "← New scan" }),
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "Scan Results" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500", children: new Date(results[0].timestamp).toLocaleString() })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: `grid gap-6 ${results.length > 1 ? "lg:grid-cols-2" : "max-w-lg mx-auto"}`,
        children: results.map((r) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-gray-900 border border-gray-800 rounded-xl p-6",
            children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 truncate mb-4", children: r.url }),
              r.error ? /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm", children: r.error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsx(GradeCircle, { score: r.overall, grade: r.grade }) }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 uppercase tracking-wider mb-3", children: "Category breakdown" }),
                  Object.entries(r.scores).map(([key, val]) => /* @__PURE__ */ jsx(
                    CategoryBar,
                    {
                      label: CATEGORY_LABELS[key] ?? key,
                      value: val,
                      max: CATEGORY_MAX[key] ?? 10
                    },
                    key
                  ))
                ] }),
                r.recommendations.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 uppercase tracking-wider mb-3", children: "Top recommendations" }),
                  /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: r.recommendations.slice(0, 3).map((rec) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-green-400 font-bold mt-0.5 shrink-0", children: [
                      "+",
                      rec.points
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-white font-medium", children: rec.title }),
                      /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-xs line-clamp-2", children: rec.description })
                    ] })
                  ] }, rec.title)) })
                ] })
              ] })
            ]
          },
          r.url
        ))
      }
    ),
    results.length > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-8 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "px-6 py-4 border-b border-gray-800", children: /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Competitor Comparison" }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-gray-400 text-xs border-b border-gray-800", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3", children: "Category" }),
          results.map((r) => /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 max-w-[140px] truncate", children: new URL(r.url).hostname }, r.url))
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          Object.keys(results[0].scores).map((cat) => {
            const vals = results.map(
              (r) => r.scores[cat]
            );
            const maxVal = Math.max(...vals);
            return /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-800/50", children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-300", children: CATEGORY_LABELS[cat] }),
              vals.map((v, i) => /* @__PURE__ */ jsxs(
                "td",
                {
                  className: `px-4 py-3 font-medium ${v === maxVal ? "text-green-400" : "text-gray-300"}`,
                  children: [
                    v,
                    /* @__PURE__ */ jsxs("span", { className: "text-gray-600", children: [
                      "/",
                      CATEGORY_MAX[cat]
                    ] }),
                    v === maxVal && vals.filter((x) => x === maxVal).length === 1 && /* @__PURE__ */ jsx("span", { className: "ml-1 text-xs", children: "👑" })
                  ]
                },
                i
              ))
            ] }, cat);
          }),
          /* @__PURE__ */ jsxs("tr", { className: "bg-gray-800/40", children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-semibold", children: "Overall" }),
            results.map((r) => {
              const isWinner = r.overall === Math.max(...results.map((x) => x.overall));
              return /* @__PURE__ */ jsxs(
                "td",
                {
                  className: `px-4 py-3 font-bold text-lg ${isWinner ? "text-green-400" : "text-gray-300"}`,
                  children: [
                    r.overall,
                    /* @__PURE__ */ jsxs("span", { className: "text-sm font-normal text-gray-500 ml-1", children: [
                      "(",
                      r.grade,
                      ")"
                    ] })
                  ]
                },
                r.url
              );
            })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ScanResults,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-DmC7AtXp.js", "imports": ["/assets/components-DxCnMdio.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-BqL9DV01.js", "imports": ["/assets/components-DxCnMdio.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-Bacn4Dej.js", "imports": ["/assets/components-DxCnMdio.js"], "css": [] }, "routes/scan": { "id": "routes/scan", "parentId": "root", "path": "scan", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/scan-BLuLhF6M.js", "imports": ["/assets/components-DxCnMdio.js"], "css": [] } }, "url": "/assets/manifest-e3a4a26d.js", "version": "e3a4a26d" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/scan": {
    id: "routes/scan",
    parentId: "root",
    path: "scan",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
