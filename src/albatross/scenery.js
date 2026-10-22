// Scenery between the statues: the trees. The builders live here; where
// each goes is the field's business (main.field.js, "Scenery").
// Everything is untextured and instanced, so it stays crisp at any
// distance. A tree is in world units, its foot at y = 0, its colors
// baked into its vertices.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clean } from "./heads.js";
import { hash } from "./statues.js";

// =====================================================================
// Trees
// =====================================================================
// Three kinds, each built from its own ranges (TREES[kind]) at
// TREES.shapes distinct shapes, and scaled per tree in the field (each
// kind its own scale range). Everything is untextured: the light is
// painted into the vertices, since the field's flat light does little
// shading of its own: the canopy darker underneath and in toward the
// trunk, lighter on top and out at its edge, the trunk darker at its
// foot. World units, foot at y = 0. The trees lab (trees.html) slides
// every range; the field and the scene tab read what it saved
// (loadSavedTrees).
//   cedar   a sugi, as at Okunoin: a tall bare trunk under a long narrow
//           spire, its edge stepped a little where the boughs lie
//   cloud   a niwaki, a cloud-pruned pine: a crooked trunk, limbs reaching
//           out and up, each ending in a flat pad of canopy; on a small
//           tree the pads heap into one crown, on a big one they float apart
//   bottle  a baobab: a swollen trunk tapering hard to a narrow top, a
//           few sprigs fanning out of it, each with a small puff
export const TREE_KINDS = ["cedar", "cloud", "bottle"];
export const TREES = {
  shapes: 6, // distinct trees built of each kind
  bark: 0x5a4636, // the palette's stand in (treeColours lays the lab's over these two)
  leaf: 0x6aa255,
  barkShade: [0.62, 0.87], // the trunk's brightness at its foot and at its top
  flare: 0.67, // how much wider a trunk spreads at its root
  shade: {
    under: 0.928, // the canopy's brightness at its underside, in by the trunk
    over: 1.209, // ...and at its top, out at its edge
    outward: 0.647, // how much of that is out-versus-in (the rest is low-versus-high)
    stop: 0.441, // how far up the canopy the dark-to-light runs, of its height: above it the top is lit evenly (1 = the whole way up)
    pad: [0.88, 1.099], // a cloud tree's pad (and a bottle tree's puff): its brightness at its underside and at its crown
  },
  // Every range is a [lo, hi] pair drawn per shape, so the trees of a kind
  // differ; `share` is how often the kind is dealt against the others
  // (0: never), `scale` how big the field stands it (drawn per tree)
  cedar: {
    // (as tuned in the lab, 2026-10-09)
    share: 1.01,
    scale: [2.03, 3.34], // big, so a BIG head stands about level with a middling one (shrunk a fifth to 1.6 – 2.7 for a while; back to this 2026-10-16)
    trunk: [4.7, 8.86], // the bare trunk, world units tall
    girth: [0.49, 0.94], // its radius at the foot
    lean: [0.37, 0.76], // how far its top stands off its foot, world units (the way is drawn)
    height: [6.37, 20.11], // the spire, world units tall
    aspect: [0.191, 0.249], // its widest radius, of its height
    base: 0.856, // where its foot sits, of the trunk's height
    dark: 0.105, // how much darker its green is than the palette's; under 0, lighter (as tuned in the lab, 2026-10-16; 0.163 was far darker than the other kinds)
    steps: 0.104, // how much its edge steps in and out where the boughs lie
  },
  cloud: {
    // (as tuned in the lab, 2026-10-09)
    share: 1,
    scale: [1, 2.56],
    trunk: [9.63, 11.63],
    girth: [0.45, 0.99],
    bend: [0.026, 0.082], // how far its top stands off its foot, of its height: it curves over, upright at the foot
    limbs: [5, 6], // limbs out of the trunk (whole numbers, 1 at least): the pads sit at their ends, none on the trunk
    from: [0.367, 0.915], // where on the trunk a limb leaves it, of its height (the trunk ends a little past the highest)
    reach: [0.22, 0.49], // how far out a limb's pad sits, of the trunk's height
    rise: [0.44, 0.94], // ...and how far up from where the limb leaves
    bow: [0.24, 0.85], // how bowed a limb is: 0 straight; toward 1 it leaves level and sweeps up to its pad; toward -1 up first, then out
    crook: [0.03, 0.069], // how crooked: how far each of a limb's three knees is kicked off its line, of the limb's length, at most (0: smooth)
    limbGirth: 0.715, // a limb's radius where it leaves the trunk, of the trunk's there (it tapers to half that)
    pad: [0.7, 2.32], // each pad's radius, world units
    flat: 0.704, // a pad's height above its middle, of its radius
    under: 0.853, // ...and below: flatter underneath, a cap
    pull: 1.09, // how much further up its crown is drawn, of its radius: a point on top
    taper: 0.11, // how narrow it comes in toward the crown: 0 round, 1 a point, more a needle
    boughs: 2, // waves stepped into a pad's edge, from its underside to its crown (whole numbers; 0: smooth)
    steps: 0.051, // how deep they step in and out, of the pad's radius (smaller than the cedar's)
    dark: 0.024,
  },
  bottle: {
    share: 0.3, // (was 0.3: every kind as often as the others, all over the map)
    scale: [1, 2.4],
    // (the trunk as tuned in the lab, 2026-10-09)
    trunk: [5, 11.49],
    girth: [1.32, 1.71],
    belly: [1.07, 1.54], // how much wider it swells at its widest, of the foot's girth
    waist: [0.705, 0.95], // where the widest is, up the trunk
    top: 0.3, // the top's radius, of the foot's (before the swell)
    lean: [0, 0.48],
    sprigs: [4, 7], // fronds out of the top (whole numbers)
    sprig: [0.8, 1.34], // a frond's length, of the trunk's height
    splay: [0.35, 1], // how far a frond tips from upright where it leaves, radians
    wide: [0.8, 3.4], // a frond's width at its widest, world units
    thin: 0.12, // ...and how thick it is
    droop: [0.2, 0.73], // how far its tip falls, of its length
    dark: 0.07,
  },
};
// TREES (or T) in the colors asked for: the bark and the canopy green
export function treeColours(trees, bark, T = TREES) {
  const out = JSON.parse(JSON.stringify(T));
  out.bark = bark;
  out.leaf = trees;
  return out;
}
// The trees lab's saved knobs, laid over TREES (what's set there is what
// the field and the scene tab stand); only what TREES knows is taken
export function loadSavedTrees(T = TREES) {
  const lay = (into, from) => {
    if (!from || typeof from !== "object") return;
    for (const key of Object.keys(into)) {
      if (!(key in from)) continue;
      const a = into[key],
        b = from[key];
      if (Array.isArray(a)) {
        if (Array.isArray(b) && b.length === a.length && b.every((x) => typeof x === "number")) into[key] = [...b];
      } else if (a && typeof a === "object") lay(a, b);
      else if (typeof b === typeof a) into[key] = b;
    }
  };
  try {
    lay(T, JSON.parse(localStorage.getItem("trees-lab") || "{}")?.T);
  } catch {
    /* no storage: the code's own */
  }
  return T;
}
// Which kind a tree is, from a draw u in 0 – 1, by the kinds' shares
// (the index into TREE_KINDS; the first kind if every share is 0)
export function pickTreeKind(u, T = TREES) {
  const total = TREE_KINDS.reduce((s, k) => s + Math.max(0, T[k].share), 0);
  if (!total) return 0;
  let acc = 0;
  for (let i = 0; i < TREE_KINDS.length; i++) {
    acc += Math.max(0, T[TREE_KINDS[i]].share) / total;
    if (u < acc) return i;
  }
  return TREE_KINDS.length - 1;
}
const tint = new THREE.Color();
// A part: unindexed, no uvs, one color on every vertex (shaded later, per vertex)
const part = (g, hex, shade = 0) => {
  const out = clean(g);
  tint.set(hex).offsetHSL(0, 0, shade);
  const col = new Float32Array(out.attributes.position.count * 3);
  for (let i = 0; i < col.length; i += 3) col.set([tint.r, tint.g, tint.b], i);
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return out;
};
// Multiply a part's colors by f(vertex position, vertex index)
const shadeBy = (g, f) => {
  const pos = g.attributes.position,
    col = g.attributes.color,
    v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const k = f(v.fromBufferAttribute(pos, i), i);
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  return g;
};
const up = new THREE.Vector3(0, 1, 0);
const clamp01 = (t) => THREE.MathUtils.clamp(t, 0, 1);
// A trunk: turned about y, its radius at a fraction t up it radiusAt(t)
// (the root flare laid over the bottom quarter), its axis off to `lean`
// at its top, by t^curve (1: a straight lean; higher: it curves over,
// upright at the foot and leaning most at the top); darker at its foot.
// It starts a little under the ground
const trunk = (h, radiusAt, lean, curve, T, rings = 8) => {
  const g = new THREE.CylinderGeometry(1, 1, h + 0.3, 12, rings, true).translate(0, (h + 0.3) / 2 - 0.3, 0);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = clamp01((pos.getY(i) + 0.3) / (h + 0.3));
    const r = radiusAt(t) * (1 + T.flare * Math.max(0, 1 - t * 4) ** 2);
    const k = t ** curve;
    pos.setX(i, pos.getX(i) * r + lean[0] * k);
    pos.setZ(i, pos.getZ(i) * r + lean[1] * k);
  }
  g.computeVertexNormals();
  return shadeBy(part(g, T.bark), (v) => T.barkShade[0] + (T.barkShade[1] - T.barkShade[0]) * clamp01(v.y / h));
};
// Where a trunk's axis is at a fraction t up it
const axisAt = (h, lean, curve, t) => new THREE.Vector3(lean[0] * t ** curve, h * t, lean[1] * t ** curve);
// A limb: a tapering tube from one point to another, bowed (bow 0:
// straight; toward 1, it leaves level and sweeps up to its end, the
// elbow squarer the nearer 1; toward -1, up first and then out) and
// crooked: `kinks` are the knees along it, evenly spaced, each a pair of
// how far it is kicked across the bow's plane and out of it, of the limb's
// length (both ends stay put). In the bark of the trunk's top. The bow
// lies in the upright plane through both ends, so the tube never twists;
// the knees fall on the tube's rings, so they read as sharp elbows
const limb = (from, to, r0, r1, bow, kinks, T) => {
  const elbow = bow >= 0 ? new THREE.Vector3(to.x, from.y, to.z) : new THREE.Vector3(from.x, to.y, from.z);
  const ctrl = from.clone().lerp(to, 0.5).lerp(elbow, Math.abs(bow));
  const curve = new THREE.QuadraticBezierCurve3(from, ctrl, to);
  const chord = to.clone().sub(from),
    len = chord.length();
  const side = new THREE.Vector3().crossVectors(chord, up); // across the bow's plane
  if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
  side.normalize();
  const across = new THREE.Vector3().crossVectors(side, chord).normalize(); // in the bow's plane, across the chord
  const rings = 4 * (kinks.length + 1); // the knees on rings
  // The centerline: the bow, plus the knees' kicks, run straight between them
  const knots = [[0, 0], ...kinks, [0, 0]];
  const at = (t, out) => {
    curve.getPoint(t, out);
    const u = clamp01(t) * (knots.length - 1),
      k = Math.min(Math.floor(u), knots.length - 2),
      f = u - k;
    const a = knots[k][0] + (knots[k + 1][0] - knots[k][0]) * f,
      b = knots[k][1] + (knots[k + 1][1] - knots[k][1]) * f;
    return out.addScaledVector(across, a * len).addScaledVector(side, b * len);
  };
  const g = new THREE.CylinderGeometry(r1, r0, 1, 8, rings, true).translate(0, 0.5, 0);
  const pos = g.attributes.position,
    p = new THREE.Vector3(),
    q = new THREE.Vector3(),
    tan = new THREE.Vector3(),
    n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const t = clamp01(pos.getY(i));
    at(t, p);
    tan.copy(at(Math.min(1, t + 0.01), q)).sub(at(Math.max(0, t - 0.01), q)).normalize();
    n.crossVectors(side, tan).normalize(); // across the limb
    at(t, p).addScaledVector(n, pos.getX(i)).addScaledVector(side, pos.getZ(i));
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  return shadeBy(part(g, T.bark), () => T.barkShade[1]);
};
// A pad of canopy: a ball squashed (its height over its middle `flat` of
// its radius, and `under` below: flatter underneath, a cap), its crown
// drawn up into a point (`pull` of its radius further up, `taper` how
// narrow it comes in toward the crown: 0 round, 1 a point, more a
// needle), its side turned about its own axis and stepped in and out
// where the boughs lie, as the cedar's spire is (`boughs` waves from its
// underside to its crown, `steps` deep, of its radius; the waves die out
// at the poles)
const pad = (r, { flat, under, pull, taper, steps, boughs }, c, phase) => {
  const profile = [];
  for (let j = 0; j <= 28; j++) {
    const t = j / 28, // from the underside's pole up to the crown's
      th = Math.PI * (1 - t), // the angle from the crown
      cy = Math.cos(th), // 1 at the crown, -1 underneath
      upper = cy >= 0;
    const wave = 1 + steps * Math.sin(t * boughs * Math.PI * 2 + phase);
    const narrow = upper ? (1 - cy) ** taper : 1; // the upper half drawn in toward the crown
    const y = upper ? r * (flat * cy + pull * cy * cy) : r * under * cy; // ...and up, most at the crown
    profile.push(new THREE.Vector2(r * Math.sin(th) * wave * narrow, y));
  }
  return new THREE.LatheGeometry(profile, 16).translate(c.x, c.y, c.z);
};
// A frond: a long flat blade from `start` out along `dir`, its tip
// falling `droop` of its length; `wide` across at its widest (the
// middle), narrowing to a stalk at its root and a point at its tip, and
// `thin` thick. A solid, so it is seen from both sides and casts a
// shadow: a tube along the blade's curve, its ring flattened, wide across
// (level) and thin through. Its color is laid on later (part)
const frond = (start, dir, len, wide, thin, droop) => {
  const end = start.clone().addScaledVector(dir, len).addScaledVector(up, -droop * len);
  const ctrl = start.clone().addScaledVector(dir, len * 0.55);
  const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
  const chord = end.clone().sub(start);
  const side = new THREE.Vector3().crossVectors(chord, up); // across the blade, level
  if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
  side.normalize();
  const g = new THREE.CylinderGeometry(1, 1, 1, 8, 14, true).translate(0, 0.5, 0);
  const pos = g.attributes.position,
    p = new THREE.Vector3(),
    tan = new THREE.Vector3(),
    n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const t = clamp01(pos.getY(i));
    const w = (wide / 2) * Math.max(0.08, Math.sin(Math.PI * t) ** 0.7); // the blade's half width: a stalk, widest in the middle, a point
    curve.getPoint(t, p);
    curve.getTangent(t, tan);
    n.crossVectors(side, tan).normalize(); // through the blade
    p.addScaledVector(n, pos.getX(i) * (thin / 2)).addScaledVector(side, pos.getZ(i) * w);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  g.userData.curve = curve;
  return g;
};
// The canopy's light: low-versus-high over the whole canopy (lo – hi),
// and in-versus-out from the trunk's axis (to `out`)
const canopyLight = (S, lo, hi, out, lean) => (v) => {
  const high = clamp01((v.y - lo) / ((hi - lo) * S.stop)),
    outer = clamp01(Math.hypot(v.x - lean[0], v.z - lean[1]) / out);
  return S.under + (S.over - S.under) * ((1 - S.outward) * high + S.outward * outer);
};
// A way to lean, drawn: a direction round the compass and how far
const leanOf = (range, between, n) => {
  const a = between([0, Math.PI * 2], n),
    d = between(range, n + 1);
  return [Math.cos(a) * d, Math.sin(a) * d];
};
// Shape k of a kind: its geometry, with userData.solid for the bird to bump
// ({ h, girth, lean, blobs }: the trunk as a leaning cylinder, the canopy
// as spheres)
export function buildTree(kind, k, T = TREES) {
  const draw = (n) => hash(k + 1, 19, n);
  const between = ([lo, hi], n) => lo + draw(n) * (hi - lo);
  const whole = (range, n) => Math.round(between([range[0] - 0.49, range[1] + 0.49], n));
  const S = T.shade,
    K = T[kind];
  const parts = [],
    blobs = []; // what the bird bumps
  let solid;
  if (kind === "cedar") {
    const h = between(K.trunk, 1),
      g = between(K.girth, 2),
      lean = leanOf(K.lean, between, 3);
    parts.push(trunk(h, (t) => g * (1 - 0.45 * t), lean, 1, T));
    // The spire: its side turned about the trunk, tapering up to a point,
    // its edge stepped where the boughs lie; its underside apart (own
    // normals: no dark rim)
    const H = between(K.height, 5),
      R = H * between(K.aspect, 6),
      foot = h * K.base,
      bump = between([0, Math.PI * 2], 7);
    const sideP = [],
      underP = [];
    for (let j = 0; j <= 40; j++) {
      const t = j / 40;
      const steps = 1 + K.steps * Math.sin(t * 26 + bump) * (1 - t); // the boughs
      sideP.push(new THREE.Vector2(R * Math.pow(1 - t, 0.8) * Math.min(1, t * 6 + 0.35) * steps, foot + H * t));
    }
    for (let j = 0; j <= 4; j++) underP.push(new THREE.Vector2(R * 0.35 * (1 - j / 4), foot - H * 0.02 * (j / 4)));
    underP.reverse();
    const spire = mergeGeometries([clean(new THREE.LatheGeometry(sideP, 20)), clean(new THREE.LatheGeometry(underP, 20))]).translate(lean[0], 0, lean[1]);
    parts.push(shadeBy(part(spire, T.leaf, -K.dark), canopyLight(S, foot, foot + H, R, lean)));
    for (let i = 0; i < 4; i++) {
      const t = (i + 0.5) / 4;
      blobs.push({ c: new THREE.Vector3(lean[0], foot + H * t, lean[1]), r: R * (1 - t * 0.7) + 0.3 });
    }
    solid = { h, girth: g, lean, blobs };
  } else if (kind === "cloud") {
    // The trunk's full height sets where the limbs leave it and how it
    // bends; it is built only up to the highest limb (a stub past it),
    // since the pads sit at the limbs' ends alone, none on the trunk
    const h = between(K.trunk, 1),
      g = between(K.girth, 2),
      lean = leanOf([K.bend[0] * h, K.bend[1] * h], between, 3),
      curve = 1.8;
    const girthAt = (t) => g * (1 - 0.45 * t);
    // The limbs, turned evenly round the trunk, give or take, each bowed
    // out to its pad
    const pads = [];
    const n = Math.max(1, whole(K.limbs, 9)),
      turn0 = between([0, Math.PI * 2], 10);
    let topT = 0;
    for (let i = 0; i < n; i++) {
      const s = 20 + i * 16;
      const t = between(K.from, s),
        a = turn0 + (i * Math.PI * 2) / n + between([-0.5, 0.5], s + 1),
        reach = between(K.reach, s + 2) * h,
        rise = between(K.rise, s + 3) * h,
        r = between(K.pad, s + 4),
        bow = between(K.bow, s + 5),
        crook = between(K.crook, s + 6);
      const kinks = [0, 1, 2].map((j) => [between([-1, 1], s + 7 + j * 2) * crook, between([-1, 1], s + 8 + j * 2) * crook]); // three knees
      topT = Math.max(topT, t);
      const from = axisAt(h, lean, curve, t);
      const c = from.clone().add(new THREE.Vector3(Math.cos(a) * reach, rise, Math.sin(a) * reach));
      parts.push(limb(from, c, girthAt(t) * K.limbGirth, girthAt(t) * K.limbGirth * 0.5, bow, kinks, T));
      pads.push({ c, r });
    }
    const hTop = Math.min(h, h * topT + girthAt(topT)); // the stub: a girth past the highest limb
    const leanTop = [lean[0] * (hTop / h) ** curve, lean[1] * (hTop / h) ** curve]; // where the axis is at that height
    parts.push(trunk(hTop, (t) => girthAt((t * hTop) / h), leanTop, curve, T, 12));
    const top = axisAt(h, lean, curve, topT);
    const lo = Math.min(...pads.map((p) => p.c.y - p.r * K.under)),
      hi = Math.max(...pads.map((p) => p.c.y + p.r * (K.flat + K.pull))),
      out = Math.max(...pads.map((p) => Math.hypot(p.c.x - top.x, p.c.z - top.z) + p.r));
    const light = canopyLight(S, lo, hi, out, [top.x, top.z]);
    pads.forEach(({ c, r }, i) => {
      // Each pad darker at its underside, lighter at its crown, then the canopy's light
      const bottom = c.y - r * K.under,
        tall = r * (K.under + K.flat + K.pull);
      parts.push(shadeBy(part(pad(r, K, c, between([0, Math.PI * 2], 11 + i)), T.leaf, -K.dark), (v) => (S.pad[0] + (S.pad[1] - S.pad[0]) * clamp01((v.y - bottom) / tall)) * light(v)));
      blobs.push({ c, r: r * Math.max(K.flat, 0.5) }); // a ball inside the pad
    });
    solid = { h: hTop, girth: g, lean: leanTop, blobs };
  } else {
    // A bottle tree: the trunk swells to its widest at the waist and
    // tapers hard above it; the fronds fan out of its top, each tipped
    // its own way, long flat blades that droop at the tip, as a palm's
    const h = between(K.trunk, 1),
      g = between(K.girth, 2),
      belly = between(K.belly, 3),
      waist = between(K.waist, 4),
      lean = leanOf(K.lean, between, 5);
    const swell = (t) => Math.sin((Math.PI / 2) * (t < waist ? t / waist : (1 - t) / (1 - waist)));
    const radiusAt = (t) => g * (1 + (K.top - 1) * t) * (1 + belly * swell(t));
    parts.push(trunk(h, radiusAt, lean, 1, T, 24));
    const n = whole(K.sprigs, 7),
      turn0 = between([0, Math.PI * 2], 8);
    const start = axisAt(h, lean, 1, 1).add(new THREE.Vector3(0, -0.3, 0)); // a touch into the trunk
    let lo = Infinity,
      hi = -Infinity,
      out = 0;
    const fronds = [];
    const q = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const s = 20 + i * 8;
      const a = turn0 + (i * Math.PI * 2) / n + between([-0.4, 0.4], s),
        splay = between(K.splay, s + 1),
        len = between(K.sprig, s + 2) * h,
        wide = between(K.wide, s + 3),
        droop = between(K.droop, s + 4);
      const dir = new THREE.Vector3(Math.sin(splay) * Math.cos(a), Math.cos(splay), Math.sin(splay) * Math.sin(a));
      const f = frond(start, dir, len, wide, K.thin, droop);
      fronds.push(f);
      // What the bird bumps: a few balls along the blade, as wide as it
      for (let j = 1; j <= 3; j++) {
        f.userData.curve.getPoint(j / 3.5, q);
        blobs.push({ c: q.clone(), r: wide / 2 });
        lo = Math.min(lo, q.y - wide / 2);
        hi = Math.max(hi, q.y + wide / 2);
        out = Math.max(out, Math.hypot(q.x - start.x, q.z - start.z) + wide / 2);
      }
    }
    const light = canopyLight(S, lo, hi, out, [start.x, start.z]);
    for (const f of fronds) {
      const c = f.userData.curve;
      // Each frond darker at its root, lighter toward its tip (S.pad, as a pad is from its underside to its crown), then the canopy's light
      const root = c.getPoint(0),
        tip = c.getPoint(1),
        span = tip.clone().sub(root),
        along = (v) => clamp01(v.clone().sub(root).dot(span) / span.lengthSq());
      parts.push(shadeBy(part(f, T.leaf, -K.dark), (v) => (S.pad[0] + (S.pad[1] - S.pad[0]) * along(v)) * light(v)));
    }
    solid = { h, girth: g * (1 + belly), lean, blobs }; // the trunk at its widest
  }
  const merged = mergeGeometries(parts);
  merged.userData.solid = solid;
  return merged;
}
// How far a tree of this kind and scale reaches out from its trunk, at
// most, for keeping trees apart
export const treeRadius = (kind, scale, T = TREES) => {
  const K = T[kind];
  const r =
    kind === "cedar"
      ? K.height[1] * K.aspect[1]
      : kind === "cloud"
        ? K.reach[1] * K.trunk[1] + K.pad[1]
        : Math.max(K.girth[1] * (1 + K.belly[1]), Math.sin(K.splay[1]) * K.sprig[1] * K.trunk[1] + K.wide[1] / 2);
  return r * scale;
};
export const treeMaterial = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });

// =====================================================================
// Obelisks
// =====================================================================
// Stone markers standing in the grass, as the graves stand in their
// thousands among the cedars at Okunoin. Five kinds, every one the same
// width at its foot, each built at OBELISKS.heights heights from the
// shortest shaft to the tallest:
//   needle   a square shaft tapering up to a low pyramid
//   stele    a slab of a shaft, barely tapering, under a shallow cap
//   octagon  an eight-sided shaft and an eight-sided cap
//   tiered   three sections stacked, each a step in from the one below
//   dome     a square shaft under a rounded top
//   lantern  a stone lantern (a tōrō): base, a shaft as an obelisk's, platform, light
//            box, a wide low roof and a ball on top; short, medium or tall
//            by its pole (the heights fall into the three, shortest to tallest)
// Crisp stone, flat shaded; the statues' stone material draws them (its
// weathering paints them), so the geometry carries no color of its own.
// World units, foot at y = 0. The obelisks lab (obelisks.html) slides all of it.
export const OBELISK_KINDS = ["needle", "stele", "octagon", "tiered", "dome", "lantern", "pentago", "diamond", "tsuri", "fallen", "gaslamp"]; // tsuri: the globe lamp; pentago: the five-sided lamp; diamond: the lamp with a diamond at its center
// The kinds with a light in them (their windows glow: buildLanternGlow)
export const LIT_KINDS = ["lantern", "pentago", "diamond", "tsuri", "fallen", "gaslamp"];
export const OBELISKS = {
  kinds: [...OBELISK_KINDS], // which kinds stand (a subset of OBELISK_KINDS)
  heights: 8, // heights built of each kind, shortest to tallest
  shaft: [3, 26], // the shaft's height, shortest to tallest
  width: 2.6, // the shaft's width at its foot: every kind, every height
  taper: 0.72, // a needle's width at the top, of its foot (the others taper their own way, from this)
  cap: 0.8, // a needle's pyramid height, of its top width (the others' caps scale from it)
  lit: 0.18, // the share of the stones that are lanterns of some kind (LIT_KINDS, those switched on), the rest the plain kinds: so adding lantern kinds does not fill the groves with lamps
};
// A kind for a stone from two draws (0 – 1): a lantern or not by O.lit,
// then which of those; all of one sort, if the other is switched off
export function pickStoneKind(u1, u2, O = OBELISKS) {
  const lit = O.kinds.filter((k) => LIT_KINDS.includes(k)),
    plain = O.kinds.filter((k) => !LIT_KINDS.includes(k));
  const from = (lit.length && (u1 < O.lit || !plain.length)) ? lit : plain;
  return from[Math.floor(u2 * from.length)];
}
// The obelisks lab's saved knobs, laid over OBELISKS (what's set there is
// what the field and the island tab stand)
export function loadSavedObelisks(O = OBELISKS) {
  try {
    const saved = JSON.parse(localStorage.getItem("obelisks-lab") || "{}")?.O;
    if (saved && typeof saved === "object")
      for (const k of Object.keys(O)) {
        if (Array.isArray(O[k]) && Array.isArray(saved[k])) O[k] = [...saved[k]];
        else if (typeof O[k] === typeof saved[k]) O[k] = saved[k];
      }
    O.kinds = O.kinds.filter((k) => OBELISK_KINDS.includes(k));
    // A kind the lab had not heard of when it saved (saved.known) is on until it is switched off there
    for (const k of OBELISK_KINDS) if (!(saved.known ?? []).includes(k) && !O.kinds.includes(k)) O.kinds.push(k);
    if (!O.kinds.length) O.kinds = [...OBELISK_KINDS];
  } catch {
    /* no storage: the code's own */
  }
  return O;
}
const SQUARE = Math.PI / 4; // a four-sided cylinder turned so its faces line up with x and z
const LANTERN = { pole: [0.35, 1.4, 7.3] }; // a lantern's pole, short, medium and tall, of the obelisks' width (the tall one twice the height it was)
const shaftAt = (k, O) => O.shaft[0] + (O.heights > 1 ? k / (O.heights - 1) : 0) * (O.shaft[1] - O.shaft[0]);
const sizeAt = (k, O) => Math.min(2, Math.floor((O.heights > 1 ? k / (O.heights - 1) : 0) * 3)); // short, medium or tall: the heights fall into three
const kAt = (k, O) => (O.heights > 1 ? k / (O.heights - 1) : 0); // 0 – 1 up the heights
// A lantern's head, from y = 0 up: the platform, the light box (its windows
// glow), the lintel, the roof and the jewel; `roof` widens and lowers it,
// `box` scales the box. Returns its parts, how tall it stands,
// and where its windows are (the box's middle and half-width, for the glow)
function lanternHead(w, { roof = 1, box = 1, platform = true } = {}) {
  const sq = (half) => half * Math.SQRT2;
  const parts = [];
  let y = 0;
  const boxPart = (bw, bh) => {
    parts.push(new THREE.BoxGeometry(bw, bh, bw).translate(0, y + bh / 2, 0));
    y += bh;
  };
  if (platform) boxPart(w * 0.95, w * 0.16);
  const boxW = w * 0.62 * box,
    boxH = w * 0.55 * box;
  const boxMid = y + boxH / 2;
  boxPart(boxW, boxH);
  boxPart(w * 0.78 * box, w * 0.06);
  const roofH = w * 0.42 * (roof > 1 ? 0.75 : 1) * box;
  parts.push(new THREE.ConeGeometry(sq(w * 0.68 * roof * box), roofH, 4).rotateY(SQUARE).translate(0, y + roofH / 2, 0));
  y += roofH * 0.8;
  const ball = w * 0.13 * box;
  parts.push(new THREE.SphereGeometry(ball, 8, 6).translate(0, y + ball, 0));
  return { parts, top: y + ball * 2, boxMid, half: boxW / 2, pane: [boxW * 0.62, boxH * 0.65] };
}
// The glow's layout for a kind at height k: where its panes go (the box's
// middle and half-width, each pane's size), and a matrix the whole lot is
// moved by (the fallen lantern's head lies on the ground)
// A kind at height k: its pieces (unflattened), how tall it stands, and
// (a lit kind) where its light is
function obeliskPieces(kind, k, O) {
  const H = shaftAt(k, O),
    w = O.width,
    sq = (half) => half * Math.SQRT2; // a square's corner radius from its half-width
  const parts = [];
  let top = H;
  let band = [0.9, H * 0.82, w * 0.36]; // where its inscription may run (inscribe): from, to, a symbol's cell; a needle's
  let glow = null; // a lit kind: { boxMid, half, pane: [w, h], matrix? }
  const lift = (head, y, matrix = null) => {
    // a head set on top of what stands so far, at y; its light noted
    for (const p of head.parts) {
      p.translate(0, y, 0);
      if (matrix) p.applyMatrix4(matrix);
      parts.push(p);
    }
    glow = { boxMid: y + head.boxMid, half: head.half, pane: head.pane, matrix };
    return y + head.top;
  };
  if (kind === "stele") {
    band = [0.7, H * 0.9, w * 0.36];
    const wt = w * 0.93;
    parts.push(new THREE.CylinderGeometry(sq(wt / 2), sq(w / 2), H, 4, 1).rotateY(SQUARE).translate(0, H / 2, 0));
    const capH = wt * 0.18;
    parts.push(new THREE.ConeGeometry(sq(wt / 2), capH, 4).rotateY(SQUARE).translate(0, H + capH / 2, 0));
    top = H + capH;
  } else if (kind === "octagon") {
    band = [0.9, H * 0.82, w * 0.33];
    const oct = (half) => half / Math.cos(Math.PI / 8); // an octagon's corner radius from its half-width across the flats
    const wt = w * O.taper;
    parts.push(new THREE.CylinderGeometry(oct(wt / 2), oct(w / 2), H, 8, 1).rotateY(Math.PI / 8).translate(0, H / 2, 0));
    const capH = wt * O.cap * 0.9;
    parts.push(new THREE.ConeGeometry(oct(wt / 2), capH, 8).rotateY(Math.PI / 8).translate(0, H + capH / 2, 0));
    top = H + capH;
  } else if (kind === "tiered") {
    band = [0.6, H * 0.46 * 0.9, w * 0.36]; // the bottom section
    const share = [0.46, 0.32, 0.22],
      widths = [1, 0.84, 0.68];
    let y = 0;
    share.forEach((f, i) => {
      const h = H * f,
        wb = w * widths[i],
        wt = wb * 0.96;
      parts.push(new THREE.CylinderGeometry(sq(wt / 2), sq(wb / 2), h, 4, 1).rotateY(SQUARE).translate(0, y + h / 2, 0));
      y += h;
    });
    const wt = w * widths[2] * 0.96,
      capH = wt * O.cap * 0.7;
    parts.push(new THREE.ConeGeometry(sq(wt / 2), capH, 4).rotateY(SQUARE).translate(0, H + capH / 2, 0));
    top = H + capH;
  } else if (kind === "dome") {
    band = [0.8, H * 0.85, w * 0.33];
    const wt = w * 0.86;
    parts.push(new THREE.CylinderGeometry(sq(wt / 2), sq(w / 2), H, 4, 1).rotateY(SQUARE).translate(0, H / 2, 0));
    const r = wt / 2;
    parts.push(new THREE.SphereGeometry(r, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.9, 1).translate(0, H, 0)); // within the top's square, a little low
    top = H + r * 0.9;
  } else if (kind === "lantern") {
    // A tōrō: a stepped base, a pole (short, medium or tall) and the head
    const pole = w * LANTERN.pole[sizeAt(k, O)];
    let y = 0;
    const box = (bw, bh) => {
      parts.push(new THREE.BoxGeometry(bw, bh, bw).translate(0, y + bh / 2, 0));
      y += bh;
    };
    box(w * 1.3, w * 0.2); // the base, stepped
    box(w * 1.1, w * 0.1);
    band = [y + 0.3, y + pole - 0.3, w * 0.3]; // up the pole
    parts.push(new THREE.CylinderGeometry(sq(w * 0.4), sq(w * 0.5), pole, 4, 1).rotateY(SQUARE).translate(0, y + pole / 2, 0)); // the pole: a shaft as thick as an obelisk's, tapering a little
    y += pole;
    top = lift(lanternHead(w), y);
  } else if (kind === "pentago") {
    // A pentagonal lamp: a tapered obelisk standing on four feet, under a
    // five-sided lantern, a window on each side, under a five-sided roof
    // and a finial
    const shaft = w * (1.0 + 2.4 * kAt(k, O)),
      wt = w * 0.62;
    const footH = w * 0.38, // (was 0.22, then 0.55: between)
      foot = w * 0.24,
      slab = w * 0.1;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) parts.push(new THREE.BoxGeometry(foot, footH, foot).translate(sx * w * 0.36, footH / 2, sz * w * 0.36)); // the four feet
    parts.push(new THREE.BoxGeometry(w * 1.0, slab, w * 1.0).translate(0, footH + slab / 2, 0)); // the slab on them
    const foot0 = footH + slab;
    band = [foot0 + 0.4, foot0 + shaft - 0.3, w * 0.3];
    parts.push(new THREE.CylinderGeometry(sq(wt / 2), sq(w / 2), shaft, 4, 1).rotateY(SQUARE).translate(0, foot0 + shaft / 2, 0));
    let y = foot0 + shaft;
    const pent = (half) => half / Math.cos(Math.PI / 5); // a pentagon's corner radius from its half-width across the flats
    const plate = w * 0.06;
    parts.push(new THREE.CylinderGeometry(pent(w * 0.5), pent(w * 0.5), plate, 5, 1).translate(0, y + plate / 2, 0)); // the plate it stands on
    y += plate;
    const lw = w * 0.4, // the lantern's half-width across the flats
      lh = w * 0.7;
    parts.push(new THREE.CylinderGeometry(pent(lw), pent(lw), lh, 5, 1).translate(0, y + lh / 2, 0)); // the body: its windows are the glow
    const sill = y;
    y += lh;
    const lintel = w * 0.06;
    parts.push(new THREE.CylinderGeometry(pent(lw * 1.15), pent(lw * 1.15), lintel, 5, 1).translate(0, y + lintel / 2, 0));
    y += lintel;
    const roofH = w * 0.34;
    parts.push(new THREE.ConeGeometry(pent(lw * 1.25), roofH, 5).translate(0, y + roofH / 2, 0));
    y += roofH;
    parts.push(new THREE.SphereGeometry(w * 0.07, 8, 6).translate(0, y + w * 0.05, 0)); // the finial
    glow = { boxMid: sill + lh / 2, half: lw, pane: [lw * 1.1, lh * 0.8], sides: 5, phase: Math.PI / 5 }; // a pane on each of the five faces (the faces sit between the prism's corners: phase)
    top = y + w * 0.12;
  } else if (kind === "diamond") {
    // A cut lamp: a plain tapered obelisk with triangles cut into each face,
    // the light showing through: one, two or three up the face by its size
    // (short, medium, tall), each a triangle pane of glow set into the face
    const shaft = w * (1.2 + 2.6 * kAt(k, O)),
      wt = w * 0.62,
      capH = wt * O.cap * 0.8;
    parts.push(new THREE.CylinderGeometry(sq(wt / 2), sq(w / 2), shaft, 4, 1).rotateY(SQUARE).translate(0, shaft / 2, 0));
    parts.push(new THREE.ConeGeometry(sq(wt / 2), capH, 4).rotateY(SQUARE).translate(0, shaft + capH / 2, 0));
    const n = sizeAt(k, O) + 1;
    const faceHalf = (y) => (w / 2) * (1 - y / shaft) + (wt / 2) * (y / shaft); // the face's half-width at a height (the shaft tapers)
    const cuts = [];
    const step = w * 0.95, // from one cut to the next
      first = shaft * 0.55 - ((n - 1) * step) / 2; // the cuts centered a little above the middle
    for (let c = 0; c < n; c++) {
      const y = first + c * step;
      cuts.push({ y, half: faceHalf(y), r: faceHalf(y) * 0.95 }); // r: the triangle's corner radius
    }
    band = [0.4, cuts[0].y - cuts[0].r - 0.2, w * 0.3]; // the inscription below the cuts
    glow = { cuts, lightY: cuts[Math.floor((n - 1) / 2)].y };
    top = shaft + capH;
  } else if (kind === "tsuri") {
    // A globe lamp: a tapered obelisk with a frosted globe on top (the
    // globe is the glow itself, drawn by the warm material: there is no
    // stone sphere), in a little cup
    const shaft = w * (1.0 + 2.2 * kAt(k, O)),
      wt = w * 0.6,
      globe = w * 0.42;
    band = [0.4, shaft - 0.3, w * 0.3];
    parts.push(new THREE.CylinderGeometry(sq(wt / 2), sq(w / 2), shaft, 4, 1).rotateY(SQUARE).translate(0, shaft / 2, 0));
    const cupH = w * 0.14;
    parts.push(new THREE.CylinderGeometry(globe * 0.75, wt * 0.5, cupH, 8, 1).translate(0, shaft + cupH / 2, 0)); // the cup the globe sits in
    const gy = shaft + cupH + globe * 0.8;
    // On the globe's crown: a flattish cone of a cap, the little tip on it
    const capR = globe * 0.42,
      capH = globe * 0.16,
      capY = gy + globe * 0.9;
    parts.push(new THREE.ConeGeometry(capR, capH, 10).translate(0, capY + capH / 2, 0));
    parts.push(new THREE.SphereGeometry(globe * 0.12, 8, 6).scale(1, 1.4, 1).translate(0, capY + capH + globe * 0.1, 0));
    glow = { globe: { y: gy, r: globe } };
    top = capY + capH + globe * 0.3;
  } else if (kind === "fallen") {
    // A tōrō that has fallen: the base and a stub of the pole stand, the
    // rest of the pole and the head lie on the grass beside, the light box
    // on its side
    const pole = w * LANTERN.pole[Math.max(1, sizeAt(k, O))],
      stub = pole * 0.3;
    let y = 0;
    const box = (bw, bh) => {
      parts.push(new THREE.BoxGeometry(bw, bh, bw).translate(0, y + bh / 2, 0));
      y += bh;
    };
    box(w * 1.3, w * 0.2);
    box(w * 1.1, w * 0.1);
    band = [0, 0, 1];
    parts.push(new THREE.CylinderGeometry(sq(w * 0.47), sq(w * 0.5), stub, 4, 1).rotateY(SQUARE).translate(0, y + stub / 2, 0));
    top = y + stub;
    // The fallen piece, built upright from 0 then laid over: rolled a little
    // off flat, turned, and set down past the base
    const rest = pole - stub;
    const lying = new THREE.Matrix4()
      .makeTranslation(w * 0.2, w * 0.33, w * 1.0)
      .multiply(new THREE.Matrix4().makeRotationY(0.5))
      .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 - 0.08));
    const stem = new THREE.CylinderGeometry(sq(w * 0.4), sq(w * 0.47), rest, 4, 1).rotateY(SQUARE).translate(0, rest / 2, 0).applyMatrix4(lying);
    parts.push(stem);
    lift(lanternHead(w), rest, lying);
  } else if (kind === "gaslamp") {
    // A lamp from another churchyard: a fat tapered obelisk of a base under
    // a square stone lantern with Tudor windows, each face a grid of panes
    // between stone mullions and a transom, under a drip mold and a
    // shallow hipped roof with a finial
    const shaft = w * (1.2 + 2.6 * kAt(k, O)),
      wt = w * 0.72;
    band = [0.4, shaft - 0.3, w * 0.3];
    parts.push(new THREE.CylinderGeometry(sq(wt / 2), sq(w / 2), shaft, 4, 1).rotateY(SQUARE).translate(0, shaft / 2, 0));
    let y = shaft;
    const box = (bw, bh) => {
      parts.push(new THREE.BoxGeometry(bw, bh, bw).translate(0, y + bh / 2, 0));
      y += bh;
    };
    box(w * 0.9, w * 0.08); // the cornice the lantern sits on
    const lw = w * 0.82,
      lh = w * 0.8;
    const sill = y;
    box(lw, lh); // the lantern's body: its windows are the glow, gridded
    // The mullions and the transom on every face, a little proud of it:
    // two uprights and one bar across, so each window is six panes
    const cols = 3,
      rows = 2,
      bar = w * 0.045,
      proud = lw / 2 + w * 0.012;
    for (let f = 0; f < 4; f++) {
      const face = [];
      for (let c = 1; c < cols; c++) face.push(new THREE.BoxGeometry(bar, lh, bar * 1.6).translate((c / cols - 0.5) * lw * 0.86, sill + lh / 2, proud));
      for (let r = 1; r < rows; r++) face.push(new THREE.BoxGeometry(lw * 0.9, bar, bar * 1.6).translate(0, sill + (r / rows) * lh, proud));
      for (const m of face) parts.push(m.rotateY((f * Math.PI) / 2));
    }
    box(lw * 1.12, w * 0.07); // the drip mold over the windows
    const roofH = w * 0.26;
    parts.push(new THREE.ConeGeometry(sq(lw * 0.6), roofH, 4).rotateY(SQUARE).translate(0, y + roofH / 2, 0)); // a shallow hipped roof
    y += roofH;
    parts.push(new THREE.SphereGeometry(w * 0.06, 8, 6).translate(0, y + w * 0.05, 0)); // the finial
    glow = { boxMid: sill + lh / 2, half: lw / 2, pane: [lw * 0.86, lh * 0.9], grid: [cols, rows, bar] }; // the panes in a grid, the mullions between
    top = y + w * 0.12;
  } else {
    // needle
    const wt = w * O.taper,
      capH = wt * O.cap;
    parts.push(new THREE.CylinderGeometry(sq(wt / 2), sq(w / 2), H, 4, 1).rotateY(SQUARE).translate(0, H / 2, 0));
    parts.push(new THREE.ConeGeometry(sq(wt / 2), capH, 4).rotateY(SQUARE).translate(0, H + capH / 2, 0));
    top = H + capH;
  }
  return { parts, top, band, glow };
}
export function buildObelisk(kind, k, O = OBELISKS) {
  const { parts, top, band } = obeliskPieces(kind, k, O);
  // Flat shaded: every face its own normal
  const g = mergeGeometries(parts.map((p) => {
    const q = clean(p);
    q.computeVertexNormals();
    return q;
  }));
  // Where the stone's shader may carve its inscription (statues.js
  // weathering: a column of symbols up a face), the same on every vertex;
  // none where the band won't hold a symbol. Statues carry no such lane,
  // so are never inscribed
  const fits = band[1] - band[0] >= band[2];
  const lane = new Float32Array(g.attributes.position.count * 3);
  if (fits) for (let i = 0; i < lane.length; i += 3) lane.set(band, i);
  g.setAttribute("aBand", new THREE.BufferAttribute(lane, 3));
  g.userData.solid = { r: O.width * 0.72, top, shaftR: O.width * 0.6 }; // what the bird bumps: the shaft's foot, then the shaft
  return g;
}
// A lit kind's light: a glowing window on each side of its light box, a
// little proud of it, for an unlit warm material to draw over the stone.
// Laid out as obeliskPieces lays the kind (its glow), so it sits on it at
// the same matrix. userData.light: how high the light box's middle is (for
// a lamp in it)
export function buildLanternGlow(kind, k, O = OBELISKS) {
  if (typeof kind === "number") [kind, k, O] = ["lantern", kind, k ?? OBELISKS]; // (the old call: a lantern's height alone)
  const { glow } = obeliskPieces(kind, k, O);
  if (!glow) return null;
  const w = O.width;
  if (glow.cuts) {
    // Triangles cut into the four faces: a pane each, a corner up
    const faces = [];
    for (const c of glow.cuts) {
      const tri = new THREE.CircleGeometry(c.r, 3).rotateZ(Math.PI / 2).translate(0, c.y, c.half + w * 0.006);
      for (let i = 0; i < 4; i++) faces.push(clean(tri.clone().rotateY((i * Math.PI) / 2)));
    }
    const g = mergeGeometries(faces);
    g.userData.light = glow.lightY;
    return g;
  }
  if (glow.diamond) {
    // A diamond: the glow is the lamp itself
    const D = glow.diamond;
    const g = new THREE.OctahedronGeometry(D.r, 0).scale(1, D.tall, 1).translate(0, D.y, 0);
    g.userData.light = D.y;
    return g;
  }
  if (glow.globe) {
    // A globe: the glow is the lamp itself
    const g = new THREE.SphereGeometry(glow.globe.r, 12, 8).translate(0, glow.globe.y, 0);
    g.userData.light = glow.globe.y;
    return g;
  }
  const half = glow.half + w * 0.006; // the box's half-width, and a hair
  // One pane a face, or (grid: columns, rows, the bar between) a grid of
  // small panes, the gaps where the mullions and the transom stand
  const face = [];
  if (glow.grid) {
    const [cols, rows, bar] = glow.grid,
      pw = (glow.pane[0] - bar * (cols - 1)) / cols,
      ph = (glow.pane[1] - bar * (rows - 1)) / rows;
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++)
        face.push(new THREE.PlaneGeometry(pw, ph).translate((c + 0.5) * (pw + bar) - glow.pane[0] / 2, glow.boxMid + (r + 0.5) * (ph + bar) - glow.pane[1] / 2, half));
  } else if (glow.diamondCut) face.push(new THREE.PlaneGeometry(glow.pane[0] / Math.SQRT2, glow.pane[1] / Math.SQRT2).rotateZ(Math.PI / 4).translate(0, glow.boxMid, half)); // a square on its corner
  else face.push(new THREE.PlaneGeometry(glow.pane[0], glow.pane[1]).translate(0, glow.boxMid, half));
  const sides = glow.sides ?? 4,
    phase = glow.phase ?? 0;
  const g = mergeGeometries(Array.from({ length: sides }, (_, i) => i).flatMap((i) => face.map((p) => clean(p.clone().rotateY(phase + (i * Math.PI * 2) / sides)))));
  const mid = new THREE.Vector3(0, glow.boxMid, 0);
  if (glow.matrix) {
    g.applyMatrix4(glow.matrix);
    mid.applyMatrix4(glow.matrix);
  }
  g.userData.light = mid.y;
  return g;
}
// How tall a kind stands at height k, cap and all, at scale 1
export const obeliskHeight = (kind, k, O = OBELISKS) => obeliskPieces(kind, k, O).top;
// How far an obelisk at this scale reaches from its middle, for keeping things apart
const KIND_REACH = { lantern: 0.68, pentago: 0.55, diamond: 0.5, tsuri: 0.5, fallen: 1.5, gaslamp: 0.6 }; // how far a kind reaches out from its foot, of the obelisks' width (a lantern's roof reaches further than a shaft; a fallen one lies spread)
export const obeliskRadius = (scale, O = OBELISKS, kind = "needle") => (KIND_REACH[kind] ?? 0.5) * O.width * Math.SQRT2 * scale;
// The heights under a cap: the tallest of a kind that stands no taller than `top` at `scale`
export function tallestUnder(kind, scale, top, O = OBELISKS) {
  let k = O.heights - 1;
  while (k > 0 && obeliskHeight(kind, k, O) * scale > top) k--;
  return k;
}

// =====================================================================
// Tufts of grass
// =====================================================================
// The grass on the islands, the way the dollies' ground cover has it: fat
// clay strands, each a tapered stalk bending over to a rounded tip, dark
// at the root and lighter up the blade so the field has depth. A few
// shapes are built (world units, foot at y = 0) and each tuft is one of
// them, scaled and turned. Colors in the vertices; smooth shading.
export const TUFTS = {
  density: 0.2, // tufts per square world unit of grass
  shapes: 4, // distinct strands built
  height: [0.2, 0.4], // world units, before the tuft's scale
  radius: [0.42, 0.74], // at the root
  taper: 0.4, // the radius just under the tip, as a fraction of the root's
  bend: [0.25, 0.7], // how far the tip finishes over from the root, as a fraction of the height
  radial: 3, // segments around the stalk
  rings: 3, // rings up the stalk, under the tip
  root: 0x3f6a3b,
  tip: 0x8ab861,
};
export function buildTuft(k, T = TUFTS) {
  const draw = (n) => hash(k + 1, 23, n);
  const between = ([lo, hi], n) => lo + draw(n) * (hi - lo);
  const h = between(T.height, 1),
    r0 = between(T.radius, 2),
    bend = between(T.bend, 3) * h;
  const R = T.radial,
    N = T.rings;
  const pos = [],
    col = [],
    idx = [];
  const root = new THREE.Color(T.root),
    tip = new THREE.Color(T.tip),
    c = new THREE.Color();
  // Rings up the strand, then one vertex at the tip
  for (let s = 0; s < N; s++) {
    const t = s / N;
    const y = h * t,
      bx = bend * t * t;
    const rad = r0 * (1 - (1 - T.taper) * t);
    c.lerpColors(root, tip, t);
    for (let i = 0; i < R; i++) {
      const a = (i / R) * Math.PI * 2;
      pos.push(bx + Math.cos(a) * rad, y, Math.sin(a) * rad);
      col.push(c.r, c.g, c.b);
    }
  }
  pos.push(bend, h, 0);
  col.push(tip.r, tip.g, tip.b);
  const tipIndex = N * R;
  for (let s = 0; s < N - 1; s++)
    for (let i = 0; i < R; i++) {
      const a = s * R + i,
        b = s * R + ((i + 1) % R),
        d = a + R,
        e = b + R;
      idx.push(a, d, b, b, d, e);
    }
  for (let i = 0; i < R; i++)
    idx.push((N - 1) * R + i, tipIndex, (N - 1) * R + ((i + 1) % R));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// =====================================================================
// Rubble
// =====================================================================
// Stone lying about the grass: pebbles, shards and the flat discs of a
// broken walkway. Low-poly and flat shaded, built about one world unit
// across with the bottom at y = 0 (the field scales each piece, sinks it
// a little and lays it where it wants); the field's material draws them.
// A kind is built at DEBRIS.shapes shapes, each its own lumps and corners
export const DEBRIS_KINDS = ["pebble", "shard", "disc"];
export const DEBRIS = {
  shapes: 4, // distinct pieces built per kind
  pebble: { squash: [0.45, 0.75], jitter: 0.35 }, // a rounded lump: its height as a share of its width, and how far its surface is pushed in and out
  shard: { sides: [4, 6], height: [0.3, 0.6], jitter: 0.45, stretch: [1.3, 2.1] }, // a broken flake: how many corners, how thick, how uneven its corners, how much longer than it is wide
  disc: { sides: [7, 10], height: [0.12, 0.2], jitter: 0.12, chip: 0.3 }, // a paving stone: corners, how thick, how uneven, and how often a corner is broken off
};
// A prism: a ring of corners about y, each its own radius (about 0.5,
// pushed in or out by `jitter`), a flat top at `height` and a flat bottom
// at 0; a chipped corner is pulled well in
function prismGeometry(sides, height, jitter, chip, stretch, draw) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = ((i + (draw(10 + i) - 0.5) * 0.6) / sides) * Math.PI * 2;
    let r = 0.5 * (1 + (draw(30 + i) - 0.5) * 2 * jitter);
    if (draw(50 + i) < chip) r *= 0.55;
    pts.push([Math.cos(a) * r * stretch, Math.sin(a) * r]);
  }
  const pos = [];
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let i = 0; i < sides; i++) {
    const [x0, z0] = pts[i],
      [x1, z1] = pts[(i + 1) % sides];
    tri([0, height, 0], [x1, height, z1], [x0, height, z0]); // the top, facing up
    tri([0, 0, 0], [x0, 0, z0], [x1, 0, z1]); // the bottom, facing down
    tri([x0, 0, z0], [x1, height, z1], [x1, 0, z1]); // the side, facing out
    tri([x0, 0, z0], [x0, height, z0], [x1, height, z1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  g.userData.height = height;
  return g;
}
export function buildDebris(kind, k, D = DEBRIS) {
  const draw = (i) => hash(k * 64 + i, DEBRIS_KINDS.indexOf(kind) + 1, 83);
  const between = ([lo, hi], i) => lo + draw(i) * (hi - lo);
  let g;
  if (kind === "pebble") {
    // A lump: a low-poly ball, every point pushed in or out by its own
    // amount (by where it is, so the faces that share it agree), squashed
    // flat, and set down on y = 0
    const P = D.pebble;
    g = new THREE.IcosahedronGeometry(0.5, 1).toNonIndexed();
    const pos = g.attributes.position;
    const squash = between(P.squash, 1);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const push = 1 + (hash(Math.round(x * 97) + k * 4099, Math.round(y * 97) * 31 + Math.round(z * 97), 89) - 0.5) * 2 * P.jitter;
      pos.setXYZ(i, x * push, y * push * squash, z * push);
    }
    g.computeBoundingBox();
    g.translate(0, -g.boundingBox.min.y, 0);
    g.computeVertexNormals();
    g.userData.height = g.boundingBox.max.y - g.boundingBox.min.y;
  } else if (kind === "shard") {
    const S = D.shard;
    g = prismGeometry(Math.round(between(S.sides, 1)), between(S.height, 2), S.jitter, 0, between(S.stretch, 3), draw);
  } else {
    const C = D.disc;
    g = prismGeometry(Math.round(between(C.sides, 1)), between(C.height, 2), C.jitter, C.chip, 1, draw);
  }
  return g;
}
