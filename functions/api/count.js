// Cloudflare Pages function for the "Woofs Created" counter: GET reads it,
// POST adds one.
//
// The number lives in a Cloudflare D1 database bound to this project as "DB":
// one table with one row. Adding one is a single UPDATE, so two visitors
// finishing at the same moment both count. The tables are created the first
// time they're needed; set the COUNTER_START variable beforehand to start
// from a number other than zero.

// Light abuse protection: it's a fun counter, not a bank balance, but one
// visitor shouldn't be able to spin it. Per address: one count every 2 seconds
// and at most 40 an hour. Addresses are stored hashed and removed after an hour.
const MIN_GAP_MS = 2000, MAX_PER_HOUR = 40, HOUR_MS = 3600_000;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

async function createTables(db, start) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK (id = 1), count INTEGER NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS hits (who TEXT PRIMARY KEY, last INTEGER NOT NULL, hour_start INTEGER NOT NULL, n INTEGER NOT NULL)'),
    db.prepare('INSERT OR IGNORE INTO counter (id, count) VALUES (1, ?)').bind(start),
  ]);
}

async function hash(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return [...bytes.slice(0, 16)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// True if this address may count right now; records the attempt if so.
async function allowed(db, ip, now) {
  const row = await db.prepare(`
    INSERT INTO hits (who, last, hour_start, n) VALUES (?1, ?2, ?2, 1)
    ON CONFLICT(who) DO UPDATE SET
      n = CASE WHEN ?2 - hour_start > ${HOUR_MS} THEN 1 ELSE n + 1 END,
      hour_start = CASE WHEN ?2 - hour_start > ${HOUR_MS} THEN ?2 ELSE hour_start END,
      last = ?2
    WHERE ?2 - last >= ${MIN_GAP_MS} AND (?2 - hour_start > ${HOUR_MS} OR n < ${MAX_PER_HOUR})
    RETURNING n`).bind(await hash(ip), now).first();
  return row !== null;
}

async function handle(request, env, waitUntil) {
  const db = env.DB;
  if (request.method === 'POST') {
    // Only our own pages may count; other sites' pages can't bump it.
    const origin = request.headers.get('Origin');
    const ours = !origin || new URL(origin).host === new URL(request.url).host;
    const now = Date.now();
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (ours && await allowed(db, ip, now)) {
      const row = await db.prepare('UPDATE counter SET count = count + 1 WHERE id = 1 RETURNING count').first();
      // Now and then, forget addresses not seen for an hour.
      if (Math.random() < 0.05) waitUntil(db.prepare('DELETE FROM hits WHERE last < ?').bind(now - HOUR_MS).run());
      return json({ count: row.count, counted: true });
    }
    const row = await db.prepare('SELECT count FROM counter WHERE id = 1').first();
    return json({ count: row.count, counted: false });
  }
  const row = await db.prepare('SELECT count FROM counter WHERE id = 1').first();
  return json({ count: row.count });
}

export async function onRequest({ request, env, waitUntil }) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
  }
  if (!env.DB) return json({ error: 'The counter database is not connected to this project.' }, 503);
  try {
    return await handle(request, env, waitUntil);
  } catch (e) {
    // First request ever: the tables don't exist yet. Create them and retry.
    if (!/no such table/i.test(String(e?.message))) throw e;
    const start = Number(env.COUNTER_START);
    await createTables(env.DB, Number.isSafeInteger(start) && start >= 0 ? start : 0);
    return handle(request, env, waitUntil);
  }
}
