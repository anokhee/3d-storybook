// TERRAIN: plateaus and ramps laid on a map, the way groundcover patches
// are (cover.js) — rounded rectangles on the ball that run together — but
// these raise the ground. Plain three.js, no React; the editor
// (mapmaker/Terrain.jsx) and a game (the car game's planet.js) both read
// this, so they agree on where the ground is. A game copies it beside its
// own code, as it does mapLoader.js and cover.js.
//
// A CLIFF is a placement whose entry is "terrain-cliff": its bearing is
// the middle of its flat top, its yaw its turn, and its args its shape —
// `width` and `length` in world units, `corner` how round, `blend` how
// near another cliff OF THE SAME HEIGHT must come to run together,
// `height` how far the top stands over the ground, `wobble` how much its
// edge wanders. Cliffs of one height make a TIER: inside its edge the
// ground is the tier's height, a bank at the edge (see CLIFF.wall).
// A cliff of a greater height laid over one is a second storey. (Older maps
// called these "terrain-plateau"; they are read as cliffs.)
//
// A RAMP is "terrain-ramp": a rectangle `width` across and `length` long.
// Its two ends are read off the tiers: whichever end lies on higher ground
// is the HEAD, the other the foot, and the deck climbs the whole length
// from the foot's ground to the head's — at one grade, easing out of the
// ground at the foot and into the top at the head over CLIFF.ease (see
// rampProfile) — with a kerb along each side. Where
// the ramp lies over a cliff it is cut INTO it, a notch with the wall
// running round, as Animal Crossing's inclines are. So a ramp is drawn
// with one end on the ground and the other over the cliff, either way
// round, and it joins the two. A ramp that lies all on one level does
// nothing.
//
// A CUT is "terrain-cut": a rounded rectangle that takes ground AWAY — cut
// out of one tier, the one of height `tier` (an arg, set when the cut is
// made: the top it was cut into; without one, the topmost cliff holding its
// middle), so the ground inside it falls to whatever stands under that
// tier. The editor's sculpt brush lays these with its right click. The
// cliffs and cuts of a tier are taken in the order they were placed: a
// cliff laid after a cut fills it back in.
//
// THE FIELD. `terrainField(lobes)` gives `rise(dir, hard)`: how far above
// the base ground a bearing is. The skin of a ball (`hard` false) eases up
// to a tier's top over CLIFF.wall inside the edge (a game's wall mesh
// stands over the easing); what STANDS on the ground (`hard` true) takes
// the edge as a step and the ramps' kerbs as kerbs.
import * as THREE from "three";
import { frameOf, toLocal, fromLocal, lobeDistance, roundedRect, smin } from "./cover.js";

export const TERRAIN = {
  cliff: { label: "cliff", tint: "#B0A562" },
  ramp: { label: "ramp", tint: "#C9A67E" },
  cut: { label: "cut", tint: "#B5473A" },
};
// `layer` (1–3): a cliff laid over another is a layer above it, its `height` the storey's own, on top of the one beneath's (see terrainLobes)
export const CLIFF_ARGS = { width: 14, length: 14, corner: 5, blend: 2.5, height: 2.1, wobble: 0.5, layer: 1 };
export const MAX_LAYERS = 3;
export const RAMP_ARGS = { width: 6, length: 10, road: false }; // `road`: the deck is a road (tarmac, dashes, a railing) not dirt
export const CUT_ARGS = { width: 8, length: 8, corner: 4 }; // (`tier`, the height cut into, is set when the cut is made)
// The cliffs' shape, shared so the editor and a game put the ground in
// the same place.
export const CLIFF = {
  wall: 4, // the skin eases up to a tier's top over this, inside its edge: a BANK, not a wall. A storey of the stock height climbs it at about 0.5 on average, 0.8 at its steepest mid-way (1.5× the average) — under `climb`, so a character (and a car) walks up it. A storey taller than about 2.9 is steeper than `climb` mid-way, and a wall again.
  wallEase: 0.8, // …but under a WALL (a step too steep to walk, isWall) the skin is hidden, and climbs to the top over only this: a narrow cliff, or one sculpted of small stamps, is flat on top right up to its wall, not a dome sunk inside its rim
  cap: 0.5, // the wall mesh's flat cap, inside the edge past the easing
  feather: 0.8, // a ramp's deck eases down its sides over this, inside its edge, under the kerb
  kerb: 0.22, // how high a ramp's kerb stands off its deck
  ease: 1.5, // a ramp's deck eases out of the ground at its foot and into the top at its head over this far (at most a quarter of its length), straight at one grade between
  climb: 1.1, // rise over run past which a step is a wall, not a slope (what a game refuses to walk up)
  wobbleScale: 0.1, // how fine the edge's wander is, per world unit
};
// THE WALLS' RECIPE, shared so the editor draws the wall a game builds (the
// car game's planet.js, CLIFFS.walls). Where a tier's step is too steep to
// walk — its bank mid-way (1.5× the step over CLIFF.wall) steeper than
// `climb` — the wall that shows is a mesh along the edge, standing over the
// skin's easing: marched off a grid of `cell`, resampled every `step`,
// smoothed that many passes; a flat `cap` reaching that far in past the
// skin's rise; the `lip` rounding over (each [in, down] from the edge); the
// face in `strata` shares of its height, leaning out `batter` by the foot,
// the bottom `foot` of it dark, buried `bury` into the lower ground. A
// ramp's kerb stands over its deck's feather with the same face under it.
export const CLIFF_WALL = {
  cell: 0.25,
  step: 0.4,
  smooth: 2,
  cap: CLIFF.cap,
  lip: [
    [-0.35, 0],
    [-0.14, -0.1],
    [0, -0.38],
  ],
  strata: [0.35, 0.3, 0.35],
  batter: 0.2,
  foot: 0.3,
  bury: 0.5,
  colors: {
    wall: "#A68B6F", // the face: a greyed earth
    band: "#957B61", // every other stratum
    foot: "#6F5B4A", // the dark row at the bottom
    lip: "#B0A562", // the round-over at the top, warmer than the green
    kerb: "#CDBA93", // the ramps' kerbs
    dirt: "#C9A67E", // the dirt ramps' decks
  },
};
// The step up a tier's edge past which it is a wall, not a bank: the bank's
// steepest (mid-way, 1.5× the step over CLIFF.wall) past `climb`.
export const isWall = (step) => (1.5 * step) / CLIFF.wall > CLIFF.climb;
export const isTerrain = (entry) => typeof entry === "string" && entry.startsWith("terrain-");
export const terrainType = (entry) => (isTerrain(entry) ? (entry.slice(8) === "plateau" ? "cliff" : entry.slice(8)) : null);

const Y = new THREE.Vector3(0, 1, 0);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth01 = (x) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
// How far up its climb a ramp's deck is, 0..1, `u` along a ramp `L` long
// from its foot: a straight grade, eased in at the foot and out at the
// head over `rampEase(L)`. (A smoothstep over the whole length put half
// the climb in the middle third, a peak grade half again the average;
// this one's peak is the average over the length less one ease.)
export const rampEase = (L) => Math.min(CLIFF.ease, L / 4);
export function rampProfile(u, L) {
  if (u <= 0) return 0;
  if (u >= L) return 1;
  const e = rampEase(L), s = 1 / (L - e);
  if (u < e) return (s * u * u) / (2 * e);
  if (u > L - e) return 1 - (s * (L - u) * (L - u)) / (2 * e);
  return s * (u - e / 2);
}
// The steepest a ramp of `L` climbing `rise` gets: its grade along the straight part.
export const rampGrade = (rise, L) => rise / Math.max(1e-3, L - rampEase(L));
// How far past its head a ramp's deck runs on at the top's height before it eases off (see rampAt): the skin's bank has come up to the top by then.
const RAMP_TAIL = CLIFF.wall + 0.5;

// Value noise on a fixed lattice (src/renderGrid/utils.js), for the edges' wander.
function nHash(x, y, z) {
  const f = (n) => n - Math.floor(n);
  let px = f(x * 0.3183099 + 0.71), py = f(y * 0.3183099 + 0.113), pz = f(z * 0.3183099 + 0.419);
  px *= 17;
  py *= 17;
  pz *= 17;
  return f(px * py * pz * (px + py + pz));
}
export function nNoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const c = (dx, dy, dz) => nHash(ix + dx, iy + dy, iz + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), ux), x10 = lerp(c(0, 1, 0), c(1, 1, 0), ux);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), ux), x11 = lerp(c(0, 1, 1), c(1, 1, 1), ux);
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz);
}

// The terrain placements of a map as lobes, in order. Takes the editor's
// placements (dir as an array) or the loader's (a Vector3) alike.
export function terrainLobes(placements, R = 36) {
  const out = [];
  placements.forEach((p, order) => {
    const type = terrainType(p.entry);
    if (!type) return;
    const frame = frameOf(p.dir, p.yaw ?? 0, R);
    if (type === "cliff") {
      const A = { ...CLIFF_ARGS, ...(p.args ?? {}) };
      const hw = Math.max(0.5, A.width / 2), hl = Math.max(0.5, A.length / 2);
      const layer = Math.max(1, Math.min(MAX_LAYERS, Math.round(A.layer ?? 1)));
      out.push({ id: p.id, type, order, frame, hw, hl, r: Math.max(0, Math.min(A.corner, hw, hl)), k: Math.max(0, A.blend), h: Math.max(0, A.height), layer, wobble: Math.max(0, A.wobble ?? 0), args: A });
    } else if (type === "ramp") {
      const A = { ...RAMP_ARGS, ...(p.args ?? {}) };
      // a road ramp's `width` is its ROAD's: the deck is that and a kerb's feather either side, so the road up it is as wide as the one it joins
      out.push({ id: p.id, type, order, frame, hw: Math.max(0.5, A.width / 2) + (A.road ? CLIFF.feather : 0), hl: Math.max(1, A.length / 2), r: 0, road: !!A.road, args: A });
    } else if (type === "cut") {
      const A = { ...CUT_ARGS, ...(p.args ?? {}) };
      const hw = Math.max(0.5, A.width / 2), hl = Math.max(0.5, A.length / 2);
      out.push({ id: p.id, type, order, frame, hw, hl, r: Math.max(0, Math.min(A.corner, hw, hl)), h: 0, tier: typeof A.tier === "number" ? A.tier : null, args: A });
    }
  });
  // LAYERS: a cliff of layer 2 or 3 stands on the highest lower layer whose
  // outline holds its middle, its top that cliff's top and its own `height`
  // more. With none beneath it, it is a cliff on the ground.
  const cliffs = out.filter((l) => l.type === "cliff").sort((a, b) => a.layer - b.layer || a.order - b.order);
  for (const c of cliffs) {
    if (c.layer < 2) continue;
    let base = 0;
    for (const o of cliffs) if (o !== c && o.layer < c.layer && containsDir(o, c.frame.d)) base = Math.max(base, o.h);
    c.h += base;
  }
  // CUTS: each is of one tier — the height it was cut into (`tier`), if a
  // tier of that height stands; else the topmost cliff holding its middle
  // (its wander and all). A cut over no cliff does nothing.
  for (const c of out) {
    if (c.type !== "cut") continue;
    if (c.tier !== null) {
      const t = cliffs.find((o) => Math.abs(o.h - c.tier) < 0.005);
      c.h = t ? t.h : 0;
      continue;
    }
    for (const o of cliffs) if (lobeDistance(o, c.frame.d) < o.wobble + 0.3) c.h = Math.max(c.h, o.h);
  }
  return out;
}
const _cl = { x: 0, z: 0 };
const containsDir = (l, dir) => {
  toLocal(l.frame, dir, _cl);
  return roundedRect(_cl.x, _cl.z, l.hw, l.hl, l.r) < 0;
};
// How many layers of cliff stand at a bearing, 0 where none: what a cliff placed there is laid over.
export function cliffLayerAt(placements, dir, R = 36) {
  let layer = 0;
  for (const l of terrainLobes(placements, R)) if (l.type === "cliff" && containsDir(l, new THREE.Vector3().fromArray(Array.isArray(dir) ? dir : dir.toArray()).normalize())) layer = Math.max(layer, l.layer);
  return layer;
}

// A frame turned about its up by half a turn: the same rectangle, its ends swapped.
const flipped = (F) => ({ ...F, X: F.X.clone().negate(), Z: F.Z.clone().negate(), q: F.q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Y, Math.PI)) });

// A tier from the cliffs of one height: its joined field (signed distance
// to its edge, negative on top, Infinity nowhere near) and the cap round
// it. `raw` is the field as drawn; `field` has the ramps' notches cut into
// it (see terrainField).
function tierOf(L, R) {
  const h = L[0].h;
  const cliffs = L.filter((l) => l.type === "cliff");
  const k = Math.max(0, ...cliffs.map((l) => l.k));
  const wob = Math.max(0, ...cliffs.map((l) => l.wobble));
  const centre = new THREE.Vector3();
  for (const l of cliffs) centre.add(l.frame.d);
  centre.normalize();
  let reach = 0;
  for (const l of cliffs) reach = Math.max(reach, centre.angleTo(l.frame.d) * R + Math.hypot(l.hw, l.hl) + l.k + wob + CLIFF.wall + 2);
  const cos = Math.cos(Math.min(Math.PI, reach / R));
  const s = CLIFF.wobbleScale * R;
  // the pieces in the order they were laid: a cliff joins what is there
  // (smoothly, by the blend), a cut takes from it, a cliff after a cut
  // fills it back in
  const outline = (dir) => {
    if (!cliffs.length || dir.dot(centre) < cos) return Infinity;
    let d = Infinity;
    for (const l of L) {
      const di = lobeDistance(l, dir);
      if (l.type === "cut") {
        if (d !== Infinity) d = Math.max(d, -di);
      } else d = d === Infinity ? di : smin(d, di, k);
    }
    if (wob > 0) {
      const n = nNoise(dir.x * s + 11, dir.y * s + 3, dir.z * s + 7) * 0.7 + nNoise(dir.x * s * 2.6, dir.y * s * 2.6 + 5, dir.z * s * 2.6) * 0.3;
      d += wob * (n * 2 - 1);
    }
    return d;
  };
  // INSIDE, the depth is the way out to that edge, whatever it is made of
  // (depthGrid): the pieces' own distances only know their own edges, so
  // where two strokes of the sculpt brush run together by the blend, or
  // overlap, the top between them read as only just inside — the skin
  // sagged there (it reaches the top CLIFF.wall in), and the top came out
  // full of holes. Near the edge the pieces' own distance stands, so the
  // edge is where it was.
  let grid;
  const field = (dir) => {
    const d = outline(dir);
    if (!(d < 0)) return d;
    grid ??= depthGrid(L, k, (dir) => (wob > 0 ? wob * ((nNoise(dir.x * s + 11, dir.y * s + 3, dir.z * s + 7) * 0.7 + nNoise(dir.x * s * 2.6, dir.y * s * 2.6 + 5, dir.z * s * 2.6) * 0.3) * 2 - 1) : 0), centre, reach, R);
    return grid ? Math.min(d, -grid(dir)) : d;
  };
  // its own step up (a storey's own height, not the top's from the ground): a wall's skin climbs to the top over CLIFF.wallEase, a bank's over CLIFF.wall — one for the whole tier, so it never flips from one to the other along the way (where it did, round a cut under another tier, the top cracked)
  const ease = isWall(Math.min(...cliffs.map((l) => l.args?.height ?? l.h))) ? CLIFF.wallEase : CLIFF.wall;
  return { h, lobes: L, k, centre, cos, reach, ease, raw: field, field };
}
// How far in from a tier's edge each bearing over it lies, as a lookup:
// its outline (the tier's pieces `L` joined as tierOf joins them, by the
// blend `k`, wandered by `wobble`) sampled on a grid round its middle (in
// the exponential map's frame, as a piece's own), and the exact Euclidean
// distance transform (Felzenszwalb & Huttenlocher's) of what lies inside,
// less a cell so it never reaches past the outline's own distance at the
// edge. Each piece is laid only over the cells it can reach (its own
// size, the blend and the wobble), in order, so a long stroke of the
// sculpt brush's stamps builds in a few milliseconds, not every cell
// asking every stamp. Built the first time the tier's inside is asked
// after, and kept.
const DEPTH = { cell: 0.5, most: 160 };
function depthGrid(L, k, wobble, centre, reach, R) {
  const half = Math.min(reach, R * Math.PI * 0.95);
  const cell = Math.max(DEPTH.cell, (2 * half) / DEPTH.most);
  const n = Math.ceil((2 * half) / cell) + 1;
  if (n < 3) return null;
  const F = frameOf(centre, 0, R);
  const dirs = new Float32Array(n * n * 3);
  const at = new THREE.Vector3();
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      fromLocal(F, -half + i * cell, -half + j * cell, at);
      dirs.set([at.x, at.y, at.z], (j * n + i) * 3);
    }
  const d = new Float64Array(n * n).fill(Infinity);
  const wob = Math.max(0, ...L.map((l) => l.wobble ?? 0));
  const c = { x: 0, z: 0 };
  for (const l of L) {
    toLocal(F, l.frame.d, c);
    const span = Math.hypot(l.hw, l.hl) + k + wob + 2 * cell;
    const i0 = Math.max(0, Math.floor((c.x - span + half) / cell)), i1 = Math.min(n - 1, Math.ceil((c.x + span + half) / cell));
    const j0 = Math.max(0, Math.floor((c.z - span + half) / cell)), j1 = Math.min(n - 1, Math.ceil((c.z + span + half) / cell));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const q = j * n + i;
        at.fromArray(dirs, q * 3);
        const di = lobeDistance(l, at);
        if (l.type === "cut") {
          if (d[q] !== Infinity) d[q] = Math.max(d[q], -di);
        } else d[q] = d[q] === Infinity ? di : smin(d[q], di, k);
      }
  }
  const BIG = 1e12;
  const g = new Float64Array(n * n);
  for (let q = 0; q < n * n; q++) g[q] = d[q] < wob && d[q] + wobble(at.fromArray(dirs, q * 3)) < 0 ? BIG : 0;
  // the squared distance to the nearest outside cell, along rows then columns
  const f = new Float64Array(n), out = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const pass = (get, set) => {
    for (let q = 0; q < n; q++) f[q] = get(q);
    let k = 0;
    v[0] = 0;
    z[0] = -Infinity;
    z[1] = Infinity;
    for (let q = 1; q < n; q++) {
      let s;
      while ((s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])) <= z[k]) k--;
      v[++k] = q;
      z[k] = s;
      z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      out[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    for (let q = 0; q < n; q++) set(q, out[q]);
  };
  for (let j = 0; j < n; j++) pass((q) => g[j * n + q], (q, x) => (g[j * n + q] = x));
  for (let i = 0; i < n; i++) pass((q) => g[q * n + i], (q, x) => (g[q * n + i] = x));
  const depth = new Float32Array(n * n);
  for (let c = 0; c < n * n; c++) depth[c] = g[c] >= BIG ? half : Math.max(0, (Math.sqrt(g[c]) - 1) * cell);
  const l = { x: 0, z: 0 };
  return (dir) => {
    toLocal(F, dir, l);
    const fx = (l.x + half) / cell, fz = (l.z + half) / cell;
    const i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= n - 1 || j >= n - 1) return 0;
    const tx = fx - i, tz = fz - j, c = j * n + i;
    return lerp(lerp(depth[c], depth[c + 1], tx), lerp(depth[c + n], depth[c + n + 1], tx), tz);
  };
}

// The joined terrain over a set of lobes. A game with cliffs of its own
// adds them through `extra`: tiers `{ h, field(dir), centre, cos, reach }`
// and ramps `{ frame, hw, hl, h0, h1, L }` (see rampDirAt for the frame).
// Each ramp comes out with its `slope` (the climb over its length) and
// its `grade` (the steepest of its deck, see rampGrade).
export function terrainField(lobes, R = 36, extra = {}) {
  // TIERS: the cliffs of one height (to the centimetre), lowest first.
  const byH = new Map();
  for (const l of lobes) if ((l.type === "cliff" || l.type === "cut") && l.h > 0) (byH.get(l.h.toFixed(2)) ?? byH.set(l.h.toFixed(2), []).get(l.h.toFixed(2))).push(l);
  const tiers = [...(extra.tiers ?? []).map((t) => ({ ...t, raw: t.raw ?? t.field })), ...[...byH.values()].map((L) => tierOf(L, R))].sort((a, b) => a.h - b.h);
  const tierStep = (m, hard, t) => (hard ? (m < 0 ? 1 : 0) : smooth01(-m / (t.ease ?? (isWall(t.h) ? CLIFF.wallEase : CLIFF.wall))));
  // The tiers' own height at a bearing, ramps aside: as drawn (`raw`), or
  // with the ramps' notches cut (the default, once they are).
  const tierRise = (dir, hard = false, raw = false) => {
    let h = 0;
    for (const t of tiers) {
      const m = raw ? t.raw(dir) : t.field(dir);
      if (m === Infinity) continue;
      // a tier climbs from whatever stands under it (the ground, or the storey it is laid over) to its own top, so a storey's bank is as gentle as a ground-floor cliff's
      if (t.h > h) h += (t.h - h) * tierStep(m, hard, t);
    }
    return h;
  };

  // RAMPS: each read against the tiers as drawn — its head the higher end,
  // its deck climbing the whole length between the two ends' ground.
  const finish = (r) => {
    const reach = Math.hypot(r.hw, r.hl) + RAMP_TAIL + 2;
    return { ...r, cos: r.cos ?? Math.cos(Math.min(Math.PI, reach / R)), slope: (r.h1 - r.h0) / Math.max(1e-3, r.L), grade: rampGrade(r.h1 - r.h0, r.L) };
  };
  const rampOf = (l) => {
    let frame = l.frame;
    const { hw } = l;
    let { hl } = l;
    let h0 = tierRise(fromLocal(frame, 0, -hl), true, true), h1 = tierRise(fromLocal(frame, 0, hl), true, true);
    if (h0 > h1) {
      frame = flipped(frame);
      [h0, h1] = [h1, h0];
    }
    // A ramp does not cut through a cliff: it climbs only as far as the cliff's
    // edge, and its deck meets the lip there at the height of the top. Marching
    // up its middle for where the cliff begins, it is shortened to that.
    let L = 2 * hl;
    let docked = false;
    if (h1 > h0 + 1e-3) {
      for (let u = 0.3; u < L - 0.05; u += 0.1) {
        if (tierRise(fromLocal(frame, 0, -hl + u), true, true) >= h1 - 1e-3) {
          const mid = (u - L) / 2; // the new middle, from the old one's, along the ramp
          const th = mid / R;
          const d = frame.d.clone().multiplyScalar(Math.cos(th)).addScaledVector(frame.Z, Math.sin(th));
          const Z = frame.Z.clone().multiplyScalar(Math.cos(th)).addScaledVector(frame.d, -Math.sin(th));
          const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(frame.X, d, Z));
          frame = { ...frame, d: d.normalize(), Z: Z.normalize(), q };
          L = u;
          hl = u / 2;
          docked = true;
          break;
        }
      }
    }
    // a road ramp carries the road's own bookkeeping (as a game's seeded ones do): `foot`, a bearing just off its foot on its line, where its road begins
    const road = l.road ? { foot: fromLocal(frame, 0, -hl - 2), at: 0.3 + 0.01 * ((l.order ?? 0) % 50), map: true } : undefined;
    return finish({ id: l.id, type: "ramp", frame, hw, hl, h0, h1, L, road, docked, lobe: l });
  };
  // A ramp that lies LEVEL (both ends on the same ground) is nothing: no
  // deck, no kerb, no dirt. It is kept aside, for the editor to point at.
  const drawn = lobes.filter((l) => l.type === "ramp").map(rampOf);
  const level = drawn.filter((r) => r.h1 - r.h0 < 1e-3);
  const ramps = [...(extra.ramps ?? []).map(finish), ...drawn.filter((r) => r.h1 - r.h0 >= 1e-3)];

  // THE NOTCHES: a ramp that comes up from under a tier to its height (or
  // past it) is cut into that tier over its rectangle — the tier's field is
  // kept outside the rectangle, so its edge, and the wall on it, runs round
  // the ramp. The deck fills the notch (see rise).
  const _nl = { x: 0, z: 0 };
  const rectOf = (r, dir) => {
    toLocal(r.frame, dir, _nl);
    return roundedRect(_nl.x, _nl.z, r.hw, r.hl, 0);
  };
  for (const t of tiers) {
    const cutters = ramps.filter((r) => r.h0 < t.h - 1e-3 && r.h1 >= t.h - 1e-3);
    if (!cutters.length) continue;
    t.field = (dir) => {
      let m = t.raw(dir);
      if (m === Infinity) return m;
      for (const r of cutters) if (dir.dot(r.frame.d) >= r.cos) m = Math.max(m, -rectOf(r, dir));
      return m;
    };
  }

  // THE DOCK: where a ramp meets a tier the tier's face is made straight and
  // square to the ramp across its head — a flat face for the ramp to land on,
  // whatever the edge as drawn did there — the straight line `u = L` over the
  // ramp's width and a little past, easing back to the edge as drawn beyond.
  for (const t of tiers) {
    const docks = ramps.filter((r) => r.docked && Math.abs(r.h1 - t.h) < 1e-3);
    if (!docks.length) continue;
    const plain = t.field;
    t.field = (dir) => {
      let m = plain(dir);
      if (m === Infinity) return m;
      for (const r of docks) {
        if (dir.dot(r.frame.d) < r.cos) continue;
        toLocal(r.frame, dir, _nl);
        const u = _nl.z + r.hl, v = _nl.x;
        const reach = Math.hypot(Math.max(0, Math.abs(v) - (r.hw + 0.4)), Math.max(0, Math.abs(u - r.L) - 2.5));
        const w = 1 - smooth01(reach / 2);
        if (w > 0) m += (r.L - u - m) * w;
      }
      return m;
    };
  }

  // The bearing `u` up a ramp from its foot and `v` across it.
  const rampDirAt = (r, u, v, target = new THREE.Vector3()) => fromLocal(r.frame, v, u - r.hl, target);
  // Where a bearing is on a ramp: `u` up it from the foot, `v` across;
  // `mask` 1 on its deck, easing to 0 past its ends and — for the skin —
  // down its sides over the feather, inside the deck's edge, where the kerb
  // stands over the easing; `hard`, the deck is the whole width; `edge`
  // whether it is in the kerb's strip; and `h` the deck's height. Null
  // when nowhere near. Past the head the deck runs on at the top's height
  // over RAMP_TAIL before it eases off: the skin's bank only comes up to the
  // top CLIFF.wall inside the edge, and no wall or cap is drawn across a
  // ramp's head (see cutByRamp), so a deck let go sooner left a trough in
  // the skin just over the lip — a seam of facets where the ramp met the top.
  const _rl = { x: 0, z: 0 };
  const rampAt = (r, dir, hard = false) => {
    if (dir.dot(r.frame.d) < r.cos) return null;
    toLocal(r.frame, dir, _rl);
    const u = _rl.z + r.hl, v = _rl.x, av = Math.abs(v);
    const Fh = CLIFF.feather;
    const ends = smooth01(u + 2) * (1 - smooth01(u - r.L - RAMP_TAIL));
    // (inside the cliff the ramp is cut into, the deck runs full width to the notch's wall: no easing down at its sides, which left a dip beside the kerb)
    const side = hard || (av < r.hw && tierRise(dir, true, true) >= r.h1 - 1e-3) ? (av < r.hw ? 1 : 0) : 1 - smooth01((av - (r.hw - Fh)) / Fh);
    const mask = side * ends;
    if (mask <= 0) return null;
    return { u, v, mask, h: lerp(r.h0, r.h1, rampProfile(u, r.L)), edge: av > r.hw - Fh };
  };
  // How far above the base ground a bearing is: the tiers', and any ramp's
  // deck filled in over it — with its kerbs, for what stands on it.
  const rise = (dir, hard = false) => {
    const base = tierRise(dir, hard);
    let h = base;
    for (const r of ramps) {
      const q = rampAt(r, dir, hard);
      if (!q) continue;
      if (q.h > base) h = Math.max(h, base + q.mask * (q.h - base));
      if (hard && q.edge && base < r.h1 - 1e-3) h = Math.max(h, base + q.mask * (Math.max(q.h, base) - base) + CLIFF.kerb * smooth01((q.u + 0.4) / 1.2) * q.mask);
    }
    return h;
  };
  // How much a bearing is on a ramp's deck, 0..1.
  const onRamp = (dir) => {
    let best = 0;
    for (const r of ramps) {
      const q = rampAt(r, dir);
      if (q && q.u > -0.5 && q.u < r.L + 0.5) best = Math.max(best, q.mask);
    }
    return best;
  };
  // How much the ground's own hollows should be pressed flat here: 1 along
  // a tier's edge (under the wall's cap inside, round its foot outside) and
  // on a ramp's deck, easing off a little way beyond.
  const flat = (dir) => {
    let best = onRamp(dir);
    const inside = CLIFF.wall + CLIFF.cap;
    for (const t of tiers) {
      const m = t.field(dir);
      if (m === Infinity) continue;
      const d = m < -inside ? -inside - m : m > 0.8 ? m - 0.8 : 0;
      best = Math.max(best, 1 - smooth01(d / 1.2));
    }
    return best;
  };
  // Whether a bearing is under a tier's wall — on the cap inside its edge
  // or close round its foot outside — where nothing is planted.
  const nearWall = (dir) =>
    tiers.some((t) => {
      const m = t.field(dir);
      return m > -(CLIFF.wall + CLIFF.cap + 0.2) && m < 0.5;
    });
  // How steep the terrain makes the skin there: rise over run.
  const _s = new THREE.Vector3(), _t = new THREE.Vector3(), _p = new THREE.Vector3();
  const steep = (dir) => {
    const e = 0.25;
    _s.set(0, 1, 0).cross(dir);
    if (_s.lengthSq() < 1e-6) _s.set(1, 0, 0).cross(dir);
    _s.normalize();
    _t.crossVectors(dir, _s);
    const at = (v, s) => rise(_p.copy(dir).multiplyScalar(R).addScaledVector(v, s * e).normalize());
    return Math.hypot(at(_s, 1) - at(_s, -1), at(_t, 1) - at(_t, -1)) / (2 * e);
  };
  // How far a bearing is from the nearest wall or ramp, roughly: what
  // stands on the ground keeps this far off them.
  const clear = (dir) => {
    let best = Infinity;
    for (const t of tiers) best = Math.min(best, Math.abs(t.field(dir)));
    for (const r of ramps) {
      if (dir.dot(r.frame.d) < r.cos) continue;
      toLocal(r.frame, dir, _rl);
      const u = _rl.z + r.hl, v = _rl.x;
      best = Math.min(best, Math.max(Math.abs(v) - r.hw, -u, u - r.L));
    }
    return best;
  };
  // Whether a point on a tier's edge is where a ramp's deck meets the top
  // — the head of its notch, where there is no wall to draw.
  const cutByRamp = (dir) =>
    ramps.some((r) => {
      const q = rampAt(r, dir, true);
      return q && Math.abs(q.v) < r.hw - 0.15 && (r.docked ? Math.abs(q.u - r.L) < 0.8 : q.u > -1 && tierRise(dir, true, true) - q.h < 0.3);
    });

  // The edge of a tier: the zero line of its field, marched square by
  // square over a grid on the plane at its middle (gnomonic, so a straight
  // line on the grid is a great circle — near enough, this close), the
  // crossings chained into loops, each resampled every `step` along and
  // smoothed over a few passes. Loops of bearings.
  const edgesOf = (tier, { cell = 0.25, step = 0.4, smooth = 2 } = {}) => {
    const centre = tier.centre;
    const seed = Math.abs(centre.z) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const e1 = seed.addScaledVector(centre, -seed.dot(centre)).normalize();
    const e2 = new THREE.Vector3().crossVectors(centre, e1).normalize();
    const reach = Math.acos(clamp(tier.cos, -1, 1)) * R;
    const h = cell;
    const n = Math.ceil((2 * reach) / h) + 1;
    const at = (x, y) => centre.clone().multiplyScalar(R).addScaledVector(e1, -reach + x * h).addScaledVector(e2, -reach + y * h).normalize();
    const f = new Float32Array(n * n);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const v = tier.field(at(i, j));
        f[i * n + j] = Number.isFinite(v) ? v : 1e3;
      }
    const points = new Map();
    const segs = [];
    const cross = (k, x0, y0, x1, y1, f0, f1) => {
      if (!points.has(k)) {
        const t = f0 / (f0 - f1);
        points.set(k, { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
      }
      return k;
    };
    for (let i = 0; i < n - 1; i++)
      for (let j = 0; j < n - 1; j++) {
        const f00 = f[i * n + j], f10 = f[(i + 1) * n + j], f01 = f[i * n + j + 1], f11 = f[(i + 1) * n + j + 1];
        const c = (f00 < 0 ? 1 : 0) | (f10 < 0 ? 2 : 0) | (f11 < 0 ? 4 : 0) | (f01 < 0 ? 8 : 0);
        if (c === 0 || c === 15) continue;
        const B = () => cross(`h${i},${j}`, i, j, i + 1, j, f00, f10);
        const T = () => cross(`h${i},${j + 1}`, i, j + 1, i + 1, j + 1, f01, f11);
        const Lf = () => cross(`v${i},${j}`, i, j, i, j + 1, f00, f01);
        const Rt = () => cross(`v${i + 1},${j}`, i + 1, j, i + 1, j + 1, f10, f11);
        switch (c) {
          case 1:
          case 14:
            segs.push([Lf(), B()]);
            break;
          case 2:
          case 13:
            segs.push([B(), Rt()]);
            break;
          case 3:
          case 12:
            segs.push([Lf(), Rt()]);
            break;
          case 4:
          case 11:
            segs.push([Rt(), T()]);
            break;
          case 6:
          case 9:
            segs.push([B(), T()]);
            break;
          case 7:
          case 8:
            segs.push([Lf(), T()]);
            break;
          case 5:
          case 10: {
            const mid = (f00 + f10 + f01 + f11) / 4 < 0;
            if ((c === 5) === mid) segs.push([Lf(), T()], [B(), Rt()]);
            else segs.push([Lf(), B()], [Rt(), T()]);
            break;
          }
        }
      }
    const adj = new Map();
    segs.forEach(([a, b], s) => {
      for (const k of [a, b]) {
        if (!adj.has(k)) adj.set(k, []);
        adj.get(k).push(s);
      }
    });
    const used = new Uint8Array(segs.length);
    const loops = [];
    for (let s0 = 0; s0 < segs.length; s0++) {
      if (used[s0]) continue;
      const keys = [segs[s0][0]];
      let s = s0, k = segs[s0][0], closed = false;
      for (;;) {
        used[s] = 1;
        const [a, b] = segs[s];
        k = a === k ? b : a;
        if (k === keys[0]) {
          closed = true;
          break;
        }
        keys.push(k);
        const next = (adj.get(k) || []).find((t) => !used[t]);
        if (next === undefined) break;
        s = next;
      }
      if (!closed || keys.length < 8) continue;
      const pts = keys.map((kk) => {
        const q = points.get(kk);
        return at(q.x, q.y);
      });
      const out = [];
      let carry = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const len = a.angleTo(b) * R;
        for (let t = carry; t < len; t += step) out.push(a.clone().lerp(b, t / len).normalize());
        carry = Math.max(0, carry + Math.ceil((len - carry) / step) * step - len);
      }
      for (let pass = 0; pass < smooth; pass++) {
        const prev = out.map((v) => v.clone());
        const N = out.length;
        for (let i = 0; i < N; i++) out[i].copy(prev[i]).multiplyScalar(0.5).addScaledVector(prev[(i - 1 + N) % N], 0.25).addScaledVector(prev[(i + 1) % N], 0.25).normalize();
      }
      if (out.length >= 3) loops.push(out);
    }
    return loops;
  };

  return { R, lobes, tiers, ramps, level, empty: !tiers.length && !ramps.length, tierRise, rise, rampAt, rampDirAt, onRamp, flat, nearWall, steep, clear, cutByRamp, edgesOf };
}
