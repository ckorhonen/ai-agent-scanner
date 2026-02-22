import { Form, useNavigation } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/cloudflare";
import { useState } from "react";

export const meta: MetaFunction = () => [
  { title: "AI Agent Readiness Scanner — Is Your Website Ready for AI Agents?" },
  { name: "description", content: "Free tool to check how well your website works with AI agents. Get scored on WebMCP, llms.txt, structured data, semantic HTML, and crawlability. Includes competitor comparison." },
  { tagName: "link", rel: "canonical", href: "https://scanner.v1be.codes" },
];

const LEVELS = [
  {
    level: 1, emoji: "🔴", label: "Invisible", range: "0–20",
    color: "#ef4444", bg: "rgba(239,68,68,0.08)",
    desc: "AI agents can't meaningfully access or understand the site. Crawlers may be blocked, semantic structure is absent, content is inaccessible.",
  },
  {
    level: 2, emoji: "🟠", label: "Crawlable", range: "21–40",
    color: "#f97316", bg: "rgba(249,115,22,0.08)",
    desc: "Agents can read raw text but can't understand page structure, purpose, or how to navigate. Like reading a book with no chapters.",
  },
  {
    level: 3, emoji: "🟡", label: "Discoverable", range: "41–60",
    color: "#eab308", bg: "rgba(234,179,8,0.08)",
    desc: "Structured data and semantic HTML help agents understand content. But they still can't take actions — search, submit forms, or navigate flows.",
  },
  {
    level: 4, emoji: "🟢", label: "Operable", range: "61–80",
    color: "#22c55e", bg: "rgba(34,197,94,0.08)",
    desc: "Agents can discover, understand, and take actions. Forms are accessible, navigation is clear, content is machine-readable.",
  },
  {
    level: 5, emoji: "🔵", label: "AI-Native", range: "81–100",
    color: "#3b82f6", bg: "rgba(59,130,246,0.08)",
    desc: "Fully optimised for AI agents. WebMCP exposes site capabilities as callable tools. llms.txt gives LLMs an accurate site overview. The top ~3% of the web.",
  },
]

const CHECKS = [
  {
    icon: "🤖", title: "WebMCP", subtitle: "Chrome 146+ · W3C standard",
    desc: "Detects mcp-tool, mcp-param, and mcp-description attributes that expose your site's forms and actions as callable tools for AI agents.",
    spec: "https://webmcp.ai",
    max: 25,
  },
  {
    icon: "🏗️", title: "Semantic HTML", subtitle: "HTML5 landmarks · heading hierarchy",
    desc: "Checks for <main>, <header>, <nav>, <article>, language attributes, ARIA roles — the vocabulary agents use to navigate your pages.",
    spec: "https://html.spec.whatwg.org/",
    max: 20,
  },
  {
    icon: "📋", title: "Structured Data", subtitle: "Schema.org · JSON-LD · Microdata",
    desc: "Validates JSON-LD blocks and checks for high-value types: WebSite, SearchAction, Product, FAQPage, BreadcrumbList.",
    spec: "https://schema.org",
    max: 15,
  },
  {
    icon: "⚡", title: "Agent Usability", subtitle: "Forms · buttons · CAPTCHA · pagination",
    desc: "Checks whether agents can actually interact with your site — label coverage, semantic buttons, CAPTCHA walls, and infinite scroll patterns.",
    spec: null,
    max: 30,
  },
  {
    icon: "🔍", title: "AI Discoverability", subtitle: "robots.txt · sitemap · llms.txt · HTTPS",
    desc: "Checks whether AI crawlers can find and access your site, including the new llms.txt standard adopted by 844,000+ sites.",
    spec: "https://llmstxt.org",
    max: 5,
  },
  {
    icon: "📝", title: "Content Quality", subtitle: "Alt text · readable prose · link clarity",
    desc: "Agents are blind to images without alt text. Checks image alt coverage, link descriptiveness, and content readability for NLP models.",
    spec: null,
    max: 5,
  },
]

const BENCHMARKS = [
  { domain: "stripe.com", note: "Excellent JSON-LD, semantic structure" },
  { domain: "openai.com", note: "Strong crawlability + structured data" },
  { domain: "github.com", note: "Comprehensive semantic HTML" },
  { domain: "shopify.com", note: "Rich product schema, agent-ready forms" },
]

export default function Index() {
  const navigation = useNavigation();
  const [urls, setUrls] = useState(["", "", "", ""]);
  const [showAll, setShowAll] = useState(false);
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";

  function setUrl(i: number, val: string) {
    setUrls(u => { const n = [...u]; n[i] = val; return n; })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs px-3 py-1.5 rounded-full mb-6 border border-blue-500/20 font-medium tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Free · No signup · Open source
          </div>

          <h1 className="text-4xl sm:text-6xl font-black mb-5 leading-tight tracking-tight bg-gradient-to-br from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Is your website ready<br />for AI agents?
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-2 leading-relaxed">
            AI agents don't browse like humans. They read your DOM, call your forms as tools,
            and index your structured data. Most websites fail silently.
          </p>
          <p className="text-gray-500 text-sm mb-10">
            Scan any site. Get a score, a readiness level, and a precise fix list — in seconds.
          </p>

          {/* Scan form */}
          <Form method="GET" action="/scan" className="w-full max-w-xl mx-auto text-left space-y-3">
            <div>
              <label htmlFor="url0" className="block text-sm text-gray-400 mb-1.5 font-medium">
                Your website <span className="text-red-400">*</span>
              </label>
              <input
                id="url0" name="url" type="url" required
                placeholder="https://example.com"
                value={urls[0]}
                onChange={e => setUrl(0, e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition text-sm"
              />
            </div>

            {showAll ? (
              [1, 2, 3].map(i => (
                <div key={i}>
                  <label htmlFor={`url${i}`} className="block text-xs text-gray-500 mb-1.5">
                    Competitor {i} <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    id={`url${i}`} name="url" type="url"
                    placeholder="https://competitor.com"
                    value={urls[i]}
                    onChange={e => setUrl(i, e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition text-sm"
                  />
                </div>
              ))
            ) : (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-xs text-gray-500 hover:text-gray-300 transition flex items-center gap-1"
              >
                <span>+</span> Compare with competitors (up to 4 sites)
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !urls[0]}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl font-bold transition text-white text-sm tracking-wide"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning…
                </span>
              ) : (
                "⚡ Scan for free"
              )}
            </button>
          </Form>

          {/* Quick benchmarks */}
          <div className="mt-6">
            <p className="text-xs text-gray-600 mb-2">Or scan a known site:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {BENCHMARKS.map(b => (
                <Form key={b.domain} method="GET" action="/scan">
                  <input type="hidden" name="url" value={`https://${b.domain}`} />
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-gray-400 hover:text-white hover:border-gray-600 transition"
                    title={b.note}
                  >
                    {b.domain}
                  </button>
                </Form>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── What is AI Agent Readiness? ─────────────────────────────────── */}
      <div className="border-t border-gray-800/60 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">What is AI Agent Readiness?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The web was built for human eyes. AI agents — tools like ChatGPT plugins, Claude's
              computer use, browser automation agents — read your HTML directly. They can't see
              images, they can't solve CAPTCHAs, and they navigate by semantic landmarks.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            {[
              {
                step: "01", title: "Agents read your DOM",
                icon: "👁️",
                body: "AI agents parse HTML, not pixels. A beautiful website with semantic structure is invisible to an agent. Raw DOM is what gets analysed.",
              },
              {
                step: "02", title: "Standards are emerging fast",
                icon: "⚡",
                body: "WebMCP (Chrome 146+) lets agents call your forms as tools. llms.txt lets you curate what LLMs know about your site. These standards are being adopted now.",
              },
              {
                step: "03", title: "Most sites fail silently",
                icon: "🔇",
                body: "Without structured data, semantic HTML, and agent-friendly forms, agents either misunderstand your site or skip it entirely — no error, just silence.",
              },
            ].map(item => (
              <div key={item.step} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <div className="text-3xl mb-4">{item.icon}</div>
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Step {item.step}</div>
                <h3 className="font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed text-xs">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5 Levels ─────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">The 5 Levels of AI Agent Readiness</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Most websites are at Level 2. The top tier is within reach for any developer willing to spend a day on it.
            </p>
          </div>

          <div className="space-y-3">
            {LEVELS.map(lvl => (
              <div
                key={lvl.level}
                className="flex items-start gap-4 p-5 rounded-2xl border"
                style={{ background: lvl.bg, borderColor: `${lvl.color}30` }}
              >
                <div
                  className="text-2xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-black"
                  style={{ background: `${lvl.color}20`, color: lvl.color }}
                >
                  {lvl.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: lvl.color }}>
                      {lvl.emoji} Level {lvl.level}: {lvl.label}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                      style={{ background: `${lvl.color}20`, color: lvl.color }}
                    >
                      {lvl.range} pts
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{lvl.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── What We Check ────────────────────────────────────────────────── */}
      <div className="border-t border-gray-800/60 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">What we check (100 points total)</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Every check has a clear fix with a code example. No vague scores — just precise,
              actionable improvements.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {CHECKS.map(check => (
              <div key={check.title} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">{check.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-sm text-white">{check.title}</h3>
                      <span className="text-xs text-gray-600 font-mono shrink-0 ml-2">/{check.max} pts</span>
                    </div>
                    <p className="text-[11px] text-blue-400 mb-2">{check.subtitle}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{check.desc}</p>
                    {check.spec && (
                      <a
                        href={check.spec}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition mt-2"
                      >
                        View spec ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-800/60">
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-3">Find out where you stand</h2>
          <p className="text-gray-500 text-sm mb-8">
            Free, no login required. Results in under 10 seconds.
          </p>
          <Form method="GET" action="/scan" className="flex gap-2">
            <label htmlFor="url-cta" className="sr-only">Website URL to scan</label>
            <input
              id="url-cta"
              name="url" type="url" required
              placeholder="https://yoursite.com"
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition text-sm"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition text-white text-sm whitespace-nowrap"
            >
              ⚡ Scan
            </button>
          </Form>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-800/40 py-8 text-center text-xs text-gray-700">
        <p>
          AI Agent Readiness Scanner · Free, open source ·{" "}
          <a
            href="https://github.com/ckorhonen/ai-agent-scanner"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-500 transition"
          >
            GitHub ↗
          </a>
        </p>
      </div>

    </div>
  );
}
