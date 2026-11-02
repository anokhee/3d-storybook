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
export const AMOUNTS = { cliffs: 10, ponds: 4, roads: 2, patches: 16 };
export const AMOUNT_RANGE = { cliffs: [0, 24], ponds: [0, 12], roads: [0, 6], patches: [0, 36] };
// Everything grown is sized against the characters (1.31 high), not the
// ball: a cliff is a few of them across and a car and a half high, a road wide
// enough for a couple abreast. The ball's own radius stays free.
const C = 1.31;

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
  const cliffs = [], ponds = [], ramps = [], roads = []; // lobes, to keep things off (or aim them at)
  const out = { cliffs: [], ponds: [], roads: [], patches: [] };

  // CLIFFS: spread apart, each a rounded slab, turned any way. Every cliff
  // gets a ramp down to the ground: its head reaches `over` in past the
  // edge (past the edge's wander, so the deck docks on the lip) and the
  // rest runs out onto the ground, long enough to climb at GRADE. A wide
  // one may carry a second storey — a smaller cliff of the same height
  // again, set back on its top, with its own ramp down to the first, as
  // long as the top has room for (shorter and steeper on a narrow one).
  const H = round(C * 1.6, 0.1);
  const GRADE = 0.4, over = 1.5;
  const ramp = { ...RAMP_ARGS, width: round(C * 3, 0.5), length: round(H / GRADE + over, 0.5) };
  // a ramp's centre, for its head `over` in past an edge at `edge` along X (signed) and the rest running out beyond
  const rampAt = (F, edge, side, slide, length) => fromLocal(F, edge + side * (length / 2 - over), slide);
  for (let i = 0; i < count("cliffs"); i++) {
    const w = round(between(rand, C * 5, C * 12), 0.5), l = round(between(rand, C * 5, C * 12), 0.5);
    const dir = openGround(rand, [[cliffs, Math.hypot(w, l) / 2 + C * 4]]);
    if (!dir) break;
    const yaw = between(rand, -Math.PI, Math.PI);
    const corner = round(between(rand, 1, Math.min(w, l) / 2.5), 0.5);
    const wobble = round(between(rand, 0.3, 0.9), 0.05);
    out.cliffs.push(place("terrain-cliff", dir, yaw, { ...CLIFF_ARGS, width: w, length: l, corner, wobble, height: H }));
    const F = frameOf(dir, yaw, R);
    cliffs.push(lobeOf(dir, yaw, w, l, corner, R));
    // the ramp, off whichever side the die says, lined up across that edge
    // (slid along it, but clear of the middle when a storey's ramp comes down there)
    const side = rand() < 0.5 ? -1 : 1;
    const storey = w >= C * 10 && l >= C * 7 && rand() < 0.5;
    let slide = between(rand, -0.4, 0.4) * Math.max(0, l / 2 - ramp.width / 2 - corner / 2);
    if (storey) slide = Math.sign(slide || 1) * Math.max(Math.abs(slide), ramp.width + 1);
    const foot = rampAt(F, side * (w / 2), side, slide, ramp.length);
    out.cliffs.push(place("terrain-ramp", foot, yawAlong(foot, F.X.clone().multiplyScalar(side), R), { ...ramp }));
    ramps.push(lobeOf(foot, yawAlong(foot, F.X.clone().multiplyScalar(side), R), ramp.width, ramp.length, 0, R));
    // a storey, where there is room for it and a ramp beside it: set back
    // from the first ramp's side, so its ramp lands on the top, with its
    // foot (and the deck's run-off past it) short of the first cliff's edge
    if (storey) {
      const uw = round(w * 0.3, 0.5), ul = round(Math.min(l * 0.7, w * 0.6), 0.5);
      const cx = -side * w * 0.3;
      const top = fromLocal(F, cx, 0);
      out.cliffs.push(place("terrain-cliff", top, yaw, { ...CLIFF_ARGS, width: uw, length: ul, corner: Math.min(corner, uw / 3), wobble: wobble * 0.7, height: H, layer: 2 }));
      const edge = cx + side * (uw / 2); // the storey's edge on the ramp's side
      const room = w / 2 - side * edge - 2.5; // from there to the first cliff's edge, less the run-off and wander
      const length = Math.min(ramp.length, round(room + over, 0.5));
      const up = rampAt(F, edge, side, 0, length);
      out.cliffs.push(place("terrain-ramp", up, yawAlong(up, F.X.clone().multiplyScalar(side), R), { ...ramp, length }));
      ramps.push(lobeOf(up, yawAlong(up, F.X.clone().multiplyScalar(side), R), ramp.width, length, 0, R));
    }
  }

  // PONDS: water in the open, well off the cliffs; one patch, or two or
  // three run together (by blend) into a crooked shape.
  const water = patchOf("pond");
  for (let i = 0; i < count("ponds"); i++) {
    const w = round(between(rand, C * 5, C * 12), 0.5), l = round(between(rand, C * 4, C * 9), 0.5);
    const reach = Math.hypot(w, l) / 2;
    const dir = openGround(rand, [[cliffs, reach + C * 3], [ponds, reach + C * 5]]);
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
  const road = { ...patchOf("road"), width: 8 }; // a bit wider than the stock 6
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
      // (unless a cliff or its ramp is on that bank: then anywhere open)
      if (clearance(cliffs, at) <= W / 2 + L / 2 + 1.5 || clearance(ramps, at) <= W / 2 + L / 2 + 1) at = null;
    }
    if (!at) {
      at = openGround(rand, [[cliffs, W + 4], [ramps, W + L / 2], [ponds, W]]);
      yaw = between(rand, -Math.PI, Math.PI);
    }
    if (!at) break;
    const pieces = Math.round(between(rand, 6, 14));
    for (let k = 0; k < pieces; k++) {
      out.roads.push(place("cover-road", at, yaw, { ...road }));
      roads.push(lobeOf(at, yaw, W + 2, L + W + 2, W / 2 + 1, R)); // its tarmac and verge, rounded past both ends, as the game lays it
      const F = frameOf(at, yaw, R);
      const end = fromLocal(F, 0, L / 2);
      // the next piece goes on from this one's end: straight over water, else turned by whichever bend keeps it clear of the cliffs
      const onBridge = clearance(ponds, at) < W || clearance(ponds, end) < W / 2;
      const order = onBridge ? [0] : [...bends].sort(() => rand() - 0.5).sort((a, b) => Math.abs(a) - Math.abs(b) + (rand() - 0.5) * 0.3);
      let next = null;
      for (const b of order) {
        const heading = F.Z.clone().applyAxisAngle(F.d, b).normalize();
        const centre = fromLocal(frameOf(end, yawAlong(end, heading, R), R), 0, L / 2);
        // the whole piece clear of the cliffs and their ramps (its middle and both ends): a road runs round a cliff, not up its bank or over its ramp
        const pieceF = frameOf(centre, yawAlong(centre, heading, R), R);
        const clear = [0, -L / 4, L / 4, -L / 2, L / 2].every((u) => {
          const q = fromLocal(pieceF, 0, u);
          return clearance(cliffs, q) > W / 2 + 2.5 && clearance(ramps, q) > W / 2 + 1; // (2.5: the verge, the edge's wander, and a little)
        });
        if (clear) {
          next = { at: centre, yaw: yawAlong(centre, heading, R) };
          break;
        }
      }
      if (!next) break;
      ({ at, yaw } = next);
    }
  }

  // GROUNDCOVER: patches of grass mostly, some flowers and pebbles, any
  // size, anywhere but in the water or on a road (its verge too) — on the
  // ground or a cliff's top alike.
  const kinds = ["grass", "grass", "grass", "flowers", "flowers", "pebbles"];
  for (let i = 0; i < count("patches"); i++) {
    const type = pick(rand, kinds);
    const top = type === "grass" ? C * 8 : C * 5;
    const w = round(between(rand, C * 2, top), 0.5), l = round(between(rand, C * 2, top), 0.5);
    const reach = Math.hypot(w, l) / 2;
    // (none rather than one on a road, when the ground is that crowded)
    const dir = openGround(rand, [[ponds, reach], [roads, reach]], 80);
    if (!dir) continue;
    out.patches.push(place(`cover-${type}`, dir, between(rand, -Math.PI, Math.PI), { ...patchOf(type), width: w, length: l, corner: round(between(rand, 0.5, Math.min(w, l) / 2), 0.5) }));
  }
  // In stacking order: the grass first and the flowers and pebbles over it
  // (a later patch clears an earlier one of another type under it, so they
  // are beds in the grass, not cut away by it), the ponds over the patches,
  // the roads over everything, as roads are.
  const rank = (p) => (p.entry === "cover-grass" ? 0 : 1);
  out.patches.sort((a, b) => rank(a) - rank(b));
  return [...out.cliffs, ...out.patches, ...out.ponds, ...out.roads];
}
