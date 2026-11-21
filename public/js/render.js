// Compositing: draws a scene frame, warps the face photo into Kevin's picture
// frame, puts his thumbs back on top, and adds captions.

export const FACE_W = 300;               // working size of the face photo (~1.5x its size in the scene)
export const FACE_H = Math.round(FACE_W / 0.63);

export async function loadScene(base = '/scene/') {
  const scene = await (await fetch(base + 'scene.json')).json();
  [scene.frameImgs, scene.thumbImgs] = await Promise.all([
    Promise.all(scene.frameSheets.map(f => loadImg(base + f))),
    Promise.all(scene.thumbSheets.map(f => loadImg(base + f))),
  ]);
  return scene;
}

// Draws tile `i` from a set of sprite sheets onto ctx at 0,0.
function drawTile(ctx, sheets, scene, i) {
  const { width: W, height: H, cols, perSheet } = scene;
  const local = i % perSheet;
  ctx.drawImage(sheets[Math.floor(i / perSheet)], (local % cols) * W, Math.floor(local / cols) * H, W, H, 0, 0, W, H);
}

export function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load ' + src));
    img.src = src;
  });
}

// Homography mapping the unit square (0,0)(1,0)(1,1)(0,1) onto quad TL,TR,BR,BL.
function squareToQuad(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  let g = 0, h = 0;
  if (sx !== 0 || sy !== 0) {
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
  }
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0,
          y1 - y0 + g * y1, y3 - y0 + h * y3, y0,
          g, h, 1];
}

function invert3(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det,
          B / det, (a * i - c * g) / det, -(a * f - c * d) / det,
          C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}

const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

// Warp face pixels (Uint8ClampedArray FACE_W x FACE_H) into `quad` of the frame.
function warpFace(frame, W, H, quad, face, seed) {
  const M = invert3(squareToQuad(quad));
  const xs = quad.map(p => p[0]), ys = quad.map(p => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(W, Math.ceil(Math.max(...xs)));
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(H, Math.ceil(Math.max(...ys)));
  const qw = (dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2;
  const qh = (dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2;
  const fw = FACE_W, fh = FACE_H;
  let rnd = seed * 9301 + 49297;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w = M[6] * px + M[7] * py + M[8];
      const u = (M[0] * px + M[1] * py + M[2]) / w;
      const v = (M[3] * px + M[4] * py + M[5]) / w;
      const cu = Math.min(u, 1 - u) * qw + 0.5, cv = Math.min(v, 1 - v) * qh + 0.5;
      if (cu <= 0 || cv <= 0) continue;
      const alpha = Math.min(1, cu) * Math.min(1, cv);
      // bilinear sample
      const fx = Math.min(fw - 1.001, Math.max(0, u * fw - 0.5));
      const fy = Math.min(fh - 1.001, Math.max(0, v * fh - 0.5));
      const ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy;
      const i00 = (iy * fw + ix) * 4, i10 = i00 + 4, i01 = i00 + fw * 4, i11 = i01 + 4;
      rnd = (rnd * 9301 + 49297) % 233280;
      const grain = (rnd / 233280 - 0.5) * 5;
      const o = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = face[i00 + c] + (face[i10 + c] - face[i00 + c]) * ax;
        const bot = face[i01 + c] + (face[i11 + c] - face[i01 + c]) * ax;
        const val = top + (bot - top) * ay + grain;
        frame[o + c] = frame[o + c] + (val - frame[o + c]) * alpha;
      }
    }
  }
}

// Give the face photo a light warm tint so it sits in that 1990 bedroom,
// without darkening it.
export function gradeFace(data) {
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    r = (r - 128) * 0.96 + 128; g = (g - 128) * 0.96 + 128; b = (b - 128) * 0.96 + 128;
    data[i] = r * 1.0 + 6;
    data[i + 1] = g * 0.97 + 3;
    data[i + 2] = b * 0.9 + 2;
  }
  return data;
}

// Renders the face canvas (any size, aspect 0.63) into graded FACE_W x FACE_H pixels.
export function facePixels(faceCanvas) {
  const c = document.createElement('canvas');
  c.width = FACE_W; c.height = FACE_H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(faceCanvas, 0, 0, FACE_W, FACE_H);
  return gradeFace(ctx.getImageData(0, 0, FACE_W, FACE_H).data);
}

function drawCaption(ctx, text, W, H) {
  // Chinese, Japanese, Korean and Cyrillic aren't in the meme font, so those
  // captions use the device's own heavy font instead.
  const otherScript = /[\u0400-\u04ff\u3000-\u9fff\uac00-\ud7af]/.test(text);
  const family = otherScript
    ? '900 SIZEpx system-ui, "PingFang SC", "Hiragino Sans", "Apple SD Gothic Neo", "Microsoft YaHei", "Yu Gothic", "Malgun Gothic", "Noto Sans CJK KR", sans-serif'
    : 'SIZEpx Anton, Impact, "Arial Black", sans-serif';
  let size = Math.round(H * (text.length < 8 ? 0.17 : 0.105));
  ctx.font = family.replace('SIZE', size);
  // Shrink long captions (some translations run longer) to fit the frame.
  const wide = ctx.measureText(text).width, room = W * 0.92;
  if (wide > room) {
    size = Math.floor(size * room / wide);
    ctx.font = family.replace('SIZE', size);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.16);
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#fff';
  const y = H - Math.round(H * 0.07);
  ctx.strokeText(text, W / 2, y);
  ctx.fillText(text, W / 2, y);
}

// Draws frame `i` into ctx (sized scene.width x scene.height).
export function renderFrame(ctx, scene, i, face, opts = {}) {
  const { width: W, height: H } = scene;
  const f = scene.frames[i];
  drawTile(ctx, scene.frameImgs, scene, i);
  if (f.quad && face) {
    const img = ctx.getImageData(0, 0, W, H);
    warpFace(img.data, W, H, f.quad, face, i + 1);
    ctx.putImageData(img, 0, 0);
    drawTile(ctx, scene.thumbImgs, scene, f.thumbs);
  }
  if (opts.captions) {   // [{ text, start, end }] in seconds from the first frame
    const cap = opts.captions.find(c => f.t >= c.start && f.t < c.end);
    if (cap) drawCaption(ctx, cap.text, W, H);
  }
}

// Renders every frame; returns [{ data: Uint8ClampedArray, delay }].
export async function renderAll(scene, face, opts, onProgress) {
  const c = document.createElement('canvas');
  c.width = scene.width; c.height = scene.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const out = [];
  for (let i = 0; i < scene.frames.length; i++) {
    renderFrame(ctx, scene, i, face, opts);
    out.push({ data: ctx.getImageData(0, 0, c.width, c.height).data, delay: scene.frames[i].delay });
    if (i % 6 === 5) { onProgress?.((i + 1) / scene.frames.length); await new Promise(r => setTimeout(r)); }
  }
  onProgress?.(1);
  return out;
}

// Plays rendered frames on a canvas in a loop. Returns a stop function.
export function play(canvas, frames, W, H) {
  const ctx = canvas.getContext('2d');
  const imgs = frames.map(f => new ImageData(f.data, W, H));
  let i = 0, next = performance.now(), raf;
  const tick = now => {
    if (now >= next) {
      ctx.putImageData(imgs[i], 0, 0);
      next = now + frames[i].delay * 10;
      i = (i + 1) % imgs.length;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
