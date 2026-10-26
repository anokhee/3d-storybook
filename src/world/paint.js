import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";

// Paint on the lump: its own surface where a box at `at`, turned `turn`
// and `size` across, tall and deep, falls on it — every side of it, so a
// box round a foot paints a sock — copied out as a decal and lifted a
// hair (`lift`) along its normals so it sits on the fur — a little more
// for paint that goes over other paint, a collar over a bib. `arch`
// rounds the patch's top off into a half-circle as wide as the patch,
// and `radius` rounds its two bottom corners off by that much: the
// decal's triangles are trimmed against a fan of planes tangent to each
// circle, in the box's own frame, the way the decal itself was trimmed
// to the box. `edges` trims it further to a polygon: each `{ a, r }` a
// straight edge `r` out from the box's middle, facing angle `a`.
export function paintOn(geo, at, turn, size, { arch = false, radius = 0, edges = [], lift = 0.006 } = {}) {
  const onto = new THREE.Mesh(geo);
  onto.updateMatrixWorld();
  let decal = new DecalGeometry(onto, at, turn, new THREE.Vector3(...size));
  const planes = [...(arch ? archPlanes(size) : []), ...(radius > 0 ? cornerPlanes(size, radius) : []), ...edges.map(({ a, r }) => tangent(0, 0, r, a))];
  if (planes.length) decal = trim(decal, at, turn, planes);
  const p = decal.attributes.position.array, n = decal.attributes.normal.array;
  for (let i = 0; i < p.length; i++) p[i] += n[i] * lift;
  return decal;
}

// A triangle clipped to the half-space n·p <= d (Sutherland–Hodgman),
// as a polygon of { p, n } corners, each new corner interpolated along
// the edge it cuts.
function clipPolygon(poly, normal, d) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = a.p.dot(normal) - d, db = b.p.dot(normal) - d;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db);
      out.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize() });
    }
  }
  return out;
}

// A plane tangent to the circle at (cx, cy) of radius r, where its
// normal points at angle `a`: the half-space n·p <= d inside it.
const tangent = (cx, cy, r, a) => {
  const normal = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  return { normal, d: normal.x * cx + normal.y * cy + r };
};
// The arch: a fan of planes round the top half of a circle as wide as
// the patch, sat at its top.
const ARCH_PLANES = 9;
function archPlanes(size) {
  const r = size[0] / 2, cy = size[1] / 2 - r;
  return Array.from({ length: ARCH_PLANES }, (_, k) => tangent(0, cy, r, (Math.PI * (k + 1)) / (ARCH_PLANES + 1)));
}
// The bottom corners: a fan of planes round the outer-lower quarter of a
// circle of `radius` tucked into each.
const CORNER_PLANES = 5;
function cornerPlanes(size, radius) {
  const r = Math.min(radius, size[0] / 2, size[1] / 2), cx = size[0] / 2 - r, cy = -size[1] / 2 + r;
  return [-1, 1].flatMap((side) => Array.from({ length: CORNER_PLANES }, (_, k) => {
    const a = (Math.PI / 2) * ((k + 1) / (CORNER_PLANES + 1)); // from straight down round to straight out
    return tangent(side * cx, cy, r, side > 0 ? -Math.PI / 2 + a : -Math.PI / 2 - a);
  }));
}
// The decal's triangles clipped to the inside of every plane, in the
// box's own frame.
function trim(decal, at, turn, planes) {
  const frame = new THREE.Matrix4().makeRotationFromEuler(turn).setPosition(at);
  const into = frame.clone().invert();
  const pos = decal.attributes.position, nor = decal.attributes.normal;
  const outP = [], outN = [];
  const rot = new THREE.Matrix3().setFromMatrix4(into), back = new THREE.Matrix3().setFromMatrix4(frame);
  for (let i = 0; i < pos.count; i += 3) {
    let poly = [0, 1, 2].map((k) => ({
      p: new THREE.Vector3().fromBufferAttribute(pos, i + k).applyMatrix4(into),
      n: new THREE.Vector3().fromBufferAttribute(nor, i + k).applyMatrix3(rot),
    }));
    for (const { normal, d } of planes) {
      poly = clipPolygon(poly, normal, d);
      if (poly.length < 3) break;
    }
    for (let k = 1; k + 1 < poly.length; k++) {
      for (const c of [poly[0], poly[k], poly[k + 1]]) {
        outP.push(...c.p.clone().applyMatrix4(frame).toArray());
        outN.push(...c.n.clone().applyMatrix3(back).toArray());
      }
    }
  }
  decal.dispose();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(outP, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(outN, 3));
  return geo;
}

// Paint on the lump wherever `mark(p)` is above zero, for markings no box
// would make: stripes that wrap round and curve, a net of patches.
// `mark` takes a point on the surface (a Vector3, in the lump's frame)
// and gives about how far it is inside the marking, + in and - out, so a
// triangle whose corners are all further from the edge than any of it
// is from them lies wholly in or out of it. The rest are split in four, `split` times
// over, and the smallest cut along where `mark` crosses zero, so the
// outline runs smooth; lifted a hair along the normals as paintOn's is.
export function paintWhere(geo, mark, { split = 1, lift = 0.006 } = {}) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, index = geo.index;
  const corner = (i) => {
    const p = new THREE.Vector3().fromBufferAttribute(pos, i);
    return { p, n: new THREE.Vector3().fromBufferAttribute(nor, i), f: mark(p) };
  };
  const between = (a, b) => {
    const p = a.p.clone().lerp(b.p, 0.5);
    return { p, n: a.n.clone().add(b.n).normalize(), f: mark(p) };
  };
  const outP = [], outN = [];
  const emit = (poly) => {
    for (let k = 1; k + 1 < poly.length; k++) {
      for (const c of [poly[0], poly[k], poly[k + 1]]) {
        outP.push(c.p.x + c.n.x * lift, c.p.y + c.n.y * lift, c.p.z + c.n.z * lift);
        outN.push(c.n.x, c.n.y, c.n.z);
      }
    }
  };
  // the part of a triangle where mark > 0, its new corners found along
  // the edges where it crosses
  const cut = (tri) => {
    const out = [];
    for (let i = 0; i < 3; i++) {
      const a = tri[i], b = tri[(i + 1) % 3];
      if (a.f > 0) out.push(a);
      if ((a.f > 0) !== (b.f > 0)) {
        const t = a.f / (a.f - b.f);
        out.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize() });
      }
    }
    if (out.length >= 3) emit(out);
  };
  const paint = (tri, depth) => {
    const [a, b, c] = tri;
    // no point of it is further from a corner than about this
    const size = 0.6 * Math.max(a.p.distanceTo(b.p), b.p.distanceTo(c.p), c.p.distanceTo(a.p));
    if (Math.min(a.f, b.f, c.f) > size) return emit(tri);
    if (Math.max(a.f, b.f, c.f) < -size) return;
    if (depth === 0) return cut(tri);
    const ab = between(a, b), bc = between(b, c), ca = between(c, a);
    for (const t of [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]) paint(t, depth - 1);
  };
  const corners = new Map();
  const at = (i) => { if (!corners.has(i)) corners.set(i, corner(i)); return corners.get(i); };
  const count = index ? index.count : pos.count;
  for (let i = 0; i < count; i += 3) {
    const k = index ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)] : [i, i + 1, i + 2];
    paint(k.map(at), split);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(outP, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(outN, 3));
  return out;
}
