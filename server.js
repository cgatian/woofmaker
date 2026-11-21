// Tiny static server for Railway. All GIF making happens in the visitor's browser;
// the only thing the server stores is the "WOOFs made" count (see counter.js).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { getCount, increment } from './counter.js';
import { LANGS, strings, pickLanguage } from './public/js/strings.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 3000;
const CANONICAL_HOST = process.env.CANONICAL_HOST || 'www.woofmaker.org';

// Extra files served from outside public/
const ALIASES = {
  '/vendor/gifenc.esm.js': join(ROOT, 'node_modules', 'gifenc', 'dist', 'gifenc.esm.js'),
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest']);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'interest-cohort=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "img-src 'self' blob: data: https://*.google-analytics.com https://*.googletagmanager.com",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "script-src 'self' https://www.googletagmanager.com",          // Google Analytics tag
    "worker-src 'self'",
    "connect-src 'self' blob: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; '),
};

const cache = new Map();

// ---------- languages ----------
// public/index.html is a template: {{key}} is replaced with that language's text
// from public/js/strings.js ({{a:key}} escaped for an attribute, {{j:key}} for
// JSON). English is served at / and every other language at /<slug>/.
const SITE = `https://${CANONICAL_HOST}`;
const pathFor = slug => (slug === 'en' ? '/' : `/${slug}/`);
const escAttr = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escJson = v => JSON.stringify(String(v).replace(/<[^>]+>/g, '')).slice(1, -1).replace(/</g, '\\u003c');
const pages = new Map();

async function renderPage(slug) {
  if (pages.has(slug)) return pages.get(slug);
  const file = join(PUBLIC, 'index.html');
  const template = await readFile(file, 'utf8');
  const lang = LANGS[slug], t = strings(slug);
  const vars = {
    slug, htmlLang: lang.htmlLang, ogLocale: lang.ogLocale, url: SITE + pathFor(slug),
    hreflang: [
      ...Object.entries(LANGS).map(([s, l]) => `  <link rel="alternate" hreflang="${l.hreflang}" href="${SITE}${pathFor(s)}">`),
      `  <link rel="alternate" hreflang="x-default" href="${SITE}/">`,
    ].join('\n'),
    langOptions: Object.entries(LANGS)
      .map(([s, l]) => `        <option value="${s}"${s === slug ? ' selected' : ''}>${l.name}</option>`).join('\n'),
  };
  const html = template.replace(/\{\{(?:(a|j):)?([\w-]+)\}\}/g, (_, mod, key) => {
    const v = key in vars ? vars[key] : t[key];
    if (v == null) throw new Error(`index.html: no text for {{${key}}}`);
    return mod === 'a' ? escAttr(v) : mod === 'j' ? escJson(v) : v;
  });
  const body = Buffer.from(html);
  const entry = { body, gz: gzipSync(body), mtime: (await stat(file)).mtime.toUTCString() };
  if (process.env.NODE_ENV === 'production') pages.set(slug, entry);
  return entry;
}

// Built from the language list, so every language is always in the sitemap.
function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const alternates = [
    ...Object.entries(LANGS).map(([s, l]) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${SITE}${pathFor(s)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`,
  ].join('\n');
  const urls = Object.keys(LANGS)
    .map(s => `  <url>\n    <loc>${SITE}${pathFor(s)}</loc>\n    <lastmod>${today}</lastmod>\n${alternates}\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

// The language a visitor to / should get: their own earlier choice (a cookie
// set by the language picker) first, otherwise their browser's preference.
function preferredLanguage(req) {
  const chosen = /(?:^|;\s*)lang=([a-z-]+)/.exec(req.headers.cookie || '')?.[1];
  if (chosen && LANGS[chosen]) return chosen;
  const tags = (req.headers['accept-language'] || '').split(',')
    .map(part => { const [tag, q] = part.trim().split(';q='); return { tag, q: q === undefined ? 1 : Number(q) }; })
    .filter(x => x.tag && x.tag !== '*' && x.q > 0)
    .sort((a, b) => b.q - a.q)
    .map(x => x.tag);
  return pickLanguage(tags);
}

async function resolveFile(urlPath) {
  if (ALIASES[urlPath]) return ALIASES[urlPath];
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = normalize(join(PUBLIC, decodeURIComponent(urlPath)));
  if (!file.startsWith(PUBLIC)) return null;
  return file;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }
  // Send the other spelling of the domain (with/without www) to the main one,
  // so search engines see one site.
  const host = (req.headers.host || '').toLowerCase().split(':')[0];
  const alternate = CANONICAL_HOST.startsWith('www.') ? CANONICAL_HOST.slice(4) : 'www.' + CANONICAL_HOST;
  // Railway terminates TLS and tells us the original scheme. Force HTTPS.
  const proto = req.headers['x-forwarded-proto'];
  if (proto === 'http' && host !== 'localhost' && host !== '127.0.0.1') {
    res.writeHead(301, { Location: `https://${host === alternate ? CANONICAL_HOST : host}${url.pathname}${url.search}` });
    return res.end();
  }
  if (host === alternate) {
    res.writeHead(301, { Location: `https://${CANONICAL_HOST}${url.pathname}${url.search}` });
    return res.end();
  }
  // The "WOOFs made" counter: GET reads it, POST adds one.
  if (url.pathname === '/api/count') {
    let counted;
    if (req.method === 'POST') {
      // Only our own pages may count; other sites' pages can't bump it.
      const origin = req.headers.origin;
      const ours = !origin || [CANONICAL_HOST, alternate, 'localhost', '127.0.0.1'].includes(new URL(origin).hostname);
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
      counted = ours && increment(ip);
    } else if (req.method !== 'GET') {
      res.writeHead(405, { Allow: 'GET, POST' });
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    return res.end(JSON.stringify({ count: getCount(), counted }));
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  try {
    // The page itself, in the right language.
    const redirect = (code, to) => { res.writeHead(code, { Location: to, 'Cache-Control': 'no-store', Vary: 'Accept-Language, Cookie' }); res.end(); };
    const named = /^\/([a-z-]+)\/?$/.exec(url.pathname)?.[1];
    let slug = null;
    if (url.pathname === '/index.html' || named === 'en') return redirect(301, '/' + url.search);
    if (url.pathname === '/') {
      slug = preferredLanguage(req);
      if (slug !== 'en') return redirect(302, pathFor(slug) + url.search);
    } else if (named && LANGS[named]) {
      if (!url.pathname.endsWith('/')) return redirect(301, pathFor(named) + url.search);
      slug = named;
    }

    let file, ext, entry;
    if (slug) {
      ext = '.html';
      entry = await renderPage(slug);
    } else if (url.pathname === '/sitemap.xml') {
      ext = '.xml';
      const body = Buffer.from(sitemap());
      entry = { body, gz: gzipSync(body), mtime: new Date().toUTCString() };
    } else {
      file = await resolveFile(url.pathname);
      if (!file || !(await stat(file)).isFile()) throw Object.assign(new Error('nf'), { code: 'ENOENT' });
      ext = extname(file);
      entry = cache.get(file);
      if (!entry) {
        const body = await readFile(file);
        entry = { body, gz: COMPRESSIBLE.has(ext) ? gzipSync(body) : null, mtime: (await stat(file)).mtime.toUTCString() };
        if (process.env.NODE_ENV === 'production') cache.set(file, entry);
      }
    }
    const headers = {
      ...SECURITY_HEADERS,
      ...(slug ? { 'Content-Language': LANGS[slug].htmlLang } : {}),
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // Code and small text files always revalidate so deploys show up at once;
      // images can be cached for an hour.
      'Cache-Control': COMPRESSIBLE.has(ext) ? 'no-cache' : 'public, max-age=3600',
      'Last-Modified': entry.mtime,
      Vary: slug === 'en' ? 'Accept-Encoding, Accept-Language, Cookie' : 'Accept-Encoding',
    };
    let body = entry.body;
    if (entry.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip';
      body = entry.gz;
    }
    headers['Content-Length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    console.error(e);
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(PORT, () => console.log(`WoofMaker listening on http://localhost:${PORT}`));
