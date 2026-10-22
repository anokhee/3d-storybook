// A hanging star, to go with the hanging clouds (hangingclouds.js): a puffy five-point star, extruded and
// rounded off like the blob's star antennae, on a cord that runs up out of sight, bobbing and turning in the
// breeze the same way. Made for the refactored page; in the storybook as Ornaments/Hanging Star.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

export const HANGING_STAR = {
  r: [0.5, 0.8], // the star's outer radius, drawn between the two
  waist: 0.45, // how far in the notches between its points come, as a part of r
  depth: 0.18, // how thick it is, before its rounded edge (a part of r)
  cord: 60, // how long the cord is: up out of sight
  // the breeze: it bobs up and down, sways and turns on its cord, more than a cloud does since it is lighter
  bob: 0.14, // world units up and down
  sway: 0.06, // radians of tilt
  twist: 0.4, // radians of turn on the cord
  wind: 1, // how strong the breeze is
  color: "#FFDF64", // the keys' theme yellow
};

const between = ([lo, hi], rnd) => lo + rnd() * (hi - lo);

function starGeometry(r, H) {
  const s = new THREE.Shape();
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2,
      k = i % 2 ? r * H.waist : r;
    i ? s.lineTo(k * Math.cos(a), k * Math.sin(a)) : s.moveTo(k * Math.cos(a), k * Math.sin(a));
  }
  return new THREE.ExtrudeGeometry(s, {
    depth: r * H.depth,
    bevelEnabled: true,
    bevelSize: r * 0.12,
    bevelThickness: r * 0.14,
    bevelSegments: 4,
  }).center();
}

// One star hung at (x, z), its middle `y` up, facing +z. `rnd` draws its size and phase (Math.random, or
// seeded). Returns the group and an `animate(now, dt)` for the breeze (now in milliseconds, as the game's loop
// gives it).
export function buildHangingStar(scene, { toonMat, inked }, x, z, { y = 5, r: radius = null, rnd = Math.random, H = HANGING_STAR } = {}) {
  const r = radius ?? between(H.r, rnd),
    star = new THREE.Group();
  star.position.set(x, y, z);
  const body = inked(new THREE.Mesh(starGeometry(r, H), toonMat(H.color)));
  body.castShadow = false;
  star.add(body);
  // the cord, from the top point up
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, H.cord, 6), toonMat(COLOR_PALETTE.cloudCord));
  cord.position.y = r * 0.95 + H.cord / 2;
  star.add(cord);
  scene.add(star);
  const rest = y,
    phase = rnd() * Math.PI * 2;
  function animate(now) {
    const tm = now / 1000,
      w = H.wind;
    star.position.y = rest + H.bob * w * Math.sin(tm * 1.3 + phase);
    star.rotation.z = H.sway * w * Math.sin(tm * 0.9 + phase * 1.7);
    star.rotation.y = H.twist * w * Math.sin(tm * 0.5 + phase * 0.6);
  }
  return { star, animate };
}
