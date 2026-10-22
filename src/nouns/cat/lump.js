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
//          box      { at, half, round, tilt? }  a box `half` each way from
//                   `at`, every edge rounded by `round` (so it is
//                   half + round overall), leant back `tilt` radians
//                   about x
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
