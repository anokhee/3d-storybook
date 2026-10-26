/* ============================================================
   HOT DOG CAR: the roadster (car.js) remade as a hot dog. The whole body
   is the hot dog, lying lengthwise along the car: the BUN two long
   rounded halves side by side with a gap between them, flattened a
   little, browner over their outer tops; the SAUSAGE a longer capsule
   lying in the gap, its top just under the buns' and poking out past
   both ends. The COCKPIT is the cut-out cars' (tray.js), cut down
   through the buns and the sausage in the middle like a cookie cutter,
   the hot dog eased level round it so its rim is four straight, level
   lines; in it the roadster's two bucket seats, dashboard and steering
   wheel, and an arched windshield raked back from its front edge,
   so the driver sits down in the bun. Squiggles of
   MUSTARD and KETCHUP wander along the sausage ahead of and behind the
   cockpit, each on its own switch. The roadster's headlights sit on
   the bun's front ends, tail lights on its back ends, and its four
   wheels with hubcaps turn on axles under the bun, so it stands clear
   of the ground. Faces +X; its origin on the ground under the axles.
   Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

export const HOTDOGCAR = {
  scale: 1.6, // built about 2.9 long; the game scales it up to fit a driver
  bun: 0xe3aa6a,
  crust: 0xcf9150, // the browner tops of the bun halves
  sausage: 0xa84a35,
  mustard: true,
  mustardColor: 0xf2c431,
  ketchup: true,
  ketchupColor: 0xd12a1e,
  trim: 0xf3e3b4, // seats, hubcaps
  dash: 0x3a3330, // the cockpit's floor, walls and lip, the dashboard, steering wheel and axles
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The hot dog, in the car's own units (before `scale`). Each bun half is
// a capsule `len` long between its round ends, `r` thick, squashed to
// `flat` of its height, its middle `z` out from the car's centre line
// and its underside just clearing the axles; the halves are fat enough
// that the cockpit's sides stay in them. The sausage is a capsule up the
// middle, longer than the bun, its top just under the WELL's rim, TOP,
// so it runs out of the cockpit's ends under the lip. The cockpit's
// floor is FLOOR, down in the bun.
const UNDER = 0.3;
const BUN = { r: 0.5, len: 2.0, flat: 0.85, z: 0.5 };
BUN.y = UNDER + BUN.r * BUN.flat;
BUN.nose = BUN.len / 2 + BUN.r;
const WELL = { x0: -0.475, x1: -0.475 + COCKPIT.len, z1: COCKPIT.half }, TOP = 1.15, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP, { cap: false });
const SAUSAGE = { r: 0.28, len: 2.6 };
SAUSAGE.y = TOP - 0.02 - SAUSAGE.r;

// The height of the sausage's skin over the point `x` along it, `z`
// across it, following its round ends down.
function onSausage(x, z) {
  const dx = Math.max(0, Math.abs(x) - SAUSAGE.len / 2);
  return SAUSAGE.y + Math.sqrt(Math.max(0, SAUSAGE.r * SAUSAGE.r - z * z - dx * dx));
}

export function buildHotDogCar(finish, C = HOTDOGCAR) {
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
  // A capsule lying along the car, `r` thick and `len` between its ends,
  // its middle at (0, y, z): turned on a lathe, its straight middle in
  // many short steps so it can be eased round the cockpit smoothly.
  const lying = (r, len, y, z) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (Math.PI / 2) * (i / 10);
      pts.push(new THREE.Vector2(r * Math.cos(a), -len / 2 + r * Math.sin(a)));
    }
    for (let i = 1; i < 60; i++) pts.push(new THREE.Vector2(r, -len / 2 + (len * i) / 60));
    for (let i = 0; i <= 10; i++) {
      const a = (Math.PI / 2) * (i / 10);
      pts.push(new THREE.Vector2(r * Math.cos(a), len / 2 + r * Math.sin(a)));
    }
    return new THREE.LatheGeometry(pts, 48).rotateZ(Math.PI / 2).translate(0, y, z);
  };
  // a piece of the hot dog with the cockpit cut through it, two-sided so
  // the well looks in at it
  const piece = (geo, color) => add(cutThrough(geo, WELL, FLOOR, LEVEL), color, 0, 0, 0, { side: THREE.DoubleSide });

  // the bun: two halves either side of the centre line, each with a
  // browner crust — the same shape a little smaller, shifted up and
  // outward so it shows through over the outer top of the half
  for (const s of [-1, 1]) {
    piece(lying(BUN.r, BUN.len, 0, 0).scale(1, BUN.flat, 1).translate(0, BUN.y, s * BUN.z), C.bun);
    piece(lying(BUN.r, BUN.len, 0, 0).scale(0.9, 0.9 * BUN.flat, 0.9).translate(0, BUN.y + 0.075, s * (BUN.z + 0.03)), C.crust);
  }

  // the sausage, up the gap and out past both ends of the bun
  piece(lying(SAUSAGE.r, SAUSAGE.len, SAUSAGE.y, 0), C.sausage);

  // mustard and ketchup: thin tubes along zigzag paths over the sausage,
  // one ahead of the cockpit and one behind, the two sauces weaving
  // opposite ways so they cross
  const squiggle = (x0, x1, amp, color) => {
    const pts = [];
    for (let i = 0; i < 7; i++) {
      const x = x0 + ((x1 - x0) * i) / 6, z = (i % 2 ? -amp : amp);
      pts.push(new THREE.Vector3(x, LEVEL.height(onSausage(x, z), x, z) + 0.012, z));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.035, 8, false), color, 0, 0, 0);
  };
  for (const [x0, x1] of [[WELL.x1 + 0.12, BUN.nose], [WELL.x0 - 0.12, -BUN.nose]]) {
    if (C.mustard) squiggle(x0, x1, 0.13, C.mustardColor);
    if (C.ketchup) squiggle(x0, x1, -0.11, C.ketchupColor);
  }

  // the cockpit, cut down into the bun (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // headlights on the front end of each bun half, tail lights on the back
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.1, 14).rotateZ(Math.PI / 2);
  for (const s of [-1, 1]) {
    add(lampGeo, C.lamp, BUN.nose + 0.01, BUN.y, s * BUN.z, { emissive: C.lamp, emissiveIntensity: 0.6 });
    box(0.05, 0.1, 0.2, C.tail, -BUN.nose - 0.01, BUN.y, s * BUN.z, { emissive: C.tail, emissiveIntensity: 0.5 });
  }

  // four wheels, each with a hubcap, turning on an axle along z under
  // the bun
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 10).rotateX(Math.PI / 2);
  for (const x of [-0.92, 0.92]) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
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
