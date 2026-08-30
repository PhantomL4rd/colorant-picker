import { extractColors } from '../../cloudflare/og/utils';
import { generateErrorImage, generateOgImage } from '../../cloudflare/og/views';

let fontDataPromise: Promise<ArrayBuffer> | null = null;

function loadFont(env: Env, request: Request): Promise<ArrayBuffer> {
  if (!fontDataPromise) {
    const fontUrl = new URL('/fonts/mplus-rounded-bold-subset.ttf', request.url);
    fontDataPromise = env.ASSETS.fetch(fontUrl).then((response) => {
      if (!response.ok) throw new Error(`Failed to load OGP font: ${response.status}`);
      return response.arrayBuffer();
    });
  }

  return fontDataPromise;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params, request }) => {
  const hostname = new URL(request.url).hostname;
  const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
  const cacheControl = isDev ? 'no-cache' : 'public, max-age=604800, s-maxage=604800';
  const data = typeof params.data === 'string' ? params.data : null;
  let fontData: ArrayBuffer | null = null;

  try {
    fontData = await loadFont(env, request);
    const colors = await extractColors(data);
    return generateOgImage(colors, cacheControl, fontData);
  } catch (error) {
    console.error('Error generating OGP image:', error);
    return fontData
      ? generateErrorImage(fontData)
      : new Response('Failed to generate OGP image', { status: 500 });
  }
};
