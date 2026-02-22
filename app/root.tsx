import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/cloudflare";
import stylesheet from "~/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
];

export const meta: MetaFunction = () => [
  { title: "AI Agent Readiness Scanner — Is Your Website Ready for AI Agents?" },
  { name: "description", content: "Free tool to check how well your website works with AI agents. Scores WebMCP support, semantic HTML, structured data, llms.txt, crawlability and more. Get a grade, a readiness level, and a prioritised fix list in seconds." },
  { name: "keywords", content: "AI agent readiness, WebMCP, llms.txt, structured data, Schema.org, semantic HTML, AI crawler, GPTBot, Claude, Perplexity, agent-friendly website" },
  { name: "author", content: "Chris Korhonen" },
  { name: "robots", content: "index, follow" },

  // Open Graph
  { property: "og:type", content: "website" },
  { property: "og:url", content: "https://scanner.v1be.codes" },
  { property: "og:site_name", content: "AI Agent Readiness Scanner" },
  { property: "og:title", content: "AI Agent Readiness Scanner — Is Your Website Ready for AI Agents?" },
  { property: "og:description", content: "Free tool to score your website's AI agent readiness. WebMCP, llms.txt, structured data, semantic HTML — get your grade in seconds." },
  { property: "og:image", content: "https://scanner.v1be.codes/og-image.png" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:locale", content: "en_US" },

  // Twitter / X
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:site", content: "@ckorhonen" },
  { name: "twitter:creator", content: "@ckorhonen" },
  { name: "twitter:title", content: "AI Agent Readiness Scanner" },
  { name: "twitter:description", content: "Free tool to score your website's AI agent readiness. WebMCP, llms.txt, structured data — get your grade in seconds." },
  { name: "twitter:image", content: "https://scanner.v1be.codes/og-image.png" },

  // Theme
  { name: "theme-color", content: "#030712" },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://scanner.v1be.codes/#app",
        "name": "AI Agent Readiness Scanner",
        "url": "https://scanner.v1be.codes",
        "description": "Free tool to assess how well a website works with AI agents. Checks WebMCP support, llms.txt, structured data, semantic HTML, crawlability, and content quality.",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Web Browser",
        "isAccessibleForFree": true,
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "creator": {
          "@type": "Person",
          "name": "Chris Korhonen",
          "url": "https://chris.v1be.codes",
          "sameAs": ["https://x.com/ckorhonen"]
        },
        "featureList": [
          "WebMCP declarative API detection (Chrome 146+)",
          "llms.txt standard detection",
          "Schema.org JSON-LD structured data analysis",
          "Semantic HTML5 landmark analysis",
          "AI crawler robots.txt analysis (GPTBot, Claude-Web, PerplexityBot)",
          "Form accessibility and agent usability scoring",
          "Side-by-side competitor comparison",
          "Prioritised fix recommendations with code examples"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://scanner.v1be.codes/#site",
        "url": "https://scanner.v1be.codes",
        "name": "AI Agent Readiness Scanner",
        "inLanguage": "en-US",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://scanner.v1be.codes/scan?url={url}",
          "query-input": "required name=url"
        }
      }
    ]
  }

  return (
    <html lang="en" className="min-h-screen bg-gray-950 text-white">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://scanner.v1be.codes" />
        <Meta />
        <Links />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
