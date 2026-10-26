/* ============================================================
   SPIDER CAR: the roadster (car.js) remade as a spider. The body is the
   spider itself: a big round ABDOMEN dome over the rear, a cream marking
   of spots on its back, grown into a smaller HEAD dome (the
   cephalothorax) at the front, four eyes on its face — two big
   headlights and a smaller pair higher up behind them — and two fangs
   hooked down under it. Out of the abdomen's flanks come eight LEGS,
   four a side, each in two joints: a thigh up and out to a knee, a shin
   down to a tip just off the ground, banded orange at the knee and the
   shin; they sway as it drives. The COCKPIT is the cut-out cars' (tray.js), cut out of the
   abdomen's top, the abdomen levelled round it so its rim is four
   straight, level lines; in it the roadster's two bucket seats, a
   dashboard and steering wheel, and an arched windshield standing on
   its front edge. The wheels are tucked under the body between the
   legs. Faces +X; its origin on the ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second,
   and sways the legs.
   ============================================================ */
import * as THREE from "three";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `body` the abdomen, head and legs, `band` the stripes on the legs'
// joints, `spot` the markings on the abdomen's back, `eye` the fangs and
// the legs' claws, `fangTip` the fangs' points, `trim` the seats,
// hubcaps, `dash` the cockpit's walls, the steering
// wheel, the belly and the axles. `sway` how far the legs swing as it
// drives (0 holds them still).
export const SPIDERCAR = {
  scale: 1.6, // built about 3 long, its legs reaching 3.3 across; the game scales it up to fit a driver
  body: 0x2c2431,
  band: 0xe0732f,
  spot: 0xf0e2c8,
  eye: 0x1e1a1c,
  fangTip: 0xd94040,
  sway: 0.12,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The body, in the car's own units (before `scale`). Each dome is half
// an ellipsoid stood on the FLOOR: `x` where its middle is along the
// car, `rx`, `ry`, `rz` how far it reaches along, up and across. The
// head's rear runs into the abdomen's front. The WELL is the cockpit
// (tray.js) cut out of the abdomen's top, its floor the FLOOR, the
// abdomen levelled round it to its rim, TOP.
const FLOOR = 0.45, BELLY = 0.16;
const ABDOMEN = { x: -0.45, rx: 1.05, ry: 0.95, rz: 0.9 };
const HEAD = { x: 0.8, rx: 0.6, ry: 0.5, rz: 0.65 };
const WELL = { x0: -0.85, x1: -0.85 + COCKPIT.len, z1: COCKPIT.half }, TOP = FLOOR + COCKPIT.depth;
const LEVEL = leveller(WELL, TOP);

const Y = new THREE.Vector3(0, 1, 0);
const heightAt = (D, x, z) => FLOOR + D.ry * Math.sqrt(Math.max(0, 1 - ((x - D.x) / D.rx) ** 2 - (z / D.rz) ** 2));
const shellAt = (x, z) => LEVEL.height(heightAt(ABDOMEN, x, z), x, z);
const reshaped = (x, z) => LEVEL.reshaped(heightAt(ABDOMEN, x, z), x, z);
function shellNormal(x, z) {
  const e = 1e-3;
  return new THREE.Vector3(-(shellAt(x + e, z) - shellAt(x - e, z)) / (2 * e), 1, -(shellAt(x, z + e) - shellAt(x, z - e)) / (2 * e)).normalize();
}
// A point on a dome's surface, out from its middle in direction `d`,
// and the surface's normal there (the abdomen's as levelled).
function onDome(D, d) {
  const v = new THREE.Vector3(...d).normalize();
  const at = new THREE.Vector3(D.x + D.rx * v.x, FLOOR + D.ry * v.y, D.rz * v.z);
  if (D === ABDOMEN && reshaped(at.x, at.z)) return { at: at.setY(shellAt(at.x, at.z)), normal: shellNormal(at.x, at.z) };
  return { at, normal: new THREE.Vector3(v.x / D.rx, v.y / D.ry, v.z / D.rz).normalize() };
}
function domeGeo(D, well = false) {
  const geo = new THREE.SphereGeometry(1, well ? 192 : 96, well ? 96 : 48, 0, Math.PI * 2, 0, Math.PI / 2).scale(D.rx, D.ry, D.rz).translate(D.x, FLOOR, 0);
  return well ? cutThrough(geo, WELL, FLOOR, LEVEL) : geo;
}

export function buildSpiderCar(finish, C = SPIDERCAR) {
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
  const stickOn = (D, d, geo, color, extra, sink = 0) => {
    const { at, normal } = onDome(D, d);
    const mesh = add(geo, color, 0, 0, 0, extra);
    mesh.position.copy(at).addScaledVector(normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, normal);
    return mesh;
  };
  const both = { side: THREE.DoubleSide };

  // the abdomen, with the well cut out of its top, and the head grown
  // into its front; under each a belly plate the shape of its footprint
  add(domeGeo(ABDOMEN, true), C.body, 0, 0, 0, both);
  add(domeGeo(HEAD), C.body, 0, 0, 0);
  for (const D of [ABDOMEN, HEAD]) add(new THREE.CylinderGeometry(1, 1, BELLY, 48).scale(D.rx - 0.03, 1, D.rz - 0.03), C.dash, D.x, FLOOR - BELLY / 2, 0);

  // the cockpit, cut out of the abdomen (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // the marking: cream spots over the abdomen's rear behind the well, a
  // cross of them down the middle and a pair on each flank
  const spotGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16).translate(0, 0.015, 0);
  const smallGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.03, 12).translate(0, 0.015, 0);
  for (const [x, y, z, g] of [[-0.7, 0.75, 0, spotGeo], [-0.9, 0.45, 0, spotGeo], [-0.95, 0.2, 0, smallGeo], [-0.55, 0.6, 0.45, smallGeo], [-0.55, 0.6, -0.45, smallGeo], [-0.75, 0.4, 0.65, smallGeo], [-0.75, 0.4, -0.65, smallGeo], [0.05, 0.35, 0.95, smallGeo], [0.05, 0.35, -0.95, smallGeo]])
    stickOn(ABDOMEN, [x, y, z], g, C.spot, undefined, 0.02);

  // the face: four eyes on the head's front — two big headlights low
  // and wide, and a smaller pair of lamps behind them, a little higher
  // and further round the head's side — and
  // two fangs hooked down from under its chin
  const lampGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14).translate(0, 0.04, 0);
  const smallLampGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.07, 14).translate(0, 0.035, 0);
  for (const s of [-1, 1]) {
    stickOn(HEAD, [0.8, 0.45, s * 0.4], lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.03);
    stickOn(HEAD, [0.6, 0.6, s * 0.6], smallLampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.025);
  }
  for (const s of [-1, 1]) {
    const fang = new THREE.Group();
    fang.position.set(HEAD.x + HEAD.rx - 0.1, FLOOR + 0.12, s * 0.14);
    fang.rotation.z = Math.PI + 0.35; // hanging down, hooked a little forward
    group.add(fang);
    add(new THREE.ConeGeometry(0.05, 0.22, 10).translate(0, 0.11, 0), C.eye, 0, 0, 0, undefined, fang);
    add(new THREE.ConeGeometry(0.022, 0.1, 8).translate(0, 0.17, 0), C.fangTip, 0, 0, 0, undefined, fang);
  }

  // the legs: four a side out of the abdomen's flanks, low, between
  // and over the wheels, each hinged at its root so it can sway: a thigh up and out to a knee, a shin down to a
  // tip just off the ground, each a cylinder between the joints, a band
  // round the knee and down the shin, and a claw at the tip. `spread`
  // is the leg's angle in plan from straight out: forward for the front
  // pair, back for the rear.
  const legs = [];
  const THIGH = 0.68, UP = 1.1, SHIN = 1.3; // the thigh steep enough to clear the wheels, the shin long enough to reach the ground from the abdomen's flank
  const tube = (a, b, r, color, parent) => {
    const d = b.clone().sub(a), g = new THREE.CylinderGeometry(r, r, d.length(), 10).translate(0, d.length() / 2, 0);
    const m = add(g, color, a.x, a.y, a.z, undefined, parent);
    m.quaternion.setFromUnitVectors(Y, d.normalize());
    return m;
  };
  const LEGS = [[0.5, 0.75], [0.05, 0.3], [-0.4, -0.2], [-0.9, -0.65]]; // [x along the abdomen, spread]
  for (const s of [-1, 1])
    for (const [i, [x, spread]] of LEGS.entries()) {
      const hinge = new THREE.Group();
      // the root on the dome's own surface, not the levelled one round the
      // well: the front pair sits where the leveller lifts the flank to the
      // rim, and rooted up there the shin could not reach the ground
      const rv = new THREE.Vector3((x - ABDOMEN.x) / ABDOMEN.rx, 0.2, s * 0.95).normalize();
      const root = new THREE.Vector3(ABDOMEN.x + ABDOMEN.rx * rv.x, FLOOR + ABDOMEN.ry * rv.y, ABDOMEN.rz * rv.z);
      hinge.position.copy(root);
      group.add(hinge);
      // the leg laid out in the hinge's frame: out is +z toward side s
      const out = new THREE.Vector3(Math.sin(spread), 0, s * Math.cos(spread));
      const knee = out.clone().multiplyScalar(THIGH * Math.cos(UP)).setY(THIGH * Math.sin(UP));
      const reach = Math.sqrt(Math.max(0, SHIN * SHIN - (knee.y + root.y - 0.03) ** 2)); // never NaN: a NaN anywhere blanks the stage
      const tip = knee.clone().add(out.clone().multiplyScalar(reach)).setY(-root.y + 0.03);
      tube(new THREE.Vector3(), knee, 0.05, C.body, hinge);
      add(new THREE.SphereGeometry(0.06, 12, 10), C.band, knee.x, knee.y, knee.z, undefined, hinge);
      tube(knee, tip, 0.038, C.body, hinge);
      tube(knee.clone().lerp(tip, 0.38), knee.clone().lerp(tip, 0.52), 0.045, C.band, hinge);
      add(new THREE.SphereGeometry(0.035, 10, 8), C.eye, tip.x, tip.y, tip.z, undefined, hinge);
      legs.push([hinge, i]);
    }

  // tail lights on the abdomen's rear
  const tailGeo = new THREE.BoxGeometry(0.2, 0.04, 0.1).translate(0, 0.02, 0);
  for (const s of [-1, 1]) stickOn(ABDOMEN, [-0.95, 0.15, s * 0.4], tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);

  // four wheels, each with a hubcap, turning on an axle along z, the
  // axles across under the belly
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.7, 10).rotateX(Math.PI / 2);
  for (const x of [ABDOMEN.x - 0.5, ABDOMEN.x + 0.7]) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
    for (const z of [-0.82, 0.82]) {
      const w = add(wheelGeo, C.wheel, x, C.wheelR, z);
      add(capGeo, C.trim, 0, 0, 0, undefined, w);
      wheels.push(w);
    }
  }
  group.scale.setScalar(C.scale);
  // the wheels turn with the speed; the legs sway while it drives, each
  // pair out of step with the next, and settle as it stops
  let swayT = 0;
  const roll = (dt, speed) => {
    for (const w of wheels) w.rotation.z -= (speed * dt) / C.wheelR;
    swayT += dt * (4 + speed * 0.3);
    const amount = C.sway * Math.min(1, speed / 4);
    for (const [hinge, i] of legs) hinge.rotation.y = Math.sin(swayT + i * 1.6) * amount;
  };
  return { group, wheels, roll, seat };
}
