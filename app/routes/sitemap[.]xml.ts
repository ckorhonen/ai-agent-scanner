import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const base = "https://scanner.v1be.codes";
  const today = new Date().toISOString().split("T")[0];

  const pages = [
    { path: '/',            changefreq: 'weekly',  priority: '1.0' },
    { path: '/leaderboard', changefreq: 'daily',   priority: '0.9' },
    { path: '/report',      changefreq: 'weekly',  priority: '0.9' },
    { path: '/monitor',     changefreq: 'monthly', priority: '0.7' },
  ];

  const urls = pages.map(p => `
  <url>
    <loc>${base}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(content, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
