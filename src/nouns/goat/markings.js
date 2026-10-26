// MARKINGS: the zebra's stripes and the giraffe's patches, each a `mark`
// for world/paint.js's paintWhere: how far a point on the lump is inside
// the paint (+) or out of it (-). Both read the body plan Goat.jsx lays
// out (its `frame`): the body block, the legs under it, the neck leant up
// out of its front and the head nosing down on that.
import { hash3, noise3 } from "../../world/random.js";

// Which part a point is on: "head", "neck", "leg" or "body", and where
// it is in that part's own terms — along the head from its middle and
// up it, along the neck from its foot, or up from the ground.
function partOf(F, p) {
  const { half, head, tilt, neckFoot, neckUp, top, bottom } = F;
  const hy = p.y - head[1], hz = p.z - head[2];
  const up = hy * Math.cos(tilt) + hz * Math.sin(tilt), along = -hy * Math.sin(tilt) + hz * Math.cos(tilt);
  if (Math.abs(p.x) < half[0] + 0.03 && Math.abs(up) < half[1] + 0.03 && along > -half[2] - 0.03) return { part: "head", along, up };
  const t = (p.y - neckFoot[1]) * neckUp[1] + (p.z - neckFoot[2]) * neckUp[2];
  if (t > top - neckFoot[1] - 0.03) return { part: "neck", along: t };
  if (p.y < bottom) return { part: "leg" };
  return { part: "body", h: (p.y - bottom) / (top - bottom) };
}

// How far inside the nearest of a row of bands `period` apart along `u`,
// each `duty` of the period wide
const band = (u, period, duty) => (period * duty) / 2 - Math.abs(u - Math.round(u / period) * period);

// THE ZEBRA: black stripes all the way round, about as wide as the white
// between them. Up the barrel they stand upright, a little wavy and
// widest over the back; over the haunch they sweep round in broad arcs
// about the stifle, as a zebra's do, meeting the barrel's in a saddle;
// a thin line runs down the spine. The neck's are broad rings, the
// face's thin ones across the bridge of the nose (the muzzle is painted
// black over), and the legs' thin rings all the way down to the hooves.
const ZEBRA = { body: 0.078, neck: 0.075, head: 0.036, leg: 0.036, haunch: 0.18, wobble: 0.012 };
export function zebraMark(F, seed = 7) {
  const Z = ZEBRA, hind = -F.B.length * Z.haunch;
  const stifle = [F.bottom + 0.15 * F.B.height, hind + 0.05]; // the middle of the haunch's arcs, (y, z)
  return (p) => {
    const wob = Z.wobble * noise3(p.x * 12, p.y * 12, p.z * 12, seed);
    const at = partOf(F, p);
    if (at.part === "head") return at.along > F.half[2] - 0.01 ? -1 : band(at.along + wob, Z.head, 0.5);
    if (at.part === "neck") return band(at.along + wob, Z.neck, 0.55);
    if (at.part === "leg") return p.y < 0.07 ? -1 : band(p.y + wob * 0.5, Z.leg, 0.5);
    const spine = p.y > F.top - 0.05 ? 0.012 - Math.abs(p.x) : -1;
    const stripe = p.z > hind
      ? band(p.z + wob + 0.025 * Math.sin(at.h * 4), Z.body, 0.42 + 0.14 * at.h)
      : band(Math.hypot(p.y - stifle[0], p.z - stifle[1]) + wob, Z.body * 0.95, 0.5);
    return Math.max(stripe, spine);
  };
}

// How far a point is from the edge of the patch it is in: the patches a
// net of cells, each round a point jittered off a grid `cell` across
// (their walls halfway between neighbouring points), so they come out
// irregular polygons fitted close, as a giraffe's are.
function inPatch(x, y, z, cell, seed) {
  const gx = Math.floor(x / cell), gy = Math.floor(y / cell), gz = Math.floor(z / cell);
  let d1 = Infinity, d2 = Infinity;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    const cx = gx + i, cy = gy + j, cz = gz + k;
    const px = (cx + 0.1 + 0.8 * hash3(cx, cy, cz, seed)) * cell;
    const py = (cy + 0.1 + 0.8 * hash3(cx, cy, cz, seed + 1)) * cell;
    const pz = (cz + 0.1 + 0.8 * hash3(cx, cy, cz, seed + 2)) * cell;
    const d = Math.hypot(x - px, y - py, z - pz);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return (d2 - d1) / 2;
}

// THE GIRAFFE: big brown patches, irregular polygons fitted close with
// a thin pale web between them, the reticulated giraffe's: largest over
// the body, smaller up the neck and smaller still down the legs, which
// go plain below the knee, as does the face; the belly's are spared a
// little web wider.
const GIRAFFE = { body: 0.13, neck: 0.1, leg: 0.075, web: 0.018, knee: 0.45, wobble: 0.006 };
export function giraffeMark(F, seed = 11) {
  const G = GIRAFFE;
  return (p) => {
    const at = partOf(F, p);
    if (at.part === "head" || p.y < F.legTop * G.knee) return -1;
    const cell = at.part === "leg" ? G.leg : at.part === "neck" ? G.neck : G.body;
    const web = at.part === "body" && at.h < 0.2 ? G.web * 1.6 : G.web;
    const w = G.wobble * noise3(p.x * 20, p.y * 20, p.z * 20, seed);
    return inPatch(p.x + w, p.y - w, p.z + w, cell, seed) - web / 2;
  };
}
