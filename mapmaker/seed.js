// THE TERRAIN SEED: a whole ground grown from a word, instead of drawn
// piece by piece. `growTerrain(seed, R, amounts)` deals out the same shape
// placements the terrain tools make by hand — cliffs (some with a second
// storey) with a ramp up each, ponds, roads winding between the cliffs and
// crossing the ponds (a road over water is a BRIDGE: the game builds the
// deck), and patches of grass, flowers and pebbles — as ordinary
// placements, so what grows can be picked, moved, reshaped or deleted like
// anything drawn. The same seed on the same ball grows the same ground; a
// different word, a different one. Everything is measured in world units
// along the ball's surface, the way the shapes themselves are
// (../runtime/cover.js).
import * as THREE from "three";
import { frameOf, fromLocal, lobeDistance, mulberry32, patchOf } from "../runtime/cover.js";
import { CLIFF_ARGS, RAMP_ARGS } from "../runtime/terrain.js";

// How much of each the seed grows, before the ball's size scales it (the
// car game's ball, radius 36, is the measure), and each amount's range.
export const AMOUNTS = { cliffs: 5, ponds: 3, roads: 2, patches: 10 };
export const AMOUNT_RANGE = { cliffs: [0, 12], ponds: [0, 8], roads: [0, 6], patches: [0, 24] };

const hashOf = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
};
// A seed to offer: two words and a number, easy to read back and retype.
const WORDS1 = ["mossy", "windy", "sunny", "quiet", "little", "stony", "misty", "golden", "hollow", "lofty", "sleepy", "wild"];
const WORDS2 = ["knoll", "meadow", "ridge", "pond", "heath", "orchard", "bluff", "dale", "moor", "glen", "terrace", "pasture"];
export const rollSeed = (rand = Math.random) => `${WORDS1[Math.floor(rand() * WORDS1.length)]}-${WORDS2[Math.floor(rand() * WORDS2.length)]}-${Math.floor(rand() * 90 + 10)}`;

// A bearing anywhere on the ball, evenly.
const anywhere = (rand) => {
  const u = rand() * 2 - 1, phi = rand() * 2 * Math.PI, s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(s * Math.cos(phi), u, s * Math.sin(phi));
};
const between = (rand, lo, hi) => lo + rand() * (hi - lo);
const round = (v, step) => Math.round(v / step) * step;
const pick = (rand, list) => list[Math.floor(rand() * list.length)];
// The turn, at a bearing, that lines a placement's length (its z) up with
// a direction `along` carried from somewhere near (as the store lays track).
const yawAlong = (at, along, R) => {
  const base = frameOf(at, 0, R);
  const Z = along.clone().addScaledVector(at, -along.dot(at)).normalize();
  return Math.atan2(Z.dot(base.X), Z.dot(base.Z));
};
const lobeOf = (dir, yaw, w, l, r, R) => ({ frame: frameOf(dir, yaw, R), hw: w / 2, hl: l / 2, r: Math.min(r, w / 2, l / 2) });
// How far a bearing is from the nearest of some lobes' edges (negative inside).
const clearance = (lobes, dir) => lobes.reduce((m, l) => Math.min(m, lobeDistance(l, dir)), Infinity);
// A bearing on open ground: this far clear of every lobe given, or null after a fair try.
const openGround = (rand, keep, tries = 40) => {
  for (let t = 0; t < tries; t++) {
    const d = anywhere(rand);
    if (keep.every(([lobes, by]) => clearance(lobes, d) > by)) return d;
  }
  return null;
};

export function growTerrain(seed, R = 36, amounts = {}) {
  const A = { ...AMOUNTS, ...amounts };
  const rand = mulberry32(hashOf(String(seed)) || 1);
  let n = 0;
  const id = () => `seed-${(hashOf(String(seed)) % 1296).toString(36)}${(n++).toString(36)}${Math.floor(rand() * 1296).toString(36)}`;
  const place = (entry, dir, yaw, args) => ({ id: id(), entry, args, dir: dir.toArray(), yaw, scale: 1, lift: 0, role: "prop" });
  // a bigger ball holds more; a smaller one less, down to a few
  const scale = Math.min(4, Math.max(0.2, (R / 36) ** 2));
  const count = (k) => Math.round((A[k] ?? 0) * scale);
  const cliffs = [], ponds = []; // lobes, to keep things off (or aim them at)
  const out = { cliffs: [], ponds: [], roads: [], patches: [] };

  // CLIFFS: spread apart, each a rounded slab, turned any way. Every cliff
  // gets a ramp down to the ground, centred on its edge so half lies on the
  // top and half runs out onto the ground. A wide one may carry a second
  // storey — a smaller cliff of twice the height set back on its top, with
  // its own ramp down to the first.
  const H = CLIFF_ARGS.height;
  for (let i = 0; i < count("cliffs"); i++) {
    const w = round(between(rand, 12, 28), 0.5), l = round(between(rand, 12, 28), 0.5);
    const dir = openGround(rand, [[cliffs, Math.hypot(w, l) / 2 + 6]]);
    if (!dir) break;
    const yaw = between(rand, -Math.PI, Math.PI);
    const corner = round(between(rand, 2, Math.min(w, l) / 2.5), 0.5);
    const wobble = round(between(rand, 0.3, 0.9), 0.05);
    out.cliffs.push(place("terrain-cliff", dir, yaw, { ...CLIFF_ARGS, width: w, length: l, corner, wobble, height: H }));
    const F = frameOf(dir, yaw, R);
    cliffs.push(lobeOf(dir, yaw, w, l, corner, R));
    // the ramp, off whichever side the die says, lined up across that edge
    const side = rand() < 0.5 ? -1 : 1;
    const slide = between(rand, -0.4, 0.4) * (l / 2 - RAMP_ARGS.width / 2 - corner / 2);
    const foot = fromLocal(F, side * (w / 2), slide);
    out.cliffs.push(place("terrain-ramp", foot, yawAlong(foot, F.X.clone().multiplyScalar(side), R), { ...RAMP_ARGS }));
    // a storey, where there is room for it and a ramp beside it
    if (w >= 20 && l >= 14 && rand() < 0.5) {
      const uw = round(w * 0.5, 0.5), ul = round(Math.min(l * 0.7, w * 0.6), 0.5);
      const cx = -side * w * 0.2; // set back from the first ramp's side, so the storey's ramp lands on the top
      const top = fromLocal(F, cx, 0);
      out.cliffs.push(place("terrain-cliff", top, yaw, { ...CLIFF_ARGS, width: uw, length: ul, corner: Math.min(corner, uw / 3), wobble: wobble * 0.7, height: round(H * 2, 0.1) }));
      const up = fromLocal(F, cx + side * (uw / 2), 0);
      out.cliffs.push(place("terrain-ramp", up, yawAlong(up, F.X.clone().multiplyScalar(side), R), { ...RAMP_ARGS }));
    }
  }

  // PONDS: water in the open, well off the cliffs; one patch, or two or
  // three run together (by blend) into a crooked shape.
  const water = patchOf("pond");
  for (let i = 0; i < count("ponds"); i++) {
    const w = round(between(rand, 10, 22), 0.5), l = round(between(rand, 8, 18), 0.5);
    const reach = Math.hypot(w, l) / 2;
    const dir = openGround(rand, [[cliffs, reach + 5], [ponds, reach + 8]]);
    if (!dir) break;
    const yaw = between(rand, -Math.PI, Math.PI);
    const F = frameOf(dir, yaw, R);
    const pieces = [{ x: 0, z: 0, w, l }];
    for (let k = 0, extra = Math.floor(rand() * 3); k < extra; k++)
      pieces.push({ x: between(rand, -0.5, 0.5) * w, z: between(rand, -0.5, 0.5) * l, w: round(w * between(rand, 0.4, 0.7), 0.5), l: round(l * between(rand, 0.4, 0.7), 0.5) });
    for (const q of pieces) {
      const at = fromLocal(F, q.x, q.z);
      const corner = round(Math.min(q.w, q.l) / between(rand, 2, 3), 0.5);
      out.ponds.push(place("cover-pond", at, yaw, { ...water, width: q.w, length: q.l, corner }));
      ponds.push(lobeOf(at, yaw, q.w, q.l, corner, R));
    }
  }

  // ROADS: laid like track, piece after piece, each turned a little from the
  // last, bending harder where a cliff is in the way and stopping when there
  // is no way round. A road starts on open ground — or, more often than not
  // where there is a pond, on its far bank, headed straight across it: the
  // pieces over the water are a BRIDGE, and a bridge runs straight.
  const road = patchOf("road");
  const L = road.length, W = road.width;
  const bends = [0, 0, 0, 0.25, -0.25, 0.5, -0.5, 0.85, -0.85];
  for (let i = 0; i < count("roads"); i++) {
    let at = null, yaw = 0;
    const pond = ponds.length && rand() < 0.7 ? pick(rand, ponds) : null;
    if (pond) {
      const across = rand() < 0.5 ? pond.frame.X : pond.frame.Z;
      const span = across === pond.frame.X ? pond.hw : pond.hl;
      at = fromLocal(pond.frame, ...(across === pond.frame.X ? [-(span + L), 0] : [0, -(span + L)]));
      yaw = yawAlong(at, across, R);
    } else {
      at = openGround(rand, [[cliffs, W + 4], [ponds, W]]);
      yaw = between(rand, -Math.PI, Math.PI);
    }
    if (!at) break;
    const pieces = Math.round(between(rand, 6, 14));
    for (let k = 0; k < pieces; k++) {
      out.roads.push(place("cover-road", at, yaw, { ...road }));
      const F = frameOf(at, yaw, R);
      const end = fromLocal(F, 0, L / 2);
      // the next piece goes on from this one's end: straight over water, else turned by whichever bend keeps it clear of the cliffs
      const onBridge = clearance(ponds, at) < W || clearance(ponds, end) < W / 2;
      const order = onBridge ? [0] : [...bends].sort(() => rand() - 0.5).sort((a, b) => Math.abs(a) - Math.abs(b) + (rand() - 0.5) * 0.3);
      let next = null;
      for (const b of order) {
        const heading = F.Z.clone().applyAxisAngle(F.d, b).normalize();
        const centre = fromLocal(frameOf(end, yawAlong(end, heading, R), R), 0, L / 2);
        if (clearance(cliffs, centre) > W / 2 + 1.5) {
          next = { at: centre, yaw: yawAlong(centre, heading, R) };
          break;
        }
      }
      if (!next) break;
      ({ at, yaw } = next);
    }
  }

  // GROUNDCOVER: patches of grass mostly, some flowers and pebbles, any
  // size, anywhere but in the water — on the ground or a cliff's top alike.
  const kinds = ["grass", "grass", "grass", "flowers", "flowers", "pebbles"];
  for (let i = 0; i < count("patches"); i++) {
    const type = pick(rand, kinds);
    const w = round(between(rand, 5, type === "grass" ? 18 : 12), 0.5), l = round(between(rand, 5, type === "grass" ? 18 : 12), 0.5);
    const dir = openGround(rand, [[ponds, Math.hypot(w, l) / 2]], 20) ?? anywhere(rand);
    out.patches.push(place(`cover-${type}`, dir, between(rand, -Math.PI, Math.PI), { ...patchOf(type), width: w, length: l, corner: round(between(rand, 1, Math.min(w, l) / 2), 0.5) }));
  }
  // In stacking order: the ponds over the patches (water clears what is
  // under it), the roads over everything, as roads are.
  return [...out.cliffs, ...out.patches, ...out.ponds, ...out.roads];
}
