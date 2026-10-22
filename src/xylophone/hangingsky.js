// A hanging moon, a hanging sun and hanging raindrops, to go with the hanging clouds and stars: each a
// puffy shape (extruded and rounded off, as the stars are) on a cord that runs up out of sight, bobbing and
// turning in the breeze the same way. The raindrops come as a strand of teardrops on one cord. New with the
// refactored page; in the storybook as Ornaments/Hanging Moon, Hanging Sun and Hanging Raindrops. Colors from
// the xylophone's keys.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

export const HANGING_SKY = {
  moon: { r: 1.2, color: "#F0E279", cut: 0.5 }, // `cut` how far the bite is taken from the middle (thinner higher)
  sun: { r: 1, rays: 8, ray: 0.55, color: "#FFC165", rayColor: "#FFDF64" }, // `ray` each ray's length (part of r)
  rain: { r: 0.28, drops: 3, gap: 1.6, shrink: 0.85, colors: ["#4DC9EF", "#5FB8B1"] }, // `gap` between drops (part of r)
  depth: 0.3, // how thick each shape is, as a part of its size, before its rounded edge
  cord: 60, // how long the cord is: up out of sight
  // the breeze, as the stars have it
  bob: 0.14,
  sway: 0.06,
  twist: 0.35,
  wind: 1,
};

// a flat shape made puffy: extruded with a deep rounded bevel, centered
const puffy = (shape, size, H) =>
  new THREE.ExtrudeGeometry(shape, {
    depth: size * H.depth,
    bevelEnabled: true,
    bevelSize: size * 0.1,
    bevelThickness: size * 0.12,
    bevelSegments: 4,
    curveSegments: 32,
  }).center();

// Hangs `thing` (built with its top at y = 0) at (x, z), its top `y` up, on a cord from its top up out of
// sight, and gives it the breeze. Returns the group and its `animate(now)` (now in milliseconds).
function hang(scene, tools, thing, x, z, y, rnd, H) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.add(thing);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, H.cord, 6), tools.toonMat(COLOR_PALETTE.cloudCord));
  cord.position.y = H.cord / 2;
  group.add(cord);
  scene.add(group);
  const phase = rnd() * Math.PI * 2;
  function animate(now) {
    const tm = now / 1000,
      w = H.wind;
    group.position.y = y + H.bob * w * Math.sin(tm * 1.2 + phase);
    group.rotation.z = H.sway * w * Math.sin(tm * 0.85 + phase * 1.7);
    group.rotation.y = H.twist * w * Math.sin(tm * 0.5 + phase * 0.6);
  }
  return { group, animate };
}

// The moon: a crescent, the bite taken out of a disc by a smaller disc off to its right, so it is fat on the
// left and thins to points top and bottom; tipped a little, as a moon in a picture book is.
export function buildHangingMoon(scene, tools, x, z, { y = 9, rnd = Math.random, H = HANGING_SKY } = {}) {
  const M = H.moon,
    R = M.r,
    c = R * M.cut,
    ri = R * 0.82,
    // where the two circles cross
    ix = (R * R - ri * ri + c * c) / (2 * c),
    iy = Math.sqrt(Math.max(0, R * R - ix * ix)),
    s = new THREE.Shape();
  const from = Math.atan2(iy, ix),
    back = Math.atan2(iy, ix - c);
  s.absarc(0, 0, R, from, Math.PI * 2 - from, false); // round the outside, by the left
  s.absarc(c, 0, ri, -back, back - Math.PI * 2, true); // and back up the bite
  const moon = tools.inked(new THREE.Mesh(puffy(s, R, H), tools.toonMat(M.color)));
  moon.rotation.z = -0.35;
  const box = new THREE.Box3().setFromObject(moon);
  moon.position.y = -box.max.y; // its top at the cord
  return hang(scene, tools, moon, x, z, y, rnd, H);
}

// The sun: a puffy disc with a ring of rounded rays round it, the rays a paler yellow.
export function buildHangingSun(scene, tools, x, z, { y = 9, rnd = Math.random, H = HANGING_SKY } = {}) {
  const S = H.sun,
    sun = new THREE.Group(),
    disc = new THREE.Shape();
  disc.absarc(0, 0, S.r, 0, Math.PI * 2, false);
  sun.add(tools.inked(new THREE.Mesh(puffy(disc, S.r, H), tools.toonMat(S.color))));
  const ray = new THREE.Shape(),
    w = S.r * 0.28,
    len = S.r * S.ray;
  ray.moveTo(-w, 0);
  ray.lineTo(0, len);
  ray.lineTo(w, 0);
  ray.closePath();
  const rayGeo = puffy(ray, S.r * 0.6, H),
    rayMat = tools.toonMat(S.rayColor);
  for (let i = 0; i < S.rays; i++) {
    const a = (i / S.rays) * Math.PI * 2,
      m = tools.inked(new THREE.Mesh(rayGeo, rayMat)),
      out = S.r * 1.12 + len * 0.45;
    m.position.set(Math.sin(a) * out, Math.cos(a) * out, 0);
    m.rotation.z = -a;
    sun.add(m);
  }
  const box = new THREE.Box3().setFromObject(sun);
  sun.position.y = -box.max.y; // its top ray at the cord
  return hang(scene, tools, sun, x, z, y, rnd, H);
}

// The raindrops: a strand of teardrops, point up, one under another on the one cord, each a little smaller
// than the one above, alternating between the two blues.
export function buildHangingRain(scene, tools, x, z, { y = 5, rnd = Math.random, H = HANGING_SKY } = {}) {
  const D = H.rain,
    strand = new THREE.Group(),
    pts = [];
  // the teardrop's outline, from its point at the top round to the bottom of its belly
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI;
    pts.push(new THREE.Vector2(Math.sin(t) * Math.pow(Math.sin(t / 2), 1.6), -(1 - Math.cos(t)) * 0.75));
  }
  const dropGeo = new THREE.LatheGeometry(pts.reverse(), 20); // bottom to top, so its faces point out
  let top = 0;
  for (let k = 0; k < D.drops; k++) {
    const r = D.r * Math.pow(D.shrink, k),
      drop = tools.inked(new THREE.Mesh(dropGeo, tools.toonMat(D.colors[k % D.colors.length])));
    drop.scale.setScalar(r * 2);
    drop.position.y = top;
    strand.add(drop);
    top -= r * 3 + D.r * D.gap; // under this drop's belly (it is 1.5 of its scale tall), and a gap
  }
  // the cord runs on down through the drops, so they read as strung
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, -top, 6), tools.toonMat(COLOR_PALETTE.cloudCord));
  thread.position.y = top / 2;
  strand.add(thread);
  return hang(scene, tools, strand, x, z, y, rnd, H);
}
