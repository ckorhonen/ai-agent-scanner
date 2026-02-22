export async function loader() {
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
