// Encodes rendered frames into a looping GIF off the main thread.
import { GIFEncoder, quantize, applyPalette } from '/vendor/gifenc.esm.js';

self.onmessage = ({ data }) => {
  const { frames, width, height } = data;
  const gif = GIFEncoder();
  frames.forEach((f, i) => {
    const rgba = new Uint8ClampedArray(f.buffer);
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, width, height, { palette, delay: f.delay * 10 });
    self.postMessage({ progress: (i + 1) / frames.length });
  });
  gif.finish();
  const bytes = gif.bytes();
  self.postMessage({ done: true, bytes }, [bytes.buffer]);
};
