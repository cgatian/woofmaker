// Builds the site as plain files in dist/, which is what Cloudflare Pages
// serves. Run with: npm run build
//
// dist/ gets everything in public/, the page rendered once per language, the
// GIF encoder, the sitemap, and the host's own config files (_headers,
// _redirects, _routes.json). The two things that still need code at request
// time live in functions/: the counter, and sending a visitor to / on to
// their own language.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS } from '../public/js/strings.js';
import { SECURITY_HEADERS, pathFor, renderHtml, sitemap } from '../site.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');

rmSync(DIST, { recursive: true, force: true });
cpSync(PUBLIC, DIST, { recursive: true });

// The page, once per language: dist/index.html, dist/es/index.html, ...
const template = readFileSync(join(PUBLIC, 'index.html'), 'utf8');
for (const slug of Object.keys(LANGS)) {
  const dir = join(DIST, pathFor(slug));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderHtml(template, slug));
}

mkdirSync(join(DIST, 'vendor'), { recursive: true });
cpSync(join(ROOT, 'node_modules', 'gifenc', 'dist', 'gifenc.esm.js'), join(DIST, 'vendor', 'gifenc.esm.js'));

writeFileSync(join(DIST, 'sitemap.xml'), sitemap());

// Without a 404 page Cloudflare Pages assumes a single-page app and answers
// every unknown address with the home page, which search engines would index.
writeFileSync(join(DIST, '404.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page not found | WoofMaker</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <article class="about">
    <h2>Page not found</h2>
    <p>There's nothing at this address. <a href="/">Make a WOOF instead</a>.</p>
  </article>
</body>
</html>
`);

// Response headers. Pages revalidates every file on each visit by default, so
// deploys show up at once; images that never change may be kept for an hour.
const block = (path, headers) => `${path}\n${Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`;
const hour = { 'Cache-Control': 'public, max-age=3600' };
writeFileSync(join(DIST, '_headers'), [
  block('/*', SECURITY_HEADERS),
  block('/scene/*', hour),
  block('/og.jpg', hour),
  block('/apple-touch-icon.png', hour),
  ...Object.entries(LANGS).map(([slug, l]) => block(pathFor(slug), { 'Content-Language': l.htmlLang })),
].join('\n'));

// English has no /en/ address of its own.
writeFileSync(join(DIST, '_redirects'), '/en / 301\n/en/ / 301\n');

// Only these addresses run a function; every other request is a plain file,
// which Cloudflare serves without counting it against the functions allowance.
writeFileSync(join(DIST, '_routes.json'), JSON.stringify({ version: 1, include: ['/', '/api/*'], exclude: [] }, null, 2) + '\n');

console.log(`Built ${Object.keys(LANGS).length} languages into ${DIST}`);
