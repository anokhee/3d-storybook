// The playroom's hanging clouds, from the xylophone game (ROOM.hangingClouds
// in its script.js, ported as a module): a big middle puff with a smaller one
// either side, a little lower, and sometimes one on top, squashed a touch,
// each on a cord that runs up out of sight. In the game nine hang in an
// arch behind the jack-in-the-boxes and bob in the breeze; here is one
// cloud, and the breeze for it.
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { COLOR_PALETTE } from "./palette.js";

export const HANGING_CLOUD = {
  r: [1.1, 1.6], // the middle puff's radius, drawn; the side puffs are smaller
  cord: 60, // how long the cord is: up out of sight
  // the breeze: it bobs up and down, sways and turns a little on its cord
  bob: 0.18, // world units up and down
  sway: 0.05, // radians of tilt
  twist: 0.15, // radians of turn on the cord
  wind: 1, // how strong the breeze is (the game scales it by its wind)
  // how much the puffs melt together into one shape, as a part of the middle puff's radius: 0 leaves them
  // separate balls, as the game has them; higher fills the dips between them more
  blend: 0.45,
};

const between = ([lo, hi], rnd) => lo + rnd() * (hi - lo);
const puffGeo = new THREE.SphereGeometry(1, 24, 16);

// The puffs melted into one: each puff, squashed a touch as the separate ones are, is a distance from its
// skin, and the distances are run together with a smooth minimum `k` wide, so where two meet they flow into
// each other with no crease. A sphere round the middle puff's center is then shrunk onto where that comes to
// nothing: along each of its vertices' directions, the skin is found by halving the distance in to it. The
// cloud is star-shaped from there (every puff overlaps the middle one), so each direction meets it once.
function meltedGeometry(puffs, k) {
  const ellipsoid = (x, y, z, [px, py, pr]) => {
    const sy = pr * 0.85;
    return (Math.hypot((x - px) / pr, (y - py) / sy, z / pr) - 1) * sy;
  };
  const smin = (a, b) => {
    const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
    return b + (a - b) * h - k * h * (1 - h);
  };
  const field = (x, y, z) => puffs.slice(1).reduce((d, p) => smin(d, ellipsoid(x, y, z, p)), ellipsoid(x, y, z, puffs[0]));
  const far = puffs.reduce((m, [px, py, pr]) => Math.max(m, Math.hypot(px, py) + pr * 1.5 + k), 0);
  const g = new THREE.SphereGeometry(1, 64, 40);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const pos = g.attributes.position,
    d = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    let lo = 0,
      hi = far;
    for (let n = 0; n < 28; n++) {
      const t = (lo + hi) / 2;
      field(d.x * t, d.y * t, d.z * t) < 0 ? (lo = t) : (hi = t);
    }
    d.multiplyScalar(lo);
    pos.setXYZ(i, d.x, d.y, d.z);
  }
  const welded = mergeVertices(g); // one skin across the sphere's seam, so it shades smooth
  welded.computeVertexNormals();
  return welded;
}

// One cloud hung at (x, z), the bottom of its middle puff `y` up. `rnd` draws
// its shape (Math.random, or seeded). Returns the group and an `animate(now,
// dt)` for the breeze (now in milliseconds, as the game's loop gives it).
export function buildHangingCloud(scene, { toonMat, inked }, x, z, { y = 4, r: radius = null, rnd = Math.random, H = HANGING_CLOUD } = {}) {
  const puffMat = toonMat(COLOR_PALETTE.hangingCloud),
    cordMat = toonMat(COLOR_PALETTE.cloudCord);
  const r = radius ?? between(H.r, rnd);
  const cloud = new THREE.Group();
  cloud.position.set(x, y + r * 0.85, z);
  const puffs = [[0, 0, r]];
  [-1, 1].forEach((side) => {
    const pr = r * (0.62 + rnd() * 0.15);
    puffs.push([side * (r + pr) * 0.75, -(r - pr) * 0.55, pr]);
  });
  if (rnd() < 0.5) puffs.push([(rnd() - 0.5) * r * 0.6, r * 0.55, r * 0.6]);
  if (H.blend > 0) {
    const puff = inked(new THREE.Mesh(meltedGeometry(puffs, r * H.blend), puffMat));
    puff.castShadow = false;
    cloud.add(puff);
  } else
    puffs.forEach(([px, py, pr]) => {
      const puff = inked(new THREE.Mesh(puffGeo, puffMat));
      puff.scale.set(pr, pr * 0.85, pr);
      puff.position.set(px, py, 0);
      puff.castShadow = false;
      cloud.add(puff);
    });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, H.cord, 6), cordMat);
  cord.position.y = r * 0.8 + H.cord / 2;
  cloud.add(cord);
  scene.add(cloud);
  const rest = cloud.position.y,
    phase = rnd() * Math.PI * 2;
  function animate(now) {
    const tm = now / 1000,
      w = H.wind;
    cloud.position.y = rest + H.bob * w * Math.sin(tm * 1.1 + phase);
    cloud.rotation.z = H.sway * w * Math.sin(tm * 0.8 + phase * 1.7);
    cloud.rotation.y = H.twist * w * Math.sin(tm * 0.45 + phase * 0.6);
  }
  return { cloud, animate };
}
