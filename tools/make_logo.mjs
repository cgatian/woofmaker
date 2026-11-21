// Draws the "WOOF [house] MAKEr" wordmark as plain SVG shapes, in the spirit of
// the Home Alone title: tall condensed Didone-style capitals (heavy vertical
// stems, hairline cross-strokes, flat serifs), a house between the words, and
// a lowercase letter at the end.
//
//   node tools/make_logo.mjs        -> writes public/logo.svg
//
// Glyphs are drawn on a grid where y=0 is the cap line and y=100 the baseline.
import { writeFileSync } from 'node:fs';

const STEM = 14;   // thick vertical
const HAIR = 4;    // hairline
const SERIF = 4;   // serif thickness

const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const poly = (...pts) => 'M' + pts.map(p => p.join(' ')).join('L') + 'Z';
// ellipse as a path (for evenodd holes)
const ell = (cx, cy, rx, ry) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;

const G = {
  W: {
    w: 86,
    d: [
      poly([4, 0], [4 + STEM, 0], [31, 100], [27, 100]),            // thick down
      poly([27, 100], [31, 100], [45, 0], [41, 0]),                 // hair up
      poly([38, 0], [38 + STEM, 0], [66, 100], [62, 100]),          // thick down
      poly([62, 100], [66, 100], [80, 0], [76, 0]),                 // hair up
      rect(0, 0, 23, SERIF), rect(35, 0, 21, SERIF), rect(71, 0, 15, SERIF),
    ],
  },
  O: {
    w: 60,
    // vertical stress: thick sides, hairline top and bottom
    d: [ell(30, 50, 30, 51.5) + ell(30, 50, 15, 47.5)],

  },
  F: {
    w: 54,
    d: [
      rect(6, 0, STEM, 100),
      rect(0, 0, 53, SERIF),
      poly([49, 0], [53, 0], [53, 27], [50, 27]),                   // top beak
      rect(20, 46, 22, HAIR),                                       // middle arm
      rect(40, 37, 3, 23),                                          // arm serif
      rect(0, 100 - SERIF, 31, SERIF),
    ],
  },
  M: {
    w: 88,
    d: [
      rect(7, 0, HAIR, 100),                                        // thin left stem
      poly([7, 0], [7 + STEM + 2, 0], [47, 100], [41, 100]),       // thick diagonal
      poly([41, 100], [45, 100], [72, 0], [68, 0]),                 // hair diagonal
      rect(68, 0, STEM, 100),                                       // thick right stem
      rect(0, 0, 24, SERIF), rect(64, 0, 24, SERIF),
      rect(0, 100 - SERIF, 18, SERIF), rect(62, 100 - SERIF, 26, SERIF),
    ],
  },
  A: {
    w: 64,
    d: [
      poly([5, 100], [9, 100], [32, 0], [28, 0]),                   // hair left
      poly([27, 0], [38, 0], [59, 100], [45, 100]),                 // thick right
      rect(15, 64, 35, HAIR),                                       // crossbar
      rect(0, 100 - SERIF, 15, SERIF), rect(41, 100 - SERIF, 23, SERIF),
    ],
  },
  K: {
    w: 66,
    d: [
      rect(6, 0, STEM, 100),
      poly([20, 55], [20, 61], [55, 0], [51, 0]),                   // hair arm
      poly([27, 49], [36, 40], [62, 100], [48, 100]),               // thick leg
      rect(0, 0, 27, SERIF), rect(0, 100 - SERIF, 27, SERIF),
      rect(43, 0, 20, SERIF), rect(44, 100 - SERIF, 22, SERIF),
    ],
  },
  E: {
    w: 58,
    d: [
      rect(6, 0, STEM, 100),
      rect(0, 0, 52, SERIF),
      poly([48, 0], [52, 0], [52, 25], [49, 25]),                   // top beak
      rect(20, 47, 22, HAIR),
      rect(40, 38, 3, 22),
      rect(0, 100 - SERIF, 57, SERIF),
      poly([53, 70], [57, 66], [57, 100], [53, 100]),               // bottom beak
    ],
  },
  r: {
    w: 42,
    d: [
      rect(6, 44, 13, 56),                                          // stem (x-height 44)
      rect(0, 44, 19, 3),                                           // top serif
      rect(0, 100 - SERIF, 30, SERIF),
      'M19 58C23 48 30 43.5 39 44L39 48C31 48 25 52 19 64Z',        // arm
      ell(35, 54, 7, 7.5),                                          // ball terminal
    ],
  },
  house: {
    w: 78,
    // main house with chimney and a window, plus a lower wing on the right
    d: [
      poly([0, 58], [24, 32], [48, 58], [44, 58], [44, 100], [4, 100], [4, 58]) +
        rect(27, 66, 7, 11),                                        // window (hole)
      rect(32, 34, 7, 18),                                          // chimney
      poly([42, 72], [57, 60], [78, 72], [75, 72], [75, 100], [42, 100]),
    ],

  },
};

const text = ['W', 'O', 'O', 'F', ' ', 'house', ' ', 'M', 'A', 'K', 'E', 'r'];
const GAP = 11, SPACE = 12;   // roomy, like the Home Alone title
let x = 0;
const parts = [];
for (const ch of text) {
  if (ch === ' ') { x += SPACE; continue; }
  const g = G[ch];
  // One <path> per stroke: overlapping strokes in a single path can cancel out
  // and leave slivers. Holes (O counter, house window) live inside one stroke.
  parts.push(`<g transform="translate(${x} 0)">` +
    g.d.map(d => `<path fill-rule="evenodd" d="${d}"/>`).join('') + '</g>');
  x += g.w + GAP;
}
const width = x - GAP;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -4 ${width + 4} 108" role="img" aria-label="WoofMaker">
<title>WoofMaker</title>
<g fill="#f6f1e7">
${parts.join('\n')}
</g>
</svg>
`;
writeFileSync(new URL('../public/logo.svg', import.meta.url), svg);
console.log(`wrote public/logo.svg (${width} x 100)`);
