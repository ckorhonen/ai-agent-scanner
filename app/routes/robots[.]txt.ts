import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ request }: LoaderFunctionArgs) {
  const host = new URL(request.url).host;
  const isCanonical = host.includes("scanner.v1be.codes") || host.includes("ai-agent-scanner.pages.dev");

  const content = `User-agent: *
Allow: /
Disallow: /scan

User-agent: GPTBot
Allow: /
Disallow: /scan

User-agent: Claude-Web
Allow: /
Disallow: /scan

User-agent: anthropic-ai
Allow: /
Disallow: /scan

User-agent: PerplexityBot
Allow: /
Disallow: /scan

Sitemap: https://scanner.v1be.codes/sitemap.xml
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
