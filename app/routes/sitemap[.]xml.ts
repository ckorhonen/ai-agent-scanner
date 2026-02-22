import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ request }: LoaderFunctionArgs) {
  const base = "https://scanner.v1be.codes";
  const today = new Date().toISOString().split("T")[0];

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  return new Response(content, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
