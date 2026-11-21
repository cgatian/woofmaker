// Tiny static server for Railway. All GIF making happens in the visitor's browser.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 3000;
const CANONICAL_HOST = process.env.CANONICAL_HOST || 'woofmaker.org';

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
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'interest-cohort=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "img-src 'self' blob: data:",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "script-src 'self'",
    "worker-src 'self'",
    "connect-src 'self' blob:",
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
  // www.woofmaker.org -> woofmaker.org, so search engines see one site
  const host = (req.headers.host || '').toLowerCase().split(':')[0];
  if (host === 'www.' + CANONICAL_HOST) {
    res.writeHead(301, { Location: `https://${CANONICAL_HOST}${url.pathname}${url.search}` });
    return res.end();
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
      entry = { body, gz: COMPRESSIBLE.has(ext) ? gzipSync(body) : null };
      if (process.env.NODE_ENV === 'production') cache.set(file, entry);
    }
    const headers = {
      ...SECURITY_HEADERS,
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // HTML always revalidates; everything else can be cached for a day.
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
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
