/* ============================================================
   BROCCOLI CAR: the roadster (car.js) remade as a head of broccoli
   lying on its side, head first. The body is the crown: a rounded core
   packed all over with small knobbly florets, so close that none of the
   core shows, lighter on top and darker down its flanks, the way a head
   of broccoli shades. Under it the thick pale STALK lies along the car,
   its cut end sticking out at the back like a tail pipe and its front
   end nosing out under the crown as a bumper, with short branch stems
   forking up out of it into the crown on either side; the wheels hang
   from the stalk. The COCKPIT is the cut-out cars' (tray.js), cut into
   the top of the crown in its middle like a cookie cutter, the core
   eased level round it so its rim is four straight, level lines, its
   floor, walls and lip in a darker colour; in it the roadster's two
   bucket seats, dashboard and steering wheel, and an arched windshield
   raked back from its front edge. The florets are laid round the core
   in an even spiral (the same way each time), nudged a little so they
   do not line up, and never over the well, the lamps or the wheels.
   Headlights on the stalk's front end, tail lights on its cut end,
   four wheels with hubcaps on two axles under the stalk. Faces +X; its
   origin on the ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in
   its own (the game's toon, or the stage's). `roll(dt, speed)` turns
   the wheels as the game does for a car going `speed` world units a
   second.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `floret` the crown's green (the florets on top are `tip`, lighter,
// and down its flanks `dark`), `core` the body under them, `stalk` the
// pale stalk and `cut` its cut end, `florets` how many (0 for a bare
// core), `trim` the seats and hubcaps, `well` the cockpit's floor,
// walls and lip.
export const BROCCOLICAR = {
  scale: 1.6, // built about 3.4 long; the game scales it up to fit a driver
  floret: 0x4a9440,
  dark: 0x2e6a2f,
  tip: 0x86c455,
  core: 0x2e6a2f,
  stalk: 0xc3dc8e,
  cut: 0xe6f0c6,
  florets: 330,
  trim: 0xf3e3b4,
  well: 0x2f4a2c,
  dash: 0x2f3a2c, // the dashboard and the steering wheel
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The core, an ellipsoid centred (0, CY): half-lengths A along x, B up
// (its underside squashed to SQUASH of that, so it sits down on the
// stalk) and CZ across. The WELL is the cockpit, its rim at TOP and its floor
// FLOOR; the core is eased to the rim round it. The STALK runs along
// x at height SY, SR thick (SZ times wider than tall), from its cut
// end at SX0 to its nose at SX1.
const A = 1.35, B = 0.66, CY = 0.88, CZ = 0.98, SQUASH = 0.6;
const WELL = { x0: -0.65, x1: -0.65 + COCKPIT.len, z1: COCKPIT.half }, TOP = 1.25, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP, { cap: false });
const SY = 0.48, SR = 0.34, SZ = 1.3, SX0 = -1.95, SX1 = 1.3;
const AXLES = [-1.0, 0.9];
// whether (x, z) in plan is more than `grow` outside the well's footprint
const clear = (x, z, grow) => x < WELL.x0 - grow || x > WELL.x1 + grow || Math.abs(z) > WELL.z1 + grow;
const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);

export function buildBroccoliCar(finish, C = BROCCOLICAR) {
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

  // the core: a smooth ellipsoid, the well cut through it
  const coreGeo = new THREE.SphereGeometry(1, 72, 48).scale(A, B, CZ);
  const cp = coreGeo.attributes.position;
  for (let i = 0; i < cp.count; i++) if (cp.getY(i) < 0) cp.setY(i, cp.getY(i) * SQUASH);
  coreGeo.computeVertexNormals();
  coreGeo.translate(0, CY, 0);
  add(cutThrough(coreGeo, WELL, FLOOR, LEVEL), C.core, 0, 0, 0, { side: THREE.DoubleSide });

  // a point on the core's skin in direction (dx, dy, dz) from its centre,
  // and the skin's normal there
  const skin = (dx, dy, dz) => {
    const Bv = dy < 0 ? B * SQUASH : B, k = 1 / Math.hypot(dx / A, dy / Bv, dz / CZ);
    const p = new THREE.Vector3(dx * k, CY + dy * k, dz * k);
    const n = new THREE.Vector3(dx / (A * A), dy / (Bv * Bv), dz / (CZ * CZ)).normalize();
    return { p, n };
  };

  // the crown: florets laid round the core's top and flanks (not the
  // underside, where the stalk is) along an even spiral, each nudged a
  // little, so they pack close without lining up; each a rounded lump
  // with a few smaller knobs on its outer face; lighter the higher it
  // sits; clear of the well and the wheels; merged per colour
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lumps = { floret: [], dark: [], tip: [] };
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler();
  const lump = (list, geo, x, y, z, sx, sy, sz) => {
    e4.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
    m4.compose(new THREE.Vector3(x, y, z), q4.setFromEuler(e4), new THREE.Vector3(sx, sy, sz));
    list.push(geo.clone().applyMatrix4(m4));
  };
  const ball = new THREE.SphereGeometry(1, 9, 6);
  const count = Math.max(0, Math.round(C.florets)), golden = Math.PI * (3 - Math.sqrt(5));
  const placed = [];
  for (let i = 0; i < count; i++) {
    // the spiral over the upper part of the unit sphere (v is height,
    // from a little under the equator to the top), then stretched to
    // the core
    const v = -0.62 + 1.62 * ((i + 0.5) / count) + 0.03 * (rand() - 0.5), u = i * golden + 0.4 * (rand() - 0.5);
    const rr = Math.sqrt(Math.max(0, 1 - v * v)), dx = Math.cos(u) * rr * A, dy = v * (v < 0 ? B * SQUASH : B), dz = Math.sin(u) * rr * CZ;
    const r = 0.14 + 0.06 * rand();
    const { p, n } = skin(dx, dy, dz);
    p.addScaledVector(n, r * 0.3);
    if (p.y < 0.5) continue; // down to the stalk, no further
    if (p.y - r < 0.72 && Math.abs(p.z) > 0.6 && AXLES.some((ax) => Math.abs(p.x - ax) < 0.5)) continue; // clear of the wheels
    if (!clear(p.x, p.z, 0.12 + r) && p.y + r > FLOOR) continue; // never over the well
    if (placed.some((o) => o.distanceTo(p) < 0.55 * (r + o.r))) continue; // not on top of each other
    p.r = r;
    placed.push(p);
    const h = (p.y - 0.55) / (CY + B + 0.1 - 0.55); // 0 at the bottom of the crown, 1 at its top
    const list = h > 0.72 + 0.2 * rand() ? lumps.tip : h < 0.35 + 0.2 * rand() ? lumps.dark : lumps.floret;
    lump(list, ball, p.x, p.y, p.z, r * (0.95 + 0.15 * rand()), r * (0.85 + 0.15 * rand()), r * (0.95 + 0.15 * rand()));
    // the knobs on its outer face (the half facing out along the
    // skin's normal), in its own colour
    const t1 = new THREE.Vector3().crossVectors(n, Math.abs(n.y) > 0.9 ? X : Y).normalize(), t2 = new THREE.Vector3().crossVectors(n, t1);
    for (let k = 0; k < 3; k++) {
      const a = rand() * 6.28, b = 0.35 + 0.6 * rand(), c = Math.sqrt(1 - b * b);
      const q = p.clone().addScaledVector(n, b * r * 0.75).addScaledVector(t1, Math.cos(a) * c * r * 0.75).addScaledVector(t2, Math.sin(a) * c * r * 0.75);
      if (clear(q.x, q.z, 0.1) || q.y < FLOOR) lump(list, ball, q.x, q.y, q.z, r * 0.42, r * 0.38, r * 0.42);
    }
  }
  for (const k of ["floret", "dark", "tip"]) {
    if (!lumps[k].length) continue;
    const merged = mergeGeometries(lumps[k].map((g) => (g.index ? g.toNonIndexed() : g)));
    add(merged, C[k], 0, 0, 0);
  }

  // the stalk: a thick pale trunk lying along the car under the crown,
  // a little wider than tall, its cut end a lighter disc out at the
  // back and its nose out under the crown's front; and from it, on
  // either side, short branch stems forking up into the crown
  const trunk = new THREE.CylinderGeometry(SR, SR * 0.92, SX1 - SX0, 24).rotateZ(-Math.PI / 2).scale(1, 1, SZ);
  add(trunk, C.stalk, (SX0 + SX1) / 2, SY, 0);
  add(new THREE.SphereGeometry(SR, 24, 12).scale(0.5, 1, SZ), C.stalk, SX1, SY, 0); // the nose, rounded
  const cutDisc = new THREE.CylinderGeometry(SR * 0.9, SR * 0.9, 0.03, 24).rotateZ(Math.PI / 2).scale(1, 1, SZ);
  add(cutDisc, C.cut, SX0 - 0.005, SY, 0);
  for (const [x, lean] of [[-0.95, 0.45], [-0.2, 0], [0.55, -0.4]]) {
    for (const s of [-1, 1]) {
      const stem = new THREE.CylinderGeometry(0.09, 0.15, 0.6, 12).translate(0, 0.25, 0);
      const m = add(stem, C.stalk, x, SY + 0.05, s * 0.25);
      m.rotation.set(s * 0.6, 0, lean); // out to its side, and leaning along the car
    }
  }

  // headlights on the stalk's nose, tail lights on its cut end (lit for
  // the night), each in a thin dark rim
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.07, 14).translate(0, 0.035, 0).rotateZ(-Math.PI / 2);
  const rimGeo = new THREE.TorusGeometry(0.1, 0.018, 8, 20).rotateY(Math.PI / 2);
  const tailGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 12).translate(0, 0.025, 0).rotateZ(Math.PI / 2);
  for (const s of [-1, 1]) {
    add(lampGeo, C.lamp, SX1 + 0.1, SY + 0.08, s * 0.24, { emissive: C.lamp, emissiveIntensity: 0.6 });
    add(rimGeo, C.wheel, SX1 + 0.15, SY + 0.08, s * 0.24);
    add(tailGeo, C.tail, SX0 - 0.015, SY, s * 0.22, { emissive: C.tail, emissiveIntensity: 0.5 });
  }

  // the cockpit, cut into the core (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP, C.well);

  // four wheels, each with a hubcap, turning on an axle along z under
  // the stalk
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.7, 10).rotateX(Math.PI / 2);
  for (const x of AXLES) {
    add(axleGeo, C.wheel, x, C.wheelR, 0);
    for (const z of [-0.85, 0.85]) {
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
