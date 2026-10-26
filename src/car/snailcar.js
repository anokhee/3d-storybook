/* ============================================================
   SNAIL CAR: the roadster (car.js) remade as a snail. The body is the
   snail's great coiled SHELL, a fat round wheel of a shell seen from
   the side, its flanks domed and its crown broad, a raised SPIRAL in a
   lighter stripe winding in on each flank to a little knob at its
   middle. Under it and out ahead of it runs the soft FOOT, a slug's
   body low along the ground, tapering to a point behind the shell and
   rising at the front into the HEAD: a round face with a smile and two
   rosy cheeks, two short EYESTALKS out of its top, the eyeballs on their
   tips lit as the headlights, each with a dark pupil looking ahead. The
   COCKPIT is the cut-out cars'
   (tray.js), cut down into the shell's crown like a cookie cutter, the
   crown levelled round it so its rim is four straight, level lines; in
   it the roadster's two bucket seats, dashboard and steering wheel, and
   an arched windshield raked back from its front edge. Tail lights
   on the foot's tail, a glossy streak of slime on the ground under it,
   and four wheels with hubcaps either side of the foot, on axles
   through it. Faces +X; its origin on the ground under the axles. Up
   is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second;
   `seat` is where a driver sits, the top of the left cushion.
   ============================================================ */
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `shell` the shell, `stripe` its spiral and the knob at the spiral's
// middle, `body` the foot, head and eyestalks, `cheek` the
// blush either side of the smile, `slime` the streak under the foot (on
// a switch, `hasSlime`), `lamp` the eyeballs (lit, they are the
// headlights), `trim` the seats and hubcaps, `dash`
// the cockpit's floor, walls and lip, the dashboard, the steering
// wheel, the axles, the pupils and the smile.
export const SNAILCAR = {
  scale: 1.6, // built about 3.3 long; the game scales it up to fit a driver
  shell: 0xb8743a,
  stripe: 0xf3d9a8,
  body: 0xa8c49c,
  cheek: 0xf2a39b,
  slime: 0xd9f2e4,
  hasSlime: true,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The snail, in the car's own units (before `scale`). The shell is a
// rounded wheel on its side: round its axle (along z, at CX, CY) it
// reaches RX along the car and RY up, its flanks a superellipse across,
// so `rho` 0 its middle and 1 its rim, and at `rho` a flank stands
// `flank(rho)` out from the middle, W at the middle. The WELL is the
// cockpit, over the shell's crown, its rim TOP and its floor FLOOR.
const CX = -0.3, CY = 1.15, RX = 1.1, RY = 0.85, W = 1.0, SQUARE = 4;
const WELL = { x0: CX - COCKPIT.len / 2, x1: CX + COCKPIT.len / 2, z1: COCKPIT.half }, TOP = 1.82, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP);
const flank = (rho) => W * Math.pow(Math.max(0, 1 - rho ** SQUARE), 1 / SQUARE);

const Y = new THREE.Vector3(0, 1, 0);
const steps = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// A surface from a grid of points: `at(i, j)` the point in row `i` of
// `rows` and column `j` of `cols`, the columns closing round on
// themselves; its seams welded so it shades smooth.
function grid(rows, cols, at) {
  const pos = [], idx = [];
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) pos.push(...at(i, j));
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j, b = a + cols + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const welded = mergeVertices(geo, 1e-5);
  welded.computeVertexNormals();
  return welded;
}

// The shell: rows from the -z flank's middle over the rim to the +z
// flank's, columns round the axle, a superellipsoid fat across.
export function shellGeo() {
  const ROWS = 120, AROUND = 200;
  return grid(ROWS, AROUND, (i, j) => {
    const phi = -Math.PI / 2 + (Math.PI * i) / ROWS, t = (Math.PI * 2 * j) / AROUND;
    const c = Math.cos(phi), s = Math.sin(phi);
    const rho = Math.pow(Math.abs(c), 2 / SQUARE), z = W * Math.sign(s) * Math.pow(Math.abs(s), 2 / SQUARE);
    return [CX + RX * rho * Math.cos(t), CY + RY * rho * Math.sin(t), z];
  });
}

// The foot: a soft body along a curve, low from the tail to under the
// shell's front, then rising into the neck. Along it (u 0 the tail, 1
// the neck) it is `footR(u)` round, stretched `footWide(u)` across and
// flattened underneath, where it runs on the ground, so its sole is
// broad.
const FOOT = new THREE.CatmullRomCurve3(
  [[-1.75, 0.34], [-1.3, 0.42], [-0.4, 0.47], [0.5, 0.48], [0.95, 0.62], [1.15, 0.9], [1.22, 1.05]].map(([x, y]) => new THREE.Vector3(x, y, 0)),
);
const footR = (u) => 0.42 * Math.sqrt(Math.max(0, 1 - Math.max(0, 1 - u / 0.22) ** 2)) - 0.07 * smooth(0.7, 1, u); // the tail rounded off, the neck a little slimmer
const footWide = (u) => 1.45 - 0.35 * smooth(0.65, 1, u);
const footFlat = (u) => 0.55 + 0.45 * smooth(0.7, 0.95, u); // how much of its round the sole keeps, 1 none flattened
function footGeo() {
  const ALONG = 120, AROUND = 48;
  return grid(ALONG, AROUND, (i, j) => {
    const u = i / ALONG, a = (Math.PI * 2 * j) / AROUND, p = FOOT.getPointAt(u), tan = FOOT.getTangentAt(u);
    const n = new THREE.Vector3(-tan.y, tan.x, 0); // up from the curve, square to it
    const up = Math.cos(a), across = Math.sin(a), r = footR(u);
    return p
      .clone()
      .addScaledVector(n, r * up * (up < 0 ? footFlat(u) : 1))
      .add(new THREE.Vector3(0, 0, r * footWide(u) * across))
      .toArray();
  });
}

// The head, round on the end of the neck, and the face's directions on
// it: out from HEAD's middle in direction `d`, a point on its skin and
// the skin's normal there.
const HEAD = { x: 1.25, y: 1.07, r: 0.36, wide: 1.15 };
const STALK = 0.55; // how far out the eyestalks reach, as a share of what they did
function onHead(d) {
  const v = new THREE.Vector3(...d).normalize();
  return {
    at: new THREE.Vector3(HEAD.x + HEAD.r * v.x, HEAD.y + HEAD.r * v.y, HEAD.r * HEAD.wide * v.z),
    normal: new THREE.Vector3(v.x, v.y, v.z / HEAD.wide).normalize(),
  };
}

// A tapering tube along `pts`, `r0` round at its root and `r1` at its
// tip, its ends left open (each one buried in something).
function tapered(pts, r0, r1, segs = 24) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.TubeGeometry(curve, segs, 1, 10, false);
  const pos = tube.attributes.position, uv = tube.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i), on = curve.getPointAt(u);
    v.fromBufferAttribute(pos, i).sub(on).multiplyScalar(r0 + (r1 - r0) * u).add(on);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  tube.computeVertexNormals();
  return { tube, curve };
}

// The snail itself, everything but the shell's own surface (which the
// car cuts its cockpit into): the spiral on each flank, the foot and the
// head, the eyestalks, the face, and the slime, into
// `group`, `add` as buildSnailCar's; the eyeballs are `C.lamp`, `lit`
// as headlights or not, the pupils and smile `C.dash`. Returns the two
// eyestalks, each a Group pivoting at its root.
export function buildSnailBody(group, add, C, { lit = false } = {}) {
  const stalks = [];
  // the spiral on each flank: a raised tube on the shell's skin, from
  // low at the front of the flank, under the crown, winding in two and
  // a quarter turns to the flank's middle, where a knob sits; its
  // outermost turn kept below the rim, clear of the levelled crown
  const OUTER = 0.74, INNER = 0.07, TURNS = 2.25, START = -0.6;
  for (const s of [-1, 1]) {
    const pts = steps(0, 1, 160).map((k) => {
      const rho = OUTER + (INNER - OUTER) * Math.pow(k, 0.85), t = START + Math.PI * 2 * TURNS * k;
      return new THREE.Vector3(CX + RX * rho * Math.cos(t), CY + RY * rho * Math.sin(t), s * (flank(rho) + 0.012));
    });
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.05, 8, false), C.stripe, 0, 0, 0);
    add(new THREE.SphereGeometry(0.11, 16, 10).scale(1, 1, 0.5), C.stripe, CX, CY, s * W);
  }

  // the foot under it all, and the round head on its neck
  add(footGeo(), C.body, 0, 0, 0);
  add(new THREE.SphereGeometry(HEAD.r, 32, 20).scale(1, 1, HEAD.wide), C.body, HEAD.x, HEAD.y, 0);

  // Something stood on the head: `geo` built standing up from its base
  // at the origin, turned to the skin's normal where `d` points, and
  // sunk `sink` into it.
  const stickOn = (d, geo, color, extra, sink = 0) => {
    const { at, normal } = onHead(d);
    const mesh = add(geo, color, 0, 0, 0, extra);
    mesh.position.copy(at).addScaledVector(normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, normal);
    return mesh;
  };

  // the eyestalks, short, out of the head's top and leaning forward and
  // apart (STALK of the way out the old long ones reached), each an
  // eyeball on its tip lit as a headlight, a dark pupil on its front
  // looking ahead
  for (const s of [-1, 1]) {
    const root = onHead([0.1, 1, s * 0.45]).at;
    const stalk = new THREE.Group(); // pivots at the root, so a page can sway it
    stalk.position.copy(root);
    group.add(stalk);
    stalks.push(stalk);
    const { tube, curve } = tapered([root.clone().addScaledVector(Y, -0.1), root, new THREE.Vector3(1.32, 1.65, s * 0.3), new THREE.Vector3(1.42, 1.88, s * 0.4)].map((v, i) => (i > 1 ? v.sub(root).multiplyScalar(STALK) : v.sub(root))), 0.06, 0.035);
    add(tube, C.body, 0, 0, 0, undefined, stalk);
    const tip = curve.getPointAt(1);
    add(new THREE.SphereGeometry(0.13, 20, 14), C.lamp, tip.x, tip.y + 0.06, tip.z, lit ? { emissive: C.lamp, emissiveIntensity: 0.6 } : undefined, stalk);
    const look = new THREE.Vector3(1, -0.1, s * 0.15).normalize();
    const pupil = add(new THREE.SphereGeometry(0.06, 14, 10).scale(1, 1, 0.45).rotateY(Math.PI / 2), C.dash, 0, 0, 0, undefined, stalk);
    pupil.position.set(tip.x, tip.y + 0.06, tip.z).addScaledVector(look, 0.11);
    pupil.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), look);
  }

  // the face: a smile across the front of the head, and a rosy cheek
  // either side of it
  const smile = add(new THREE.TorusGeometry(0.12, 0.018, 8, 24, Math.PI * 0.7).rotateZ(-Math.PI / 2 - Math.PI * 0.35), C.dash, 0, 0, 0);
  smile.position.set(HEAD.x + HEAD.r - 0.03, HEAD.y + 0.02, 0);
  smile.rotation.y = Math.PI / 2;
  const cheekGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16).translate(0, 0.01, 0);
  for (const s of [-1, 1]) stickOn([0.75, -0.15, s * 0.6], cheekGeo, C.cheek, undefined, 0.008);

  // the slime: a glossy streak on the ground under the foot, trailing
  // out behind it
  if (C.hasSlime) {
    const streak = new THREE.Shape();
    streak.moveTo(1.1, 0);
    streak.bezierCurveTo(1.1, 0.45, 0.2, 0.62, -0.6, 0.6);
    streak.bezierCurveTo(-1.6, 0.58, -2.3, 0.35, -2.5, 0);
    streak.bezierCurveTo(-2.3, -0.35, -1.6, -0.58, -0.6, -0.6);
    streak.bezierCurveTo(0.2, -0.62, 1.1, -0.45, 1.1, 0);
    const mesh = add(new THREE.ShapeGeometry(streak, 24).rotateX(-Math.PI / 2), C.slime, 0, 0.006, 0, { transparent: true, opacity: 0.6 });
    mesh.castShadow = false;
  }

  return stalks;
}

export function buildSnailCar(finish, C = SNAILCAR) {
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

  // the shell, with the cockpit cut down into its crown, two-sided so
  // the well looks in at it
  add(cutThrough(shellGeo(), WELL, FLOOR, LEVEL), C.shell, 0, 0, 0, both);
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  const stalks = buildSnailBody(group, add, C, { lit: true });

  // tail lights on the top of the foot's tail, either side, each a bead
  // half sunk in its skin
  const tailAt = FOOT.getPointAt(0.12), tailR = footR(0.12);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.055, 12, 8), C.tail, tailAt.x, tailAt.y + tailR * 0.6, s * tailR * footWide(0.12) * 0.7, { emissive: C.tail, emissiveIntensity: 0.5 });

  // four wheels, each with a hubcap, standing out either side of the
  // foot, turning on axles along z through it
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 10).rotateX(Math.PI / 2);
  for (const x of [-0.95, 0.9]) {
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
  return { group, wheels, roll, seat, stalks };
}
