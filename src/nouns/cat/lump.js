import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";

// A LUMP: one continuous form poured round a handful of balls, the way
// clay pressed together has no seams — a head and a body as one, legs
// pulled down out of it. The balls are metaballs: each adds a field that
// falls off with distance, and the lump's surface is where the sum passes
// a threshold, so two that come near enough swell into each other. Three's
// marching cubes polygonises that field over a grid; here it is run once
// per build, not per frame, and the triangles copied out into a geometry
// of their own.
//
//   balls       [{ at: [x, y, z], r, subtract? }] in the object's own
//               units: `r` is the radius the ball would have on its own;
//               `subtract`, if given, is this ball's own blend tightness
//               (below), looser for a part that should fillet softly
//               into its neighbours
//   resolution  the grid's cells a side; more is smoother and slower
//   subtract    how tight the blend is: a ball's field reaches out to
//               about r * sqrt((ISOLATION + subtract) / subtract), so a
//               higher subtract keeps neighbours from swelling each
//               other as much
//
// The grid spans a cube fitted round the balls with a margin, so the
// output is in the balls' own units wherever they are.
const ISOLATION = 80;
const MARGIN = 1.2;
let cubes = null;
let cubesResolution = 0;

export function lumpOf(balls, { resolution = 52, subtract = 48 } = {}) {
  if (!cubes || cubesResolution !== resolution) {
    cubes = new MarchingCubes(resolution, new THREE.MeshBasicMaterial(), false, false, 80000);
    cubes.isolation = ISOLATION;
    cubesResolution = resolution;
  }
  // The cube: centred on the balls, wide enough for the widest reach.
  const box = new THREE.Box3();
  for (const b of balls) {
    const at = new THREE.Vector3(...b.at);
    box.expandByPoint(at.clone().addScalar(b.r));
    box.expandByPoint(at.clone().subScalar(b.r));
  }
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const extent = (Math.max(size.x, size.y, size.z) / 2) * MARGIN; // half the cube, in the balls' units

  cubes.reset();
  for (const b of balls) {
    // Field coordinates run 0..1 across the cube; a radius R there (as a
    // share of the cube) is the surface of strength / R² - subtract = ISOLATION.
    const R = b.r / extent / 2;
    const sub = b.subtract ?? subtract;
    const strength = (ISOLATION + sub) * R * R;
    cubes.addBall(
      (b.at[0] - center.x) / extent / 2 + 0.5,
      (b.at[1] - center.y) / extent / 2 + 0.5,
      (b.at[2] - center.z) / extent / 2 + 0.5,
      strength,
      sub,
    );
  }
  cubes.update();

  // Out of the cube (-1..1) and back into the balls' units.
  const n = cubes.count;
  const position = new Float32Array(n * 3);
  const normal = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i += 3) {
    position[i] = cubes.positionArray[i] * extent + center.x;
    position[i + 1] = cubes.positionArray[i + 1] * extent + center.y;
    position[i + 2] = cubes.positionArray[i + 2] * extent + center.z;
    normal[i] = cubes.normalArray[i];
    normal[i + 1] = cubes.normalArray[i + 1];
    normal[i + 2] = cubes.normalArray[i + 2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  return geo;
}
