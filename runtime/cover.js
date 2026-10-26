// GROUNDCOVER PATCHES: grass, flowers, pebbles or bare ground laid on a map
// as rounded rectangles that run together. Plain three.js, no React; the
// editor (mapmaker/Patch.jsx) and a game (the car game's planet.js) both
// read this, so they agree on where a patch reaches and where its tufts
// stand. A game copies it beside its own code, as it does mapLoader.js.
//
// A patch is a placement whose entry is "cover-<type>" (see COVER): its
// bearing is the patch's middle, its yaw its turn, and its args its shape
// — `width` across (its x) and `length` along (its z) in world units,
// `corner` how round the corners are, `blend` how near another patch of
// the same type must come to run together, `density` how many things per
// square unit, `size` a multiplier on each thing.
//
// THE FIELD. Every patch is a rounded rectangle laid on the ball, measured
// in the ball's own units along its surface (the exponential map at the
// patch's middle, so a big patch wraps the curve rather than floating off
// it). Patches of one type join into one field by a smooth minimum, the
// way the dollies' pools do — two that come near each other bulge out to
// meet, and neck together — so a type's field is where that distance is
// under zero. STACKING: patches lie in the order they are placed, later
// on top. A patch laid over one of a different type clears it where they
// overlap (the lower's field is kept out by a smooth maximum of the
// upper's, turned inside out), so a bare patch over grass is a clearing,
// and a pebble patch over grass is pebbles with no grass under them. Only
// the lower is cut: a patch is never cut by one under it.
//
// THE SCATTER. Each patch deals its own things on a jittered grid over its
// own rectangle (plus the blend's bulge), keeps those that land inside the
// type's field, and of those only the ones it is the nearest patch to — so
// where two patches of a type overlap, each point is dealt once and the
// density stays even across the join.
import * as THREE from "three";

// The kinds of cover, by the type in the entry's id: what to call it, how
// many per square unit unless the patch says, and the swatch the editor
// shows for it. A density of 0 scatters nothing: bare ground, there to
// clear what is under it; WATER, a pond — a game sinks a basin under it,
// the water a little under the grass with a shore of sand, and where a
// road crosses it, the road is a BRIDGE: a deck on piers at the grass's
// height (the car game's planet.js builds its own sea and bridge this way);
// and ROAD, which a game paints as tarmac and presses the ground flat
// under. A road lies `over` everything, whatever order it was laid in:
// nothing grows on tarmac.
export const COVER = {
  grass: { label: "grass", density: 3, tint: "#6c8f5b" },
  flowers: { label: "flowers", density: 0.5, tint: "#d7a3b6" },
  pebbles: { label: "pebbles", density: 1.2, tint: "#9b9385" },
  bare: { label: "bare ground", density: 0, tint: "#8e7352" },
  // WATER comes in three kinds, patches all: a pond, an ocean (a stretch of
  // the sea, much bigger) and a hot spring (small, milky). All sink a basin
  // and fill it, and a road over any is a bridge; the field and a game know
  // them as the one type, "water" (see coverLobes). `water` itself is the
  // older name of a pond, kept so maps drawn with it still load.
  pond: { label: "pond", density: 0, tint: "#495a74", water: true, patch: { width: 14, length: 11, corner: 5, blend: 3 } },
  ocean: { label: "ocean", density: 0, tint: "#3b6a9a", water: true, patch: { width: 34, length: 26, corner: 10, blend: 4 } },
  spring: { label: "hot spring", density: 0, tint: "#8cc7bf", water: true, patch: { width: 8, length: 7, corner: 3, blend: 2 } },
  water: { label: "water", density: 0, tint: "#495a74", water: true, hidden: true, patch: { width: 14, length: 11, corner: 5, blend: 3 } },
  // A ROAD is a STROKE, not a rectangle: drawn with the pointer like a pen,
  // kept as `knots` (bearings, a few units apart) on the placement, with
  // `closed` for a loop. Its args are its `width` and its `verge` (how far
  // past the tarmac the grass is kept back). A road placement with no
  // knots is an older rectangular piece, read as a straight stroke down
  // its length. The ribbon is `width` wide; the dashes down its middle
  // are the game's (DASH).
  road: { label: "road", density: 0, tint: "#5B5956", over: true, patch: { width: 6, length: 12, corner: 0, blend: 1 }, path: { width: 6, verge: 1, fence: "none", bridgeFence: "wooden" } },
};
export const PATCH = { width: 8, length: 8, corner: 3, blend: 2, size: 1 };
// The dashes down a road's middle, as the car game draws them: a cream
// line `width` wide, `on` samples drawn then `off` skipped, the samples
// `step` apart along the road (so the editor's dashes fall where the
// game's do).
export const DASH = { color: "#DFCFBC", width: 0.18, on: 7, off: 9, step: 0.4, lift: 0.05 };
// A type's stock shape: PATCH, or the type's own where it has one.
export const patchOf = (type) => ({ ...PATCH, ...(COVER[type]?.patch ?? {}) });
export const isWater = (type) => !!COVER[type]?.water;
export const isCover = (entry) => typeof entry === "string" && entry.startsWith("cover-");
export const coverType = (entry) => (isCover(entry) ? entry.slice(6) : null);
export const isRoad = (entry) => coverType(entry) === "road";

// ---- the ball's frame at a bearing (as mapLoader.js's standOn / poseOf)
const Y = new THREE.Vector3(0, 1, 0);
function standOn(up) {
  const seed = Math.abs(up.z) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const fwd = seed.addScaledVector(up, -seed.dot(up)).normalize();
  const right = new THREE.Vector3().crossVectors(up, fwd);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd));
}
const vec = (d) => (Array.isArray(d) ? new THREE.Vector3().fromArray(d) : d.clone()).normalize();

// A patch's frame: its middle `d` on the unit ball, its across `X` and
// along `Z` axes (tangent there, turned by its yaw), and the ball's radius.
export function frameOf(dir, yaw = 0, R = 36) {
  const d = vec(dir);
  const q = standOn(d);
  if (yaw) q.multiply(new THREE.Quaternion().setFromAxisAngle(Y, yaw));
  return { d, X: new THREE.Vector3(1, 0, 0).applyQuaternion(q), Z: new THREE.Vector3(0, 0, 1).applyQuaternion(q), q, R };
}
// Where a bearing lies in a frame: (x, z) in world units along the ground
// from the frame's middle (the exponential map's inverse).
const _t = new THREE.Vector3();
export function toLocal(F, p, out = { x: 0, z: 0 }) {
  const c = Math.max(-1, Math.min(1, F.d.dot(p)));
  const theta = Math.acos(c);
  const sin = Math.sin(theta);
  if (sin < 1e-9) return ((out.x = 0), (out.z = 0), out);
  _t.copy(p).addScaledVector(F.d, -c);
  const s = (theta * F.R) / sin;
  out.x = s * _t.dot(F.X);
  out.z = s * _t.dot(F.Z);
  return out;
}
// The bearing (x, z) units along the ground from the frame's middle.
export function fromLocal(F, x, z, out = new THREE.Vector3()) {
  const s = Math.hypot(x, z);
  if (s < 1e-9) return out.copy(F.d);
  const theta = s / F.R;
  out.copy(F.d).multiplyScalar(Math.cos(theta));
  out.addScaledVector(F.X, (Math.sin(theta) * x) / s);
  out.addScaledVector(F.Z, (Math.sin(theta) * z) / s);
  return out.normalize();
}

// A rounded rectangle's signed distance at (x, z): `hw` by `hl` half-sizes,
// corners `r` round (as the pools' lobeDistance).
export function roundedRect(x, z, hw, hl, r) {
  const qx = Math.abs(x) - hw + r, qz = Math.abs(z) - hl + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}
const _l = { x: 0, z: 0 };
export const lobeDistance = (l, p) => {
  if (l.shape === "path") return pathDistance(l, p);
  toLocal(l.frame, p, _l);
  return roundedRect(_l.x, _l.z, l.hw, l.hl, l.r);
};

// ---- ROADS: strokes
// A road's knots, as bearings: the placement's own, or — for an older
// rectangular piece — its two ends, down the middle of its length.
export function roadKnots(p, R = 36) {
  if (p.knots?.length >= 2) return p.knots.map((k) => vec(k));
  const A = { ...patchOf("road"), ...(p.args ?? {}) };
  const F = frameOf(p.dir, p.yaw ?? 0, R);
  const hl = Math.max(0.5, A.length / 2);
  return [fromLocal(F, 0, -hl), fromLocal(F, 0, hl)];
}
// The dense samples along a stroke, `step` apart: a Catmull-Rom spline
// through the knots (on the ball: the curve in space, each point put back
// on the ball), closed or open. Each sample has its bearing `dir`, the way
// along (`tangent`) and the sideways unit across it (`side`).
export function pathSamples(knots, closed, R = 36, step = DASH.step) {
  const K = knots.map((k) => vec(k));
  const N = K.length;
  if (N < 2) return [];
  const at = (i) => K[closed ? ((i % N) + N) % N : Math.max(0, Math.min(N - 1, i))];
  const dirs = [];
  const segs = closed ? N : N - 1;
  const p = new THREE.Vector3();
  for (let i = 0; i < segs; i++) {
    const P0 = at(i - 1), P1 = at(i), P2 = at(i + 1), P3 = at(i + 2);
    const n = Math.max(1, Math.ceil((P1.angleTo(P2) * R) / step));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      // Catmull-Rom, tension 0.5
      p.set(0, 0, 0)
        .addScaledVector(P0, -0.5 * t3 + t2 - 0.5 * t)
        .addScaledVector(P1, 1.5 * t3 - 2.5 * t2 + 1)
        .addScaledVector(P2, -1.5 * t3 + 2 * t2 + 0.5 * t)
        .addScaledVector(P3, 0.5 * t3 - 0.5 * t2);
      dirs.push(p.clone().normalize());
    }
  }
  if (!closed) dirs.push(K[N - 1].clone());
  const M = dirs.length;
  return dirs.map((dir, i) => {
    const prev = closed || i > 0 ? dirs[(i - 1 + M) % M] : dir;
    const next = closed || i < M - 1 ? dirs[(i + 1) % M] : dir;
    const tangent = next.clone().sub(prev);
    tangent.addScaledVector(dir, -tangent.dot(dir)).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, dir).normalize();
    return { dir, tangent, side };
  });
}
// How far a bearing is from a stroke's edge: the distance to the nearest
// piece of the stroke (the chord between two samples is near enough, this
// close), less half the width. Negative on the road. A cap round the
// stroke turns most of the ball away cheaply.
const _pp = new THREE.Vector3(), _ab = new THREE.Vector3(), _ap = new THREE.Vector3();
export function pathDistance(l, p) {
  if (p.dot(l.centre) < l.cos) return p.angleTo(l.centre) * l.frame.R - l.reach;
  const R = l.frame.R;
  _pp.copy(p).multiplyScalar(R);
  const P = l.points;
  const n = P.length;
  let best = Infinity;
  const last = l.closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = P[i], b = P[(i + 1) % n];
    _ab.subVectors(b, a);
    _ap.subVectors(_pp, a);
    const t = Math.max(0, Math.min(1, _ap.dot(_ab) / Math.max(1e-9, _ab.lengthSq())));
    const d = _ap.addScaledVector(_ab, -t).lengthSq();
    if (d < best) best = d;
  }
  return Math.sqrt(best) - l.hw;
}
// A road placement as a lobe: its samples, its points (at the ball's
// radius, for the distance), and a cap round the whole stroke. `hw` and
// `hl` are the cap's reach, so what measures a patch by its rectangle
// (the editor) still finds it.
function roadLobe(p, order, R) {
  const A = { ...COVER.road.path, ...(p.args ?? {}) };
  const knots = roadKnots(p, R);
  const closed = !!p.closed && knots.length >= 3;
  const samples = pathSamples(knots, closed, R);
  const centre = new THREE.Vector3();
  for (const s of samples) centre.add(s.dir);
  centre.normalize();
  let reach = 0;
  for (const s of samples) reach = Math.max(reach, s.dir.angleTo(centre) * R);
  const hw = Math.max(0.5, A.width / 2);
  reach += hw + 2;
  return {
    id: p.id,
    type: "road",
    shape: "path",
    order,
    over: true,
    frame: frameOf(centre, 0, R),
    centre,
    cos: Math.cos(Math.min(Math.PI, reach / R)),
    reach,
    knots,
    closed,
    samples,
    points: samples.map((s) => s.dir.clone().multiplyScalar(R)),
    width: hw * 2,
    verge: Math.max(0, A.verge ?? 0),
    hw: reach,
    hl: reach,
    r: 0,
    k: 0.5,
    density: 0,
    size: 1,
    args: A,
  };
}
// The smooth minimum of two distances, `k` wide (the polynomial one: it
// only acts where the two are within `k` of each other, so a far-off patch
// leaves another's edge exactly where it is), and the smooth maximum.
export function smin(a, b, k) {
  if (!(k > 0)) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
const smax = (a, b, k) => -smin(-a, -b, k);

// The cover placements of a map as lobes: `{ id, type, order, frame, hw,
// hl, r, k, density, size, args }`, in stacking order — a road's a stroke
// (see roadLobe). Takes the editor's placements (dir as an array) or the
// loader's (a Vector3) alike.
export function coverLobes(placements, R = 36) {
  const out = [];
  placements.forEach((p, order) => {
    const type = coverType(p.entry);
    if (!type) return;
    if (type === "road") return out.push(roadLobe(p, order, R));
    const C = COVER[type] ?? COVER.grass;
    const A = { ...patchOf(type), density: C.density, ...(p.args ?? {}) };
    const hw = Math.max(0.25, A.width / 2), hl = Math.max(0.25, A.length / 2);
    out.push({
      id: p.id,
      type: isWater(type) ? "water" : type, // a pond, an ocean, a spring: water, to the field and to a game
      kind: type,
      order,
      over: !!C.over,
      frame: frameOf(p.dir, p.yaw ?? 0, R),
      hw,
      hl,
      r: Math.max(0, Math.min(A.corner, hw, hl)),
      k: Math.max(0, A.blend),
      density: Math.max(0, A.density),
      size: A.size ?? 1,
      args: A,
    });
  });
  return out;
}

// The joined field over a set of lobes.
//   probe(type, p)  → { d, owner }: the type's signed distance at bearing p
//                     (inside under 0), and the lobe of that type nearest p
//   inside(type, p) → whether p is in the type's field
//   typeAt(p)       → the type showing at p, or null
export function coverField(lobes) {
  const byType = new Map();
  for (const l of lobes) (byType.get(l.type) ?? byType.set(l.type, []).get(l.type)).push(l);
  const kOf = new Map([...byType].map(([t, L]) => [t, Math.max(...L.map((l) => l.k))]));
  const dists = [];
  const probe = (type, p) => {
    const L = byType.get(type);
    if (!L) return { d: Infinity, owner: null };
    let m = Infinity, owner = null;
    dists.length = 0;
    for (const l of L) {
      const d = lobeDistance(l, p);
      dists.push(d);
      if (d < m) ((m = d), (owner = l));
    }
    // run together: the nearest, then each other one folded in
    let d = m;
    const k = kOf.get(type);
    if (k > 0) for (const di of dists) if (di !== m) d = smin(d, di, k);
    // cut by everything of another type laid over the nearest lobe (a road, whenever it was laid)
    for (const o of lobes) if (o.type !== type && (o.over || o.order > owner.order)) d = smax(d, -lobeDistance(o, p), o.k);
    return { d, owner };
  };
  const inside = (type, p) => probe(type, p).d < 0;
  const typeAt = (p) => {
    let best = null, top = -1;
    for (const type of byType.keys()) {
      const { d, owner } = probe(type, p);
      if (d < 0 && (owner.over ? Infinity : owner.order) > top) ((best = type), (top = owner.over ? Infinity : owner.order));
    }
    return best;
  };
  // A type's joined distance alone, uncut: for a game pressing the ground
  // flat under its roads and painting them (Infinity with none of that type).
  const distance = (type, p) => {
    const L = byType.get(type);
    if (!L) return Infinity;
    let m = Infinity;
    dists.length = 0;
    for (const l of L) {
      const d = lobeDistance(l, p);
      dists.push(d);
      if (d < m) m = d;
    }
    const k = kOf.get(type);
    if (k > 0) for (const di of dists) if (di !== m) m = smin(m, di, k);
    return m;
  };
  return { lobes, byType, probe, inside, typeAt, distance };
}

// A small deterministic random (mulberry32), seeded from a lobe's id, so a
// patch's things stay put from one build to the next.
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashOf = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
};

// Deals every lobe's things: `visit(dir, lobe, rand)` for each bearing that
// lands in the lobe's type's field and is nearest this lobe, `rand` the
// lobe's own stream, for rolling the thing's size and tint. `only` keeps it
// to one type.
export function sampleCover(lobes, { only = null, field = coverField(lobes), visit }) {
  const p = new THREE.Vector3();
  for (const l of lobes) {
    if (!(l.density > 0) || (only && l.type !== only)) continue;
    const rand = mulberry32(hashOf(l.id) + 7);
    const px = l.hw + l.k, pz = l.hl + l.k;
    const cell = 1 / Math.sqrt(l.density);
    const nx = Math.max(1, Math.ceil((2 * px) / cell)), nz = Math.max(1, Math.ceil((2 * pz) / cell));
    const sx = (2 * px) / nx, sz = (2 * pz) / nz;
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const x = -px + (i + rand()) * sx, z = -pz + (j + rand()) * sz;
        fromLocal(l.frame, x, z, p);
        const { d, owner } = field.probe(l.type, p);
        if (owner !== l || d >= 0) continue;
        visit(p, l, rand);
      }
  }
}
