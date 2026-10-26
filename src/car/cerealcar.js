/* ============================================================
   CEREAL BOX CAR: the roadster (car.js) remade as a cereal box lying on
   its side, wider than tall, its bottom end at the front and its top
   end, the one with the flaps, at the back. The car's two long sides
   are the box's front and back: on the +z side the FRONT of the box, a
   brand banner along the top with a logo pill in it, a bowl heaped with
   round cereal rings in three pastels, and a starburst badge at the
   front corner; on the -z side the BACK of the box, the same banner, a
   white nutrition panel ruled with dark lines, a yellow puzzle panel
   with a grid, and a barcode. At the back the box's big flaps are
   folded shut (a seam down the middle of the end face) and its small
   top flap is popped open, standing up and back like a spoiler, with a
   few loose rings spilled on the deck behind the seats and one on the
   hood. A stripe of the band's colour runs along the hood and the deck.
   The COCKPIT is the cut-out cars' (tray.js), cut into the top of the
   box in its middle like a cookie cutter, the lid eased level round it
   so its rim is four straight, level lines, its floor, walls and lip in
   raw cardboard; in it the roadster's two bucket seats, dashboard and
   steering wheel, and an arched windshield raked back from its front
   edge. Headlights in dark rims on the front face, tail lights on the
   back, four wheels with hubcaps on two axles under the belly. Faces
   +X; its origin on the ground under the axles. Up is +Y.

   The print is thin plates, rings and cut-out shapes stuck a hair
   proud of the panels. `finish(color, extra)` makes every material, so
   a page can hand in its own (the game's toon, or the stage's).
   `roll(dt, speed)` turns the wheels as the game does for a car going
   `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `box` the box's colour, `band` the logo pill, the badge and the
// stripes, `banner` the band along the top of the sides, `ring` `ring2`
// `ring3` the printed rings, `cereal` the loose ones, `flap` the
// cardboard of the flaps, `label` the white panels, `trim` the seats
// and hubcaps, `well` the cockpit's floor, walls and lip.
export const CEREALCAR = {
  scale: 1.6, // built about 3 long; the game scales it up to fit a driver
  box: 0x3f8fd6,
  band: 0xffd23f,
  banner: 0xe63946,
  ring: 0xf7d046,
  ring2: 0xf7a8c8,
  ring3: 0x9fe0c4,
  cereal: 0xd9a24e,
  flap: 0xc9955c,
  label: 0xfafafa,
  trim: 0xf3e3b4,
  well: 0xb98a5a,
  dash: 0x3a3330, // the dashboard, the steering wheel and the print's ink
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The box, in the car's own units (before `scale`): `LEN` along x, `W`
// across, from `BOT` up to `TOP` (the cockpit's rim), its edges rounded
// `ROUND`. The WELL is the cockpit; its floor is FLOOR.
const LEN = 3, W = 1.8, BOT = 0.3, TOP = 1.25, ROUND = 0.06;
const WELL = { x0: -0.65, x1: -0.65 + COCKPIT.len, z1: COCKPIT.half }, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP, { cap: false, margin: 0.1 });
const T = 0.02; // how thick the print is

// a box of the given size with its edges rounded `r`, centred on the origin
function roundedBox(w, h, d, r) {
  const geo = new THREE.BoxGeometry(w, h, d, 48, 14, 28);
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  const p = new THREE.Vector3(), c = new THREE.Vector3(), o = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    c.set(Math.max(-hx, Math.min(hx, p.x)), Math.max(-hy, Math.min(hy, p.y)), Math.max(-hz, Math.min(hz, p.z)));
    o.copy(p).sub(c);
    if (o.lengthSq() > 1e-12) {
      o.normalize();
      p.copy(c).addScaledVector(o, r);
      nor.setXYZ(i, o.x, o.y, o.z);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
  }
  return geo;
}

// a flat shape (in x/y, facing z) `T` thick, centred on z = 0
const plate = (shape) => new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false }).translate(0, 0, -T / 2);
// a star of `points` points, `outer` to its tips and `inner` to its notches
function star(points, outer, inner) {
  const sh = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer, a = (Math.PI / points) * i + Math.PI / 2;
    i ? sh.lineTo(r * Math.cos(a), r * Math.sin(a)) : sh.moveTo(r * Math.cos(a), r * Math.sin(a));
  }
  sh.closePath();
  return sh;
}
// a half disc of radius `r`, flat side up
function bowl(r) {
  const sh = new THREE.Shape();
  sh.moveTo(-r, 0);
  sh.lineTo(r, 0);
  sh.absarc(0, 0, r, 0, Math.PI, true);
  return sh;
}
// a pill `w` long and `h` tall
function pill(w, h) {
  const sh = new THREE.Shape(), r = h / 2, hw = w / 2 - r;
  sh.moveTo(-hw, -r);
  sh.lineTo(hw, -r);
  sh.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false);
  sh.lineTo(-hw, r);
  sh.absarc(-hw, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  return sh;
}

export function buildCerealCar(finish, C = CEREALCAR) {
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

  // the box, the well cut through it
  const raw = roundedBox(LEN, TOP - BOT, W, ROUND).translate(0, (TOP + BOT) / 2, 0);
  add(cutThrough(raw, WELL, FLOOR, LEVEL), C.box, 0, 0, 0, { side: THREE.DoubleSide });

  // the print on the two sides, `s` the side (+1 the box's front, -1 its
  // back): `at(geo, color, x, y, lift)` sticks a plate centred on z = 0
  // onto that side, `lift` layers proud of the face
  const face = W / 2 + T / 2 - 0.004;
  const ringGeo = new THREE.TorusGeometry(0.075 - 0.028, 0.028, 10, 24); // lies in x/y, so it faces z
  for (const s of [-1, 1]) {
    const at = (geo, color, x, y, lift = 0) => add(geo, color, x, y, s * (face + lift * (T + 0.004)));
    const flat = (w, h, color, x, y, lift) => at(new THREE.BoxGeometry(w, h, T), color, x, y, lift);
    // the banner along the top, with the logo pill in it
    flat(2.7, 0.17, C.banner, 0, 1.115);
    at(plate(pill(0.95, 0.1)), C.band, -0.25, 1.115, 1);
    if (s > 0) {
      // the FRONT: a bowl with a stripe round it, heaped with rings, and
      // the starburst badge at the front corner
      at(plate(bowl(0.28)), C.label, 0.3, 0.66);
      flat(0.5, 0.04, C.banner, 0.3, 0.55, 1);
      for (const [x, y, color] of [[0.12, 0.72, C.ring], [0.3, 0.72, C.ring2], [0.48, 0.72, C.ring3], [0.21, 0.84, C.ring3], [0.39, 0.84, C.ring], [0.3, 0.95, C.ring2]]) at(ringGeo, color, x, y, 1);
      at(plate(star(12, 0.2, 0.14)), C.band, 1.1, 0.58);
      at(new THREE.CylinderGeometry(0.085, 0.085, T, 20).rotateX(Math.PI / 2), C.banner, 1.1, 0.58, 1);
      at(ringGeo, C.ring, -1.05, 0.5, 1); // two strays by the back corner
      at(ringGeo, C.ring2, -0.85, 0.62, 1);
    } else {
      // the BACK: the nutrition panel, ruled; a puzzle panel with a
      // grid; and the barcode
      flat(0.55, 0.6, C.label, -0.55, 0.65);
      flat(0.45, 0.035, C.dash, -0.55, 0.9, 1);
      for (let i = 0; i < 6; i++) flat(i % 2 ? 0.28 : 0.4, 0.014, C.dash, -0.55 - (i % 2 ? 0.06 : 0), 0.82 - i * 0.07, 1);
      flat(0.55, 0.5, C.band, 0.45, 0.62);
      for (let i = 0; i < 4; i++) {
        flat(0.45, 0.012, C.dash, 0.45, 0.42 + (i * 0.4) / 3, 1);
        flat(0.012, 0.4, C.dash, 0.225 + (i * 0.45) / 3, 0.62, 1);
      }
      flat(0.32, 0.22, C.label, 1.15, 0.5);
      for (let i = 0; i < 10; i++) flat(i % 3 ? 0.012 : 0.024, 0.14, C.dash, 1.03 + i * 0.027, 0.5, 1);
    }
  }

  // the stripe along the hood and the deck
  box(0.7, T, 0.34, C.band, 1.0, TOP + T / 2 - 0.004, 0);
  box(0.55, T, 0.34, C.band, -1.1, TOP + T / 2 - 0.004, 0);

  // the back end: the big flaps folded shut, their seam down the middle
  // of the end face, and the small top flap popped open as a spoiler,
  // cardboard on its inside
  box(T, TOP - BOT - 0.24, 0.016, C.dash, -LEN / 2 - 0.004, (TOP + BOT) / 2, 0);
  const FT = 0.04;
  const hinge = new THREE.Group();
  hinge.position.set(-LEN / 2 + 0.03, TOP - 0.03, 0);
  hinge.rotation.z = -0.95;
  group.add(hinge);
  box(0.62, FT, 1.5, C.box, -0.31, FT / 2, 0, undefined, hinge);
  box(0.6, 0.014, 1.46, C.flap, -0.31, -0.006, 0, undefined, hinge);
  box(0.5, T, 0.3, C.band, -0.33, FT + T / 2 - 0.004, 0, undefined, hinge); // the stripe carries on up the flap

  // loose cereal rings: three spilled on the deck behind the seats, one
  // on the hood
  const looseGeo = new THREE.TorusGeometry(0.1, 0.04, 10, 22).rotateX(Math.PI / 2);
  for (const [x, y, z, tilt] of [[-1.1, TOP + 0.04, 0.42, 0], [-0.95, TOP + 0.04, -0.4, 0.3], [-1.28, TOP + 0.04, -0.05, -0.2], [1.22, TOP + 0.04, 0.5, 0]]) {
    const m = add(looseGeo, C.cereal, x, y, z);
    m.rotation.x = tilt;
  }

  // headlights on the front face and tail lights on the back, each in a
  // dark rim (lit for the night)
  const lampGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14).translate(0, 0.04, 0).rotateZ(-Math.PI / 2);
  const tailGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12).translate(0, 0.025, 0).rotateZ(Math.PI / 2);
  const rim = (r) => new THREE.TorusGeometry(r, 0.02, 8, 20).rotateY(Math.PI / 2);
  for (const s of [-1, 1]) {
    add(lampGeo, C.lamp, LEN / 2 - 0.01, 0.78, s * 0.6, { emissive: C.lamp, emissiveIntensity: 0.6 });
    add(rim(0.11), C.dash, LEN / 2 + 0.05, 0.78, s * 0.6);
    add(tailGeo, C.tail, -LEN / 2 + 0.01, 0.72, s * 0.6, { emissive: C.tail, emissiveIntensity: 0.5 });
    add(rim(0.08), C.dash, -LEN / 2 - 0.03, 0.72, s * 0.6);
  }

  // the cockpit, cut into the lid (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP, C.well);

  // four wheels, each with a hubcap, turning on an axle along z under
  // the box, just outside its sides
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 10).rotateX(Math.PI / 2);
  for (const x of [-0.95, 0.95]) {
    add(axleGeo, C.wheel, x, C.wheelR, 0);
    for (const z of [-1, 1]) {
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
