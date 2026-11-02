/* ============================================================
   DUCK CAR: the roadster (car.js) remade as a rubber ducky, the yellow
   bath toy. The body is the fish car's (fishcar.js) in profile: one
   plump shape about the car's length, wider than it is tall, blunt at
   the chest; but behind the cockpit the whole body sweeps up, narrowing
   across and growing tall, into a broad TAIL that ends in a blunt
   point. At the front the body rises into a big round HEAD, one skin
   from tail to bill: the chest swells up and forward into the ball of
   the head, the join filleted smooth, no seam. On the head
   a wide flat orange BILL, two domed EYES (a dome on each side of the
   face, a black pupil on its crown, as the fish's eyes are; lit, they
   are the headlights) and a little TUFT on top; a WING lies flat
   against each flank, halfway down it, a fin in outline — a round
   shoulder, swept back to a rounded tip — raised a little off the skin
   like the wing moulded on a bath duck. The
   COCKPIT is the cut-out cars' (tray.js), cut into the duck's back
   between the head and the tail like a cookie cutter, the back
   levelled round it so its rim is four straight, level lines; in it
   the roadster's two bucket seats, dashboard and steering wheel, and
   an arched windshield raked back from its front edge. Tail lights under the tail's sweep, and four wheels with hubcaps on axles hung from a dark
   chassis beam under the body. Faces +X; its origin on the ground
   under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second;
   `seat` is where a driver sits, the top of the left cushion.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `body` the duck (the tail, the head and tuft too), `wing` its wings,
// `bill` the bill, `lamp` the domes of its eyes (lit, they are the
// headlights), `pupil` the pupils, `trim` the seats and hubcaps, `dash`
// the cockpit's floor, walls and lip, the dashboard, the steering
// wheel, the chassis and the axles, `tail` the tail lights.
export const DUCKCAR = {
  scale: 1.165, // built about 3.6 long, bill to tail; scaled so a character fills the driver's seat at its walking height (CAT_HEIGHT, 1.31 — the seat was built for 1.8 at 1.6)
  body: 0xffd51e,
  wing: 0xf7c210,
  bill: 0xff8a1c,
  pupil: 0x1c1a1a,
  trim: 0xfff6e0,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The duck, in the car's own units (before `scale`). Its body is the
// fish car's in profile: an axis along x from the tail, TAILX, to the
// chest, NOSEX, at height CY, its skin a radius `radius(x)` from the
// axis, stretched SY up and SZ across; fattest PEAK of the way along,
// STALK of R where it is thinnest at the tail, the nose rounded off
// over NOSE of the length and the tail's end over TAILEND. Behind the
// cockpit the body `sweep`s up into the tail: the axis rises RISE by
// the tail's tip, the skin pinches PINCH across and grows TALL. The
// WELL is the cockpit (tray.js) cut into its back, its floor FLOOR,
// the back levelled round it to its rim, TOP (not capped: the tail
// rises over the rim behind it). HEAD is the head's middle and its
// radius, a ball (HEADY as tall and HEADZ as wide as it is long)
// ahead of the nose and over the chest, grown out of the body in one
// skin: each slice across the car is the body's and the head's
// together, their edges rounded into one another where they are
// within BLEND of each other.
const TAILX = -1.25, NOSEX = 1.3, R = 0.8, SY = 1.0, SZ = 1.3, CY = 1.08;
const PEAK = 0.45, STALK = 0.3, NOSE = 0.04, TAILEND = 0.03;
const RISE = 0.6, PINCH = 0.55, TALL = 0.5;
const WELL = { x0: -0.6, x1: -0.6 + COCKPIT.len, z1: COCKPIT.half }, FLOOR = CY + 0.04, TOP = FLOOR + COCKPIT.depth;
const LEVEL = leveller(WELL, TOP, { cap: false });
const HEAD = { x: 1.5, y: 1.5, r: 0.52 }, HEADY = 0.96, HEADZ = 1.02, BLEND = 0.14;
const FRONTX = HEAD.x + HEAD.r; // the skin's front end, the front of the head

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const radius = (x) => {
  const u = (x - TAILX) / (NOSEX - TAILX);
  if (u <= 0 || u >= 1) return 0;
  // swells from the tail to the peak, then rounds off to the nose,
  // steeply at either end so the chest is blunt and the tail's point broad
  const hump = u < PEAK ? Math.pow(Math.sin((Math.PI / 2) * (u / PEAK)), 0.75) : Math.pow(Math.cos((Math.PI / 2) * ((u - PEAK) / (1 - PEAK))), 0.4);
  return R * (STALK + (1 - STALK) * hump) * Math.min(1, Math.sqrt((1 - u) / NOSE), Math.sqrt(u / TAILEND));
};
// how far into the tail's sweep `x` is, 0 behind the cockpit .. 1 at the tip
const sweep = (x) => smooth(-0.7, TAILX, x);
const lift = (x) => RISE * Math.pow(sweep(x), 1.3);
const tall = (x) => SY * (1 + TALL * sweep(x)), across = (x) => SZ * (1 - PINCH * sweep(x));
// The slice across the car at `x`, of the body and of the head: an
// ellipse, its middle's height `y`, `a` its half-height and `b` its
// half-width (0 where there is nothing).
const bodySlice = (x) => {
  const r = radius(x);
  return { y: CY + lift(x), a: tall(x) * r, b: across(x) * r };
};
const headSlice = (x) => {
  const dx = x - HEAD.x, r = Math.abs(dx) < HEAD.r ? Math.sqrt(HEAD.r * HEAD.r - dx * dx) : 0;
  return { y: HEAD.y, a: HEADY * r, b: HEADZ * r };
};
// How far it is from (cy, 0) in the slice, along the direction (uy,
// uz), to the far edge of the ellipse `e`: 0 if the ray misses it (or
// there is no ellipse).
function reach(e, cy, uy, uz) {
  if (!(e.a > 1e-6)) return 0;
  const dy = cy - e.y, A = (uy / e.a) ** 2 + (uz / e.b) ** 2, B = (2 * dy * uy) / (e.a * e.a), D = B * B - 4 * A * ((dy / e.a) ** 2 - 1);
  return D < 0 ? 0 : Math.max(0, (-B + Math.sqrt(D)) / (2 * A));
}
// the larger of two reaches, the two rounded into one another where
// they are within BLEND of each other (so the skins meet in a fillet)
const smax = (p, q) => {
  const h = Math.max(BLEND - Math.abs(p - q), 0) / BLEND;
  return Math.max(p, q) + (h * h * BLEND) / 4;
};
// A point on the skin at `x`, `phi` round from the top (0 the back, PI
// the belly, positive to +z): the body's slice and the head's as one
// loop, measured out from a middle that climbs from the body's to the
// head's as the head takes over from the chest.
function skinAt(x, phi) {
  const b = bodySlice(x), h = headSlice(x), cy = b.y + (h.y - b.y) * smooth(HEAD.x - HEAD.r, NOSEX, x);
  const uy = Math.cos(phi), uz = Math.sin(phi), t = smax(reach(b, cy, uy, uz), reach(h, cy, uy, uz));
  return new THREE.Vector3(x, cy + t * uy, t * uz);
}
// …and the skin's outward normal there, from its slopes along and round
const Y = new THREE.Vector3(0, 1, 0);
function onBody(x, phi) {
  const e = 1e-3;
  const dx = skinAt(x + e, phi).sub(skinAt(x - e, phi)), dphi = skinAt(x, phi + e).sub(skinAt(x, phi - e));
  return { at: skinAt(x, phi), normal: dphi.cross(dx).normalize() };
}

// The body and head, one skin: rings along x from the tail to the
// front of the head, closer together toward the ends where the skin
// turns fastest, each a loop round the slice; the first and last
// rings, at the tips, shrink to a point. Then cut through by the well
// and levelled round it (tray.js).
function bodyGeometry() {
  const RINGS = 120, AROUND = 96, pos = [], idx = [];
  for (let i = 0; i <= RINGS; i++) {
    const t = i / RINGS, u = 0.5 - 0.5 * Math.cos(Math.PI * t); // bunched toward both tips
    const x = TAILX + u * (FRONTX - TAILX);
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

// A wing, lying flat against the flank on side `s` (+1 the +z flank).
// In outline a fish's pectoral fin — a round shoulder, a leading edge
// sweeping back to a rounded tip, a hollowed trailing edge — drawn
// with its shoulder at the origin and its tip out to +y, then turned
// WTILT so the tip points back along the body and a little up, and
// laid on the skin with the shoulder at WX, WPHI round from the top,
// the outline's y running up the flank. Raised off the skin as a low
// lens, WLIFT proud at its middle and down to the skin at its edge.
const WX = 0.5, WPHI = 1.45, WTILT = 0.44, WSCALE = 0.9, WLIFT = 0.06;
function wingGeometry(s) {
  const outline = new THREE.Shape();
  outline.moveTo(-0.42, 0);
  outline.quadraticCurveTo(-0.14, -0.3, 0.14, 0); // the shoulder, round
  outline.quadraticCurveTo(-0.08, 0.5, -0.72, 0.7); // the leading edge, out to the tip
  outline.quadraticCurveTo(-0.92, 0.76, -0.86, 0.56); // the tip, rounded off
  outline.quadraticCurveTo(-0.55, 0.3, -0.42, 0); // the trailing edge, hollowed, back to the root
  const pts = outline.getPoints(10);
  if (pts[pts.length - 1].distanceTo(pts[0]) < 1e-6) pts.pop();
  const rim = pts.map((p) => p.clone().rotateAround(new THREE.Vector2(), WTILT).multiplyScalar(WSCALE));
  const centre = rim.reduce((c, p) => c.add(p), new THREE.Vector2()).multiplyScalar(1 / rim.length);
  // the outline's y, a length up the flank, as an angle round it there
  const arc = (x) => (radius(x) * (SY + SZ)) / 2;
  const K = rim.length, RINGS = 6, pos = [], idx = [];
  for (let r = 0; r <= RINGS; r++) {
    const t = r / RINGS;
    for (const p of rim) {
      const q = centre.clone().lerp(p, t), x = WX + q.x;
      const { at, normal } = onBody(x, s * (WPHI - q.y / arc(x)));
      pos.push(...at.addScaledVector(normal, 0.006 + WLIFT * (1 - t * t)).toArray());
    }
  }
  for (let r = 0; r < RINGS; r++)
    for (let k = 0; k < K; k++) {
      const a = r * K + k, b = r * K + ((k + 1) % K), c = a + K, d = b + K;
      if (s > 0) idx.push(a, d, b, a, c, d);
      else idx.push(a, b, d, a, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

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
  // at the origin, turned to the skin's normal at (`x`, `phi`), and
  // sunk `sink` into it.
  const stickOn = (x, phi, geo, color, extra, sink = 0) => {
    const { at, normal } = onBody(x, phi);
    const mesh = add(geo, color, 0, 0, 0, extra);
    mesh.position.copy(at).addScaledVector(normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, normal);
    return mesh;
  };

  // the body, tail and head, one skin — two-sided, so what little of
  // the inside the well's walls miss shows skin, not nothing
  add(bodyGeometry(), C.body, 0, 0, 0, { side: THREE.DoubleSide });

  // the cockpit, cut into the back (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // a wing flat against each flank
  for (const s of [-1, 1]) add(wingGeometry(s), C.wing, 0, 0, 0);

  // on the head: a little tuft of three curls on top
  const H = new THREE.Vector3(HEAD.x, HEAD.y, 0);
  const tuft = [];
  for (const [lean, turn, len] of [[-0.5, 0, 0.24], [-0.15, 0.35, 0.18], [-0.15, -0.35, 0.18]])
    tuft.push(new THREE.ConeGeometry(0.06, len, 10).translate(0, len / 2, 0).rotateZ(lean).rotateY(turn).translate(H.x - 0.05, H.y + HEAD.r * 0.94, 0));
  add(mergeGeometries(tuft), C.body, 0, 0, 0);

  // the bill: wide and flat, an upper bill sticking well out of the
  // front of the head with a smaller lower bill under it
  add(new THREE.SphereGeometry(1, 32, 16).scale(0.4, 0.1, 0.33), C.bill, H.x + HEAD.r * 0.8, H.y - 0.1, 0);
  add(new THREE.SphereGeometry(1, 24, 12).scale(0.3, 0.07, 0.26), C.bill, H.x + HEAD.r * 0.72, H.y - 0.2, 0);

  // the eyes, the headlights, the fish car's: a lit dome on each side
  // of the face, a half-sphere with its flat base sunk a hair under the
  // head's skin so the rim never lifts off the curve, and a dark pupil
  // on its crown
  const eyeGeo = new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, -0.03, 0);
  const pupilGeo = new THREE.SphereGeometry(0.07, 14, 10).translate(0, 0.1, 0);
  for (const s of [-1, 1]) {
    const d = new THREE.Vector3(0.72, 0.42, s * 0.52).normalize(), eyeAt = H.clone().addScaledVector(d, HEAD.r - 0.03);
    for (const [geo, color, extra] of [[eyeGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.5 }], [pupilGeo, C.pupil]]) {
      const mesh = add(geo, color, eyeAt.x, eyeAt.y, eyeAt.z, extra);
      mesh.quaternion.setFromUnitVectors(Y, d);
    }
  }

  // tail lights under the tail's sweep, each turned to face out of the
  // skin where it sits
  const tailGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 14).translate(0, 0.015, 0);
  for (const s of [-1, 1]) stickOn(-0.95, s * 2.2, tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 });

  // the chassis: a dark beam under the belly, the two axles across it,
  // and four wheels, each with a hubcap, turning on an axle along z
  box(2.0, 0.16, 0.3, C.dash, 0, C.wheelR + 0.06, 0);
  const axleGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.9, 10).rotateX(Math.PI / 2);
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  for (const x of [-0.92, 0.92]) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
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
