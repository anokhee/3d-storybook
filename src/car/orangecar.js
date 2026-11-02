/* ============================================================
   ORANGE CAR: the roadster (car.js) remade as an orange, built the way
   the ball cars are (ballcar.js). The body is one round orange, a true
   sphere, its peel pocked all over with tiny pores; on top, behind the
   cockpit, the little brown button where it hung from the tree, with a
   leaf beside it. It is a ONE-SEATER: the COCKPIT is a narrow well cut
   into the top of the orange like a cookie cutter (tray.js), the skin
   eased up to its rim, so its rim is four straight, level lines, every
   triangle trimmed against the well's footprint, and a solid lip laid
   round the cut; in it a floor and four walls, one bucket seat in the
   middle, a dashboard and steering wheel before it, and a framed
   windshield raked back. Low on the nose are the headlights and low on
   the tail the tail lights. Under it, the roadster's four wheels with
   hubcaps on two axles hung from a dark chassis beam, tucked up under
   the belly so the orange sits low over them. Faces +X; its origin on
   the ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in
   its own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second;
   `seat` is where the driver sits, the top of the one cushion.
   ============================================================ */
import * as THREE from "three";
import { COCKPIT, RAKE, leveller, cutThrough, fitCockpit } from "./tray.js";

// `body` the orange, `stem` the button on top and the leaf's midrib,
// `leaf` the leaf, `trim` the seat and hubcaps, `dash` the cockpit's
// floor, walls and lip, the dashboard and steering wheel, the chassis
// and the axles, `lamp` the headlights, `tail` the tail lights.
export const ORANGECAR = {
  scale: 1.165, // built 2.6 across; scaled so a character fills the driver's seat at its walking height (CAT_HEIGHT, 1.31 — the seat was built for 1.8 at 1.6)
  body: 0xf7931e,
  stem: 0x7a5230,
  leaf: 0x4f9d3a,
  trim: 0xfff0d6,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The orange, in the car's own units (before `scale`): a sphere of
// radius R, its centre CY up, as the balls are; the one-seat cockpit
// (tray.js) cut into its top, as long as every car's but narrower, its
// floor FLOOR and its rim TOP, set a little over the skin at the well's
// corners, so the skin is eased up to the rim all round it and only the
// crown of the orange is levelled flat. The PORES: that many spread
// evenly over the peel (a Fibonacci spiral), each a shallow round dent
// PORE_R radians across and PORE_D deep. BUTTON is the direction of the
// stem's button on top, behind the cockpit, clear of the eased crown.
const R = 1.3, CY = 1.4;
const WELL = { x0: -COCKPIT.len / 2, x1: COCKPIT.len / 2, z1: 0.42 }, TOP = CY + 1.13, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP);
const AXLES = [-0.8, 0.8], TRACK = 0.74;
const PORES = 900, PORE_R = 0.045, PORE_D = 0.012;
const BUTTON = new THREE.Vector3(-0.72, 0.69, 0).normalize();
const Y = new THREE.Vector3(0, 1, 0);

// The skin's point and normal in the unit direction `u`: on the sphere,
// or on the top where it is eased round the well.
function skinAt(u) {
  let p = new THREE.Vector3(R * u.x, CY + R * u.y, R * u.z), n = u.clone();
  if (u.y > 0.05 && LEVEL.reshaped(p.y, p.x, p.z)) {
    n = LEVEL.normal(n, p.y, p.x, p.z);
    p = p.setY(LEVEL.height(p.y, p.x, p.z));
  }
  return { p, n };
}

// the pores' centres, spread evenly over the sphere
function poreCentres() {
  const out = [], phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < PORES; i++) {
    const y = 1 - (2 * (i + 0.5)) / PORES, r = Math.sqrt(1 - y * y), a = i * phi;
    out.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
  }
  return out;
}

// The orange: a sphere, its peel dented with the pores, with the well
// cut through it and the top eased round the well's rim (tray.js).
function bodyGeometry() {
  const g = new THREE.SphereGeometry(R, 160, 100).translate(0, CY, 0);
  const centres = poreCentres(), pos = g.attributes.position, nor = g.attributes.normal, u = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    u.fromBufferAttribute(nor, i);
    let best = null, bestAng = PORE_R;
    for (const c of centres) {
      const ang = Math.acos(Math.min(1, u.dot(c)));
      if (ang < bestAng) (best = c), (bestAng = ang);
    }
    if (!best) continue;
    // a round dent: deepest at its centre, out to nothing at its rim;
    // the skin's normal tilted toward the centre by its slope
    const f = bestAng / PORE_R, depth = PORE_D * (1 - f * f), slope = (2 * PORE_D * f) / (PORE_R * R);
    const toward = best.clone().addScaledVector(u, -u.dot(best)).normalize();
    p.fromBufferAttribute(pos, i).addScaledVector(u, -depth);
    pos.setXYZ(i, p.x, p.y, p.z);
    const n = u.clone().addScaledVector(toward, slope).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return cutThrough(g, WELL, FLOOR, LEVEL);
}

export function buildOrangeCar(finish, C = ORANGECAR) {
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
  // Something stood on the skin: `geo` built standing up from its base
  // at the origin, turned to the skin's normal in direction `u`.
  const stickOn = (u, geo, color, extra, sink = 0) => {
    const mesh = add(geo, color, 0, 0, 0, extra), { p, n } = skinAt(u);
    mesh.position.copy(p).addScaledVector(n, -sink);
    mesh.quaternion.setFromUnitVectors(Y, n);
    return mesh;
  };

  // the orange, two-sided so what little of the inside the well's walls
  // miss shows peel, not nothing
  add(bodyGeometry(), C.body, 0, 0, 0, { side: THREE.DoubleSide });

  // the cockpit, cut into the top (tray.js): one seat, in the middle
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP, C.dash, RAKE, 1);

  // the button on top where the stem was: a little brown disc with a
  // nub in its middle, and a leaf lying out from it: a pointed oval
  // with a midrib, swung out to the right and tipped up a touch
  const button = stickOn(BUTTON, new THREE.CylinderGeometry(0.1, 0.11, 0.04, 16).translate(0, 0.02, 0), C.stem, undefined, 0.01);
  add(new THREE.CylinderGeometry(0.03, 0.04, 0.06, 10).translate(0, 0.05, 0), C.stem, 0, 0, 0, undefined, button);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.26, 0.2, 0.62, 0);
  leafShape.quadraticCurveTo(0.26, -0.2, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.02, bevelEnabled: false }).translate(0, 0, -0.01);
  const leafHold = new THREE.Group();
  leafHold.position.copy(skinAt(BUTTON).p).add(new THREE.Vector3(0.04, 0.04, 0.06));
  leafHold.rotation.set(-1.2, 0.5, 0.35); // flat-ish on the peel, swung to +z, tipped up
  group.add(leafHold);
  add(leafGeo, C.leaf, 0, 0, 0, { side: THREE.DoubleSide }, leafHold);
  add(new THREE.BoxGeometry(0.5, 0.012, 0.03).translate(0.29, 0, 0), C.stem, 0, 0, 0.012, undefined, leafHold); // the midrib

  // headlights low on the nose, either side, and tail lights low on the
  // tail, a little wider apart, as the balls have them
  const EL = -0.42; // elevation below the equator
  const lampDir = (front, az, s) => new THREE.Vector3(front * Math.cos(EL) * Math.cos(az), Math.sin(EL), s * Math.cos(EL) * Math.sin(az)).normalize();
  const lampGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16).translate(0, 0.04, 0);
  const tailGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14).translate(0, 0.03, 0);
  for (const s of [-1, 1]) {
    stickOn(lampDir(1, 0.34, s), lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.03);
    stickOn(lampDir(-1, 0.5, s), tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);
  }

  // the chassis: a dark beam under the belly, the two axles across it,
  // and four wheels, each with a hubcap, turning on an axle along z
  box(2.0, 0.16, 0.3, C.dash, 0, C.wheelR + 0.06, 0);
  const axleGeo = new THREE.CylinderGeometry(0.045, 0.045, 2 * TRACK + 0.2, 10).rotateX(Math.PI / 2);
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  for (const x of AXLES) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
    for (const z of [-TRACK, TRACK]) {
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
