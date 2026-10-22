/* ============================================================
   the car from the Car project (Desktop/car/planet.js, "the car"), the
   convertible chickens3d built, remade as a roadster: one body drawn as a
   side silhouette and extruded across its width, so the bonnet domes up to
   the cowl and the boot rounds off behind the cockpit, with a well sunk
   between them. In the well, two bucket seats, a dashboard and a steering
   wheel on its column; over the cowl, a raked windshield in a frame. Then
   bumpers, a grille, headlights and tail lights, and four wheels with
   hubcaps. Faces +X; its origin on the ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";

export const CAR = {
  scale: 1.6, // built about 2.9 long; the game scales it up to fit a driver
  body: 0xd9534f,
  trim: 0xf3e3b4, // seats, bumpers, hubcaps, the windshield frame
  dash: 0x3a3330, // the dashboard, the steering wheel, the grille
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The body's side view, x along the car and y up, in the car's own units
// (before `scale`). The underside clears the axles; the nose rises to a
// domed bonnet that flattens into the cowl; the cockpit is a well sunk to
// the floor; behind it the boot's lid rounds down to the tail.
const UNDER = 0.25, NOSE = 1.42, TAIL = -1.42, COWL = 0.5, FLOOR = 0.45, BOOT = -0.85, WIDTH = 1.4;
function bodyShape() {
  const s = new THREE.Shape();
  s.moveTo(TAIL, UNDER);
  s.lineTo(NOSE, UNDER);
  s.lineTo(NOSE, 0.62); // the nose
  s.bezierCurveTo(NOSE, 0.88, 1.05, 1.0, COWL, 1.0); // the bonnet, domed
  s.lineTo(COWL, FLOOR); // the front of the well
  s.lineTo(BOOT, FLOOR); // the floor
  s.lineTo(BOOT, 0.9); // the back of the well
  s.bezierCurveTo(-1.18, 0.9, TAIL, 0.86, TAIL, 0.58); // the boot, rounded
  s.closePath();
  return s;
}

export function buildCar(finish, C = CAR) {
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

  // the body: the silhouette, extruded across the width and centred on it
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape(), { depth: WIDTH, bevelEnabled: false, curveSegments: 16 }).translate(0, 0, -WIDTH / 2);
  add(bodyGeo, C.body, 0, 0, 0);
  // the sills: the well is cut clean through, so these are the doors' height
  for (const z of [-WIDTH / 2 + 0.06, WIDTH / 2 - 0.06]) box(COWL - BOOT, 0.4, 0.12, C.body, (COWL + BOOT) / 2, FLOOR + 0.2, z);

  // the dashboard, under the cowl, and the steering wheel before the left seat
  box(0.22, 0.2, WIDTH - 0.24, C.dash, COWL - 0.11, 0.88, 0);
  const RAKE = 0.35, DRIVER = 0.34;
  const wheelAt = new THREE.Vector3(0.1, 0.98, DRIVER);
  const rim = new THREE.TorusGeometry(0.16, 0.025, 10, 28).rotateY(Math.PI / 2).rotateZ(RAKE);
  add(rim, C.dash, wheelAt.x, wheelAt.y, wheelAt.z);
  const spoke = new THREE.BoxGeometry(0.03, 0.3, 0.04).rotateZ(RAKE); // one up and down
  add(spoke, C.dash, wheelAt.x, wheelAt.y, wheelAt.z);
  const spokeAcross = new THREE.BoxGeometry(0.03, 0.04, 0.3).rotateZ(RAKE); // and one side to side
  add(spokeAcross, C.dash, wheelAt.x, wheelAt.y, wheelAt.z);
  const axis = new THREE.Vector3(Math.cos(RAKE), Math.sin(RAKE), 0); // the wheel's normal, toward the dash
  const column = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 10).rotateZ(-(Math.PI / 2 - RAKE));
  const columnAt = wheelAt.clone().addScaledVector(axis, 0.2);
  add(column, C.dash, columnAt.x, columnAt.y, columnAt.z);

  // two bucket seats: a cushion and a backrest leaning back, on the floor
  for (const z of [-DRIVER, DRIVER]) {
    box(0.46, 0.14, 0.5, C.trim, -0.28, FLOOR + 0.07, z);
    const back = box(0.12, 0.5, 0.5, C.trim, -0.54, FLOOR + 0.36, z);
    back.rotation.z = 0.22;
    const rest = box(0.1, 0.14, 0.26, C.trim, -0.65, FLOOR + 0.66, z); // headrest
    rest.rotation.z = 0.22;
  }

  // the windshield: a pane in a frame, raked back from the cowl
  const shield = new THREE.Group();
  shield.position.set(COWL - 0.02, 1.0, 0);
  shield.rotation.z = RAKE;
  group.add(shield);
  const pane = box(0.03, 0.5, WIDTH - 0.3, C.glass, 0, 0.25, 0, { transparent: true, opacity: 0.55 }, shield);
  pane.castShadow = false;
  for (const z of [-(WIDTH - 0.3) / 2, (WIDTH - 0.3) / 2]) box(0.05, 0.54, 0.05, C.trim, 0, 0.27, z, undefined, shield);
  box(0.05, 0.05, WIDTH - 0.25, C.trim, 0, 0.52, 0, undefined, shield);

  // bumpers, the grille, headlights and tail lights (lit for the night)
  for (const x of [NOSE + 0.03, TAIL - 0.03]) box(0.08, 0.1, WIDTH + 0.1, C.trim, x, 0.38, 0);
  box(0.04, 0.16, 0.6, C.dash, NOSE + 0.01, 0.52, 0);
  for (const z of [-0.5, 0.5]) {
    add(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14).rotateZ(Math.PI / 2), C.lamp, NOSE + 0.02, 0.52, z, { emissive: C.lamp, emissiveIntensity: 0.6 });
    box(0.05, 0.1, 0.2, C.tail, TAIL - 0.01, 0.52, z, { emissive: C.tail, emissiveIntensity: 0.5 });
  }

  // four wheels, each with a hubcap, turning on an axle along z
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  for (const x of [-0.92, 0.92])
    for (const z of [-0.72, 0.72]) {
      const w = add(wheelGeo, C.wheel, x, C.wheelR, z);
      add(capGeo, C.trim, 0, 0, 0, undefined, w);
      wheels.push(w);
    }
  group.scale.setScalar(C.scale);
  const roll = (dt, speed) => {
    for (const w of wheels) w.rotation.z -= (speed * dt) / C.wheelR;
  };
  return { group, wheels, roll };
}
