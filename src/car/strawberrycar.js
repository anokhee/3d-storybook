/* ============================================================
   STRAWBERRY CAR: the roadster (car.js) remade as a strawberry lying
   on its side, tip first. The body is one big berry: a rounded shoulder
   at the back where the calyx is, swelling to its widest a little
   ahead of that and drawn in to a rounded point at the FRONT, the tip
   dipping toward the road ahead of the front wheels; a little wider
   than tall. Its skin is dotted with pale seeds, laid round it in an
   even spiral over its top and flanks (the same way each time), each a
   tiny grain stood on the skin. At the back the CALYX: a ring of
   pointed green sepals lying back over the shoulder, each a ribbon
   hugging the skin and peeling a little away at its tip, the ones on
   top shorter so they stop clear of the cockpit, and a short stem out
   of the middle of them. The COCKPIT is the cut-out cars' (tray.js),
   cut into the top of the berry behind its middle like a cookie cutter,
   the skin eased level round it so its rim is four straight, level
   lines, its floor, walls and lip in a darker colour; in it the
   roadster's two bucket seats, dashboard and steering wheel, and an
   arched windshield raked back from its front edge. Headlights in dark
   rims on the nose's upper flanks, tail lights on the shoulder between
   the sepals, four wheels with hubcaps on two axles under the belly.
   Faces +X; its origin on the ground under the axles. Up is +Y.

   The skin is a function `at(u, angle)` (u 0 at the calyx, 1 at the
   tip; the angle 0 on top, going round through +z) so anything that
   has to sit on it (the seeds, the sepals, the lamps) is put there
   outright, the skin's normal found from the function's slopes.
   `finish(color, extra)` makes every material, so a page can hand in
   its own (the game's toon, or the stage's). `roll(dt, speed)` turns
   the wheels as the game does for a car going `speed` world units a
   second.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `berry` the fruit, `seed` the seeds and `seeds` how many, `leaf` the
// calyx and stem, `sepals` how many sepals, `trim` the seats and
// hubcaps, `well` the cockpit's floor, walls and lip.
export const STRAWBERRYCAR = {
  scale: 1.6, // built about 3.4 long; the game scales it up to fit a driver
  berry: 0xe23b4e,
  seed: 0xffd98a,
  seeds: 90,
  leaf: 0x5fa14a,
  sepals: 9,
  trim: 0xf3e3b4,
  well: 0x7a1620,
  dash: 0x3a3330, // the dashboard and the steering wheel
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The berry, in the car's own units (before `scale`): from X0 (the
// calyx) to X1 (the tip) along x; its spine at height SPINE, falling
// DROP toward the tip over the front half; R its half-height at the
// widest, RZ times that its half-width; the shoulder's dome DOME of
// the length. The WELL is the cockpit, its rim at TOP and its floor
// FLOOR; the skin is eased to the rim round it.
const X0 = -1.5, X1 = 1.9, LEN = X1 - X0, SPINE = 0.9, DROP = 0.25, R = 0.72, RZ = 1.35, DOME = 0.12;
const WELL = { x0: -1.05, x1: -1.05 + COCKPIT.len, z1: COCKPIT.half }, TOP = 1.25, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP, { cap: false });
const clear = (x, z, grow) => x < WELL.x0 - grow || x > WELL.x1 + grow || Math.abs(z) > WELL.z1 + grow;
const SEGS = 110, RINGS = 40; // along the berry, and around it
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// the skin's radius (half-height) at u along it: a rounded shoulder,
// full to a fifth of the way, then drawn in to a rounded point
const radius = (u) => {
  const dome = u < DOME ? Math.sqrt(Math.max(0, 1 - ((DOME - u) / DOME) ** 2)) : 1;
  const t = Math.max(0, (u - 0.2) / 0.8);
  return R * dome * Math.pow(Math.max(0, 1 - Math.pow(t, 1.6)), 0.7);
};
const spineY = (u) => SPINE - DROP * smooth((u - 0.5) / 0.5);
// the skin at u along and `a` round (0 on top, pi underneath)
const at = (u, a, out = new THREE.Vector3()) => {
  const r = radius(u);
  return out.set(X0 + u * LEN, spineY(u) + r * Math.cos(a), RZ * r * Math.sin(a));
};
// the skin's outward normal there, from its slopes
const normalAt = (u, a) => {
  const e = 2e-3, uu = Math.min(1 - e, Math.max(e, u));
  const du = at(uu + e, a).sub(at(uu - e, a)), da = at(uu, a + e).sub(at(uu, a - e));
  const n = da.cross(du);
  return n.lengthSq() < 1e-12 ? new THREE.Vector3(u > 0.5 ? 1 : -1, 0, 0) : n.normalize();
};
// a point a hair off the skin, eased with the skin where it is eased
// round the well
const off = (u, a, lift) => {
  const nrm = normalAt(u, a), q = at(u, a).addScaledVector(nrm, lift);
  if (nrm.y > 0.05) q.y = LEVEL.height(q.y, q.x, q.z) + lift * Math.max(0, 1 - nrm.y); // keep the lift where the easing flattens it
  return { q, nrm };
};
const Y = new THREE.Vector3(0, 1, 0);

export function buildStrawberryCar(finish, C = STRAWBERRYCAR) {
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

  // the body: the skin function sampled on a grid, closed at both ends
  // by the profile itself, the well cut through it
  const P = [], idx = [], p = new THREE.Vector3();
  for (let i = 0; i <= SEGS; i++) {
    for (let k = 0; k <= RINGS; k++) {
      at(i / SEGS, (2 * Math.PI * k) / RINGS, p);
      P.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < SEGS; i++) {
    for (let k = 0; k < RINGS; k++) {
      const a = i * (RINGS + 1) + k, b = a + RINGS + 1, c = a + 1, d = b + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  add(cutThrough(geo, WELL, FLOOR, LEVEL), C.berry, 0, 0, 0, { side: THREE.DoubleSide }); // two-sided, so the well looks in at it

  // the seeds: grains stood on the skin along an even spiral over the
  // top and flanks, from just ahead of the calyx to near the tip,
  // never over the well; merged into one piece
  const grain = new THREE.SphereGeometry(1, 8, 6).scale(0.032, 0.05, 0.024).translate(0, 0.01, 0);
  const seeds = [], m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  const n = Math.max(0, Math.round(C.seeds)), golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const u = 0.2 + (0.74 * (i + 0.5)) / n;
    let a = (i * golden) % (2 * Math.PI);
    if (a > Math.PI) a -= 2 * Math.PI;
    if (Math.abs(a) > 2.3) continue; // not underneath
    const { q, nrm } = off(u, a, 0);
    if (q.y > FLOOR && !clear(q.x, q.z, 0.1)) continue;
    m4.compose(q, q4.setFromUnitVectors(Y, nrm), one);
    seeds.push(grain.clone().applyMatrix4(m4));
  }
  if (seeds.length) add(mergeGeometries(seeds), C.seed, 0, 0, 0);

  // the calyx: sepals round the shoulder, each a ribbon along the skin
  // from the middle of the back out over the shoulder, tapering to a
  // point and lifting off the skin toward its tip; the ones on top
  // shorter, to stop short of the cockpit; and the stem out of the
  // middle, pointing back and a little up
  const sepals = Math.max(0, Math.round(C.sepals)), STEPS = 14;
  for (let s = 0; s < sepals; s++) {
    const a0 = (2 * Math.PI * s) / sepals + 0.2, reach = 0.21 * (1 - 0.5 * Math.max(0, Math.cos(a0)));
    const V = [], I = [];
    for (let j = 0; j <= STEPS; j++) {
      const t = j / STEPS, u = 0.012 + reach * t, hw = 0.26 * (1 - Math.pow(t, 1.6)) + 0.004;
      const da = hw / Math.max(0.12, radius(u) * RZ); // half the width, as an angle round the berry
      for (const w of [-1, 1]) {
        const { q } = off(u, a0 + w * da, 0.025 + 0.16 * t * t);
        V.push(q.x, q.y, q.z);
      }
    }
    for (let j = 0; j < STEPS; j++) {
      const a = 2 * j, b = a + 1, c = a + 2, d = a + 3;
      I.push(a, b, c, b, d, c);
    }
    const ribbon = new THREE.BufferGeometry();
    ribbon.setAttribute("position", new THREE.Float32BufferAttribute(V, 3));
    ribbon.setIndex(I);
    ribbon.computeVertexNormals();
    add(ribbon, C.leaf, 0, 0, 0, { side: THREE.DoubleSide });
  }
  const stemDir = new THREE.Vector3(-1, 0.3, 0).normalize();
  const stem = add(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 10).translate(0, 0.25, 0), C.leaf, X0 + 0.08, SPINE + 0.02, 0);
  stem.quaternion.setFromUnitVectors(Y, stemDir);

  // headlights on the nose's upper flanks and tail lights on the
  // shoulder, between the sepals, each stood on the skin along its
  // normal in a dark rim (lit for the night)
  const lampGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.07, 14).translate(0, 0.035, 0);
  const rimGeo = new THREE.TorusGeometry(0.095, 0.018, 8, 20).rotateX(Math.PI / 2).translate(0, 0.05, 0);
  const tailGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12).translate(0, 0.025, 0);
  const tailRim = new THREE.TorusGeometry(0.07, 0.015, 8, 20).rotateX(Math.PI / 2).translate(0, 0.035, 0);
  const stand = (u, a, g, color, extra, sink) => {
    const nrm = normalAt(u, a), m = add(g, color, 0, 0, 0, extra);
    m.position.copy(at(u, a)).addScaledVector(nrm, -sink);
    m.quaternion.setFromUnitVectors(Y, nrm);
  };
  for (const s of [-1, 1]) {
    stand(0.84, s * 0.95, lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.025);
    stand(0.84, s * 0.95, rimGeo, C.dash, undefined, 0.025);
    stand(0.1, s * 1.75, tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.015);
    stand(0.1, s * 1.75, tailRim, C.dash, undefined, 0.015);
  }

  // the cockpit, cut into the berry (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP, C.well);

  // four wheels, each with a hubcap, turning on an axle along z under
  // the belly
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 10).rotateX(Math.PI / 2);
  for (const x of [-0.95, 1.0]) {
    add(axleGeo, C.wheel, x, C.wheelR, 0);
    for (const z of [-0.9, 0.9]) {
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
