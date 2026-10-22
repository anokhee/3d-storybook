import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// generates random 32-bit seed
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// e1 <= e0 (e.g. feather [0,0]) would divide 0/0 at x = e0; return a hard step instead
const smoothstep = (e0, e1, x) => {
  if (e1 <= e0) return x < e0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function smoothGeo(geometry) {
  const g = mergeVertices(geometry);
  if (g !== geometry) geometry.dispose();
  g.computeVertexNormals();
  return g;
}

// Value noise on a fixed lattice — what the lumps field is built on.
function nHash(x, y, z) {
  const f = (n) => n - Math.floor(n);
  let px = f(x * 0.3183099 + 0.71),
    py = f(y * 0.3183099 + 0.113),
    pz = f(z * 0.3183099 + 0.419);
  px *= 17;
  py *= 17;
  pz *= 17;
  return f(px * py * pz * (px + py + pz));
}
function nNoise(x, y, z) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const fx = x - ix,
    fy = y - iy,
    fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx),
    uy = fy * fy * (3 - 2 * fy),
    uz = fz * fz * (3 - 2 * fz);
  const c = (dx, dy, dz) => nHash(ix + dx, iy + dy, iz + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), ux),
    x10 = lerp(c(0, 1, 0), c(1, 1, 0), ux),
    x01 = lerp(c(0, 0, 1), c(1, 0, 1), ux),
    x11 = lerp(c(0, 1, 1), c(1, 1, 1), ux);
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz);
}
// Octaves of it, each half the size and `gain` of the weight. Returns roughly
// -1..+1, centered, so an amplitude reads as a bump height either way.
function nFbm(x, y, z, octaves, gain) {
  let sum = 0,
    amp = 1,
    norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * nNoise(x, y, z);
    norm += amp;
    x *= 2.03;
    y *= 2.03;
    z *= 2.03;
    amp *= gain;
  }
  return (sum / (norm || 1)) * 2 - 1;
}

// How far the middle of a facet sits below the sphere it approximates. The
// icosahedron's edge is about 1.05 radii, subdivision divides it, and a chord
// of length e on a unit sphere dips about e^2/8 under it. The face is placed
// on the SMOOTH sphere, so this is exactly the depth the facets would swallow
// it by: 0.0007 at detail 14, which is why nobody noticed — but 0.0055 at a
// detail of 5, which sinks a mouth.
const facetSag = (detail) => (1.0515 / detail) ** 2 / 8;

const FORWARD = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);

// ============================================================ sane randomization
const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Read one band. A pair is drawn inside it; a bare number is returned as-is —
// but the draw is consumed either way, so pinning a param to a constant leaves
// every param after it exactly where it was.
const reader = (range) => (band) => {
  const t = range(0, 1);
  return Array.isArray(band) ? lerp(band[0], band[1], t) : band;
};
// Where a band's own endpoints are needed rather than a sample from it.
const span = (band) => (Array.isArray(band) ? band : [band, band]);

// The counts a preset is willing to be dealt: its band's endpoints rounded,
// minus everything `omit` names. A band that omits its whole span falls back
// to the bottom of it — a doll with no antennae at all is a nicer failure than
// NaN.
const allowedCounts = (band, omit) => {
  const [lo, hi] = span(band).map(Math.round);
  const out = [];
  for (let c = lo; c <= hi; c++) if (!omit?.includes(c)) out.push(c);
  return out.length ? out : [lo];
};

// Pick one of them, EVENLY. Rounding a lerp across the band does not do that
// twice over: the two endpoints only own half a bucket each (a [1, 4] band
// rounds to 1 and 4 a sixth of the time and 2 and 3 a third), and an omitted
// count used to spill onto its neighbor and hand that one a double share. So
// the draw indexes the list instead of landing on the band — every count the
// preset allows comes up equally often, whatever `omit` took out.
//
// Still exactly ONE draw, so the stream stays aligned with the presets that
// omit nothing.
const drawCount = (draw, band, omit) => {
  const allowed = allowedCounts(band, omit);
  const i = Math.floor(draw([0, allowed.length]));
  return allowed[Math.min(allowed.length - 1, Math.max(0, i))];
};

// Pull one key out of a preset table. The draw is a position in the table
// rather than a name, so it costs exactly one number whichever table it is
// handed and the stream stays the same length under every outcome.
const pickKey = (draw, keys) =>
  keys[Math.min(keys.length - 1, Math.floor(draw([0, keys.length])))];

export {
  mulberry32,
  smoothstep,
  smoothGeo,
  nHash,
  nNoise,
  nFbm,
  facetSag,
  FORWARD,
  UP,
  lerp,
  pickKey,
  reader,
  span,
  allowedCounts,
  drawCount,
};
