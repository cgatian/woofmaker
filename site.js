// What the site is made of, shared by every way of serving it: the Node server
// (server.js), the static build (tools/build_site.mjs) and the Cloudflare Pages
// functions (functions/). Nothing in here may use Node-only modules.
import { LANGS, strings, pickLanguage } from './public/js/strings.js';

export const CANONICAL_HOST = globalThis.process?.env?.CANONICAL_HOST || 'www.woofmaker.org';
export const SITE = `https://${CANONICAL_HOST}`;

// English is served at / and every other language at /<slug>/.
export const pathFor = slug => (slug === 'en' ? '/' : `/${slug}/`);

export const SECURITY_HEADERS = {
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

const escAttr = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escJson = v => JSON.stringify(String(v).replace(/<[^>]+>/g, '')).slice(1, -1).replace(/</g, '\\u003c');

// public/index.html is a template: {{key}} is replaced with that language's text
// from public/js/strings.js ({{a:key}} escaped for an attribute, {{j:key}} for JSON).
export function renderHtml(template, slug) {
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
  return template.replace(/\{\{(?:(a|j):)?([\w-]+)\}\}/g, (_, mod, key) => {
    const v = key in vars ? vars[key] : t[key];
    if (v == null) throw new Error(`index.html: no text for {{${key}}}`);
    return mod === 'a' ? escAttr(v) : mod === 'j' ? escJson(v) : v;
  });
}

// Built from the language list, so every language is always in the sitemap.
export function sitemap() {
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
// Takes the raw Cookie and Accept-Language header values.
export function preferredLanguage(cookie, acceptLanguage) {
  const chosen = /(?:^|;\s*)lang=([a-z-]+)/.exec(cookie || '')?.[1];
  if (chosen && LANGS[chosen]) return chosen;
  const tags = (acceptLanguage || '').split(',')
    .map(part => { const [tag, q] = part.trim().split(';q='); return { tag, q: q === undefined ? 1 : Number(q) }; })
    .filter(x => x.tag && x.tag !== '*' && x.q > 0)
    .sort((a, b) => b.q - a.q)
    .map(x => x.tag);
  return pickLanguage(tags);
}
