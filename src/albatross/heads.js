import * as THREE from "three";
// (flatlight.js, the global shader patch, is NOT imported here: the library applies that look per material, see adjectives/flat/material.js)
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const hull = (pts) => new ConvexGeometry(pts.map((p) => V(...p)));
export const mirrorPts = (pts) =>
  pts.flatMap((p) => (p[0] === 0 ? [p] : [p, [-p[0], p[1], p[2]]]));
export const sidePts = (pts, s) => pts.map((p) => [p[0] * s, p[1], p[2]]);
// Non-indexed, no uvs: so every piece can be merged into one geometry
export const clean = (g) => {
  const out = g.index ? g.toNonIndexed() : g;
  out.deleteAttribute("uv");
  return out;
};

// Below this height the neck's walls are straight, so a vertex shader can pull
// the bottom ring down to any length per statue without touching the head
export const STRETCH_FROM = -1.5;

// How far the eyes stand out of the face, as a multiple of the eye shape's
// own depth. Fixed: it's not a knob, every head bulges the same.
export const EYE_BULGE = 2;

// How much narrower the base of the neck is than where it meets the head
// (negative = a wider base). The shaft keeps the skull-base outline at the top
// of the straight zone and scales it evenly down to the ground, which the
// shader stretches over the whole visible neck.
export const NECK_TAPER = -0.15;

export const HEAD_PARAMS = {
  skull: {
    width: {
      label: "skull width",
      default: 0.86,
      range: { min: 0.7, max: 1.05 },
    },
    height: {
      label: "skull height",
      default: 1.1,
      range: { min: 0.9, max: 1.35 },
    },
    depth: {
      label: "skull depth",
      default: 1.0,
      range: { min: 0.85, max: 1.2 },
    },
    sideFlat: {
      label: "side flats",
      default: 0.68,
      range: { min: 0.55, max: 0.86 },
      note: "how far out the flat sides of the cranium sit",
    },
    cheekWidth: {
      label: "cheek width",
      default: 0.36,
      range: { min: 0.22, max: 0.5 },
      note: "where the face's side planes begin",
    },
    foreheadSlope: {
      label: "forehead slope",
      default: 0.4,
      range: { min: 0.1, max: 0.9 },
      note: "higher = more swept back",
    },
    faceFlat: {
      label: "face depth",
      default: 0.88,
      range: { min: 0.78, max: 0.98 },
      note: "the front-of-face plane; lower = flatter face",
    },
  },
  // The jaw and chin
  jaw: {
    width: {
      label: "jaw width",
      default: 0.62,
      range: { min: 0.45, max: 0.8 },
    },
    slope: {
      label: "jaw slope",
      default: -0.45,
      range: { min: -0.85, max: -0.15 },
      note: "nearer 0 = squarer jaw",
    },
    bevel: {
      label: "jaw bevel",
      default: 0.6,
      range: { min: 0.25, max: 1.1 },
      note: "tilt of the bevel under the jaw",
    },
    chinWidth: {
      label: "chin width",
      default: 0.2,
      range: { min: 0.05, max: 0.4 },
    },
    chinY: {
      label: "chin height",
      default: -1.15,
      range: { min: -1.35, max: -0.95 },
      note: "the underside of the chin; lower = longer face",
    },
    chinFront: {
      label: "chin forward",
      default: 0.78,
      range: { min: 0.62, max: 0.92 },
    },
    napeSlope: {
      label: "nape slope",
      default: -0.9,
      range: { min: -1.5, max: -0.5 },
      note: "the under-jaw plane; also shapes the neck's outline",
    },
  },
  // The nose
  nose: {
    width: { label: "nose width", default: 1, range: { min: 0.6, max: 1.8 } },
    length: {
      label: "nose length",
      default: 1,
      range: { min: 0.6, max: 1.5 },
      note: "stretched down from the bridge",
    },
    projection: {
      label: "nose projection",
      default: 1,
      range: { min: 0.4, max: 1.8 },
      note: "how far it stands off the face",
    },
    y: { label: "nose level", default: 0, range: { min: -0.15, max: 0.15 } },
  },
  // The mouth
  mouth: {
    width: { label: "mouth width", default: 1, range: { min: 0.5, max: 1.8 } },
    y: { label: "mouth level", default: 0, range: { min: -0.12, max: 0.12 } },
    lipFullness: {
      label: "lip fullness",
      default: 1,
      range: { min: 0.4, max: 2 },
      note: "how far the lips stand off the face",
    },
    upperLip: {
      label: "upper lip height",
      default: 1,
      range: { min: 0.4, max: 1.8 },
    },
    lowerLip: {
      label: "lower lip height",
      default: 1,
      range: { min: 0.4, max: 1.8 },
    },
  },
  // The eyes
  eyes: {
    spacing: {
      label: "eye spacing",
      default: 0.24,
      range: { min: 0.14, max: 0.36 },
    },
    y: { label: "eye level", default: 0.03, range: { min: -0.12, max: 0.18 } },
    width: { label: "eye width", default: 1, range: { min: 0.6, max: 1.6 } },
    height: {
      label: "eye height",
      default: 0.85,
      range: { min: 0.6, max: 1.8 },
    },
    tilt: {
      label: "eye tilt",
      default: 0,
      range: { min: -0.35, max: 0.35 },
      note: "radians; positive lifts the outer corners",
    },
  },
  // The ears
  ears: {
    size: { label: "ear size", default: 1, range: { min: 0.6, max: 1.6 } },
    y: { label: "ear level", default: 0, range: { min: -0.2, max: 0.2 } },
    out: {
      label: "ears stick out",
      default: 0,
      range: { min: -0.06, max: 0.12 },
    },
    back: {
      label: "ears set back",
      default: 0,
      range: { min: -0.15, max: 0.1 },
    },
  },
  // The crease where the neck meets the head
  neck: {
    filletReach: {
      label: "fillet reach",
      default: 0.25,
      range: { min: 0, max: 0.5 },
      note: "how far up the head the fillet climbs where the jaw overhangs",
    },
    filletDrop: {
      label: "fillet drop",
      default: 0.3,
      range: { min: 0.1, max: 0.7 },
      note: "how far down the shaft it takes to straighten out",
    },
  },
};

// The same knobs as a flat list, one entry per knob, for anything that wants
// to walk them (the lab): key is the "group.name" path, e.g. "skull.width"
export const PARAMS = Object.entries(HEAD_PARAMS).flatMap(([group, knobs]) =>
  Object.entries(knobs).map(([name, q]) => ({
    key: `${group}.${name}`,
    group,
    name,
    label: q.label,
    def: q.default,
    min: q.range.min,
    max: q.range.max,
    note: q.note ?? "",
  })),
);
// Read or write one knob of a params object by its "group.name" path
export const getKnob = (P, key) => {
  const [g, n] = key.split(".");
  return P[g][n];
};
export const setKnob = (P, key, v) => {
  const [g, n] = key.split(".");
  P[g][n] = v;
};
// Every knob at its default, in the same group/name layout
export const DEFAULTS = Object.fromEntries(
  Object.entries(HEAD_PARAMS).map(([group, knobs]) => [
    group,
    Object.fromEntries(
      Object.entries(knobs).map(([name, q]) => [name, q.default]),
    ),
  ]),
);

// One head's numbers from a set of ranges, laid out like HEAD_PARAMS: each
// entry is either a fixed value or a [lo, hi] pair to draw from. Anything not
// mentioned keeps its default.
//   buildHead(drawParams(Math.random, { mouth: { width: [0.8, 1.3] }, eyes: { y: 0.05 } }))
export function drawParams(rnd, ranges = {}) {
  const out = {};
  for (const [group, knobs] of Object.entries(DEFAULTS)) {
    out[group] = { ...knobs };
    for (const [name, r] of Object.entries(ranges[group] ?? {}))
      out[group][name] = Array.isArray(r) ? r[0] + rnd() * (r[1] - r[0]) : r;
  }
  return fitFace(out);
}

// =====================================================================
// The carved solid
// =====================================================================
// Everything about the skull's shape, before any geometry is made: the
// ellipsoid, the planes that carve it, and the surface queries the features
// and the neck are built against.
function shapeOf(P) {
  const C = V(0, -0.14, -0.02),
    R = V(P.skull.width, P.skull.height, P.skull.depth);
  const plane = (n, q) => {
    const v = V(...n).normalize();
    return { n: v, d: v.dot(V(...q)) };
  };
  const planes = [];
  for (const s of [1, -1]) {
    planes.push(plane([s, 0, 0], [P.skull.sideFlat * s, 0, 0])); // flat side of cranium
    planes.push(plane([0.8 * s, 0, 1], [P.skull.cheekWidth * s, 0, 0.86])); // side planes of face
    planes.push(
      plane(
        [0.9 * s, -0.13, 0.9],
        [(0.35 + (P.skull.cheekWidth - 0.36)) * s, -0.1, 0.88],
      ),
    ); // cheek to chin
    planes.push(plane([s, P.jaw.slope, 0.25], [P.jaw.width * s, -0.55, 0])); // jaw sides
    planes.push(plane([s, -0.1, 0.8], [P.jaw.chinWidth * s, -1, 0.75])); // chin corners
    planes.push(plane([P.jaw.bevel * s, -1, 0.1], [0.55 * s, -0.95, 0])); // jaw bevel
  }
  planes.push(plane([0, P.skull.foreheadSlope, 1], [0, 0.2, 0.86])); // forehead
  planes.push(plane([0, 0, 1], [0, 0, P.skull.faceFlat])); // front of face
  planes.push(plane([0, -1, 0], [0, P.jaw.chinY, 0])); // under chin
  const napeIdx = planes.length;
  planes.push(plane([0, -1, P.jaw.napeSlope], [0, -0.5, -0.4])); // under jaw to nape
  planes.push(plane([0, -0.35, 1], [0, -1, P.jaw.chinFront])); // chin front

  const ellipsoidF = (q) =>
    ((q.x - C.x) / R.x) ** 2 +
    ((q.y - C.y) / R.y) ** 2 +
    ((q.z - C.z) / R.z) ** 2;
  const carve = (q) => {
    for (let it = 0; it < 12; it++) {
      let moved = false;
      for (const pl of planes) {
        const e = pl.n.dot(q) - pl.d;
        if (e > 0) {
          q.addScaledVector(pl.n, -e);
          moved = true;
        }
      }
      if (!moved) break; // settled: the rest of the passes would do nothing
    }
    return q;
  };
  const onSurface = (q, skip) => {
    for (let k = 0; k < planes.length; k++) {
      if (skip.includes(k)) continue;
      if (planes[k].n.dot(q) - planes[k].d > 1e-4) return false;
    }
    return ellipsoidF(q) <= 1 + 1e-4;
  };
  // The surface in direction `d` from the center: the ellipsoid point carved
  // by the planes, with the normal of whatever it landed on
  const headPoint = (d) => {
    const q = carve(V(C.x + d.x * R.x, C.y + d.y * R.y, C.z + d.z * R.z));
    const n = V();
    for (const pl of planes)
      if (Math.abs(pl.n.dot(q) - pl.d) < 3e-4) n.add(pl.n);
    if (n.lengthSq() === 0)
      n.set(
        (q.x - C.x) / (R.x * R.x),
        (q.y - C.y) / (R.y * R.y),
        (q.z - C.z) / (R.z * R.z),
      );
    return { p: q, n: n.normalize() };
  };
  // The surface straight out from the center along `d`, and its normal:
  // whichever of the ellipsoid and the planes the ray meets first. headPoint
  // above lands somewhere on the surface near direction d, but on an
  // ellipsoid that is no sphere its point lies off the ray by a fair way, so
  // anything asking "what is under this point" asks this instead.
  const alongRay = (d) => {
    let t = 1 / Math.sqrt((d.x / R.x) ** 2 + (d.y / R.y) ** 2 + (d.z / R.z) ** 2);
    for (const pl of planes) {
      const a = pl.n.dot(d);
      if (a > 1e-9) t = Math.min(t, (pl.d - pl.n.dot(C)) / a);
    }
    const q = C.clone().addScaledVector(d, t);
    const n = V();
    for (const pl of planes)
      if (Math.abs(pl.n.dot(q) - pl.d) < 3e-4) n.add(pl.n);
    if (n.lengthSq() === 0)
      n.set(
        (q.x - C.x) / (R.x * R.x),
        (q.y - C.y) / (R.y * R.y),
        (q.z - C.z) / (R.z * R.z),
      );
    return { p: q, n: n.normalize() };
  };
  // Straight in from the front at (x, y): where the face surface is, and its normal
  const surfaceAt = (x, y) => {
    const ex = (x - C.x) / R.x,
      ey = (y - C.y) / R.y;
    let z = C.z + R.z * Math.sqrt(Math.max(0, 1 - ex * ex - ey * ey));
    let n = V(ex / R.x, ey / R.y, (z - C.z) / (R.z * R.z)).normalize();
    for (const pl of planes) {
      if (pl.n.z < 1e-6) continue;
      const pz = (pl.d - pl.n.x * x - pl.n.y * y) / pl.n.z;
      if (pz < z) {
        z = pz;
        n = pl.n;
      }
    }
    return { p: V(x, y, z), n };
  };
  // Straight in from the right at (y, z): where the side surface is, and its normal
  const sideAt = (y, z) => {
    const ey = (y - C.y) / R.y,
      ez = (z - C.z) / R.z;
    let x = C.x + R.x * Math.sqrt(Math.max(0, 1 - ey * ey - ez * ez));
    let n = V((x - C.x) / (R.x * R.x), ey / R.y, ez / R.z).normalize();
    for (const pl of planes) {
      if (pl.n.x < 1e-6) continue;
      const px = (pl.d - pl.n.y * y - pl.n.z * z) / pl.n.x;
      if (px < x) {
        x = px;
        n = pl.n;
      }
    }
    return { p: V(x, y, z), n };
  };
  // How far back along `dir` a point outside the solid must move to be inside
  // it (0 if it already is): the furthest any one plane, or the ellipsoid,
  // asks for
  const sinkAlong = (p, dir) => {
    let t = 0;
    for (const pl of planes) {
      const a = pl.n.dot(dir);
      if (a > 1e-6) t = Math.max(t, (pl.n.dot(p) - pl.d) / a);
    }
    const u = V((p.x - C.x) / R.x, (p.y - C.y) / R.y, (p.z - C.z) / R.z),
      w = V(dir.x / R.x, dir.y / R.y, dir.z / R.z);
    const A = w.lengthSq(),
      B = u.dot(w),
      F = u.lengthSq() - 1;
    if (F > 0 && B > 0) {
      const disc = B * B - A * F;
      t = Math.max(t, (B - Math.sqrt(Math.max(0, disc))) / A);
    }
    return t;
  };
  // How far along `dir` the surface is from p, signed: positive, p is outside
  // and must move that far back along `dir` to be inside; negative, p is
  // inside and can move that far along `dir` before leaving. Infinity when
  // the line along `dir` never meets the ellipsoid at all.
  const reachAlong = (p, dir) => {
    let t = -Infinity;
    for (const pl of planes) {
      const a = pl.n.dot(dir);
      if (a > 1e-6) t = Math.max(t, (pl.n.dot(p) - pl.d) / a);
    }
    const u = V((p.x - C.x) / R.x, (p.y - C.y) / R.y, (p.z - C.z) / R.z),
      w = V(dir.x / R.x, dir.y / R.y, dir.z / R.z);
    const A = w.lengthSq(),
      B = u.dot(w),
      disc = B * B - A * (u.lengthSq() - 1);
    if (disc < 0) return Infinity;
    return Math.max(t, (B - Math.sqrt(disc)) / A);
  };
  // Is this point on the under-jaw face (the nape plane)? That face is hidden
  // inside the neck, so nothing should be shaded or grown as if it faced out.
  const nape = planes[napeIdx];
  const onNape = (p) => Math.abs(nape.n.dot(p) - nape.d) < 3e-4;
  // From a point on the under-jaw face, straight out along the face to where
  // it meets the skull: a point on the neck's outline, with the skull's normal
  // there (never the face's own). The neck is extruded from this same outline.
  const napeCentre = C.clone().addScaledVector(
    nape.n,
    -(nape.n.dot(C) - nape.d),
  );
  const napeEdge = (p) => {
    const w = V().subVectors(p, napeCentre);
    w.addScaledVector(nape.n, -w.dot(nape.n));
    if (w.lengthSq() < 1e-10) w.set(0, 0, -1).addScaledVector(nape.n, nape.n.z); // dead center: any way along the face will do
    w.normalize();
    let lo = 0,
      hi = 3;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (onSurface(napeCentre.clone().addScaledVector(w, m), [napeIdx]))
        lo = m;
      else hi = m;
    }
    const q = napeCentre.clone().addScaledVector(w, lo);
    const n = V();
    for (let k = 0; k < planes.length; k++)
      if (k !== napeIdx && Math.abs(planes[k].n.dot(q) - planes[k].d) < 3e-4)
        n.add(planes[k].n);
    if (n.lengthSq() === 0)
      n.set(
        (q.x - C.x) / (R.x * R.x),
        (q.y - C.y) / (R.y * R.y),
        (q.z - C.z) / (R.z * R.z),
      );
    return { p: q, n: n.normalize() };
  };
  return {
    C,
    R,
    planes,
    napeIdx,
    carve,
    onSurface,
    headPoint,
    alongRay,
    surfaceAt,
    sideAt,
    sinkAlong,
    reachAlong,
    onNape,
    napeEdge,
  };
}

// The cranium: a sphere pushed onto the carved ellipsoid. Each vertex takes the
// normal of the plane it landed on, so the planes read as crisp flats.
// With a neck (`openNape`), the under-jaw face is left out: every vertex that
// would land on it goes to the neck's outline instead, with the skull's
// normal there. Otherwise the triangles that straddle that edge would blend
// the skull's normal with the face's downward one and shade a dark band
// just above the neck, and the skull's last row would fall short of the
// outline, leaving the neck's top ring standing a hair proud of it. The face
// itself is never seen: it sits inside the neck.
function craniumGeometry(S, openNape = false) {
  const geo = new THREE.SphereGeometry(1, 72, 48);
  const pos = geo.attributes.position,
    nor = geo.attributes.normal,
    d = V();
  for (let i = 0; i < pos.count; i++) {
    let { p, n } = S.headPoint(d.fromBufferAttribute(pos, i));
    if (openNape && S.onNape(p)) ({ p, n } = S.napeEdge(p));
    pos.setXYZ(i, p.x, p.y, p.z);
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return geo;
}

// The neck: one plane's outline on the head, extruded straight down — with a
// fillet worked into the crease where it meets the head, so head and neck read
// as one carved piece. Where the jaw overhangs the neck the fillet climbs a
// little way up the head and sweeps down into the shaft; where the head is
// already flush it just rounds the shoulder. The shaft below the fillet keeps
// the outline exactly, so the bend sees the same neck as before.
function extrudeFace(S, idx, bottomY, fillet, steps = 64) {
  const { C, R, planes, onSurface, headPoint } = S;
  const pl = planes[idx];
  const q = C.clone().addScaledVector(pl.n, -(pl.n.dot(C) - pl.d));
  const ax = Math.abs(pl.n.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
  const e1 = V().crossVectors(pl.n, ax).normalize(),
    e2 = V().crossVectors(pl.n, e1);
  const top = [],
    outDir = [];
  for (let k = 0; k < steps; k++) {
    const th = (2 * Math.PI * k) / steps;
    const w = e1
      .clone()
      .multiplyScalar(Math.cos(th))
      .addScaledVector(e2, Math.sin(th));
    let lo = 0,
      hi = 3;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (onSurface(q.clone().addScaledVector(w, m), [idx])) lo = m;
      else hi = m;
    }
    top.push(q.clone().addScaledVector(w, lo));
    outDir.push(w);
  }
  // The shaft wall's outward normal at each outline point, from the outline
  // itself (its tangent, turned to point away from the outline's center).
  // Not from the head's surface beside it: where the two jaw sides meet in a
  // keel under the chin that surface faces sideways, as often as not to the
  // wrong side of the center line, and the wall there would be wound inside
  // out and culled - a hole in the front of the neck.
  const cz = top.reduce((sum, p) => sum + p.z, 0) / steps;
  const wallN = top.map((P, k) => {
    const t = V().subVectors(top[(k + 1) % steps], top[(k + steps - 1) % steps]);
    const n = V(t.z, 0, -t.x);
    if (n.lengthSq() < 1e-12) n.set(P.x, 0, P.z - cz);
    if (n.x * P.x + n.z * (P.z - cz) < 0) n.negate();
    return n.normalize();
  });

  // The head surface next to the outline, a given distance from a ring point,
  // straight across the outline (not along it), off the under-jaw face itself
  const onFace = (pt) => Math.abs(pl.n.dot(pt) - pl.d) < 1e-3;
  const surfaceBeside = (k, dist) => {
    const P = top[k];
    const tan = V()
      .subVectors(top[(k + 1) % steps], top[(k + steps - 1) % steps])
      .normalize();
    const d0 = V().subVectors(P, C).divide(R).normalize();
    const ea = V()
      .crossVectors(d0, Math.abs(d0.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0))
      .normalize();
    const eb = V().crossVectors(d0, ea);
    let best = null,
      bestErr = Infinity;
    for (let j = 0; j < 72; j++) {
      const ph = (2 * Math.PI * j) / 72;
      const tilt = ea
        .clone()
        .multiplyScalar(Math.cos(ph))
        .addScaledVector(eb, Math.sin(ph));
      let lo = 0,
        hi = 1.5,
        hp = null;
      for (let i = 0; i < 28; i++) {
        const m = (lo + hi) / 2;
        hp = headPoint(d0.clone().addScaledVector(tilt, m).normalize());
        if (hp.p.distanceTo(P) < dist) lo = m;
        else hi = m;
      }
      hp = headPoint(d0.clone().addScaledVector(tilt, lo).normalize());
      const off = V().subVectors(hp.p, P);
      if (onFace(hp.p) || off.dot(outDir[k]) < 0) continue;
      const err = Math.abs(off.dot(tan)) / Math.max(off.length(), 1e-6);
      if (err < bestErr) {
        bestErr = err;
        best = hp;
      }
    }
    return best;
  };

  // How much a surface overhangs, from its normal: the drop per unit out
  const overhangOf = (n) => THREE.MathUtils.clamp(-n.y / Math.max(Math.hypot(n.x, n.z), 0.05), 0, 3);
  const OVERHANG_FULL = 0.4; // this steep an underside gets the whole reach, and is as far as a column may climb
  // How much the head overhangs the shaft at each point, from the slope of the
  // surface just beside the outline; smoothed around the ring so the fillet's
  // top edge doesn't zigzag where the head's planes meet
  const overhang = top.map((_, k) => {
    const hp = surfaceBeside(k, 0.05);
    return hp ? overhangOf(hp.n) : 0;
  });
  let reach = overhang.map(
    (a) => fillet.reach * THREE.MathUtils.smoothstep(a, 0.05, OVERHANG_FULL),
  );
  for (let pass = 0; pass < 2; pass++)
    reach = reach.map(
      (r, k) =>
        (reach[(k + steps - 1) % steps] + 2 * r + reach[(k + 1) % steps]) / 4,
    );

  // Where each column leaves the head (Q, with the head's normal there),
  // its foot on the shaft (W), and the way it leaves (tQ): the steepest way
  // down the head, or on a flat underside straight across toward the wall
  // (straight down if already at it). All three smoothed around the ring:
  // neighboring columns can land on different faces of the head (one on
  // the flat underside of the chin, the next on the chin's corner), and a
  // sheet strung between columns that leave in different directions creases
  // and faces sideways where it should face out, which from the front reads
  // as a hole. The head is convex, so a blend of nearby surface points stays
  // under its surface; the climb from P is what is smoothed, so a ring with
  // no climb at all stays exactly on the outline.
  const smoothRing = (arr, passes) => {
    for (let pass = 0; pass < passes; pass++)
      arr = arr.map((v, k) =>
        V()
          .add(arr[(k + steps - 1) % steps])
          .addScaledVector(v, 2)
          .add(arr[(k + 1) % steps])
          .multiplyScalar(0.25),
      );
    return arr;
  };
  // A column climbs only over surface that overhangs the neck. With a long
  // reach and a short chin the climb ran out of underside, round the chin's
  // edge and up the front of the face, and the sheet came down through the
  // chin. Where the head turns past OVERHANG_FULL the climb stops short.
  const climb = (k, dist) => {
    let hp = surfaceBeside(k, dist);
    if (!hp || overhangOf(hp.n) >= OVERHANG_FULL) return hp;
    let lo = 0.05,
      hi = dist;
    for (let i = 0; i < 8; i++) {
      const m = (lo + hi) / 2;
      const h = surfaceBeside(k, m);
      if (h && overhangOf(h.n) >= OVERHANG_FULL) lo = m;
      else hi = m;
    }
    return surfaceBeside(k, lo) || hp;
  };
  const leave = top.map((P, k) => {
    const hp = reach[k] > 0.01 ? climb(k, reach[k]) : null;
    return {
      climb: hp ? V().subVectors(hp.p, P) : V(),
      n: hp ? hp.n.clone() : (surfaceBeside(k, 0.05) || { n: outDir[k] }).n.clone(),
    };
  });
  const Qs = smoothRing(leave.map((l) => l.climb), 3).map((c, k) => c.add(top[k]));
  const nQs = smoothRing(leave.map((l) => l.n), 3).map((n) => n.normalize());
  // Out of the head along `dir` to just proud of its surface (a point already
  // outside stays put): the smoothing above blends surface points, which on
  // a convex head lie under its surface, by up to 0.03 at the chin's
  // corners, where neighboring columns land on the flat underside and on
  // the bevel. A fillet that starts inside the jaw comes back out of the
  // underside lower down, a seam seen from below.
  const PROUD = 0.002; // head units off the surface: clear of the jaw's own triangles at any distance the depth buffer resolves
  const liftAlong = (p, dir) => {
    if (!onSurface(p, [])) return;
    if (!dir) {
      // The shortest way out: through whichever face the point is least deep behind (or the skull)
      let depth = -Infinity;
      for (const pl of planes) {
        const e = pl.n.dot(p) - pl.d;
        if (e > depth) (depth = e), (dir = pl.n);
      }
      const u = V((p.x - C.x) / R.x, (p.y - C.y) / R.y, (p.z - C.z) / R.z);
      const d = u.clone().normalize();
      const e = (u.length() - 1) / Math.sqrt((d.x / R.x) ** 2 + (d.y / R.y) ** 2 + (d.z / R.z) ** 2);
      if (e > depth) dir = V(d.x / R.x, d.y / R.y, d.z / R.z).normalize();
    }
    let lo = 0,
      hi = 0.6;
    for (let i = 0; i < 30; i++) {
      const m = (lo + hi) / 2;
      if (onSurface(p.clone().addScaledVector(dir, m), [])) lo = m;
      else hi = m;
    }
    p.addScaledVector(dir, hi + PROUD);
  };
  Qs.forEach((Q, k) => liftAlong(Q, nQs[k]));
  // The foot: straight under P, the drop below the lower of P and Q (where
  // the jaw runs on down past the outline Q sits below P, and a foot above
  // it looped the sweep), and never below the stretch line, where the
  // shaft's first ring sits (a deeper foot, from a low chin and a long drop,
  // folded the wall back up to that ring and down again)
  const Ws = top.map((P, k) => V(P.x, Math.max(Math.min(P.y, Qs[k].y) - fillet.drop, STRETCH_FROM + 0.02), P.z));
  const tQs = smoothRing(
    top.map((_, k) => {
      const nQ = nQs[k], Q = Qs[k], W = Ws[k];
      let tQ = V(0, -1, 0).addScaledVector(nQ, nQ.y);
      if (tQ.lengthSq() < 1e-4) tQ = V(W.x - Q.x, 0, W.z - Q.z);
      if (tQ.lengthSq() < 1e-6) tQ = V(0, -1, 0);
      return tQ.normalize();
    }),
    2,
  ).map((t) => t.normalize());

  // Each column of the fillet: a Hermite curve from Q, leaving along tQ, to
  // W, arriving vertical
  const columns = top.map((P, k) => {
    const Q = Qs[k], nQ = nQs[k], W = Ws[k], wOut = wallN[k];
    // The tangents' length: the chord's, but never more than three times the
    // vertical gap, past which the sweep loops (down, back up, down again)
    const L = Math.max(Math.min(W.distanceTo(Q), 3 * (Q.y - W.y)), 1e-4);
    const mQ = tQs[k].clone().multiplyScalar(L),
      mW = V(0, -L, 0);
    const at = (t) => {
      const t2 = t * t,
        t3 = t2 * t;
      const pt = V()
        .addScaledVector(Q, 2 * t3 - 3 * t2 + 1)
        .addScaledVector(mQ, t3 - 2 * t2 + t)
        .addScaledVector(W, -2 * t3 + 3 * t2)
        .addScaledVector(mW, t3 - t2);
      const tau = V()
        .addScaledVector(Q, 6 * t2 - 6 * t)
        .addScaledVector(mQ, 3 * t2 - 4 * t + 1)
        .addScaledVector(W, -6 * t2 + 6 * t)
        .addScaledVector(mW, 3 * t2 - 2 * t)
        .normalize();
      const n = wOut.clone().addScaledVector(tau, -wOut.dot(tau));
      if (n.lengthSq() < 1e-6) n.copy(nQ);
      return { p: pt, n: t === 0 ? nQ.clone() : n.normalize() };
    };
    return { at, wOut };
  });

  // Rings: the fillet from the head down to the shaft, then straight rings to
  // the bottom, so the straight part has enough vertices to bend into a curve.
  // The straight rings taper about the outline's center, from the outline
  // itself at STRETCH_FROM to NECK_TAPER at the bottom.
  const SLICES = 64;
  const rings = [];
  for (let r = 0; r <= fillet.rings; r++)
    rings.push(columns.map((c) => c.at(r / fillet.rings)));
  // The columns leave their tops along a tangent to the smoothed normal,
  // not their own face's, so near a corner a sheet can still dip a little
  // way into the head below its top: those points are lifted out too, by
  // the shortest way (along the sheet's own normal, oblique to the face, a
  // point went three times as far and put a kink in its column). The
  // straight rings below need none of this: under the outline the head is
  // carved away.
  for (let r = 1; r <= fillet.rings; r++) for (const v of rings[r]) liftAlong(v.p);
  for (let r = 0; r <= SLICES; r++) {
    const y = THREE.MathUtils.lerp(STRETCH_FROM, bottomY, r / SLICES);
    const s = 1 - NECK_TAPER * (r / SLICES);
    rings.push(
      top.map((pt, k) => ({
        p: V(pt.x * s, y, cz + (pt.z - cz) * s),
        n: columns[k].wOut,
      })),
    );
  }
  const tris = [],
    norms = [];
  // Each triangle wound to face away from the shaft's axis; by its vertex
  // normals only where it stands edge-on to that
  const pushTri = (a, b, c) => {
    const face = V().subVectors(b.p, a.p).cross(V().subVectors(c.p, a.p));
    const mid = V().add(a.p).add(b.p).add(c.p);
    const away = V(mid.x, 0, mid.z - 3 * cz);
    let side = face.dot(away);
    if (Math.abs(side) < 1e-3 * face.length() * away.length())
      side = face.dot(V().add(a.n).add(b.n).add(c.n));
    if (side < 0) [b, c] = [c, b];
    for (const v of [a, b, c]) {
      tris.push(v.p.x, v.p.y, v.p.z);
      norms.push(v.n.x, v.n.y, v.n.z);
    }
  };
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r],
      Bn = rings[r + 1];
    for (let i = 0; i < steps; i++) {
      const j = (i + 1) % steps;
      pushTri(A[i], A[j], Bn[j]);
      pushTri(A[i], Bn[j], Bn[i]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(tris, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(norms, 3));
  // The collar: the part of the neck above STRETCH_FROM, which rides rigidly
  // with the head. Per outline column, its surface from the stretch line up
  // the straight wall to the foot of the fillet and on up the fillet to the
  // head, as points with normals (rings[0] is the head end, rings[fillet.rings]
  // the fillet's foot).
  const collar = columns.map((c, k) => {
    const pts = [{ p: V(top[k].x, STRETCH_FROM, top[k].z), n: c.wOut }];
    for (let r = fillet.rings; r >= 0; r--) pts.push(rings[r][k]);
    return pts;
  });
  return { geo: g, ring: top, collar };
}

// =====================================================================
// The face sculpt
// =====================================================================
// The base features, each a small convex hull, as the original sketch's points
// in head units on the default head. Laid out like HEAD_PARAMS: grouped by the
// same part names, so a feature's sculpt and its knobs read side by side, with
// one entry per hull and the same fields on every entry:
//   label   what it is
//   on      the surface it rides. "face": z is re-expressed as an offset off
//           the face; "side": x as an offset off the side of the head, so when
//           a knob changes the skull the hull rides along instead of floating
//           off or sinking in. "center": the points are offsets around a center
//           the knobs place, z already an offset off the face.
//   pivot   the point its knobs scale about; an axis not given is 0
//   points  the hull
//   note    what the points are, in order
export const FACE_SCULPT = {
  nose: {
    nose: {
      label: "nose",
      on: "face",
      pivot: { y: 0.2 },
      note: "bridge, wedge, tip, wings; nose length stretches down from the bridge",
      points: [
        [0.06, 0.2, 0.85],
        [0.07, -0.1, 0.9],
        [0, -0.05, 0.95],
        [0, 0.2, 0.88],
        [0.05, -0.36, 1.1],
        [0.04, -0.43, 1.06],
        [0.14, -0.37, 0.9],
        [0.12, -0.45, 0.9],
        [0.07, -0.46, 0.86],
        [0.1, 0.1, 0.8],
      ],
    },
  },
  mouth: {
    upper: {
      label: "upper lip",
      on: "face",
      pivot: { y: -0.63 },
      note: "the lip line; upper lip height grows up from it",
      points: [
        [0.2, -0.63, 0.86],
        [0.1, -0.58, 0.935],
        [0, -0.555, 0.955],
        [0, -0.625, 0.965],
        [0.1, -0.628, 0.945],
        [0.13, -0.53, 0.86],
        [0, -0.5, 0.87],
      ],
    },
    lower: {
      label: "lower lip",
      on: "face",
      pivot: { y: -0.655 },
      note: "the lip line; lower lip height grows down from it",
      points: [
        [0.18, -0.64, 0.86],
        [0.1, -0.655, 0.935],
        [0, -0.655, 0.95],
        [0.08, -0.72, 0.925],
        [0, -0.73, 0.93],
        [0.12, -0.76, 0.86],
      ],
    },
  },
  ears: {
    ear: {
      label: "ear",
      on: "side",
      pivot: { y: -0.1, z: -0.18 },
      note: "the right ear, mirrored for the left; ear size scales about the pivot",
      points: [
        [0.66, 0.15, -0.1],
        [0.7, 0.17, -0.22],
        [0.76, 0.1, -0.3],
        [0.78, -0.08, -0.31],
        [0.76, -0.28, -0.24],
        [0.71, -0.42, -0.12],
        [0.67, -0.38, -0.06],
        [0.66, -0.1, -0.06],
        [0.62, 0.05, -0.18],
        [0.62, -0.3, -0.14],
      ],
    },
  },
  eyes: {
    eye: {
      label: "eye",
      on: "centre",
      pivot: { x: 0, y: 0 }, // the center itself, where eye spacing and level put it
      note: "around the eye's centre; the last two are the pupil bump and a back point",
      points: [
        [-0.13, -0.01, -0.02],
        [0.13, 0.02, -0.05],
        [-0.07, 0.04, 0.012],
        [0.01, 0.055, 0.018],
        [0.08, 0.045, 0.01],
        [-0.07, -0.04, 0.01],
        [0.01, -0.05, 0.016],
        [0.08, -0.03, 0.008],
        [0, 0, 0.025],
        [0, 0, -0.06],
      ],
    },
  },
};

// Every hull's points re-expressed relative to the surface it rides (`on`
// above), in the same group/hull layout as FACE_SCULPT
const REF = shapeOf(DEFAULTS);
const offFace = (pts) =>
  pts.map(([x, y, z]) => [x, y, z - REF.surfaceAt(Math.abs(x), y).p.z]);
const offSide = (pts) => pts.map(([x, y, z]) => [x - REF.sideAt(y, z).p.x, y, z]);
const RELATIVE = { face: offFace, side: offSide, centre: (pts) => pts };
const SCULPT_REL = Object.fromEntries(
  Object.entries(FACE_SCULPT).map(([group, hulls]) => [
    group,
    Object.fromEntries(
      Object.entries(hulls).map(([name, h]) => [
        name,
        RELATIVE[h.on](h.points),
      ]),
    ),
  ]),
);

// Scale `v` about `pivot`, written so a scale of exactly 1 changes nothing
const about = (v, pivot, k) => v + (v - pivot) * (k - 1);

// The nose's place between the eyes and the mouth, on the default head: the
// nose from its highest point that stands well clear of the face (above that
// the bridge only hugs the face, up between the eyes) to its lowest; the
// upper lip's highest point that stands clear; the eye's reach below and
// beside its center (scaled by eye height and width, turned by the tilt)
const PROUD = 0.05;
const NOSE_SPAN = {
  top: Math.max(...SCULPT_REL.nose.nose.filter((p) => p[2] > PROUD).map((p) => p[1])),
  bottom: Math.min(...SCULPT_REL.nose.nose.map((p) => p[1])),
};
const LIP_TOP = Math.max(...SCULPT_REL.mouth.upper.filter((p) => p[2] > PROUD).map((p) => p[1]));
const EYE_REACH = {
  down: -Math.min(...SCULPT_REL.eyes.eye.map((p) => p[1])),
  up: Math.max(...SCULPT_REL.eyes.eye.map((p) => p[1])),
  across: Math.max(...SCULPT_REL.eyes.eye.map((p) => Math.abs(p[0]))),
};
const FACE_GAP = 0.02; // clearance kept between a feature and its neighbor, or the center line
const LIP_BOTTOM = Math.min(...SCULPT_REL.mouth.lower.map((p) => p[1]));
const CHIN_ROOM = 0.2; // chin kept below the lower lip: the lip's lowest point stays this far above the underside of the chin
const MOUTH_WRAP = 0.25; // how far behind the lip line's center a lip may reach as it follows the face round: past this it is on the jaw, not the face

// The largest value in [a, b] at which f stays within `limit`, by bisection:
// b itself if that fits, a if nothing does. f is monotone over [a, b].
const mostWithin = (f, a, b, limit) => {
  if (f(b) <= limit) return b;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2;
    if (f(m) <= limit) a = m;
    else b = m;
  }
  return a;
};

// The mouth kept on the face: first the chin room, by shortening the lower
// lip and then lifting the mouth; then the wrap: no point of either lip may
// land further behind the center of the lip line than MOUTH_WRAP, which is
// had by narrowing the mouth, then shortening the lower lip, then lifting the
// mouth, each only as far as it must. A narrow, steep jaw pulls its side
// planes a whole head unit behind the lips, and a wide mouth laid over them
// wrapped onto the jaw.
function fitMouth(P, S) {
  const M = P.mouth,
    F = FACE_SCULPT.mouth,
    lo = HEAD_PARAMS.mouth;
  const lipBottom = () => about(LIP_BOTTOM, F.lower.pivot.y, M.lowerLip) + M.y;
  const need = P.jaw.chinY + CHIN_ROOM;
  if (lipBottom() < need) {
    M.lowerLip = Math.max(lo.lowerLip.range.min, (need - M.y - F.lower.pivot.y) / (LIP_BOTTOM - F.lower.pivot.y));
    if (lipBottom() < need) M.y += need - lipBottom();
  }
  // The furthest any lip point lands behind the lip line's center, at this width
  const wrap = (w) => {
    const ref = S.surfaceAt(0, F.upper.pivot.y + M.y).p.z;
    let worst = 0;
    for (const [name, pts] of Object.entries(SCULPT_REL.mouth)) {
      const k = name === "upper" ? M.upperLip : M.lowerLip;
      for (const [x, y] of pts)
        worst = Math.max(worst, ref - S.surfaceAt(Math.abs(x) * w, about(y, F[name].pivot.y, k) + M.y).p.z);
    }
    return worst;
  };
  const most = (f, a, b) => mostWithin(f, a, b, MOUTH_WRAP);
  const fits = () => wrap(M.width) <= MOUTH_WRAP;
  if (!fits()) M.width = most(wrap, lo.width.range.min, M.width); // narrower, to fit the jaw
  if (!fits()) M.lowerLip = most((k) => ((M.lowerLip = k), wrap(M.width)), lo.lowerLip.range.min, M.lowerLip); // a shorter lower lip, off the jaw's wedge
  if (!fits()) {
    const y0 = M.y; // lifted, as little as will do
    M.y = -most((y) => ((M.y = -y), wrap(M.width)), -(y0 + 1), -y0);
  }
}

// The eyes are sized to the face: their spacing, width and height all scale
// with the head's half-width at eye level, relative to the default head's, so
// the eye knobs mean "as a share of this face" and a narrow head gets smaller,
// closer eyes than a broad one from the same numbers
const EYE_FACE = REF.sideAt(DEFAULTS.eyes.y, REF.C.z).p.x;
export const eyeScale = (S, P) => S.sideAt(P.eyes.y, S.C.z).p.x / EYE_FACE;
const EYE_GAP = { min: 0.7, max: 1.6 }; // the room between the eyes, in eye widths: the classical canon is one eye
const EYE_WRAP = 0.2; // how far the face may fall away behind an eye's outer corner: past this the eye folds round onto the cheek

// The eyes kept on the face. Spaced within EYE_GAP of each other (the eyes'
// reach toward the center line scales with their width, height and tilt, so
// this is the gap between their inner corners). And neither reaching round
// the cheek: where the face drops more than EYE_WRAP behind the eye's outer
// corner, the eyes move in as far as the gap allows, then shrink, width and
// height together, until the corner sits on the front of the face.
function fitEyes(P, S, k) {
  const E = P.eyes,
    t = Math.abs(E.tilt);
  const eyeIn = () => EYE_REACH.across * E.width * Math.cos(t) + Math.max(EYE_REACH.up, EYE_REACH.down) * E.height * Math.sin(t); // how far in from its center an eye reaches
  const eyeWidth = () => 2 * EYE_REACH.across * E.width;
  const least = () => eyeIn() + Math.max(FACE_GAP / k, (EYE_GAP.min * eyeWidth()) / 2);
  E.spacing = Math.min(Math.max(E.spacing, least()), eyeIn() + (EYE_GAP.max * eyeWidth()) / 2);
  const drop = () => {
    const c = Math.cos(E.tilt),
      s = Math.sin(E.tilt);
    let xo = -Infinity,
      yo = 0;
    for (const [dx, dy] of SCULPT_REL.eyes.eye) {
      const ex = dx * E.width * k,
        ey = dy * E.height * k;
      const x = E.spacing * k + ex * c - ey * s;
      if (x > xo) (xo = x), (yo = E.y + ex * s + ey * c);
    }
    return S.surfaceAt(E.spacing * k, E.y).p.z - S.surfaceAt(xo, yo).p.z;
  };
  if (drop() > EYE_WRAP) {
    E.spacing = mostWithin((v) => ((E.spacing = v), drop()), least(), E.spacing, EYE_WRAP);
    if (drop() > EYE_WRAP) {
      const w0 = E.width,
        h0 = E.height;
      mostWithin((f) => ((E.width = w0 * f), (E.height = h0 * f), (E.spacing = least()), drop()), 0.5, 1, EYE_WRAP);
    }
  }
}

// The features kept apart. The mouth: on the face, see fitMouth. The eyes:
// apart, and on the front of the face, see fitEyes. The nose: no taller than
// the room from the eyes' lowest point down to the top of the upper lip (less
// the clearance each side), and moved to sit within that room. Every draw and
// every build goes through this, so no head's eyes meet or fold round the
// cheek, no nose runs into its eyes or lip, and no mouth wraps onto the jaw.
export function fitFace(P) {
  const S = shapeOf(P);
  fitMouth(P, S);
  const E = P.eyes, M = P.mouth, N = P.nose;
  const k = eyeScale(S, P);
  fitEyes(P, S, k);
  const t = Math.abs(E.tilt);
  const eyeBottom = E.y - k * (EYE_REACH.down * E.height * Math.cos(t) + EYE_REACH.across * E.width * Math.sin(t));
  const lipTop = about(LIP_TOP, FACE_SCULPT.mouth.upper.pivot.y, M.upperLip) + M.y;
  const room = eyeBottom - lipTop - 2 * FACE_GAP;
  const pivot = FACE_SCULPT.nose.nose.pivot.y;
  N.length = Math.max(Math.min(N.length, room / (NOSE_SPAN.top - NOSE_SPAN.bottom)), 0.1);
  const top = about(NOSE_SPAN.top, pivot, N.length) + N.y;
  if (top > eyeBottom - FACE_GAP) N.y -= top - (eyeBottom - FACE_GAP);
  const bottom = about(NOSE_SPAN.bottom, pivot, N.length) + N.y;
  if (bottom < lipTop + FACE_GAP) N.y += lipTop + FACE_GAP - bottom;
  return P;
}

// The ear's reach out from the side it rides, and how deep its base sits in
const EAR_REACH = Math.max(...SCULPT_REL.ears.ear.map((p) => p[0]));
const EAR_BASE = Math.min(...SCULPT_REL.ears.ear.map((p) => p[0]));
// Each ear point's place between the base (0) and the tip (1); those up to
// EAR_BAND are the base band, the inner points and the rim they stand on
const EAR_BANDS = SCULPT_REL.ears.ear.map(([dx]) => (dx - EAR_BASE) / (EAR_REACH - EAR_BASE));
const EAR_BAND = 0.35;
// How deep (head units) every base-band point sits inside the skull, at least.
// Less, and the ear's foot lies on the skin or a hair off it, and reads as
// floating beside the head; this much, and the ear grows out of the skull.
export const EAR_ROOT = 0.07;
// How far (head units) one base-band point may be pushed in on its own,
// bending the foot to the skull, before the whole ear is sunk instead
const EAR_BEND = 0.1;

// The right ear's points on this head (the left is its mirror). The ear is one
// rigid shape: its base lies flat against the side of the head at the ear's
// pivot, and it comes straight out along the surface's normal there (sideways
// on the flat of the cranium; swung back where the pivot lands on the curve
// behind it). "Stick out" moves only the outer rim, by its full amount at the
// tip and not at all at the base, so the base stays put; and where the side
// curves away under a corner of the base, the whole ear is sunk along its
// normal until its innermost points are inside the skull, and then every
// point of its base band is pushed in toward the center until it sits
// EAR_ROOT deep. So no ear floats, ever: its foot is always in the skull.
export function placeEar(S, P) {
  const F = FACE_SCULPT.ears.ear,
    k = P.ears.size;
  const { p: at, n: n0 } = S.sideAt(F.pivot.y + P.ears.y, F.pivot.z + P.ears.back);
  // The ear's points, standing out along `n` from the pivot
  const place = (n) => {
    const up = V(0, 1, 0).addScaledVector(n, -n.y).normalize(),
      fwd = V().crossVectors(n, up); // +z when the normal is +x
    return SCULPT_REL.ears.ear.map(([dx, y, z]) =>
      at
        .clone()
        .addScaledVector(n, dx * k + (P.ears.out * Math.max(dx, 0)) / EAR_REACH)
        .addScaledVector(up, (y - F.pivot.y) * k)
        .addScaledVector(fwd, (z - F.pivot.z) * k),
    );
  };
  // Tilted to the skull under its whole foot, not just under the pivot: a big
  // ear, or one set low, reaches past the flat of the side onto the curve
  // toward the jaw, and standing straight out from the flat its bottom would
  // hang off the head. So its normal is the mean of the skull's normals under
  // each base-band point (the same as the pivot's where the side is flat).
  const n = V();
  place(n0).forEach((p, i) => {
    if (EAR_BANDS[i] <= EAR_BAND) n.add(S.alongRay(p.clone().sub(S.C).normalize()).n);
  });
  if (n.lengthSq() < 1e-12 || n.dot(n0) < 0.5) n.copy(n0); // a degenerate mean (never, on a head): the pivot's own
  n.normalize();
  const pts = place(n);
  // Sunk as one along its normal until its innermost points are in the skull
  let sink = 0;
  SCULPT_REL.ears.ear.forEach(([dx], i) => {
    if (dx <= EAR_BASE + 1e-9) sink = Math.max(sink, S.sinkAlong(pts[i], n));
  });
  for (const p of pts) p.addScaledVector(n, -sink);
  // Then, whatever the skull's shape (a narrow head, a big ear, a side that
  // curves away under the foot), each base-band point still shy of EAR_ROOT
  // inside is pushed straight toward the skull's center till it is: that line
  // always gets in. The ear's foot bends to the skull; its rim and tip stay
  // put. But only a little: a point pushed much further than its neighbors
  // draws the foot to a cone, so anything over EAR_BEND of push is first taken
  // by the whole ear, sunk along its normal.
  const toward = (p) => p.clone().sub(S.C).normalize();
  const short = (p) => Math.max(0, S.reachAlong(p, toward(p)) + EAR_ROOT); // how far this point has to go in
  let excess = 0;
  pts.forEach((p, i) => {
    if (EAR_BANDS[i] <= EAR_BAND) excess = Math.max(excess, short(p) - EAR_BEND);
  });
  if (excess > 0) for (const p of pts) p.addScaledVector(n, -excess);
  pts.forEach((p, i) => {
    if (EAR_BANDS[i] <= EAR_BAND) p.addScaledVector(toward(p), -short(p));
  });
  return pts.map((p) => p.toArray());
}

// One head. `params` may be partial; anything missing takes its default.
//   opts.neck        false to skip the neck (much faster to build)
//   opts.neckBottom  how far down the neck goes (head units)
export function buildHead(params = DEFAULTS, opts = {}) {
  const P = Object.fromEntries(
    Object.entries(DEFAULTS).map(([g, knobs]) => [
      g,
      { ...knobs, ...(params[g] ?? {}) },
    ]),
  );
  fitFace(P);
  const S = shapeOf(P);
  const F = FACE_SCULPT, // the base features P's knobs act on
    R = SCULPT_REL; // their points, relative to the surface each rides
  const { surfaceAt } = S;
  const onFace = (pts) =>
    pts.map(([x, y, dz]) => [x, y, surfaceAt(Math.abs(x), y).p.z + dz]);

  const nose = onFace(
    R.nose.nose.map(([x, y, dz]) => [
      x * P.nose.width,
      about(y, F.nose.nose.pivot.y, P.nose.length) + P.nose.y,
      dz * P.nose.projection,
    ]),
  );
  const upper = onFace(
    R.mouth.upper.map(([x, y, dz]) => [
      x * P.mouth.width,
      about(y, F.mouth.upper.pivot.y, P.mouth.upperLip) + P.mouth.y,
      dz * P.mouth.lipFullness,
    ]),
  );
  const lower = onFace(
    R.mouth.lower.map(([x, y, dz]) => [
      x * P.mouth.width,
      about(y, F.mouth.lower.pivot.y, P.mouth.lowerLip) + P.mouth.y,
      dz * P.mouth.lipFullness,
    ]),
  );
  const ear = placeEar(S, P);
  // The eye on one side: the shape scaled (by its knobs, and to the face),
  // tilted (mirrored for the left eye so both outer corners lift together),
  // then laid onto the face
  const eye = (side) => {
    const k = eyeScale(S, P);
    const cx = P.eyes.spacing * k * side,
      cy = P.eyes.y;
    const c = Math.cos(P.eyes.tilt * side),
      s = Math.sin(P.eyes.tilt * side);
    return hull(
      R.eyes.eye.map(([dx, dy, dz]) => {
        const ex = dx * P.eyes.width * k,
          ey = dy * P.eyes.height * k;
        const x = cx + (ex * c - ey * s),
          y = cy + (ex * s + ey * c);
        return [x, y, surfaceAt(Math.abs(x), y).p.z + dz * EYE_BULGE];
      }),
    );
  };

  const neck =
    opts.neck === false ?
      null
    : extrudeFace(S, S.napeIdx, opts.neckBottom ?? STRETCH_FROM - 1, {
        reach: P.neck.filletReach,
        drop: P.neck.filletDrop,
        rings: 8,
      });

  // The features stand proud of the skull, and are kept on their own too
  const features = mergeGeometries([
    clean(hull(mirrorPts(nose))),
    clean(hull(mirrorPts(upper))),
    clean(hull(mirrorPts(lower))),
    ...[1, -1].map((s) => clean(hull(sidePts(ear, s)))),
  ]);
  const head = mergeGeometries([
    clean(craniumGeometry(S, !!neck)),
    features,
    ...(neck ? [clean(neck.geo)] : []),
  ]);
  const eyes = mergeGeometries([clean(eye(1)), clean(eye(-1))]);
  return {
    head,
    eyes,
    features,
    ring: neck ? neck.ring : [],
    collar: neck ? neck.collar : [],
    shape: S,
    params: P,
  };
}

// =====================================================================
// The lab: a grid of heads, and a range for every knob
// =====================================================================
// Four ways to fill the grid:
//   random    every varied knob drawn uniformly from its [lo, hi], per head
//   extremes  like random, but each knob lands on lo or hi — the corner cases
//   sweep     one knob runs lo → hi across the grid (or two: one across, one down),
//             everything else held at its fixed value
//   field     the heads the field actually stands up (statues.js variantParams,
//             drawn from HEAD_RANGES there, not the ranges here), with a slider
//             for how far apart they are pushed (VARIETY there). Only when the
//             page hands mountLab those: opts.field = { count, params, variety }
//   unusual   a test: the field's heads again, each broken (see breakHead)
// Ranges, mode and grid size are remembered in localStorage between visits.
const STORE_KEY = "heads-lab-v2"; // v2: knobs keyed by group.name
const SPEC = Object.fromEntries(PARAMS.map((q) => [q.key, q]));
const GROUPS = [...new Set(PARAMS.map((q) => q.group))];

// A small seeded generator, so a grid can be revisited by its seed
// Break a built head, as a test: 1–3 cuts, each a plane a little way into the
// stone behind some point on it (the nose and ears as often as the skull).
// Whatever lies past a plane is pressed flat onto it, so every cut leaves a
// flat broken face; the eyes past it are dropped. Changes `built` in place,
// and leaves on it `cuts`: each plane { n, d, area }, area how much broken
// face it left (head units², the field lays a fallen head on its biggest)
export function breakHead(built, rnd) {
  const pts = (g) => g.attributes.position;
  const pick = (a) => {
    const i = Math.floor(rnd() * a.count);
    return V(a.getX(i), a.getY(i), a.getZ(i));
  };
  const planes = [];
  for (let k = 1 + Math.floor(rnd() * 3); k--; ) {
    let p;
    do p = pick(rnd() < 0.4 ? pts(built.features) : pts(built.head));
    while (p.y < -0.8); // not the neck
    const n = p
      .clone()
      .sub(V(0, 0.1, 0))
      .normalize()
      .add(V(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.2))
      .normalize();
    const depth = 0.06 + rnd() * 0.3;
    planes.push({ n, d: n.dot(p) - depth, area: 0 }); // past it: n·x > d
  }
  const v = new THREE.Vector3(),
    tri = [0, 1, 2].map(() => new THREE.Vector3()),
    e1 = new THREE.Vector3(),
    e2 = new THREE.Vector3();
  // The stone: press each vertex back onto every plane it is past; a triangle
  // that moved takes its new facing (flat on a cut, it faces out of the cut)
  const pos = pts(built.head),
    nrm = built.head.attributes.normal;
  for (let t = 0; t < pos.count; t += 3) {
    let moved = false;
    for (let j = 0; j < 3; j++) {
      v.fromBufferAttribute(pos, t + j);
      for (const { n, d } of planes) {
        const over = n.dot(v) - d;
        if (over > 0) (v.addScaledVector(n, -over), (moved = true));
      }
      pos.setXYZ(t + j, v.x, v.y, v.z);
      tri[j].copy(v);
    }
    if (!moved) continue;
    e1.subVectors(tri[1], tri[0]).cross(e2.subVectors(tri[2], tri[0]));
    if (e1.lengthSq() < 1e-14) continue;
    const area = e1.length() / 2;
    e1.normalize();
    for (let j = 0; j < 3; j++) nrm.setXYZ(t + j, e1.x, e1.y, e1.z);
    for (const c of planes)
      if (e1.dot(c.n) > 0.999 && tri.every((q) => Math.abs(c.n.dot(q) - c.d) < 1e-5))
        c.area += area;
  }
  pos.needsUpdate = nrm.needsUpdate = true;
  // The eyes: a triangle with any corner past a plane goes
  const ep = pts(built.eyes);
  for (let t = 0; t < ep.count; t += 3) {
    let gone = false;
    for (let j = 0; j < 3 && !gone; j++) {
      v.fromBufferAttribute(ep, t + j);
      gone = planes.some(({ n, d }) => n.dot(v) > d);
    }
    if (gone)
      for (let j = 1; j < 3; j++)
        ep.setXYZ(t + j, ep.getX(t), ep.getY(t), ep.getZ(t));
  }
  ep.needsUpdate = true;
  built.head.computeBoundingSphere();
  built.eyes.computeBoundingSphere();
  built.cuts = planes;
  return built;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
};
export const fmt = (v) =>
  (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3)).replace(/\.?0+$/, "");
const stepFor = (q) => (q.max - q.min > 1 ? 0.01 : 0.005);

export function mountLab(root, opts = {}) {
  const FIELD = opts.field ?? null; // { count, params(v, variety), variety }: the field's heads, if the page has them
  const FIELD_MODES = ["field", "unusual"];
  // ---- state ---------------------------------------------------------
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
  } catch {
    saved = {};
  }
  const state = {
    grid: [2, 3, 4, 5].includes(saved.grid) ? saved.grid : 3, // rows; twice as many columns
    mode:
      FIELD_MODES.includes(saved.mode) && !FIELD ? "random" : (
        (saved.mode ?? "random")
      ),
    variety: FIELD ? (saved.variety ?? FIELD.variety) : 0,
    sweepX: SPEC[saved.sweepX] ? saved.sweepX : "mouth.width",
    sweepY: SPEC[saved.sweepY] ? saved.sweepY : "",
    seed: saved.seed ?? 1,
    neck: saved.neck ?? false, // necks cost ~180 ms a head to build; switch on to check the jaw line
    yaw: 0,
    spin: false,
    ranges: Object.fromEntries(
      PARAMS.map((q) => [
        q.key,
        {
          vary: true,
          lo: q.min,
          hi: q.max,
          fixed: q.def,
          ...(saved.ranges?.[q.key] ?? {}),
        },
      ]),
    ),
  };
  const save = () => {
    try {
      const { grid, mode, sweepX, sweepY, seed, neck, variety, ranges } = state;
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          grid,
          mode,
          sweepX,
          sweepY,
          seed,
          neck,
          variety,
          ranges,
        }),
      );
    } catch {
      /* private mode, or storage full: the lab still works, it just forgets */
    }
  };
  // The field's heads fill as many rows as they need, five or so to a row
  const fieldish = () => FIELD_MODES.includes(state.mode);
  const gridDims = () => {
    if (!fieldish())
      return { rows: state.grid, cols: state.grid * 2 };
    const rows = Math.max(1, Math.round(FIELD.count / 5));
    return { rows, cols: Math.ceil(FIELD.count / rows) };
  };
  const isAxis = (key) =>
    state.mode === "sweep" && (key === state.sweepX || key === state.sweepY);

  // The ranges as drawParams wants them (and as "copy ranges" hands them out),
  // laid out like HEAD_PARAMS: a [lo, hi] pair for every varied knob, a single
  // number for a fixed one. With fixedOnly, every knob is its fixed value.
  const rangesOut = (fixedOnly = false) => {
    const out = {};
    for (const q of PARAMS) {
      const r = state.ranges[q.key];
      (out[q.group] ??= {})[q.name] =
        r.vary && !fixedOnly ? [r.lo, r.hi] : r.fixed;
    }
    return out;
  };

  // The numbers for every cell of the grid, in reading order
  function cellParams() {
    if (fieldish())
      return Array.from({ length: FIELD.count }, (_, v) =>
        FIELD.params(v, state.variety),
      );
    const { rows, cols } = gridDims(),
      cells = [];
    const rnd = mulberry32(state.seed);
    const corner = () => (rnd() < 0.5 ? 0 : 1);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (state.mode === "sweep") {
          const P = drawParams(rnd, rangesOut(true));
          const X = state.ranges[state.sweepX];
          const tx =
            state.sweepY ?
              c / Math.max(1, cols - 1)
            : (r * cols + c) / Math.max(1, rows * cols - 1);
          setKnob(P, state.sweepX, X.lo + (X.hi - X.lo) * tx);
          if (state.sweepY) {
            const Y = state.ranges[state.sweepY];
            setKnob(
              P,
              state.sweepY,
              Y.lo + (Y.hi - Y.lo) * (r / Math.max(1, rows - 1)),
            );
          }
          cells.push(P);
        } else {
          cells.push(
            drawParams(state.mode === "extremes" ? corner : rnd, rangesOut()),
          );
        }
      }
    return cells;
  }

  // ---- the page ------------------------------------------------------
  const panel = el("aside", { id: "lab-panel" });
  const view = el("div", { id: "lab-view" });
  const labels = el("div", { id: "lab-labels" });
  const tip = el("div", { id: "lab-tip", hidden: "" });
  const toast = el("div", { id: "lab-toast", hidden: "" });
  const status = el("div", { id: "lab-status" });
  root.append(panel, view);
  view.append(labels, tip, toast, status);

  let toastTimer = 0;
  const say = (msg) => {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 1400);
  };

  // Toolbar: grid, mode, sweep axes, seed, neck, and the range buttons
  const select = (opts, value, onchange) => {
    const s = el("select", { onchange: (e) => onchange(e.target.value) });
    for (const [v, label] of opts)
      s.append(el("option", { value: v, text: label }));
    s.value = value;
    return s;
  };
  const paramOptions = (none) => [
    ...(none ? [["", "none"]] : []),
    ...PARAMS.map((q) => [q.key, q.label]),
  ];
  const gridSel = select(
    [2, 3, 4, 5].map((n) => [n, `${n} × ${n * 2}`]),
    state.grid,
    (v) => {
      state.grid = +v;
      save();
      fitCamera();
      rebuild();
    },
  );
  const modeSel = select(
    [
      ["random", "random"],
      ["extremes", "extremes (lo or hi)"],
      ["sweep", "sweep"],
      ...(FIELD ?
        [
          ["field", "the field's heads"],
          ["unusual", "unusual"],
        ]
      : []),
    ],
    state.mode,
    (v) => {
      state.mode = v;
      save();
      refreshRows();
      fitCamera();
      rebuild();
    },
  );
  // The field's heads: how far apart they are pushed (VARIETY in statues.js)
  const varietyOut = el("span", { class: "lab-seed" });
  const varietySlider = el("input", {
    type: "range",
    min: 0,
    max: 1,
    step: 0.01,
    oninput: (e) => {
      state.variety = +e.target.value;
      varietyOut.textContent = fmt(state.variety);
      rebuildSoon();
    },
  });
  varietySlider.value = state.variety;
  varietyOut.textContent = fmt(state.variety);
  const varietyRow = el("div", { class: "lab-row lab-sweep" }, [
    el("label", {
      text: "variety",
      title:
        "0: the heads where their draws fell; 1: every knob at an end of its range. Paste the number over VARIETY in statues.js",
    }),
    varietySlider,
    varietyOut,
  ]);
  const sweepXSel = select(paramOptions(false), state.sweepX, (v) => {
    state.sweepX = v;
    save();
    refreshRows();
    rebuild();
  });
  const sweepYSel = select(paramOptions(true), state.sweepY, (v) => {
    state.sweepY = v;
    save();
    refreshRows();
    rebuild();
  });
  const sweepRow = el("div", { class: "lab-row lab-sweep" }, [
    el("label", { text: "across" }),
    sweepXSel,
    el("label", { text: "down" }),
    sweepYSel,
  ]);
  const seedLabel = el("span", { class: "lab-seed" });
  const showSeed = () => (seedLabel.textContent = `seed ${state.seed}`);
  showSeed();
  const neckBox = el("input", {
    type: "checkbox",
    onchange: (e) => {
      state.neck = e.target.checked;
      save();
      rebuild();
    },
  });
  neckBox.checked = state.neck;

  panel.append(
    el("div", { class: "lab-row" }, [
      el("label", { text: "grid" }),
      gridSel,
      el("label", { text: "fill" }),
      modeSel,
    ]),
    sweepRow,
    varietyRow,
    el("div", { class: "lab-row" }, [
      el("button", {
        text: "reroll",
        title: "a new random draw",
        onclick: () => {
          state.seed = (state.seed + 1) % 100000;
          showSeed();
          save();
          rebuild();
        },
      }),
      seedLabel,
      el("label", { class: "lab-check" }, [
        neckBox,
        el("span", { text: "neck" }),
      ]),
    ]),
    el("div", { class: "lab-row" }, [
      el("button", {
        text: "copy ranges",
        title:
          "the ranges as JSON, laid out like HEAD_PARAMS, ready to paste over HEAD_RANGES",
        onclick: async () => {
          const json = JSON.stringify(rangesOut(), null, 2);
          try {
            await navigator.clipboard.writeText(json);
            say("ranges copied");
          } catch {
            console.log(json);
            say("clipboard blocked — printed to the console");
          }
        },
      }),
      el("button", {
        text: "all vary",
        onclick: () =>
          setVary(
            PARAMS.map((q) => q.key),
            true,
          ),
      }),
      el("button", {
        text: "all fixed",
        onclick: () =>
          setVary(
            PARAMS.map((q) => q.key),
            false,
          ),
      }),
      el("button", {
        text: "reset",
        title: "every knob back to its default and its full range",
        onclick: () => {
          for (const q of PARAMS)
            state.ranges[q.key] = {
              vary: true,
              lo: q.min,
              hi: q.max,
              fixed: q.def,
            };
          save();
          refreshRows();
          rebuild();
          say("ranges reset");
        },
      }),
    ]),
  );

  // One row per knob. Varied: a two-thumb slider for [lo, hi]. Fixed: one
  // slider for the value. Number boxes beside them for exact values.
  const rows = {};
  let rebuildTimer = 0;
  const rebuildSoon = () => {
    save();
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuild, 180);
  };
  function setVary(keys, vary) {
    for (const k of keys) state.ranges[k].vary = vary;
    refreshRows();
    rebuildSoon();
  }
  const numBox = (q, get, set) => {
    const box = el("input", {
      type: "number",
      min: q.min,
      max: q.max,
      step: stepFor(q),
      onchange: (e) => {
        set(THREE.MathUtils.clamp(+e.target.value || 0, q.min, q.max));
        refreshRows();
        rebuildSoon();
      },
    });
    box.sync = () => (box.value = fmt(get()));
    return box;
  };
  const slider = (q, cls, get, set) => {
    const s = el("input", {
      type: "range",
      class: cls,
      min: q.min,
      max: q.max,
      step: stepFor(q),
      oninput: (e) => {
        set(+e.target.value);
        refreshRow(q.key);
        rebuildSoon();
      },
    });
    s.sync = () => (s.value = get());
    return s;
  };
  for (const group of GROUPS) {
    const keys = PARAMS.filter((q) => q.group === group).map((q) => q.key);
    const groupBox = el("input", {
      type: "checkbox",
      title: "vary every knob in this group",
      onchange: (e) => setVary(keys, e.target.checked),
    });
    panel.append(
      el("h3", { class: "lab-group" }, [
        groupBox,
        el("span", { text: group[0].toUpperCase() + group.slice(1) }),
      ]),
    );
    for (const key of keys) {
      const q = SPEC[key],
        R = state.ranges[key];
      const vary = el("input", {
        type: "checkbox",
        onchange: (e) => setVary([key], e.target.checked),
      });
      const lo = slider(
        q,
        "lo",
        () => R.lo,
        (v) => {
          R.lo = v;
          if (R.hi < v) R.hi = v;
        },
      );
      const hi = slider(
        q,
        "hi",
        () => R.hi,
        (v) => {
          R.hi = v;
          if (R.lo > v) R.lo = v;
        },
      );
      const fixed = slider(
        q,
        "fixed",
        () => R.fixed,
        (v) => (R.fixed = v),
      );
      const loBox = numBox(
        q,
        () => R.lo,
        (v) => {
          R.lo = v;
          if (R.hi < v) R.hi = v;
        },
      );
      const hiBox = numBox(
        q,
        () => R.hi,
        (v) => {
          R.hi = v;
          if (R.lo > v) R.lo = v;
        },
      );
      const fixedBox = numBox(
        q,
        () => R.fixed,
        (v) => (R.fixed = v),
      );
      const fill = el("div", { class: "fill" });
      const dual = el("div", { class: "dual" }, [
        el("div", { class: "track" }, [fill]),
        lo,
        hi,
      ]);
      const single = el("div", { class: "single" }, [fixed]);
      const defMark = el("div", {
        class: "def",
        title: `default ${fmt(q.def)}`,
      });
      // the thumbs travel between 7px in from each end, so the marker does too
      defMark.style.left = `calc(7px + (100% - 14px) * ${(q.def - q.min) / (q.max - q.min)})`;
      const row = el("div", { class: "prow", title: q.note }, [
        el("div", { class: "prow-head" }, [
          vary,
          el("span", { class: "name", text: q.label }),
          el("span", { class: "boxes" }, [
            loBox,
            el("span", { class: "dash", text: "–" }),
            hiBox,
            fixedBox,
          ]),
        ]),
        el("div", { class: "prow-slider" }, [dual, single, defMark]),
      ]);
      panel.append(row);
      rows[key] = {
        row,
        vary,
        lo,
        hi,
        fixed,
        loBox,
        hiBox,
        fixedBox,
        fill,
        groupBox,
        keys,
      };
    }
  }
  function refreshRow(key) {
    const r = rows[key],
      R = state.ranges[key],
      q = SPEC[key];
    const varied = R.vary || isAxis(key);
    r.row.classList.toggle("varied", varied);
    r.row.classList.toggle("axis", isAxis(key));
    r.vary.checked = R.vary;
    r.vary.disabled = isAxis(key);
    for (const s of [r.lo, r.hi, r.fixed, r.loBox, r.hiBox, r.fixedBox])
      s.sync();
    const pct = (v) => ((v - q.min) / (q.max - q.min)) * 100;
    r.fill.style.left = `${pct(R.lo)}%`;
    r.fill.style.width = `${pct(R.hi) - pct(R.lo)}%`;
    const inGroup = r.keys.map((k) => state.ranges[k].vary);
    r.groupBox.checked = inGroup.every(Boolean);
    r.groupBox.indeterminate = !r.groupBox.checked && inGroup.some(Boolean);
  }
  function refreshRows() {
    sweepRow.hidden = state.mode !== "sweep";
    varietyRow.hidden = !fieldish();
    for (const q of PARAMS) refreshRow(q.key);
  }
  refreshRows();

  // ---- the scene -----------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  view.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3ecd8);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;

  // Brighter than the field's moonlight, so the planes and features read
  scene.add(new THREE.HemisphereLight(0xc4d2f2, 0x33301f, 0.8));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(3, 5, 7);
  const fillL = new THREE.DirectionalLight(0x8fb0ff, 0.7);
  fillL.position.set(-6, 1, 4);
  const rimL = new THREE.DirectionalLight(0x6f8cc4, 1.0);
  rimL.position.set(1, 3, -7);
  scene.add(key, fillL, rimL);

  // The same stone as the field, minus its weathering shader
  const plaster = new THREE.MeshStandardMaterial({
    color: 0xe0dac9,
    roughness: 1,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x6e6656,
    roughness: 1,
  });
  const hot = new THREE.MeshStandardMaterial({
    color: 0xf6ead0,
    roughness: 1,
    emissive: 0x2a2416,
  });

  const DX = 2.5,
    DY = 3.7,
    NECK_BOTTOM = -2.2;
  let heads = []; // { group, P, i, label }
  let gen = 0;

  const cellPos = (i, out) => {
    const { rows, cols } = gridDims(),
      r = Math.floor(i / cols),
      c = i % cols;
    return out.set(
      (c - (cols - 1) / 2) * DX,
      ((rows - 1) / 2 - r) * DY + 0.6,
      0,
    );
  };
  function fitCamera() {
    const { rows, cols } = gridDims();
    const W = (cols - 1) * DX + 2.4,
      H = (rows - 1) * DY + 3.6;
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const dist =
      Math.max(H / 2 / half, W / 2 / half / camera.aspect) * 1.06 + 1.5;
    camera.position.set(0, 0, dist);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  function resize() {
    const w = view.clientWidth,
      h = view.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(view);
  resize();
  fitCamera();

  const labelFor = (P, i) => {
    if (fieldish()) return i ? `variant ${i}` : "default";
    if (state.mode !== "sweep") return "";
    let s = `${SPEC[state.sweepX].label} ${fmt(getKnob(P, state.sweepX))}`;
    if (state.sweepY)
      s += `\n${SPEC[state.sweepY].label} ${fmt(getKnob(P, state.sweepY))}`;
    return s;
  };
  function clear() {
    for (const h of heads) {
      scene.remove(h.group);
      for (const m of h.group.children) m.geometry.dispose();
      h.label.remove();
    }
    heads = [];
    tip.hidden = true;
  }
  // Rebuild the whole grid, one head per frame so the page never locks up
  function rebuild() {
    clear();
    const cells = cellParams();
    const g = ++gen;
    let i = 0;
    const step = () => {
      if (g !== gen) return;
      if (i >= cells.length) {
        status.textContent = "";
        return;
      }
      const P = cells[i];
      const built = buildHead(P, { neck: state.neck, neckBottom: NECK_BOTTOM });
      if (state.mode === "unusual")
        breakHead(built, mulberry32(state.seed * 7919 + i));
      const group = new THREE.Group();
      group.add(
        new THREE.Mesh(built.head, plaster),
        new THREE.Mesh(built.eyes, dark),
      );
      cellPos(i, group.position);
      group.rotation.y = state.yaw;
      scene.add(group);
      const label = el("div", { class: "hlabel", text: `${i + 1}` });
      const sub = labelFor(P, i);
      if (sub) label.append(el("span", { class: "sub", text: sub }));
      labels.append(label);
      heads.push({ group, P, i, label });
      i++;
      status.textContent =
        i < cells.length ? `building ${i} / ${cells.length}` : "";
      requestAnimationFrame(step);
    };
    step();
  }

  // Labels sit under each neck; they follow the heads as the camera moves
  const proj = new THREE.Vector3();
  function placeLabels() {
    const w = view.clientWidth,
      h = view.clientHeight;
    for (const hd of heads) {
      proj
        .set(0, NECK_BOTTOM - 0.3, 0)
        .applyMatrix4(hd.group.matrixWorld)
        .project(camera);
      const behind = proj.z > 1;
      hd.label.style.display = behind ? "none" : "";
      if (behind) continue;
      hd.label.style.transform = `translate(${((proj.x + 1) / 2) * w}px, ${((1 - proj.y) / 2) * h}px)`;
    }
  }

  // Hover a head for its numbers; click it to copy them
  let hovered = null;
  const nearest = (mx, my) => {
    const w = view.clientWidth,
      h = view.clientHeight;
    let best = null,
      bestD = 70;
    for (const hd of heads) {
      proj.set(0, -0.6, 0).applyMatrix4(hd.group.matrixWorld).project(camera);
      const d = Math.hypot(
        ((proj.x + 1) / 2) * w - mx,
        ((1 - proj.y) / 2) * h - my,
      );
      if (d < bestD) {
        bestD = d;
        best = hd;
      }
    }
    return best;
  };
  const setHover = (hd) => {
    if (hovered === hd) return;
    if (hovered) hovered.group.children[0].material = plaster;
    hovered = hd;
    if (hd) hd.group.children[0].material = hot;
  };
  view.addEventListener("pointermove", (e) => {
    if (e.buttons) return; // orbiting
    const r = view.getBoundingClientRect();
    const hd = nearest(e.clientX - r.left, e.clientY - r.top);
    setHover(hd);
    tip.hidden = !hd;
    if (!hd) return;
    const shown = PARAMS.filter(
      (q) =>
        fieldish() || state.ranges[q.key].vary || isAxis(q.key),
    );
    tip.replaceChildren(
      el("div", { class: "tip-title", text: `head ${hd.i + 1}` }),
      ...(shown.length ?
        shown.map((q) =>
          el("div", { class: "tip-row" }, [
            el("span", { text: q.label }),
            el("b", { text: fmt(getKnob(hd.P, q.key)) }),
          ]),
        )
      : [el("div", { class: "tip-row", text: "all knobs fixed" })]),
      el("div", { class: "tip-hint", text: "click to copy every value" }),
    );
    const x = e.clientX - r.left + 16,
      y = e.clientY - r.top + 16;
    tip.style.left = `${Math.min(x, r.width - tip.offsetWidth - 8)}px`;
    tip.style.top = `${Math.min(y, r.height - tip.offsetHeight - 8)}px`;
  });
  view.addEventListener("pointerleave", () => {
    setHover(null);
    tip.hidden = true;
  });
  view.addEventListener("click", async () => {
    if (!hovered) return;
    const json = JSON.stringify(hovered.P, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      say(`head ${hovered.i + 1} copied`);
    } catch {
      console.log(json);
      say("clipboard blocked — printed to the console");
    }
  });
  view.addEventListener("dblclick", fitCamera);

  // Turn every head together, to see them all in profile
  const yawSlider = el("input", {
    type: "range",
    min: -180,
    max: 180,
    value: 0,
    oninput: (e) => {
      state.yaw = THREE.MathUtils.degToRad(+e.target.value);
      for (const hd of heads) hd.group.rotation.y = state.yaw;
    },
  });
  const spinBox = el("input", {
    type: "checkbox",
    onchange: (e) => (state.spin = e.target.checked),
  });
  view.append(
    el("div", { id: "lab-viewbar" }, [
      el("label", { text: "turn" }),
      yawSlider,
      el("label", { class: "lab-check" }, [
        spinBox,
        el("span", { text: "spin" }),
      ]),
      el("span", {
        class: "lab-hint",
        text: "drag to orbit · scroll to zoom · double-click to refit",
      }),
    ]),
  );

  renderer.setAnimationLoop(() => {
    if (state.spin) {
      state.yaw += 0.006;
      yawSlider.value = THREE.MathUtils.radToDeg(
        Math.atan2(Math.sin(state.yaw), Math.cos(state.yaw)),
      );
      for (const hd of heads) hd.group.rotation.y = state.yaw;
    }
    controls.update();
    renderer.render(scene, camera);
    placeLabels();
  });

  rebuild();
}
