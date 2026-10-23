/* ============================================================
   DUCK CAR: the roadster (car.js) remade as a rubber ducky, the yellow
   bath toy. The body is the duck's: a plump, wide hull like a little
   boat, its cross-section a rounded square, its front a round CHEST,
   its back sweeping up into a perky TAIL that flicks to a point. A big
   round HEAD sits on top of the front, with a wide flat orange BILL,
   two big friendly EYES (white, with black pupils and a glint), rosy
   CHEEKS and a little TUFT on top; a WING lies along each flank. The
   COCKPIT is the cut-out cars' (tray.js), cut into the duck's back
   between the head and the tail like a cookie cutter, the back levelled
   round it so its rim is four straight, level lines; in it the
   roadster's two bucket seats, dashboard and steering wheel, and an
   arched windshield standing upright on its front edge, just behind
   the head. Headlights low on the chest, tail lights under the tail,
   and four wheels with hubcaps on axles hung from a dark chassis beam
   under the hull. Faces +X; its origin on the ground under the axles.
   Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second;
   `seat` is where a driver sits, the top of the left cushion.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `body` the duck (the head and tuft too), `wing` its wings, `bill` the
// bill, `eye` the whites of its eyes and their glints, `pupil` the
// pupils, `cheek` its cheeks (and `cheeks` whether it has them), `trim`
// the seats, hubcaps and windshield frame, `dash` the cockpit's floor,
// walls and lip, the dashboard, the steering wheel, the chassis and the
// axles, `lamp` the headlights, `tail` the tail lights.
export const DUCKCAR = {
  scale: 1.6, // built about 3.4 long; the game scales it up to fit a driver
  body: 0xffd51e,
  wing: 0xf7c210,
  bill: 0xff8a1c,
  eye: 0xffffff,
  pupil: 0x1c1a1a,
  cheek: 0xff9e8c,
  cheeks: true,
  trim: 0xfff6e0,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The duck, in the car's own units (before `scale`). The hull runs along
// x from the tail's tip, TAILX, to the chest, NOSEX; seen from above it
// is a rounded oblong `WMAX` either side of its middle at its widest,
// closing to a point at either end (`close(x)`, 1 in the middle, 0 at
// the ends). Each slice across it is a rounded square (a superellipse,
// power `ROUND`) round a middle height `mid(x)`, rising `UP` over it and
// dropping `DOWN` under it, both shrinking with `close`; `mid` sweeps up
// behind the cockpit to TAILY, so the tail flicks up to a point. The
// WELL is the cockpit, its rim TOP on the flat of the back and its floor
// FLOOR, clear above the hull's underside. HEAD is the head's middle and
// its radius.
const TAILX = -1.55, NOSEX = 1.45, XC = (TAILX + NOSEX) / 2, HALF = (NOSEX - TAILX) / 2;
const WMAX = 0.98, MID = 0.86, UP = 0.44, DOWN = 0.44, ROUND = 2.6, TAILY = 1.62;
const WELL = { x0: -0.85, x1: -0.85 + COCKPIT.len, z1: COCKPIT.half }, TOP = 1.3, FLOOR = TOP - COCKPIT.depth;
// not capped: the tail and the head rise over the rim, behind and ahead of it
const LEVEL = leveller(WELL, TOP, { cap: false });
const HEAD = { x: 0.98, y: 1.58, r: 0.52 };

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const close = (x) => Math.sqrt(Math.max(0, 1 - Math.abs((x - XC) / HALF) ** 3));
// the middle height, swept up toward the tail; the half-width, pinched
// a little more toward the tail so the flick is slim
const mid = (x) => MID + (TAILY - MID) * smooth(-0.9, TAILX, x) ** 1.3;
const halfWidth = (x) => WMAX * close(x) * (1 - 0.45 * smooth(-1.1, TAILX, x));
// a signed power, for the superellipse
const spow = (a, p) => Math.sign(a) * Math.abs(a) ** p;
// A point on the skin at `x`, `v` round from the top (0 the back, PI the
// underside, positive to +z): the rise over the middle eases from UP on
// top to DOWN underneath, so the flanks run smooth.
function skinAt(x, v) {
  const c = close(x), k = c * (DOWN + ((UP - DOWN) * (1 + Math.cos(v))) / 2);
  return new THREE.Vector3(x, mid(x) + k * spow(Math.cos(v), 2 / ROUND), halfWidth(x) * spow(Math.sin(v), 2 / ROUND));
}
// the skin's outward normal there, from its slopes along and round
function normalAt(x, v) {
  const e = 1e-3;
  const du = skinAt(x + e, v).sub(skinAt(x - e, v)), dv = skinAt(x, v + e).sub(skinAt(x, v - e));
  return dv.cross(du).normalize();
}

// The hull: rings along x, closer together toward the ends where the
// skin turns fastest, each a loop round the slice; the first and last
// rings, at the tips, shrink to a point. Then cut through by the well
// and levelled round it (tray.js).
function hullGeometry() {
  const RINGS = 72, AROUND = 112, pos = [], idx = [];
  for (let i = 0; i <= RINGS; i++) {
    const t = i / RINGS, u = 0.5 - 0.5 * Math.cos(Math.PI * t); // bunched toward both tips
    const x = TAILX + u * (NOSEX - TAILX);
    for (let j = 0; j < AROUND; j++) pos.push(...skinAt(x, (2 * Math.PI * j) / AROUND).toArray());
  }
  for (let i = 0; i < RINGS; i++)
    for (let j = 0; j < AROUND; j++) {
      const a = i * AROUND + j, b = i * AROUND + ((j + 1) % AROUND), c = a + AROUND, d = b + AROUND;
      idx.push(a, b, c, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return cutThrough(g, WELL, FLOOR, LEVEL);
}

const Y = new THREE.Vector3(0, 1, 0);

export function buildDuckCar(finish, C = DUCKCAR) {
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
  // at the origin, turned to the skin's normal at (`x`, `v`), and sunk
  // `sink` into it.
  const stickOn = (x, v, geo, color, extra, sink = 0) => {
    const at = skinAt(x, v), normal = normalAt(x, v);
    const mesh = add(geo, color, 0, 0, 0, extra);
    mesh.position.copy(at).addScaledVector(normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, normal);
    return mesh;
  };

  // the hull — two-sided, so what little of the inside the well's walls
  // miss shows skin, not nothing
  add(hullGeometry(), C.body, 0, 0, 0, { side: THREE.DoubleSide });

  // the cockpit, cut into the back (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // a wing along each flank: a flattened egg laid on the skin, its
  // pointed end swept back and up
  for (const s of [-1, 1]) {
    const x = -0.35, v = s * 1.45, at = skinAt(x, v), n = normalAt(x, v);
    const wing = add(new THREE.SphereGeometry(1, 24, 16).scale(0.52, 0.26, 0.13), C.wing, 0, 0, 0);
    wing.position.copy(at).addScaledVector(n, -0.05); // sunk half into the flank, a bump
    wing.lookAt(wing.position.clone().add(n)); // its flat face out along the normal (its z)
    wing.rotateZ(s * 0.25); // the back end raised
  }

  // the head: a big ball on the front of the back, ahead of the
  // windshield, a touch wider than tall; a little tuft of three curls on
  // top
  const H = new THREE.Vector3(HEAD.x, HEAD.y, 0);
  add(new THREE.SphereGeometry(HEAD.r, 40, 28).scale(1, 0.96, 1.02), C.body, H.x, H.y, H.z);
  const tuft = [];
  for (const [lean, turn, len] of [[-0.5, 0, 0.24], [-0.15, 0.35, 0.18], [-0.15, -0.35, 0.18]])
    tuft.push(new THREE.ConeGeometry(0.06, len, 10).translate(0, len / 2, 0).rotateZ(lean).rotateY(turn).translate(H.x - 0.05, H.y + HEAD.r * 0.94, 0));
  add(mergeGeometries(tuft), C.body, 0, 0, 0);

  // the bill: wide and flat, an upper bill sticking well out of the
  // front of the head with a smaller lower bill under it
  add(new THREE.SphereGeometry(1, 32, 16).scale(0.4, 0.1, 0.33), C.bill, H.x + HEAD.r * 0.8, H.y - 0.1, 0);
  add(new THREE.SphereGeometry(1, 24, 12).scale(0.3, 0.07, 0.26), C.bill, H.x + HEAD.r * 0.72, H.y - 0.2, 0);

  // the eyes: a white ball sunk into each side of the head's front, a
  // big black pupil on its front and a glint on that; and the cheeks,
  // rosy discs under and behind them
  const onHead = (dir, out) => H.clone().addScaledVector(dir.clone().normalize(), out);
  for (const s of [-1, 1]) {
    const d = new THREE.Vector3(0.72, 0.42, s * 0.52).normalize();
    const eyeAt = onHead(d, HEAD.r - 0.06);
    add(new THREE.SphereGeometry(0.15, 20, 14), C.eye, eyeAt.x, eyeAt.y, eyeAt.z);
    const look = new THREE.Vector3(1, 0.1, s * 0.35).normalize(); // the pupils look ahead
    const pupilAt = eyeAt.clone().addScaledVector(look, 0.1);
    add(new THREE.SphereGeometry(0.075, 16, 12), C.pupil, pupilAt.x, pupilAt.y, pupilAt.z);
    const glintAt = pupilAt.clone().addScaledVector(look, 0.05).add(new THREE.Vector3(0, 0.035, s * -0.02));
    add(new THREE.SphereGeometry(0.024, 10, 8), C.eye, glintAt.x, glintAt.y, glintAt.z);
    if (C.cheeks) {
      const cd = new THREE.Vector3(0.5, -0.1, s * 0.86).normalize(), cheekAt = onHead(cd, HEAD.r - 0.005);
      const cheek = add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 18), C.cheek, cheekAt.x, cheekAt.y, cheekAt.z);
      cheek.quaternion.setFromUnitVectors(Y, cd);
    }
  }

  // headlights low on the chest, tail lights under the tail's flick,
  // each turned to face out of the skin where it sits
  const lampGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16).translate(0, 0.02, 0);
  const tailGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 14).translate(0, 0.015, 0);
  for (const s of [-1, 1]) {
    stickOn(NOSEX - 0.12, s * 2.05, lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 });
    stickOn(-1.3, s * 2.3, tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 });
  }

  // the chassis: a dark beam under the hull, the two axles across it,
  // and four wheels, each with a hubcap, turning on an axle along z
  box(2.0, 0.16, 0.3, C.dash, 0, C.wheelR + 0.08, 0);
  const axleGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.9, 10).rotateX(Math.PI / 2);
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  for (const x of [-0.92, 0.92]) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
    for (const z of [-0.92, 0.92]) {
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
