// A seeded generator, so a scattered world comes back the SAME on reload.
// Math.random would reshuffle every blade of grass on every refresh, which
// makes tuning impossible — you could never tell your change from the noise.
//
// (The dolly grid has its own copy of this in renderGrid/utils.js. Kept
// separate on purpose: world/ is the r3f world's own data layer and does not
// reach into the vanilla renderer.)
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A roll inside [lo, hi].
export const between = ([lo, hi], rand) => lo + rand() * (hi - lo);

// A point's own random number in [0, 1), the same every time for the same
// whole-number cell and `seed`: for markings scattered over a surface.
export function hash3(x, y, z, seed = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth noise in [-1, 1] over space, a cell a unit across: the cells'
// own numbers eased between. For wobbling an edge so it reads as drawn.
export function noise3(x, y, z, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const ease = (t) => t * t * (3 - 2 * t);
  const u = ease(x - ix), v = ease(y - iy), w = ease(z - iz);
  const lerp = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz, seed);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w) * 2 - 1;
}
