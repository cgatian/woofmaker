// The "WOOFs made" counter: one number in one small JSON file. No database.
//
// On Railway, attach a Volume to the service; Railway then sets
// RAILWAY_VOLUME_MOUNT_PATH and the file lives there, so the count survives
// restarts and redeploys. Without a volume (local development) it falls back
// to ./.data, which a redeploy would wipe.
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = process.env.COUNTER_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  join(dirname(fileURLToPath(import.meta.url)), '.data');
const FILE = join(DIR, 'counter.json');

let count = 0;
try {
  const saved = JSON.parse(readFileSync(FILE, 'utf8')).count;
  if (Number.isSafeInteger(saved) && saved >= 0) count = saved;
} catch (e) {
  if (e.code !== 'ENOENT') console.error('counter: could not read', FILE, e.message);
}
console.log(`counter: ${count} (stored in ${FILE}${process.env.RAILWAY_VOLUME_MOUNT_PATH ? ', on a volume' : ''})`);

// Writes go to a temp file first and are then renamed over the real one, so a
// crash mid-write can never leave a half-written count behind.
let dirty = false, timer = null;
function flush() {
  clearTimeout(timer); timer = null;
  if (!dirty) return;
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE + '.tmp', JSON.stringify({ count, updated: new Date().toISOString() }));
    renameSync(FILE + '.tmp', FILE);
    dirty = false;
  } catch (e) {
    console.error('counter: could not save', e.message);
  }
}
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { flush(); process.exit(0); });

// Light abuse protection: it's a fun counter, not a bank balance, but one
// visitor shouldn't be able to spin it. Per address: one count every 2 seconds
// and at most 40 an hour.
const MIN_GAP_MS = 2000, MAX_PER_HOUR = 40;
const seen = new Map();   // ip -> { last, windowStart, n }
setInterval(() => {
  const cutoff = Date.now() - 3600_000;
  for (const [ip, v] of seen) if (v.last < cutoff) seen.delete(ip);
}, 600_000).unref();

export function getCount() { return count; }

// Returns true if the count went up.
export function increment(ip) {
  const now = Date.now();
  let v = seen.get(ip);
  if (!v) { v = { last: 0, windowStart: now, n: 0 }; seen.set(ip, v); }
  if (now - v.windowStart > 3600_000) { v.windowStart = now; v.n = 0; }
  if (now - v.last < MIN_GAP_MS || v.n >= MAX_PER_HOUR) return false;
  v.last = now; v.n++;
  count++;
  dirty = true;
  if (!timer) timer = setTimeout(flush, 500);   // batch bursts into one write
  return true;
}
