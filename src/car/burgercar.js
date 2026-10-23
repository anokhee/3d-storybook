/* ============================================================
   BURGER CAR: the roadster (car.js) remade as a hamburger. The body is
   the burger, oval in plan so it runs long like a car, stacked up from
   the ground: a BOTTOM BUN, a slab with rounded edges; a PATTY a little
   wider, its edge lumpy; a square CHEESE slice turned corner-first,
   its corners drooping over the patty; a ruffle of LETTUCE peeking out
   all round; a few TOMATO slices poking out of the stack; and the TOP
   BUN, a dome with sesame seeds. The COCKPIT is the cut-out cars'
   (tray.js), cut down through the top bun to the cheese like a cookie
   cutter, the bun's top levelled round it so its rim is four straight,
   level lines; in it the roadster's two bucket seats, dashboard and
   steering wheel, and an arched windshield standing upright on its
   front edge. Headlights on the bottom bun's front, tail lights on its
   back, and four wheels with hubcaps standing out either side of it, on
   axles under it. Faces +X; its origin on the ground under the axles.
   Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `bun` both buns, `patty`, `cheese`, `lettuce`, `tomato` the fillings
// (the last three each on a switch too), `seeds` whether the top bun is
// sesame (in `seed` colour), `trim` the seats, hubcaps and windshield
// frame, `dash` the cockpit's floor, walls and lip, the dashboard, the
// steering wheel and the axles.
export const BURGERCAR = {
  scale: 1.6, // built about 2.9 long; the game scales it up to fit a driver
  bun: 0xe0a35a,
  patty: 0x6b3f26,
  cheese: 0xf5b82e,
  hasCheese: true,
  lettuce: 0x6dbb3c,
  hasLettuce: true,
  tomato: 0xd8382c,
  hasTomato: true,
  seeds: true,
  seed: 0xfff3dc,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The burger, in the car's own units (before `scale`). Every layer is
// turned on a lathe round the vertical and stretched to an oval, `RX`
// along the car and `RZ` across, so `rho` 1 is the buns' edge. The
// layers' heights: the bottom bun from UNDER, just clear of the axles,
// the fillings on it, the top bun's dome rising DOME from its base. The
// WELL is the cockpit, its floor FLOOR at the cheese and its rim TOP in
// the top bun.
const RX = 1.4, RZ = 1.05;
const UNDER = 0.34, BOTTOM = 0.28, PATTY = [0.6, 0.84], CHEESE = 0.85, LETTUCE = 0.87, TOMATO = [0.88, 0.93];
const BASE = 0.93, DOME = 0.68;
const WELL = { x0: -0.7, x1: -0.7 + COCKPIT.len, z1: COCKPIT.half }, TOP = 1.48, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP);

const Y = new THREE.Vector3(0, 1, 0);
// how far out (x, z) is in the oval, 1 at the buns' edge
const rho = (x, z) => Math.hypot(x / RX, z / RZ);
// A layer turned on a lathe from a profile (points [r, y], r 1 the
// buns' edge) and stretched to the oval.
const turned = (profile, segs = 96) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segs).scale(RX, 1, RZ);
// A slab's profile: flat bottom at `y0`, flat top at `y1`, out to `r`,
// its edges rounded `e`.
function slab(r, y0, y1, e) {
  const pts = [[0, y0]];
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / 6);
    pts.push([r - e + e * Math.cos(a), y0 + e + e * Math.sin(a)]);
  }
  for (let i = 0; i <= 6; i++) {
    const a = (Math.PI / 2) * (i / 6);
    pts.push([r - e + e * Math.cos(a), y1 - e + e * Math.sin(a)]);
  }
  pts.push([0, y1]);
  return pts;
}
// The top bun's height over (x, z): its dome, levelled round the well.
const domeAt = (x, z) => BASE + DOME * Math.sqrt(Math.max(0, 1 - rho(x, z) ** 2));
const bunAt = (x, z) => LEVEL.height(domeAt(x, z), x, z);
function bunNormal(x, z) {
  const e = 1e-3;
  return new THREE.Vector3(-(bunAt(x + e, z) - bunAt(x - e, z)) / (2 * e), 1, -(bunAt(x, z + e) - bunAt(x, z - e)) / (2 * e)).normalize();
}

export function buildBurgerCar(finish, C = BURGERCAR) {
  const group = new THREE.Group(),
    wheels = [];
  const add = (geo, color, x, y, z, extra, parent = group) => {
    const mesh = new THREE.Mesh(geo, finish(color, extra));
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (w, h, d, color, x, y, z, extra, parent) => add(new THREE.BoxGeometry(w, h, d), color, x, y, z, extra, parent);
  const both = { side: THREE.DoubleSide };
  // a layer with the cockpit cut through it, two-sided so the well looks in at it
  const piece = (geo, color) => add(cutThrough(geo, WELL, FLOOR, LEVEL), color, 0, 0, 0, both);

  // the bottom bun, and the patty on it, a little wider, its edge pushed
  // in and out round the oval so it is lumpy
  add(turned(slab(1, UNDER, UNDER + BOTTOM, 0.1)), C.bun, 0, 0, 0);
  const patty = turned(slab(1.04, PATTY[0], PATTY[1], 0.08));
  const pp = patty.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), z = pp.getZ(i), t = Math.atan2(z / RZ, x / RX), k = 1 + 0.025 * Math.sin(7 * t) + 0.015 * Math.sin(13 * t + 1);
    pp.setX(i, x * k);
    pp.setZ(i, z * k);
  }
  add(patty, C.patty, 0, 0, 0);

  // the cheese: a square slice turned corner-first, its corners, out
  // past the patty, drooping down over it
  if (C.hasCheese) {
    const cheese = new THREE.PlaneGeometry(2.05, 2.05, 32, 32).rotateX(-Math.PI / 2).rotateY(Math.PI / 4).scale(RX / 1.2, 1, RZ / 1.2);
    const cp = cheese.attributes.position;
    for (let i = 0; i < cp.count; i++) cp.setY(i, CHEESE - 0.7 * Math.max(0, rho(cp.getX(i), cp.getZ(i)) - 0.98));
    cheese.computeVertexNormals();
    add(cheese, C.cheese, 0, 0, 0, both);
  }

  // the lettuce: a ruffled ring peeking out from under the top bun, its
  // outer edge wavy, rippling up and down, and drooping as it goes out
  if (C.hasLettuce) {
    const AROUND = 160, ACROSS = 4, pos = [], idx = [];
    for (let i = 0; i <= AROUND; i++) {
      const t = (Math.PI * 2 * i) / AROUND, outer = 1.12 + 0.05 * Math.sin(9 * t);
      for (let j = 0; j <= ACROSS; j++) {
        const s = j / ACROSS, r = 0.88 + (outer - 0.88) * s;
        pos.push(RX * r * Math.cos(t), LETTUCE + s * 0.03 * Math.sin(11 * t) - 0.35 * Math.max(0, r - 1) ** 1.5, RZ * r * Math.sin(t));
        if (i < AROUND && j < ACROSS) {
          const a = i * (ACROSS + 1) + j, b = a + ACROSS + 1;
          idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    const lettuce = new THREE.BufferGeometry();
    lettuce.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    lettuce.setIndex(idx);
    lettuce.computeVertexNormals();
    add(lettuce, C.lettuce, 0, 0, 0, both);
  }

  // the tomato: slices poking out of the stack, ahead of and behind the
  // cockpit
  if (C.hasTomato)
    for (const deg of [30, 150, 210, 330]) {
      const t = (deg * Math.PI) / 180, x = RX * 0.82 * Math.cos(t), z = RZ * 0.82 * Math.sin(t);
      piece(new THREE.CylinderGeometry(0.32, 0.32, TOMATO[1] - TOMATO[0], 24).translate(x, (TOMATO[0] + TOMATO[1]) / 2, z), C.tomato);
    }

  // the top bun: a dome on a rounded underside tucked in a little, its
  // top levelled round the cockpit and the cockpit cut through it
  const bunProfile = [[0, BASE - 0.06]];
  for (let i = 0; i <= 32; i++) {
    const a = -0.5 + ((Math.PI / 2 + 0.5) * i) / 32;
    bunProfile.push([a < 0 ? 0.92 + 0.08 * Math.cos(a * Math.PI) : Math.cos(a), a < 0 ? BASE + 0.06 * Math.sin(a * 2) : BASE + DOME * Math.sin(a)]);
  }
  piece(turned(bunProfile, 160), C.bun);

  // the sesame seeds: little flattened ovals on the top bun, scattered
  // (the same way each time), clear of the cockpit
  if (C.seeds) {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const seedGeo = new THREE.SphereGeometry(0.035, 8, 6).scale(1.7, 0.6, 1);
    const seeds = [];
    for (let placed = 0, tries = 0; placed < 40 && tries < 400; tries++) {
      const r = 0.85 * Math.sqrt(rand()), t = Math.PI * 2 * rand(), x = RX * r * Math.cos(t), z = RZ * r * Math.sin(t);
      if (x > WELL.x0 - 0.15 && x < WELL.x1 + 0.15 && Math.abs(z) < WELL.z1 + 0.15) continue;
      const n = bunNormal(x, z), q = new THREE.Quaternion().setFromUnitVectors(Y, n).multiply(new THREE.Quaternion().setFromAxisAngle(Y, Math.PI * 2 * rand()));
      seeds.push(seedGeo.clone().applyQuaternion(q).translate(x, bunAt(x, z), z));
      placed++;
    }
    add(mergeGeometries(seeds), C.seed, 0, 0, 0);
  }

  // the cockpit, cut down through the top bun (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // headlights on the bottom bun's front, tail lights on its back, each
  // turned to face out of the oval where it sits
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 14).translate(0, 0.04, 0);
  const tailGeo = new THREE.BoxGeometry(0.16, 0.04, 0.08).translate(0, 0.02, 0);
  const onEdge = (t, geo, color, glow) => {
    const mesh = add(geo, color, RX * Math.cos(t) - 0.02 * Math.cos(t), UNDER + BOTTOM / 2, RZ * Math.sin(t), { emissive: color, emissiveIntensity: glow });
    mesh.quaternion.setFromUnitVectors(Y, new THREE.Vector3(Math.cos(t) / RX, 0, Math.sin(t) / RZ).normalize());
  };
  for (const s of [-1, 1]) {
    onEdge(s * 0.35, lampGeo, C.lamp, 0.6);
    onEdge(Math.PI + s * 0.35, tailGeo, C.tail, 0.5);
  }

  // four wheels, each with a hubcap, standing out either side of the
  // bottom bun, turning on axles along z under it
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 10).rotateX(Math.PI / 2);
  for (const x of [-0.9, 0.9]) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
    for (const z of [-1.0, 1.0]) {
      const w = add(wheelGeo, C.wheel, x, C.wheelR, z);
      add(capGeo, C.trim, 0, 0, 0, undefined, w);
      wheels.push(w);
    }
  }
  group.scale.setScalar(C.scale);
  const roll = (dt, speed) => {
    for (const w of wheels) w.rotation.z -= (speed * dt) / C.wheelR;
  };
  return { group, wheels, roll, seat };
}
