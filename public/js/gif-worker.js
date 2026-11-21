// Encodes rendered frames into a looping GIF off the main thread, in one pass.
import { GIFEncoder, quantize, applyPalette } from '/vendor/gifenc.esm.js';

const GIF_WIDTH = 360;   // px; the scene is rendered larger and scaled down
const COLORS = 128;      // palette size per frame (power of 2)
// A pixel that changed by less than this per channel since what's already on
// screen is left as-is. Most of each frame is still, so this keeps the file
// small (a typical GIF is a little over 1 MB).
const KEEP = 12;

// 4x4 ordered (Bayer) dither: a fixed, gentle pattern that breaks up colour
// banding in gradients without the frame-to-frame shimmer of error diffusion.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v / 16 - 0.47) * 4);

// Which source pixels (and how much of each) land in every destination pixel.
function spans(srcN, dstN) {
  const out = [];
  const r = srcN / dstN;
  for (let d = 0; d < dstN; d++) {
    const a = d * r, b = (d + 1) * r, list = [];
    for (let s = Math.floor(a); s < Math.min(srcN, Math.ceil(b)); s++) {
      list.push(s, (Math.min(s + 1, b) - Math.max(s, a)) / r);
    }
    out.push(list);
  }
  return out;
}

// Area-average downscale of RGBA pixels (same result in every browser).
function makeResizer(sw, sh, dw, dh) {
  if (sw === dw && sh === dh) return rgba => rgba;
  const xs = spans(sw, dw), ys = spans(sh, dh);
  const tmp = new Float32Array(dw * sh * 3);
  return rgba => {
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < dw; x++) {
        const l = xs[x]; let r = 0, g = 0, b = 0;
        for (let k = 0; k < l.length; k += 2) {
          const i = (y * sw + l[k]) * 4, w = l[k + 1];
          r += rgba[i] * w; g += rgba[i + 1] * w; b += rgba[i + 2] * w;
        }
        const o = (y * dw + x) * 3;
        tmp[o] = r; tmp[o + 1] = g; tmp[o + 2] = b;
      }
    }
    const out = new Uint8ClampedArray(dw * dh * 4);
    for (let y = 0; y < dh; y++) {
      const l = ys[y];
      for (let x = 0; x < dw; x++) {
        let r = 0, g = 0, b = 0;
        for (let k = 0; k < l.length; k += 2) {
          const i = (l[k] * dw + x) * 3, w = l[k + 1];
          r += tmp[i] * w; g += tmp[i + 1] * w; b += tmp[i + 2] * w;
        }
        const o = (y * dw + x) * 4;
        out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
      }
    }
    return out;
  };
}

function dither(rgba, width) {
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    const x = p % width, y = (p / width) | 0;
    const d = BAYER[((y & 3) << 2) | (x & 3)];
    out[i] = rgba[i] + d;
    out[i + 1] = rgba[i + 1] + d;
    out[i + 2] = rgba[i + 2] + d;
    out[i + 3] = 255;
  }
  return out;
}

function encode(frames, sw, sh, onProgress) {
  const w = Math.min(GIF_WIDTH, sw), h = Math.round(w * sh / sw), n = w * h;
  const resize = makeResizer(sw, sh, w, h);
  const transparent = COLORS - 1;               // palette slot meaning "unchanged"
  const gif = GIFEncoder();
  const shown = new Uint8ClampedArray(n * 3);   // what the viewer currently sees
  frames.forEach((f, k) => {
    const rgba = resize(new Uint8ClampedArray(f.buffer));
    const palette = quantize(rgba, COLORS - 1);
    const index = applyPalette(dither(rgba, w), palette);
    while (palette.length < COLORS) palette.push([0, 0, 0]);
    // Pixels that barely changed since the last frame stay transparent, so the
    // previous frame shows through. Most of each frame is still, so this is
    // where nearly all the file-size saving comes from.
    for (let p = 0; p < n; p++) {
      const c = palette[index[p]], i = p * 4, s = p * 3;
      if (k > 0 &&
          Math.abs(rgba[i] - shown[s]) < KEEP &&
          Math.abs(rgba[i + 1] - shown[s + 1]) < KEEP &&
          Math.abs(rgba[i + 2] - shown[s + 2]) < KEEP) {
        index[p] = transparent;
      } else {
        shown[s] = c[0]; shown[s + 1] = c[1]; shown[s + 2] = c[2];
      }
    }
    gif.writeFrame(index, w, h, k === 0
      ? { palette, delay: f.delay * 10 }
      : { palette, delay: f.delay * 10, transparent: true, transparentIndex: transparent, dispose: 1 });
    onProgress((k + 1) / frames.length);
  });
  gif.finish();
  return { bytes: gif.bytes(), width: w, height: h };
}

self.onmessage = ({ data }) => {
  const { frames, width, height } = data;
  const result = encode(frames, width, height, progress => self.postMessage({ progress }));
  self.postMessage({ done: true, ...result }, [result.bytes.buffer]);
};
