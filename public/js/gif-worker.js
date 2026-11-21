// Encodes rendered frames into a looping GIF off the main thread.
import { GIFEncoder, quantize, applyPalette } from '/vendor/gifenc.esm.js';

// 4x4 ordered (Bayer) dither: a fixed, gentle pattern that breaks up colour
// banding in gradients without the frame-to-frame shimmer of error diffusion.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v / 16 - 0.47) * 4);
// A pixel that changed by less than this (per channel) since what's already on
// screen is left transparent, so the previous frame shows through. Most of each
// frame barely changes, so this shrinks the file a lot.
const KEEP_THRESHOLD = 8;
const TRANSPARENT = 255;   // palette slot reserved for "unchanged"

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

self.onmessage = ({ data }) => {
  const { frames, width, height } = data;
  const n = width * height;
  const gif = GIFEncoder();
  const shown = new Uint8ClampedArray(n * 3);   // what the viewer currently sees
  frames.forEach((f, k) => {
    const rgba = new Uint8ClampedArray(f.buffer);
    const palette = quantize(rgba, 255);
    const index = applyPalette(dither(rgba, width), palette);
    palette.push([0, 0, 0]);                      // slot 255: transparent
    for (let p = 0; p < n; p++) {
      const c = palette[index[p]], i = p * 4, s = p * 3;
      if (k > 0 &&
          Math.abs(rgba[i] - shown[s]) < KEEP_THRESHOLD &&
          Math.abs(rgba[i + 1] - shown[s + 1]) < KEEP_THRESHOLD &&
          Math.abs(rgba[i + 2] - shown[s + 2]) < KEEP_THRESHOLD) {
        index[p] = TRANSPARENT;
      } else {
        shown[s] = c[0]; shown[s + 1] = c[1]; shown[s + 2] = c[2];
      }
    }
    gif.writeFrame(index, width, height, k === 0
      ? { palette, delay: f.delay * 10 }
      : { palette, delay: f.delay * 10, transparent: true, transparentIndex: TRANSPARENT, dispose: 1 });
    self.postMessage({ progress: (k + 1) / frames.length });
  });
  gif.finish();
  const bytes = gif.bytes();
  self.postMessage({ done: true, bytes }, [bytes.buffer]);
};
