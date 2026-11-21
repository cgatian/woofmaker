import { loadScene, renderFrame, renderAll, facePixels, play } from './render.js';
import { track } from './analytics.js';
import { strings } from './strings.js';

// The server renders the page in the visitor's language; the same text table
// supplies the messages and GIF captions used here.
const LANG = document.documentElement.dataset.lang || 'en';
const T = strings(LANG);
const HOME = location.pathname;    // '/' for English, '/es/' etc. for the others

const $ = sel => document.querySelector(sel);
const ASPECT = 0.63;               // width / height of the photo in Kevin's frame
const PREVIEW_OFFSET = 8;          // which close-up frame the live preview shows

const state = {
  scene: null,
  img: null,          // the user's photo (canvas, downscaled)
  // placement, normalised to the editor width so it survives resizes
  s: 1, tx: 0, ty: 0,
  coverS: 1,
  captions: true,
  stopDemo: null, stopResult: null,
  gifUrl: null, gifBlob: null,
};

// ---------- screens ----------
const screens = ['home', 'fit', 'result'];
function show(name, push = true) {
  screens.forEach(s => { $('#' + s).hidden = s !== name; });
  document.body.dataset.screen = name;
  window.scrollTo(0, 0);
  if (push) history.pushState({ screen: name }, '', name === 'home' ? HOME : '#' + name);
  if (name === 'fit') requestAnimationFrame(() => { sizeEditor(); drawEditor(); schedulePreview(); });
  if (name !== 'result') state.stopResult?.();
}
window.addEventListener('popstate', e => {
  const want = e.state?.screen || 'home';
  show(want === 'fit' && !state.img ? 'home' : want === 'result' && !state.gifUrl ? 'home' : want, false);
});
history.replaceState({ screen: 'home' }, '', HOME);

// ---------- scene + home demo ----------
const scenePromise = loadScene().then(scene => {
  state.scene = scene;
  // keep every scene canvas at the scene's real size, whatever the HTML says
  for (const id of ['demo', 'mini', 'out']) {
    const c = $('#' + id);
    c.width = scene.width; c.height = scene.height;
  }
  startDemo();
  return scene;
}).catch(err => {
  console.error(err);
  toast(T.toastScene);
});

function placeholderFace() {
  const c = document.createElement('canvas');
  c.width = 252; c.height = 400;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 400);
  grad.addColorStop(0, '#22324f'); grad.addColorStop(1, '#0f1a2e');
  g.fillStyle = grad; g.fillRect(0, 0, 252, 400);
  g.fillStyle = 'rgba(255,255,255,.16)';
  g.beginPath(); g.ellipse(126, 170, 62, 78, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(126, 360, 110, 90, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = '700 34px "Lilita One", system-ui, sans-serif';
  T.face.forEach((line, i) => g.fillText(line, 126, 158 + i * 38));
  return c;
}

async function startDemo() {
  await document.fonts.load('40px Anton').catch(() => {});
  await document.fonts.load('34px "Lilita One"').catch(() => {});
  const { scene } = state;
  const frames = await renderAll(scene, facePixels(placeholderFace()), { captions: captionList() });
  const demo = $('#demo');
  state.stopDemo?.();
  state.stopDemo = play(demo, frames, scene.width, scene.height);
  demo.closest('.stage').classList.add('ready');
}

// The GIF captions in the visitor's language, timed from the scene. Languages
// whose subtitle track has no second line keep the first one up throughout.
function captionList() {
  const [first, second] = state.scene.captions;
  return T.cap2
    ? [{ ...first, text: T.cap1 }, { ...second, text: T.cap2 }]
    : [{ text: T.cap1, start: first.start, end: second.end }];
}

// ---------- "Woofs Created" counter in the footer (old-school hit counter) ----------
function showCount(n) {
  if (!Number.isSafeInteger(n)) return;
  const box = $('#counter');
  $('#digits').replaceChildren(...String(n).padStart(6, '0').split('').map(d => {
    const cell = document.createElement('span');
    cell.textContent = d;
    return cell;
  }));
  box.setAttribute('aria-label', T.countAria.replace('{n}', n.toLocaleString(document.documentElement.lang)));
  box.hidden = false;
}
fetch('/api/count').then(r => r.json()).then(d => showCount(d.count)).catch(() => {});

// ---------- picking a photo ----------
for (const input of [$('#cam'), $('#pick')]) {
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      state.img = await loadPhoto(file);
    } catch (e) {
      console.error(e);
      toast(T.toastPhoto);
      return;
    }
    state.placed = false;
    track('photo_selected', { source: input.id === 'cam' ? 'camera' : 'library' });
    show('fit');
  });
}

async function loadPhoto(file) {
  let src;
  try {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    src = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = reject;
      im.src = url;
    });
  }
  const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight;
  const k = Math.min(1, 1600 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

// ---------- editor (drag / pinch / zoom) ----------
const editor = $('#editor');
const ecan = $('#editCanvas');
let FW = 1, FH = 1;

function sizeEditor() {
  const r = editor.getBoundingClientRect();
  FW = r.width; FH = r.height;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  ecan.width = Math.round(FW * dpr); ecan.height = Math.round(FH * dpr);
  if (!state.placed && state.img) placeInitial();
}

function placeInitial() {
  const { width: w, height: h } = state.img;
  // cover the frame, centred, nudged up a bit since faces tend to sit high
  const cover = Math.max(1 / w, (1 / ASPECT) / h);   // in "editor widths per image px"
  state.coverS = cover;
  state.s = cover;
  state.tx = (1 - w * cover) / 2;
  state.ty = ((1 / ASPECT) - h * cover) * 0.35;
  state.placed = true;
  syncZoom();
}

function drawEditor() {
  if (!state.img) return;
  const ctx = ecan.getContext('2d');
  const k = ecan.width;                      // px per editor width
  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(0, 0, ecan.width, ecan.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(state.img, state.tx * k, state.ty * k, state.img.width * state.s * k, state.img.height * state.s * k);
}

function faceCanvas() {
  const c = document.createElement('canvas');
  c.width = 360; c.height = Math.round(360 / ASPECT);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b1b1b'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high';
  const k = c.width;
  ctx.drawImage(state.img, state.tx * k, state.ty * k, state.img.width * state.s * k, state.img.height * state.s * k);
  return c;
}

function zoomAt(factor, cx, cy) {   // cx, cy in editor-width units
  const min = state.coverS * 0.35, max = state.coverS * 6;
  const ns = Math.min(max, Math.max(min, state.s * factor));
  const f = ns / state.s;
  state.tx = cx - (cx - state.tx) * f;
  state.ty = cy - (cy - state.ty) * f;
  state.s = ns;
}

const pointers = new Map();
let last = null;
editor.addEventListener('pointerdown', e => {
  editor.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  last = gesture();
  editor.classList.add('active');
});
editor.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const g = gesture();
  if (last && g.n === last.n) {
    if (g.n >= 2 && last.d > 0) zoomAt(g.d / last.d, last.x, last.y);
    state.tx += g.x - last.x;
    state.ty += g.y - last.y;
    syncZoom(); changed();
  }
  last = g;
});
const end = e => {
  pointers.delete(e.pointerId);
  last = pointers.size ? gesture() : null;
  if (!pointers.size) editor.classList.remove('active');
};
editor.addEventListener('pointerup', end);
editor.addEventListener('pointercancel', end);
editor.addEventListener('wheel', e => {
  e.preventDefault();
  const r = editor.getBoundingClientRect();
  zoomAt(Math.exp(-e.deltaY * 0.0015), (e.clientX - r.left) / FW, (e.clientY - r.top) / FW);
  syncZoom(); changed();
}, { passive: false });

function gesture() {
  const r = editor.getBoundingClientRect();
  const pts = [...pointers.values()].map(p => ({ x: (p.x - r.left) / FW, y: (p.y - r.top) / FW }));
  const n = pts.length;
  const x = pts.reduce((a, p) => a + p.x, 0) / n, y = pts.reduce((a, p) => a + p.y, 0) / n;
  const d = n >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
  return { n, x, y, d };
}

const zoom = $('#zoom');
function syncZoom() { zoom.value = String(Math.log(state.s / state.coverS)); }
zoom.addEventListener('input', () => {
  const target = state.coverS * Math.exp(parseFloat(zoom.value));
  zoomAt(target / state.s, 0.5, (1 / ASPECT) / 2);
  changed();
});

$('#captions').addEventListener('change', e => { state.captions = e.target.checked; schedulePreview(); });

let pending = false;
function changed() {
  drawEditor();
  schedulePreview();
}
function schedulePreview() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    if (!state.scene || !state.img) return;
    const mini = $('#mini');
    const first = state.scene.frames.findIndex(f => f.quad);
    renderFrame(mini.getContext('2d', { willReadFrequently: true }), state.scene, first + PREVIEW_OFFSET, facePixels(faceCanvas()), {});
  });
}
window.addEventListener('resize', () => {
  if (document.body.dataset.screen === 'fit') { sizeEditor(); drawEditor(); }
});

$('#back').addEventListener('click', () => history.back());

// ---------- make the GIF ----------
$('#make').addEventListener('click', async () => {
  const scene = await scenePromise;
  if (!scene) return;
  if (!state.placed) placeInitial();
  const face = facePixels(faceCanvas());
  if (state.gifUrl) URL.revokeObjectURL(state.gifUrl);
  state.gifUrl = null; state.gifBlob = null;
  show('result');
  const out = $('#out'), result = $('#resultImg'), bar = $('#bar');
  document.body.classList.add('working');
  result.hidden = true; out.hidden = false;
  setProgress(0, T.statusScene);
  await document.fonts.load('40px Anton').catch(() => {});
  const frames = await renderAll(scene, face, { captions: state.captions ? captionList() : null }, p => setProgress(p * 0.3, T.statusScene));
  state.stopResult?.();
  state.stopResult = play(out, frames, scene.width, scene.height);
  setProgress(0.3, T.statusWrap);

  const worker = new Worker('/js/gif-worker.js', { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.progress != null) setProgress(0.3 + data.progress * 0.7, T.statusWrap);
    if (data.done) {
      worker.terminate();
      state.gifBlob = new Blob([data.bytes], { type: 'image/gif' });
      track('gif_created', { size_kb: Math.round(state.gifBlob.size / 1024), captions: state.captions ? 'on' : 'off', site_language: LANG });
      state.gifUrl = URL.createObjectURL(state.gifBlob);
      result.src = state.gifUrl;
      result.onload = () => {
        state.stopResult?.();
        out.hidden = true; result.hidden = false;
        document.body.classList.remove('working');
      };
      $('#save').href = state.gifUrl;
      setProgress(1, T.statusReady);
      // Add one to the site-wide counter shown in the footer.
      fetch('/api/count', { method: 'POST' }).then(r => r.json()).then(d => showCount(d.count)).catch(() => {});
    }
  };
  worker.onerror = e => {
    console.error(e);
    document.body.classList.remove('working');
    setProgress(0, T.statusError);
  };
  // Copied, not transferred: the preview above keeps playing these frames.
  worker.postMessage({
    width: scene.width, height: scene.height,
    frames: frames.map(f => ({ buffer: f.data.buffer, delay: f.delay })),
  });
  bar.focus?.();
});

function setProgress(p, label) {
  $('#bar').style.setProperty('--p', p);
  $('#status').textContent = label;
}

// ---------- share / save ----------
const shareBtn = $('#share');
const canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.gif', { type: 'image/gif' })] }));
if (!canShareFiles) shareBtn.hidden = true;
shareBtn.addEventListener('click', async () => {
  if (!state.gifBlob) return;
  const file = new File([state.gifBlob], 'woof.gif', { type: 'image/gif' });
  try {
    await navigator.share({ files: [file], title: 'WOOF!', text: T.shareText + ' ' + location.origin + HOME });
    track('share', { method: 'share_sheet', content_type: 'gif' });
  } catch (e) {
    if (e.name !== 'AbortError') toast(T.toastShare);
  }
});
$('#save').addEventListener('click', () => { if (state.gifBlob) track('gif_saved'); });
$('#again').addEventListener('click', () => { state.img = null; show('home'); });
$('#refit').addEventListener('click', () => history.back());

// ---------- language picker ----------
// Remembers the choice in a cookie so the server stops auto-picking a language.
$('#lang').addEventListener('change', e => {
  const slug = e.target.value;
  document.cookie = `lang=${slug}; path=/; max-age=31536000; SameSite=Lax`;
  location.href = slug === 'en' ? '/' : `/${slug}/`;
});

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
}
