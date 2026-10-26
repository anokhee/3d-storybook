/* ============================================================
   FISH CAR: the roadster (car.js) remade as a fish. The whole body is
   one plump fish, head first, facing +X: a profile turned on a lathe
   about the car's length, wider than it is tall, blunt at the
   nose and pinched to a stalk at the tail, where a forked TAIL FIN
   stands; a dorsal fin on its back, a pectoral fin out of each flank,
   a lighter BELLY, and stripes round the body if it wears them. Its
   headlights are its EYES, two domes on the head with pupils, and two
   fat LIPS band across the nose. Driven, it swims: the tail beats, the
   dorsal fin sways and the pectorals row (roll). The COCKPIT is a well cut into its back
   just behind the head like a cookie cutter: the back is flattened to
   one level round it, so its rim is four straight, level lines, every
   triangle trimmed against the well's footprint, and a solid lip laid
   round the cut — with a floor and four walls, the roadster's two
   bucket seats, a dashboard and steering wheel, and a framed windshield
   raked back in it. Under
   it all, the roadster's four wheels with hubcaps, on axles hung from a
   dark chassis beam, so the fish stands clear of the ground. Faces +X;
   its origin on the ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second,
   and flaps the fins, the quicker the faster it goes;
   `seat` is where a driver sits, the top of the left cushion.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `body` the fish, `belly` its underside, `fin` every fin, `trim` the
// seats, the hubcaps, `stripes` whether it
// wears its two white stripes, `dash` the cockpit's floor, walls and
// lip, the dashboard, the steering wheel, the mouth and the
// pupils, `lamp` the eyes (lit, they are the headlights). A
// pufferfish's: `spikes` whether it bristles with them (in `spike`
// colour), `spots` whether its back and flanks are spotted (in `spot`),
// and `mouth` "lips", two fat lips across the nose, "grin", a line
// grinning across it, or "pout", a pursed ring (lips in `lips`).
// The fins: `fins` "swept", big and pointed, or "round", small
// paddles; `pectoralX` where along the body the pectorals root and
// `pectoralY` how high up the flank (a height, in the car's units);
// `dorsal` how tall the dorsal fin stands; `tail` "fork", "shark" (a
// crescent, its top lobe the longer) or "paddle" (a fan, no lobes).
// A shark's: `peak`, `stalk` and `nose` reshape the body (where it is
// fattest, 0 tail .. 1 nose; the tail stalk's share of the radius; how
// far back the nose starts to taper, so a bigger one is a pointier
// snout), `gills` how many slits each flank has, `teeth` whether the
// grin is jagged, `bill` how long a swordfish's sword is (0 for none, in
// `billColor`), `lure` whether an anglerfish's glowing bulb (in `lureColor`)
// hangs on a stalk over the snout, `mouthX` where along the body the grin lies, `eyeX`
// where the eyes sit.
export const FISHCAR = {
  scale: 1.6, // built about 2.9 long; the game scales it up to fit a driver
  body: 0xf07f1f,
  belly: 0xffc98a,
  fin: 0xd9532b,
  trim: 0xf3e3b4,
  stripes: true,
  stripe: 0xfff8ea, // the stripes, whiter than the trim
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  spikes: false,
  spike: 0xfff0c8,
  spots: false,
  spot: 0x7a5a32,
  mouth: "lips",
  lips: 0xd9826b,
  peak: 0.45,
  stalk: 0.18,
  nose: 0.04,
  tail: "fork",
  fins: "swept",
  pectoralX: 0.6,
  pectoralY: 0.96,
  dorsal: 0.78,
  gills: 0,
  teeth: false,
  lure: false,
  bill: 0,
  billColor: 0x4a5560,
  lureColor: 0xfff2a8,
  mouthX: 1.21,
  eyeX: 0.98,
  wheelR: 0.3,
};
// an anglerfish: round and dark, a wide toothy grin, and a lamp of its own
// dangling over the snout on a stalk
export const ANGLERFISH = {
  ...FISHCAR,
  body: 0x4b3c5e,
  belly: 0x8d749f,
  fin: 0x2f2542,
  stripes: false,
  peak: 0.6,
  stalk: 0.14,
  nose: 0.08,
  tail: "fork",
  dorsal: 0.3,
  teeth: true,
  lure: true,
  mouthX: 1.15,
  eyeX: 0.9,
};
// a swordfish: sleek and dark blue on a shark's body, a tall sail of a
// dorsal fin, a crescent tail, and a long sword out of its snout where
// its upper lip would be (only the lower lip is drawn under it)
export const SWORDFISH = {
  ...FISHCAR,
  body: 0x3d5f8f,
  belly: 0xe3ecf2,
  fin: 0x2c4468,
  stripes: false,
  peak: 0.5,
  stalk: 0.12,
  nose: 0.3,
  tail: "shark",
  dorsal: 0.95,
  bill: 1.4,
  mouthX: 1.0,
  eyeX: 0.86,
};
export const SHARK = {
  ...FISHCAR,
  body: 0x7b93a8,
  belly: 0xf2f6f8,
  fin: 0x5f7689,
  stripes: false,
  peak: 0.5,
  stalk: 0.12,
  nose: 0.3,
  tail: "shark",
  dorsal: 0.8,
  gills: 3,
  teeth: true,
  mouth: "grin",
  mouthX: 1.0,
  eyeX: 0.86,
};
// the pufferfish's fins are small and round, its pectorals high on the
// flanks by the middle of the body, just under the cockpit's rim (about
// a fifth of the way down from the top), its tail a fan
export const PUFFERFISH = { ...FISHCAR, body: 0xe8c25a, belly: 0xfff3d6, fin: 0xe0a63c, stripes: false, spikes: true, spots: true, mouth: "pout", fins: "round", tail: "paddle", dorsal: 0.3, pectoralX: -0.05, pectoralY: 1.39 };

// The fish, in the car's own units (before `scale`). Its axis runs
// along x from the tail stalk to the nose at height CY, its skin a
// radius `radius(x)` from the axis, stretched SY up and SZ across. The
// WELL is the cockpit (tray.js) cut into its back, its floor FLOOR, the
// back levelled round it to its rim, TOP. The fish is broad enough round
// the cockpit that its corners, and the lip round them, stay up on its
// back, where there is skin under them.
const TAILX = -1.25, NOSEX = 1.3, R = 0.8, SY = 1.0, SZ = 1.3, CY = 1.08;
const PEAK = 0.45, STALK = 0.18, NOSE = 0.04; // where the body is fattest (0 tail .. 1 nose), the tail stalk's share of R, the nose's rounding
// …as the fish being built has them (FISHCAR's `peak`, `stalk` and `nose`)
let SHAPE = { peak: PEAK, stalk: STALK, nose: NOSE };
const WELL = { x0: -0.6, x1: -0.6 + COCKPIT.len, z1: COCKPIT.half }, FLOOR = CY + 0.04, TOP = FLOOR + COCKPIT.depth;
const LEVEL = leveller(WELL, TOP);
const STRIPES = [[0.64, 0.8], [-0.88, -0.72]]; // x spans, each a few rings of the lathe, clear of the cockpit
const BELLY = -0.45; // the belly is the skin below this cosine of the angle from the top (between two of the lathe's rows, so the line is clean)

const radius = (x) => {
  const u = (x - TAILX) / (NOSEX - TAILX);
  if (u <= 0 || u >= 1) return 0;
  // swells from the stalk to the peak, then rounds off to the nose,
  // steeply at the very end so the nose is blunt, not pointed
  const { peak, stalk, nose } = SHAPE;
  const hump = u < peak ? Math.pow(Math.sin((Math.PI / 2) * (u / peak)), 0.75) : Math.pow(Math.cos((Math.PI / 2) * ((u - peak) / (1 - peak))), 0.4);
  return R * (stalk + (1 - stalk) * hump) * Math.min(1, Math.sqrt((1 - u) / nose));
};
// the skin's height over (x, z), on top of the body
const skin = (x, z) => CY + SY * Math.sqrt(Math.max(0, radius(x) ** 2 - (z / SZ) ** 2));
// the back's height over (x, z), levelled round the well; whether that
// differs from the skin's there
const back = (x, z) => LEVEL.height(skin(x, z), x, z);
const reshaped = (x, z) => LEVEL.reshaped(skin(x, z), x, z);
// A point on the skin at `x`, `phi` round from the top (0 the back, PI
// the belly, positive to +z), and the skin's normal there.
const Y = new THREE.Vector3(0, 1, 0);
function onBody(x, phi) {
  const r = radius(x), slope = (radius(x + 1e-3) - radius(x - 1e-3)) / 2e-3;
  return {
    at: new THREE.Vector3(x, CY + SY * r * Math.cos(phi), SZ * r * Math.sin(phi)),
    normal: new THREE.Vector3(-slope, Math.cos(phi) / SY, Math.sin(phi) / SZ).normalize(),
  };
}
// The x on the nose where the skin passes `dy` off the axis and `z`
// across: past the body's peak the radius only shrinks towards NOSEX,
// so there is one x there with that radius, found by bisection.
function noseAt(dy, z) {
  const want = Math.hypot(dy / SY, z / SZ);
  let lo = TAILX + SHAPE.peak * (NOSEX - TAILX), hi = NOSEX;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (radius(mid) > want) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const EYE = 1.25; // the eyes' angle round from the top, either side of the head
const steps = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

// The body, turned on the lathe and split three ways by its triangles:
// the belly, the stripes and the rest, each its own geometry, each with
// the well cut through it and the back levelled round it (tray.js). The
// lathe's rings are at fixed x and its rows at fixed angles, so the
// belly's and the stripes' edges fall clean between triangles.
function bodyGeometries(stripes) {
  const RINGS = 56, AROUND = 96, pts = [new THREE.Vector2(0, TAILX - 0.02)];
  for (let i = 0; i <= RINGS; i++) {
    const u = 1 - Math.pow(1 - i / RINGS, 1.4); // rings closer together toward the nose, where the skin turns fastest
    const x = TAILX + u * (NOSEX - TAILX);
    pts.push(new THREE.Vector2(radius(x), x));
  }
  const lathe = new THREE.LatheGeometry(pts, AROUND).rotateZ(-Math.PI / 2).scale(1, SY, SZ).translate(0, CY, 0);
  const pos = lathe.attributes.position, index = lathe.index.array, v = new THREE.Vector3();
  const parts = { body: [], belly: [], stripe: [] };
  for (let t = 0; t < index.length; t += 3) {
    let belly = true, stripe = true, band = null;
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, index[t + k]);
      const up = (v.y - CY) / SY, rho = Math.hypot(up, v.z / SZ);
      if (!(rho > 1e-6) || up / rho >= BELLY) belly = false;
      const hit = STRIPES.find(([a, b]) => v.x >= a - 1e-3 && v.x <= b + 1e-3);
      if (!hit || (band && hit !== band)) stripe = false;
      band = band ?? hit;
    }
    (stripes && stripe ? parts.stripe : belly ? parts.belly : parts.body).push(index[t], index[t + 1], index[t + 2]);
  }
  const part = (list) => {
    if (!list.length) return null;
    const g = lathe.clone();
    g.setIndex(list);
    return cutThrough(g, WELL, FLOOR, LEVEL);
  };
  return { body: part(parts.body), belly: part(parts.belly), stripe: part(parts.stripe) };
}

// A fin: a flat shape in the fish's side view, `depth` thick, centred
// across its thickness.
const fin = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 }).translate(0, 0, -depth / 2);

export function buildFishCar(finish, C = FISHCAR) {
  SHAPE = { peak: C.peak ?? PEAK, stalk: C.stalk ?? STALK, nose: C.nose ?? NOSE };
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

  // the body, its belly and its stripes — two-sided, so what little of
  // the inside the well's walls miss shows skin, not nothing
  const both = { side: THREE.DoubleSide };
  const skins = bodyGeometries(C.stripes);
  add(skins.body, C.body, 0, 0, 0, both);
  if (skins.belly) add(skins.belly, C.belly, 0, 0, 0, both);
  if (skins.stripe) add(skins.stripe, C.stripe, 0, 0, 0, both);

  // the cockpit, cut into the back (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // the fins, big, each hung on a hinge at its root so it can flap (see
  // roll): the tail fin out of the stalk, beating side to side; the
  // dorsal fin on the back behind the cockpit, its base sunk along the
  // skin's slope, swaying; a pectoral fin out of each flank, swept back
  // and drooping, rowing up and down
  const hinge = (mesh, x, y, z) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    mesh.position.sub(pivot.position);
    pivot.add(mesh);
    group.add(pivot);
    return pivot;
  };
  const tail = new THREE.Shape();
  if (C.tail === "shark") {
    // a crescent, its top lobe the longer
    tail.moveTo(-1.1, 0.12);
    tail.lineTo(-2.0, 1.3);
    tail.quadraticCurveTo(-1.66, 0.42, -1.54, 0.02);
    tail.quadraticCurveTo(-1.65, -0.24, -1.82, -0.68);
    tail.lineTo(-1.1, -0.12);
  } else if (C.tail === "paddle") {
    // a fan: a tapered slab out of the stalk, widening to a flat end
    // with its corners rounded off
    tail.moveTo(-1.1, 0.12);
    tail.lineTo(-1.66, 0.42);
    tail.quadraticCurveTo(-1.76, 0.48, -1.78, 0.36);
    tail.lineTo(-1.78, -0.36);
    tail.quadraticCurveTo(-1.76, -0.48, -1.66, -0.42);
    tail.lineTo(-1.1, -0.12);
  } else {
    tail.moveTo(-1.1, 0.14);
    tail.lineTo(-2.0, 0.98);
    tail.quadraticCurveTo(-1.62, 0.3, -1.5, 0);
    tail.quadraticCurveTo(-1.62, -0.3, -2.0, -0.98);
    tail.lineTo(-1.1, -0.14);
  }
  tail.closePath();
  const tailFin = hinge(add(fin(tail, 0.06), C.fin, 0, CY, 0), -1.1, CY, 0);
  const round = C.fins === "round";
  const DA = round ? -0.8 : -0.76, DB = round ? -1.08 : -1.16, dorsal = new THREE.Shape();
  dorsal.moveTo(DA, back(DA, 0) - 0.08);
  if (round) {
    // a rounded hump, leaning back a little
    const DM = (DA + DB) / 2 - 0.04;
    dorsal.quadraticCurveTo(DA - 0.02, back(DA, 0) + C.dorsal * 0.95, DM, back(DM, 0) + C.dorsal);
    dorsal.quadraticCurveTo(DB + 0.02, back(DB, 0) + C.dorsal * 0.8, DB, back(DB, 0) - 0.08);
  } else {
    dorsal.lineTo(-0.93 - (C.dorsal - 0.42) * 0.25, back(DA, 0) + C.dorsal);
    dorsal.quadraticCurveTo(-1.1, back(DB, 0) + 0.2 + C.dorsal * 0.15, DB, back(DB, 0) - 0.08);
  }
  for (let i = 1; i < 6; i++) dorsal.lineTo(DB + ((DA - DB) * i) / 6, back(DB + ((DA - DB) * i) / 6, 0) - 0.08);
  dorsal.closePath();
  const dorsalFin = hinge(add(fin(dorsal, 0.05), C.fin, 0, 0, 0), (DA + DB) / 2, back((DA + DB) / 2, 0), 0);
  // a pectoral fin: drawn flat as seen from above, its root along the
  // flank at (pectoralX, pectoralY) and its tip out to +y; swept, a
  // long point raked back, or round, a short paddle. Turned onto the +z
  // flank and tilted: the swept fin droops, the round one stands out
  // along the skin, square to it. The other side is its mirror.
  const pectoral = new THREE.Shape();
  if (round) {
    pectoral.moveTo(0.15, 0);
    pectoral.quadraticCurveTo(0.14, 0.3, -0.1, 0.34);
    pectoral.quadraticCurveTo(-0.3, 0.32, -0.17, 0);
  } else {
    pectoral.moveTo(0.1, 0);
    pectoral.quadraticCurveTo(-0.15, 0.55, -0.9, 0.78);
    pectoral.quadraticCurveTo(-0.52, 0.34, -0.42, 0);
  }
  pectoral.closePath();
  const pectoralGeo = fin(pectoral, 0.04).rotateX(Math.PI / 2);
  // where the root meets the skin: the angle round from the top at that
  // height, and how far out the flank is there
  const PX = C.pectoralX, PR = radius(PX), PPHI = Math.acos(Math.max(-1, Math.min(1, (C.pectoralY - CY) / (SY * PR))));
  const pectoralRest = round ? -(Math.PI / 2 - PPHI) : 0.5, pectoralBeat = round ? 0.3 : 0.38;
  const pectoralFins = [-1, 1].map((s) => {
    const f = add(pectoralGeo, C.fin, PX, C.pectoralY, s * (SZ * PR * Math.sin(PPHI) - 0.06));
    f.scale.z = s;
    f.rotation.x = s * pectoralRest;
    return f;
  });

  // the eyes, the headlights: a lit dome on each side of the head, a
  // half-sphere with its flat base sunk a hair under the skin so the
  // rim never lifts off the curve, and a dark pupil on its crown; and
  // the mouth on the nose
  const eyeGeo = new THREE.SphereGeometry(0.19, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, -0.03, 0);
  const pupilGeo = new THREE.SphereGeometry(0.08, 14, 10).translate(0, 0.12, 0);
  for (const s of [-1, 1]) {
    stickOn(C.eyeX, s * EYE, eyeGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.5 });
    stickOn(C.eyeX, s * EYE, pupilGeo, C.dash);
  }
  if (C.mouth === "pout") stickOn(NOSEX - 0.03, Math.PI, new THREE.TorusGeometry(0.07, 0.035, 10, 20).rotateX(Math.PI / 2), C.lips);
  else if (C.mouth === "lips") {
    // two fat lips, an upper and a lower, each a tube laid level across
    // the front of the nose just off the axis, bowing back with the skin
    // to either side, its ends dipped under the skin (a swordfish keeps
    // only the lower one: its sword comes out where the upper lip was)
    for (const dy of C.bill > 0 ? [-0.06] : [0.06, -0.06]) {
      const lip = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 10 - 1, z = 0.38 * t;
        const { at, normal } = onBody(noseAt(dy, z), Math.atan2(z / SZ, dy / SY));
        lip.push(at.addScaledVector(normal, 0.012 - 0.08 * Math.pow(Math.abs(t), 6)));
      }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lip), 40, 0.055, 10, false), C.lips, 0, 0, 0);
    }
  } else {
    // a line grinning across the nose, a tube along the skin
    const grin = [];
    for (let i = 0; i <= 16; i++) {
      const { at, normal } = onBody(C.mouthX, Math.PI + 1.1 * (i / 8 - 1));
      grin.push(at.addScaledVector(normal, 0.01));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(grin), 32, 0.022, 8, false), C.dash, 0, 0, 0);
    // a shark's teeth: a row of small white points standing out of the grin
    if (C.teeth) {
      const toothGeo = new THREE.ConeGeometry(0.035, 0.1, 5).translate(0, 0.05, 0);
      for (let i = 1; i < 16; i++) {
        const { at, normal } = onBody(C.mouthX, Math.PI + 1.1 * (i / 8 - 1));
        const tooth = add(toothGeo, C.stripe, 0, 0, 0);
        tooth.position.copy(at).addScaledVector(normal, -0.01);
        tooth.quaternion.setFromUnitVectors(Y, normal);
      }
    }
  }
  // a swordfish's sword, `bill` long, out of the snout where the upper
  // lip would be, just over the axis and tilted up a touch: turned on a
  // lathe with a concave taper, broad at its root (sunk a way into the
  // snout, so it grows out of the skin, not off it) and thinning fast to
  // a needle point
  if (C.bill > 0) {
    const SUNK = 0.3, ROOT = 0.15, L = C.bill + SUNK, TILT = 0.06, pts = [];
    for (let i = 0; i <= 24; i++) {
      const s = i / 24;
      pts.push(new THREE.Vector2(ROOT * Math.pow(1 - s, 1.6) + (s < 1 ? 0.004 : 0), s * L));
    }
    const sword = new THREE.LatheGeometry(pts, 12).rotateZ(-Math.PI / 2).rotateZ(TILT).translate(noseAt(0.1, 0) - SUNK, CY + 0.1, 0);
    add(sword, C.billColor, 0, 0, 0);
  }
  // an anglerfish's lure: a stalk arching up out of the forehead and forward
  // over the snout, a glowing bulb hung on its tip
  if (C.lure) {
    const root = onBody(0.75, 0).at, top = root.y + 0.32, tip = new THREE.Vector3(1.55, top - 0.12, 0);
    const stalk = new THREE.CatmullRomCurve3([root.clone().add(new THREE.Vector3(0, -0.04, 0)), new THREE.Vector3(0.75, top - 0.05, 0), new THREE.Vector3(1.2, top + 0.1, 0), tip]);
    add(new THREE.TubeGeometry(stalk, 20, 0.022, 6, false), C.dash, 0, 0, 0);
    add(new THREE.SphereGeometry(0.11, 16, 12), C.lureColor, tip.x, tip.y - 0.1, 0, { emissive: C.lureColor, emissiveIntensity: 0.9 });
  }
  // gills: short dark slits across each flank, behind the eye
  for (let g = 0; g < C.gills; g++) {
    for (const s of [-1, 1]) {
      const slit = [];
      for (let i = 0; i <= 6; i++) {
        const { at, normal } = onBody(0.5 - g * 0.09 + (C.eyeX > 0.9 ? 0.1 : 0), s * (0.85 + 0.4 * (i / 6)));
        slit.push(at.addScaledVector(normal, 0.008));
      }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(slit), 12, 0.014, 6, false), C.dash, 0, 0, 0);
    }
  }

  // a pufferfish's spikes and spots, on a grid over the skin, rings
  // along the body, staggered, spaced evenly round each ring: kept off
  // the flattened back round the cockpit, the belly over the wheels, and
  // the eyes and fins. Each kind is merged into one mesh.
  if (C.spikes || C.spots) {
    const clear = (x, phi) => {
      const a = Math.abs(phi), { at } = onBody(x, phi);
      if (at.y > CY && reshaped(at.x, at.z)) return false; // the flattened back
      if (a > 2.3) return false; // under the belly
      if (x > 0.78 && x < 1.18 && a > EYE - 0.35 && a < EYE + 0.35) return false; // the eyes
      if (Math.abs(x - PX) < (round ? 0.25 : 0.4) && Math.abs(a - PPHI) < (round ? 0.3 : 0.4)) return false; // the pectorals
      if (x < -0.68 && a < 0.4) return false; // the dorsal fin
      return true;
    };
    const placed = (geo, x, phi, sink) => {
      const { at, normal } = onBody(x, phi);
      return geo.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, normal)).translate(...at.addScaledVector(normal, -sink).toArray());
    };
    // a spike: a stubby cone, its tip rounded off with a ball
    const spikeGeo = mergeGeometries([
      new THREE.CylinderGeometry(0.021, 0.0625, 0.12, 8).translate(0, 0.06, 0),
      new THREE.SphereGeometry(0.021, 8, 6).translate(0, 0.12, 0),
    ]);
    const spotGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 14).translate(0, 0.01, 0);
    // a grid over the skin, `step` apart: rings along the body, staggered,
    // spaced evenly round each ring
    const grid = (step, each) =>
      steps(-0.95, 1.12, Math.round(2.07 / step)).forEach((x, i) => {
        const arc = step / (radius(x) * (SY + SZ) / 2), n = Math.floor(2.3 / arc);
        for (let j = -n; j <= n; j++) each(x, (j + (i % 2) * 0.5) * arc, i, j, arc);
      });
    const spikes = [], spots = [], STEP = 0.16;
    if (C.spikes) grid(0.24, (x, phi) => clear(x, phi) && spikes.push(placed(spikeGeo, x, phi, 0.01)));
    // the spots, on the back and flanks, a scatter of them
    if (C.spots)
      grid(STEP, (x, phi, i, j, arc) => {
        const sx = x + STEP / 2, sphi = phi + arc / 2;
        if (Math.abs(sphi) < 1.6 && sx < 1.1 && clear(sx, sphi) && Math.abs(Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1 > 0.4) spots.push(placed(spotGeo, sx, sphi, 0.005));
      });
    if (spikes.length) add(mergeGeometries(spikes), C.spike, 0, 0, 0);
    if (spots.length) add(mergeGeometries(spots), C.spot, 0, 0, 0);
  }

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
  // Driven: the wheels turn for the speed, and the fish swims — the
  // tail beats side to side, the dorsal fin sways after it, and the
  // pectorals row up and down, all the quicker the faster it goes.
  let stroke = 0;
  const roll = (dt, speed) => {
    for (const w of wheels) w.rotation.z -= (speed * dt) / C.wheelR;
    stroke += dt * (3.5 + Math.abs(speed) * 0.7);
    tailFin.rotation.y = 0.42 * Math.sin(stroke);
    dorsalFin.rotation.x = 0.16 * Math.sin(stroke - 0.8);
    pectoralFins.forEach((f, i) => (f.rotation.x = (i ? 1 : -1) * (pectoralRest + pectoralBeat * Math.sin(stroke * 1.3 + (i ? 0 : Math.PI)))));
  };
  return { group, wheels, roll, seat };
}
