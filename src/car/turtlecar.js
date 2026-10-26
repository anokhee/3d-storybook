/* ============================================================
   TURTLE CAR: the roadster (car.js) remade as a turtle. The body is the
   turtle's SHELL, a dome stood on a pale belly plate, its top marked
   out in SCUTES: a ring of plates round the cockpit and a staggered ring
   below them down the flanks, each outlined in a raised ridge with a
   growth ring inside it. Round the shell's foot runs the MARGIN, a
   lighter rolled band, notched along its lower edge and scored into
   segments. Out of the front comes a short NECK and a round HEAD with
   big eyes, a smile and headlights in its cheeks; four stubby LEGS peek
   out from under the margin by the wheels, and a little pointed TAIL
   out of the back, a tail light either side of it. The COCKPIT is the
   cut-out cars' (tray.js), cut out of the shell's top, the shell
   levelled round it so its rim is four straight, level lines; in it the
   roadster's two bucket seats, dashboard and steering wheel, and an
   arched windshield raked back from its front edge. Faces +X; its
   origin on the ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `shell` the shell's plates, `plate` the growth rings inside them,
// `scute` the ridges between them, `margin` the band round the shell's
// foot (scored in `shell`), `skin` the head, neck, legs and tail,
// `belly` the plate under the shell, `eye` and `pupil` the eyes, `trim`
// the seats, hubcaps and toenails, `dash` the
// cockpit's floor, walls and lip, the dashboard, the steering wheel and
// the axles.
export const TURTLECAR = {
  scale: 1.6, // built about 3.4 long; the game scales it up to fit a driver
  shell: 0x2f6e3f,
  plate: 0x3d8650,
  scute: 0xc9b86c,
  margin: 0xc3cf7c,
  skin: 0xb6d46f,
  belly: 0xe9d68c,
  eye: 0xfffaf0,
  pupil: 0x1e1a1c,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The body, in the car's own units (before `scale`). The SHELL is half
// an ellipsoid stood on the FLOOR: `x` where its middle is along the
// car, `rx`, `ry`, `rz` how far it reaches along, up and across. The
// margin and the belly are stretched to its oval. The WELL is the
// cockpit (tray.js) cut out of the shell's top, its floor the FLOOR,
// the shell levelled round it to its rim, TOP.
const FLOOR = 0.45, BELLY = 0.16;
const SHELL = { x: -0.2, rx: 1.2, ry: 0.8, rz: 0.95 };
const WELL = { x0: -0.85, x1: -0.85 + COCKPIT.len, z1: COCKPIT.half }, TOP = FLOOR + COCKPIT.depth;
const HEAD = { x: 1.38, y: 0.8, rx: 0.33, ry: 0.29, rz: 0.3 };
const LEVEL = leveller(WELL, TOP);

const Y = new THREE.Vector3(0, 1, 0);
const steps = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
// The shell's dome over (x, z), the floor outside its footprint; that
// levelled round the well; and its normal there.
const domeAt = (x, z) => FLOOR + SHELL.ry * Math.sqrt(Math.max(0, 1 - ((x - SHELL.x) / SHELL.rx) ** 2 - (z / SHELL.rz) ** 2));
const shellAt = (x, z) => LEVEL.height(domeAt(x, z), x, z);
function shellNormal(x, z) {
  const e = 1e-3;
  return new THREE.Vector3(-(shellAt(x + e, z) - shellAt(x - e, z)) / (2 * e), 1, -(shellAt(x, z + e) - shellAt(x, z - e)) / (2 * e)).normalize();
}

// The scutes are laid out from above over the ring between the well and
// the shell's foot. `t` goes round (0 straight ahead, the same angle
// round the oval as the margin's), `s` out across the ring: 0 a little
// way off the well, on a rounded rectangle round it, 1 near the shell's
// foot, where the margin covers it; the plan point between them.
function plan(t, s) {
  const { x0, x1, z1 } = WELL, OFF = 0.1, c = Math.cos(t), n = Math.sin(t);
  const ix = (x0 + x1) / 2 + Math.sign(c) * Math.abs(c) ** 0.25 * ((x1 - x0) / 2 + OFF), iz = Math.sign(n) * Math.abs(n) ** 0.25 * (z1 + OFF);
  const R = 0.95, ox = SHELL.x + R * SHELL.rx * c, oz = R * SHELL.rz * n;
  return [ix + (ox - ix) * s, iz + (oz - iz) * s];
}
// where the two rows of plates meet, across the ring
const MID = 0.42;

export function buildTurtleCar(finish, C = TURTLECAR) {
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

  // the shell, with the well cut out of its top, on a belly plate the
  // shape of its footprint
  const dome = new THREE.SphereGeometry(1, 192, 96, 0, Math.PI * 2, 0, Math.PI / 2).scale(SHELL.rx, SHELL.ry, SHELL.rz).translate(SHELL.x, FLOOR, 0);
  add(cutThrough(dome, WELL, FLOOR, LEVEL), C.shell, 0, 0, 0, both);
  add(new THREE.CylinderGeometry(1, 1, BELLY, 64).scale(SHELL.rx - 0.03, 1, SHELL.rz - 0.03), C.belly, SHELL.x, FLOOR - BELLY / 2, 0);

  // the cockpit, cut out of the shell (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // the scutes: ridges laid on the levelled shell along curves drawn
  // over the ring from above, each a tube a hair proud of the surface;
  // `path(u)` the plan point at u 0..1 along the curve
  const ridge = (path, n, radius, closed) => {
    const pts = steps(0, 1, n).slice(0, closed ? n : n + 1).map((u) => {
      const [x, z] = path(u);
      return new THREE.Vector3(x, shellAt(x, z), z).addScaledVector(shellNormal(x, z), 0.006);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), n * 2, radius, 6, closed);
  };
  const ridges = [], rings = [];
  const TAU = Math.PI * 2, INNER = steps(0, 7, 7).map((k) => Math.PI / 8 + (k * Math.PI) / 4), OUTER = steps(0, 7, 7).map((k) => (k * Math.PI) / 4);
  // the edges round the well and between the rows, all the way round;
  // the seams across each row, the outer row's halfway between the inner's
  for (const s of [0, MID]) ridges.push(ridge((u) => plan(u * TAU, s), 160, 0.024, true));
  for (const t of INNER) ridges.push(ridge((u) => plan(t, u * MID), 12, 0.024, false));
  for (const t of OUTER) ridges.push(ridge((u) => plan(t, MID + u * (1 - MID)), 16, 0.024, false));
  // and in each plate a growth ring, a rounded loop drawn in toward its middle
  const loop = (t0, t1, s0, s1) => (u) => {
    const a = u * TAU, c = Math.cos(a), n = Math.sin(a), k = 0.55;
    return plan((t0 + t1) / 2 + Math.sign(c) * Math.abs(c) ** 0.5 * k * ((t1 - t0) / 2), (s0 + s1) / 2 + Math.sign(n) * Math.abs(n) ** 0.5 * k * ((s1 - s0) / 2));
  };
  for (const t of INNER) rings.push(ridge(loop(t, t + Math.PI / 4, 0, MID), 48, 0.013, true));
  for (const t of OUTER) rings.push(ridge(loop(t, t + Math.PI / 4, MID, 0.97), 48, 0.013, true));
  add(mergeGeometries(ridges), C.scute, 0, 0, 0);
  add(mergeGeometries(rings), C.plate, 0, 0, 0);

  // the margin: a rolled band round the shell's foot, turned on a lathe
  // from a profile (points [r, y], r 1 the shell's edge) and stretched to
  // its oval, coming out of the shell a little up its side and curling
  // under past the belly's edge; its lower edge notched between segments
  const BAND = [[0.88, 0.34], [1.0, 0.34], [1.05, 0.39], [1.065, 0.46], [1.035, 0.55], [0.99, 0.62], [0.95, 0.67]];
  const SEGS = 16, NOTCH = 0.07;
  const band = new THREE.LatheGeometry(BAND.map(([r, y]) => new THREE.Vector2(r, y)), 320).scale(SHELL.rx, 1, SHELL.rz);
  const bp = band.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const y = bp.getY(i);
    if (y > 0.42) continue;
    const t = Math.atan2(bp.getZ(i) / SHELL.rz, bp.getX(i) / SHELL.rx), seg = (TAU / SEGS), d = Math.abs(((t % seg) + seg * 1.5) % seg - seg / 2);
    bp.setY(i, y + 0.08 * Math.max(0, 1 - d / NOTCH));
  }
  band.computeVertexNormals();
  add(band, C.margin, SHELL.x, 0, 0);
  // scored between its segments, a groove up its face in the shell's green
  const onBand = (t, r, y) => new THREE.Vector3(SHELL.x + r * SHELL.rx * Math.cos(t), y, r * SHELL.rz * Math.sin(t));
  const scores = [];
  for (let k = 0; k < SEGS; k++) {
    const t = (k * TAU) / SEGS, pts = BAND.slice(2).map(([r, y]) => onBand(t, r + 0.012, y));
    pts.unshift(onBand(t, 1.04, 0.44));
    scores.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.016, 6, false));
  }
  add(mergeGeometries(scores), C.shell, 0, 0, 0);

  // the neck, out of the shell's front under the margin, tipped up, and
  // the head on it, round and a little wide
  const neck = new THREE.CylinderGeometry(0.15, 0.18, 0.55, 18).rotateZ(-Math.PI / 2 + 0.35);
  add(neck, C.skin, 1.12, 0.66, 0);
  add(new THREE.SphereGeometry(1, 32, 24).scale(HEAD.rx, HEAD.ry, HEAD.rz), C.skin, HEAD.x, HEAD.y, 0);
  // a point on the head's surface out from its middle in direction `d`,
  // and the surface's normal there
  const onHead = (d) => {
    const v = new THREE.Vector3(...d).normalize();
    return { at: new THREE.Vector3(HEAD.x + HEAD.rx * v.x, HEAD.y + HEAD.ry * v.y, HEAD.rz * v.z), normal: new THREE.Vector3(v.x / HEAD.rx, v.y / HEAD.ry, v.z / HEAD.rz).normalize() };
  };
  // the eyes: big white balls high on the head, each with a dark pupil
  // looking ahead and a glint in it
  for (const s of [-1, 1]) {
    const { at, normal } = onHead([0.55, 0.55, s * 0.5]);
    const eye = at.clone().addScaledVector(normal, -0.02);
    add(new THREE.SphereGeometry(0.1, 18, 14), C.eye, eye.x, eye.y, eye.z);
    const look = normal.clone().lerp(new THREE.Vector3(1, 0, 0), 0.5).normalize();
    const pupil = eye.clone().addScaledVector(look, 0.075);
    add(new THREE.SphereGeometry(0.05, 14, 10), C.pupil, pupil.x, pupil.y, pupil.z);
    const glint = pupil.clone().addScaledVector(look, 0.035).add(new THREE.Vector3(0, 0.02, -s * 0.01));
    add(new THREE.SphereGeometry(0.014, 8, 6), C.eye, glint.x, glint.y, glint.z);
  }
  // headlights in its cheeks, each turned to face out of the head
  const lampGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.06, 14).translate(0, 0.03, 0);
  for (const s of [-1, 1]) {
    const { at, normal } = onHead([0.75, -0.2, s * 0.6]);
    const lamp = add(lampGeo, C.lamp, 0, 0, 0, { emissive: C.lamp, emissiveIntensity: 0.6 });
    lamp.position.copy(at).addScaledVector(normal, -0.02);
    lamp.quaternion.setFromUnitVectors(Y, normal);
  }
  // a smile across its front, low, and two nostrils over it
  const ARC = Math.PI * 0.55;
  const smile = new THREE.TorusGeometry(0.11, 0.013, 6, 16, ARC).rotateZ(-Math.PI / 2 - ARC / 2).rotateY(Math.PI / 2);
  add(smile, C.pupil, HEAD.x + HEAD.rx - 0.02, HEAD.y - 0.0, 0);
  for (const s of [-1, 1]) {
    const { at } = onHead([1, 0.15, s * 0.12]);
    add(new THREE.SphereGeometry(0.014, 8, 6), C.pupil, at.x, at.y, at.z);
  }

  // four stubby legs peeking out from under the margin, ahead of the
  // front wheels and behind the back ones, each a flattened round
  // flipper splayed out, three toenails at its tip
  const legGeo = new THREE.SphereGeometry(1, 20, 14).scale(0.24, 0.11, 0.15);
  const nailGeo = new THREE.SphereGeometry(0.035, 8, 6);
  for (const [x, ang] of [[0.82, 0.35], [-1.18, -0.4]])
    for (const s of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.24, s * 0.5);
      leg.rotation.y = -s * ang;
      group.add(leg);
      add(legGeo, C.skin, Math.sign(x) * 0.12, 0, 0, undefined, leg);
      for (const k of [-1, 0, 1]) add(nailGeo, C.trim, Math.sign(x) * (0.12 + 0.225 - 0.02 * Math.abs(k)), -0.02, k * 0.07, undefined, leg);
    }

  // the tail: a little pointed cone out of the shell's back, under the
  // margin, tipped up a touch; a round tail light either side of it on
  // the margin, turned to face out of the oval
  add(new THREE.ConeGeometry(0.1, 0.38, 14).rotateZ(Math.PI / 2 - 0.2), C.skin, -1.52, 0.4, 0);
  const tailGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14).translate(0, 0.025, 0);
  for (const s of [-1, 1]) {
    const t = Math.PI + s * 0.42, light = add(tailGeo, C.tail, 0, 0, 0, { emissive: C.tail, emissiveIntensity: 0.5 });
    light.position.copy(onBand(t, 1.05, 0.47));
    light.quaternion.setFromUnitVectors(Y, new THREE.Vector3(Math.cos(t) / SHELL.rx, 0, Math.sin(t) / SHELL.rz).normalize());
  }

  // four wheels, each with a hubcap, tucked a little under the margin,
  // turning on axles along z under the belly, the same distance either
  // side of the shell's middle
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 10).rotateX(Math.PI / 2);
  for (const x of [SHELL.x - 0.6, SHELL.x + 0.6]) {
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
