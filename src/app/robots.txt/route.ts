export async function GET() {
  const robotsTxt = `User-agent: Googlebot
Disallow:

User-agent: Googlebot-image
Disallow:

User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*
Disallow: /cart
Disallow: /checkout
Disallow: /profile
Disallow: /profile/*
Disallow: /search

User-agent: AhrefsBot
User-agent: Screaming Frog SEO Spider
User-agent: SemrushBot
User-agent: DotBot
User-agent: PetalBot
User-agent: MJ12bot
User-agent: Baiduspider
Disallow: /

Sitemap: https://borarly.com/sitemap.xml`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
