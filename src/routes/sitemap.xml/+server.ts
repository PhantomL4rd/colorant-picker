const SITE_URL = 'https://colorant-picker.pl4rd.com';

const pages = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/kasane', priority: 0.9, changefreq: 'weekly' },
  { path: '/favorites', priority: 0.7, changefreq: 'monthly' },
  { path: '/showcase', priority: 0.8, changefreq: 'daily' },
];

export const prerender = true;

export function GET() {
  const lastmod = new Date().toISOString().split('T')[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
