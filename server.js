// Tiny static server for Railway. All GIF making happens in the visitor's browser;
// the only thing the server stores is the "WOOFs made" count (see counter.js).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { getCount, increment } from './counter.js';

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
    const file = await resolveFile(url.pathname);
    if (!file || !(await stat(file)).isFile()) throw Object.assign(new Error('nf'), { code: 'ENOENT' });
    const ext = extname(file);
    let entry = cache.get(file);
    if (!entry) {
      const body = await readFile(file);
      entry = { body, gz: COMPRESSIBLE.has(ext) ? gzipSync(body) : null, mtime: (await stat(file)).mtime.toUTCString() };
      if (process.env.NODE_ENV === 'production') cache.set(file, entry);
    }
    const headers = {
      ...SECURITY_HEADERS,
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // Code and small text files always revalidate so deploys show up at once;
      // images can be cached for an hour.
      'Cache-Control': COMPRESSIBLE.has(ext) ? 'no-cache' : 'public, max-age=3600',
      'Last-Modified': entry.mtime,
      Vary: 'Accept-Encoding',
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
