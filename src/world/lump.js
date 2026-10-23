import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// A LUMP: one continuous form, the way clay pressed together has no
// seams — a body as a block, legs pulled straight down out of it, a head
// grown out of its front. Each part is a signed distance field (how far a
// point is from the part's surface, negative inside), the parts are joined
// with a smooth minimum — so where two come together the join is a
// fillet rather than a crease, as wide as that part's `blend` — and the
// surface is where the joined distance is zero. Three's marching cubes
// polygonises that over a grid; it is run once per build, not per frame,
// and the triangles copied out into a geometry of their own.
//
//   parts  each { kind, blend?, ...its own fields }, in the object's units:
//          sphere   { at, r }
//          box      { at, half, round, tilt?, yaw? }  a box `half` each
//                   way from `at`, every edge rounded by `round` (so it
//                   is half + round overall), turned `yaw` radians about
//                   y and leant back `tilt` radians about x
//          capsule  { a, b, ra, rb }  from `a` to `b`, `ra` thick at one
//                   end and `rb` at the other
//          `blend` is how wide a fillet this part makes with what it
//          meets; 0 is a sharp join
//   resolution  the grid's cells a side; more is smoother and slower
//
// The grid spans a cube fitted round the parts with a margin, so the
// output is in the parts' own units wherever they are.
const ISOLATION = 80;
const MARGIN = 1.15;
let cubes = null;
let cubesResolution = 0;

const smin = (a, b, k) => {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

const p = new THREE.Vector3(), q = new THREE.Vector3(), ab = new THREE.Vector3();
function distance(part, x, y, z) {
  if (part.kind === "sphere") {
    return Math.hypot(x - part.at[0], y - part.at[1], z - part.at[2]) - part.r;
  }
  if (part.kind === "box") {
    q.set(x - part.at[0], y - part.at[1], z - part.at[2]);
    if (part.yaw) {
      const c = Math.cos(-part.yaw), s = Math.sin(-part.yaw);
      const qx = q.x * c + q.z * s, qz = -q.x * s + q.z * c;
      q.x = qx; q.z = qz;
    }
    if (part.tilt) {
      const c = Math.cos(-part.tilt), s = Math.sin(-part.tilt);
      const qy = q.y * c - q.z * s, qz = q.y * s + q.z * c;
      q.y = qy; q.z = qz;
    }
    const dx = Math.abs(q.x) - part.half[0], dy = Math.abs(q.y) - part.half[1], dz = Math.abs(q.z) - part.half[2];
    const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
    const inside = Math.min(Math.max(dx, dy, dz), 0);
    return outside + inside - part.round;
  }
  // capsule
  ab.set(part.b[0] - part.a[0], part.b[1] - part.a[1], part.b[2] - part.a[2]);
  p.set(x - part.a[0], y - part.a[1], z - part.a[2]);
  const t = Math.max(0, Math.min(1, p.dot(ab) / ab.lengthSq()));
  const r = part.ra + (part.rb - part.ra) * t;
  return p.addScaledVector(ab, -t).length() - r;
}

// How far each part reaches, for the cube to fit round.
function reachOf(part, box) {
  if (part.kind === "sphere") box.expandByPoint(new THREE.Vector3(...part.at).addScalar(part.r)).expandByPoint(new THREE.Vector3(...part.at).subScalar(part.r));
  else if (part.kind === "box") {
    const r = Math.hypot(...part.half) + part.round;
    box.expandByPoint(new THREE.Vector3(...part.at).addScalar(r)).expandByPoint(new THREE.Vector3(...part.at).subScalar(r));
  } else {
    const r = Math.max(part.ra, part.rb);
    for (const e of [part.a, part.b]) box.expandByPoint(new THREE.Vector3(...e).addScalar(r)).expandByPoint(new THREE.Vector3(...e).subScalar(r));
  }
}

export function lumpOf(parts, { resolution = 56 } = {}) {
  if (!cubes || cubesResolution !== resolution) {
    cubes = new MarchingCubes(resolution, new THREE.MeshBasicMaterial(), false, false, 120000);
    cubes.isolation = ISOLATION;
    cubesResolution = resolution;
  }
  const box = new THREE.Box3();
  for (const part of parts) reachOf(part, box);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const extent = (Math.max(size.x, size.y, size.z) / 2) * MARGIN; // half the cube, in the parts' units

  // The field, cell by cell: the joined distance, flipped so inside is
  // above ISOLATION, in the cube's own units so the step between cells
  // stays well scaled.
  cubes.reset();
  const n = resolution, half = n / 2, field = cubes.field;
  const scale = 60 / extent;
  for (let zi = 0; zi < n; zi++) {
    const z = ((zi - half) / half) * extent + center.z;
    for (let yi = 0; yi < n; yi++) {
      const y = ((yi - half) / half) * extent + center.y;
      const row = zi * n * n + yi * n;
      for (let xi = 0; xi < n; xi++) {
        const x = ((xi - half) / half) * extent + center.x;
        let d = Infinity;
        for (const part of parts) d = smin(d, distance(part, x, y, z), part.blend ?? 0);
        field[row + xi] = ISOLATION - d * scale;
      }
    }
  }
  cubes.update();

  // Out of the cube (-1..1) and back into the parts' units. The
  // triangles' shared corners are joined up and the normals taken from
  // the mesh, so the form shades smoothly as one.
  const count = cubes.count;
  const position = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    position[i] = cubes.positionArray[i] * extent + center.x;
    position[i + 1] = cubes.positionArray[i + 1] * extent + center.y;
    position[i + 2] = cubes.positionArray[i + 2] * extent + center.z;
  }
  const raw = new THREE.BufferGeometry();
  raw.setAttribute("position", new THREE.BufferAttribute(position, 3));
  const geo = mergeVertices(raw, 1e-4);
  raw.dispose();
  geo.computeVertexNormals();
  return geo;
}

// A TAIL on a lump: a curve of `points` from where it leaves the rump to
// its tip, `rootR` thick where it leaves and `tipR` at the tip. tailBalls
// samples it into TAIL_SAMPLES balls, each with how far along it is
// (`u`), and tailParts turns those into the capsules between them for
// the lump — the first blends widest, where it leaves the body, the
// rest join sharp: capsules end to end at the same radius already meet
// smoothly, and a fillet there would swell a ring at every join and
// bead the tail.
export const TAIL_SAMPLES = 24;
export function tailBalls(tail) {
  const curve = new THREE.CatmullRomCurve3(tail.points.map((p) => new THREE.Vector3(...p)));
  return Array.from({ length: TAIL_SAMPLES }, (_, i) => {
    const u = i / (TAIL_SAMPLES - 1);
    return { at: curve.getPointAt(u).toArray(), r: THREE.MathUtils.lerp(tail.rootR, tail.tipR, u), u };
  });
}
export const tailParts = (samples) =>
  samples.slice(1).map((b, i) => ({ kind: "capsule", a: samples[i].at, b: b.at, ra: samples[i].r, rb: b.r, blend: i === 0 ? 0.1 : 0 }));

// Which of a geometry's vertices are tail, and how far along it: each is
// given the `u` of the nearest point on the run of balls (along the
// segment between two of them, so it varies smoothly down the tail
// rather than stepping ball by ball) if it lies within reach of it,
// eased so the root barely moves and the tip moves fully, or 0 for the
// rest. A swish or a wag then bends the tail about a vertical axis
// through the root, every vertex by its own share of the angle, so the
// tail curls from where it leaves the rump rather than hinging.
export function tailWeights(geo, balls) {
  const pos = geo.attributes.position.array;
  const n = pos.length / 3;
  const weights = new Float32Array(n);
  const index = [];
  const v = new THREE.Vector3(), a = new THREE.Vector3(), seg = new THREE.Vector3(), near = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    let bestU = -1, bestD = Infinity;
    for (let k = 1; k < balls.length; k++) {
      const from = balls[k - 1], to = balls[k];
      a.set(...from.at);
      seg.set(...to.at).sub(a);
      const t = THREE.MathUtils.clamp(near.copy(v).sub(a).dot(seg) / seg.lengthSq(), 0, 1);
      const d = near.copy(a).addScaledVector(seg, t).distanceTo(v);
      const r = THREE.MathUtils.lerp(from.r, to.r, t);
      if (d < r * 1.8 && d < bestD) { bestD = d; bestU = THREE.MathUtils.lerp(from.u, to.u, t); }
    }
    if (bestU < 0) continue;
    weights[i] = bestU * bestU * (3 - 2 * bestU);
    index.push(i);
  }
  return { weights, index: Int32Array.from(index) };
}

// A copy of where a geometry's vertices rest, and which way they face,
// for the bend to work from.
export const restOf = (geo) => ({ position: geo.attributes.position.array.slice(), normal: geo.attributes.normal.array.slice() });

// The bend: a geometry's tail turned `angle` about the vertical through
// `root`, each vertex by its weight (see tailWeights), its normal turned
// with it. `rest` is where the vertices lie unbent (restOf).
const Y = new THREE.Vector3(0, 1, 0);
const bq = new THREE.Quaternion(), bv = new THREE.Vector3();
export function bendTail({ geo, rest, weights, index }, root, angle) {
  const pos = geo.attributes.position.array;
  const nor = geo.attributes.normal.array;
  for (let j = 0; j < index.length; j++) {
    const i = index[j], o = i * 3;
    bq.setFromAxisAngle(Y, angle * weights[i]);
    bv.set(rest.position[o] - root.x, rest.position[o + 1] - root.y, rest.position[o + 2] - root.z).applyQuaternion(bq);
    pos[o] = bv.x + root.x; pos[o + 1] = bv.y + root.y; pos[o + 2] = bv.z + root.z;
    bv.set(rest.normal[o], rest.normal[o + 1], rest.normal[o + 2]).applyQuaternion(bq);
    nor[o] = bv.x; nor[o + 1] = bv.y; nor[o + 2] = bv.z;
  }
  geo.attributes.position.needsUpdate = true;
  geo.attributes.normal.needsUpdate = true;
}
