// Cloudflare Pages function for the home page address, /.
// Sends the visitor on to their own language (their earlier choice in the
// footer picker first, otherwise their browser's preference); English
// visitors get the page itself. Same behaviour as server.js.
import { pathFor, preferredLanguage } from '../site.js';

export async function onRequest({ request, next }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  const slug = preferredLanguage(request.headers.get('Cookie'), request.headers.get('Accept-Language'));
  if (slug !== 'en') {
    return new Response(null, {
      status: 302,
      headers: {
        Location: pathFor(slug) + new URL(request.url).search,
        'Cache-Control': 'no-store',
        Vary: 'Accept-Language, Cookie',
      },
    });
  }
  const page = await next();
  const response = new Response(page.body, page);
  response.headers.append('Vary', 'Accept-Language, Cookie');
  return response;
}
