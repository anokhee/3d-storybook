import * as THREE from "three";

import { toon } from "../adjectives/unlit/toon.js";

// THE PAVEMENT'S PAINT: a colour laid on with a light hand rather than
// flat — paving slabs `slab` across, each a shade off the next, a soft
// joint between them, and faint blotches and flecks over the lot, as if
// painted. One small tiling image (`tile` slabs square, `px` a slab),
// shared by everything paved; the shade differences are `vary`, the joints
// `joint`, the blotches `blot` (shares of full brightness taken off), all
// over the colour. The street's pavements wear it, and the strip of
// pavement out front of a Shop Interior.
export const PAVING = { slab: 1, tile: 4, px: 64, vary: 0.06, joint: 0.18, blot: 0.05 };

let image = null;
const imageOf = () => {
  if (image) return image;
  const P = PAVING, n = P.tile, size = n * P.px, c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  let seed = 99; const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const grey = (k) => `rgb(${k},${k},${k})`, of = (share) => Math.round(255 * (1 - share));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = grey(of(r() * P.vary)); g.fillRect(i * P.px, j * P.px, P.px, P.px); }
  // blotches: soft round dabs, a little darker, some wrapping the edges so it tiles
  for (let k = 0; k < 40; k++) {
    const x = r() * size, y = r() * size, rad = 6 + r() * 22, a = r() * P.blot;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      grad.addColorStop(0, `rgba(0,0,0,${a})`); grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    }
  }
  // flecks
  for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.05 + r() * 0.08})`; g.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 2); }
  // the joints: a soft dark line on each slab's edge (drawn at both edges of the image so it tiles)
  g.strokeStyle = `rgba(0,0,0,${P.joint})`; g.lineWidth = 2;
  for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * P.px, 0); g.lineTo(i * P.px, size); g.moveTo(0, i * P.px); g.lineTo(size, i * P.px); g.stroke(); }
  return (image = c);
};

// The paving's material in `hex`, for a box `width` (x) by `depth` (z):
// the image repeated so a slab is `slab` across whatever its size. Kept,
// by colour and size, so all the same are one.
const mats = new Map();
export function pavingMat(hex, width, depth) {
  const key = `${hex}:${width}:${depth}`;
  if (mats.has(key)) return mats.get(key);
  const P = PAVING, t = new THREE.CanvasTexture(imageOf());
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.repeat.set(width / (P.slab * P.tile), depth / (P.slab * P.tile));
  const m = toon(new THREE.Color(hex), { map: t });
  mats.set(key, m);
  return m;
}
