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
