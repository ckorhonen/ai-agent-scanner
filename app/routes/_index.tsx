import { Form, useNavigation } from "@remix-run/react";
import { useState } from "react";

export default function Index() {
  const navigation = useNavigation();
  const [urls, setUrls] = useState(["", "", "", ""]);
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-sm px-3 py-1 rounded-full mb-4 border border-blue-500/20">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          WebMCP · Schema.org · Agent Usability
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          AI Agent Readiness Scanner
        </h1>
        <p className="text-gray-400 text-lg">
          Assess how well your website works with AI agents — WebMCP support,
          semantic structure, structured data and more. Compare up to 4 sites.
        </p>
      </div>

      {/* Scan Form */}
      <Form method="GET" action="/scan" className="w-full max-w-xl space-y-3">
        <div>
          <label htmlFor="url0" className="block text-sm text-gray-400 mb-1">
            Your website <span className="text-red-400">*</span>
          </label>
          <input
            id="url0"
            name="url"
            type="url"
            required
            placeholder="https://example.com"
            value={urls[0]}
            onChange={(e) =>
              setUrls((u) => {
                const n = [...u];
                n[0] = e.target.value;
                return n;
              })
            }
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <label htmlFor={`url${i}`} className="block text-sm text-gray-500 mb-1">
              Competitor {i}{" "}
              <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id={`url${i}`}
              name="url"
              type="url"
              placeholder="https://competitor.com"
              value={urls[i]}
              onChange={(e) =>
                setUrls((u) => {
                  const n = [...u];
                  n[i] = e.target.value;
                  return n;
                })
              }
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg font-semibold transition text-white"
        >
          {isSubmitting ? "Scanning..." : "⚡ Scan Now"}
        </button>
      </Form>

      {/* Value props */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-12 max-w-2xl text-sm text-gray-400">
        {[
          ["🔌", "WebMCP Detection", "W3C standard, Chrome 146+"],
          ["🏗️", "Semantic Analysis", "HTML5 structure & a11y"],
          ["📋", "Structured Data", "Schema.org & JSON-LD"],
          ["🤖", "Crawler Readiness", "robots.txt & sitemaps"],
          ["⚖️", "Competitor Compare", "Side-by-side scoring"],
          ["💡", "Recommendations", "Actionable improvements"],
        ].map(([icon, title, desc]) => (
          <div
            key={title}
            className="bg-gray-900/50 rounded-lg p-3 border border-gray-800"
          >
            <div className="text-lg mb-1">{icon}</div>
            <div className="font-medium text-white text-xs">{title}</div>
            <div className="text-xs mt-1 text-gray-500">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
