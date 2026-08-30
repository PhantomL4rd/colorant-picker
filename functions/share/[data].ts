import { APP_BASE_URL } from '../../cloudflare/og/utils';
import { generateShareHtml } from '../../cloudflare/og/views';

const CRAWLER_PATTERNS =
  /Twitterbot|facebookexternalhit|Discordbot|Slackbot|LinkedInBot|LINE|Iframely/i;

export const onRequestGet: PagesFunction<Env> = ({ params, request }) => {
  const data = typeof params.data === 'string' ? params.data : '';
  const targetUrl = `${APP_BASE_URL}/?palette=${data}`;

  if (!CRAWLER_PATTERNS.test(request.headers.get('user-agent') ?? '')) {
    return Response.redirect(targetUrl, 302);
  }

  const requestUrl = new URL(request.url);
  const ogImageUrl = `${requestUrl.origin}/og/${data}`;
  const isDev = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';

  return new Response(String(generateShareHtml(ogImageUrl, targetUrl)), {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800, immutable',
    },
  });
};
