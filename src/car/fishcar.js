/* ============================================================
   FISH CAR: the roadster (car.js) remade as a fish. The whole body is
   one plump fish, head first, facing +X: a profile turned on a lathe
   about the car's length, wider than it is tall, blunt at the
   nose and pinched to a stalk at the tail, where a forked TAIL FIN
   stands; a dorsal fin on its back, a pectoral fin out of each flank,
   a lighter BELLY, and stripes round the body if it wears them. Its
   headlights are its EYES, two balls on the head with pupils, and a
   mouth grins across the nose. The COCKPIT is a well cut into its back
   just behind the head like a cookie cutter: the back is flattened to
   one level round it, so its rim is four straight, level lines, every
   triangle trimmed against the well's footprint, and a solid lip laid
   round the cut — with a floor and four walls, the roadster's two
   bucket seats, a dashboard and steering wheel, and a framed windshield
   standing upright in it. Under
   it all, the roadster's four wheels with hubcaps, on axles hung from a
   dark chassis beam, so the fish stands clear of the ground. Faces +X;
   its origin on the ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second;
   `seat` is where a driver sits, the top of the left cushion.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `body` the fish, `belly` its underside, `fin` every fin, `trim` the
// seats, the hubcaps and the windshield frame, `stripes` whether it
// wears its two white stripes, `dash` the cockpit's floor, walls and
// lip, the dashboard, the steering wheel, the mouth and the
// pupils, `lamp` the eyes (lit, they are the headlights). A
// pufferfish's: `spikes` whether it bristles with them (in `spike`
// colour), `spots` whether its back and flanks are spotted (in `spot`),
// and `mouth` "grin" or "pout", a pursed ring of lips (in `lips`).
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
  mouth: "grin",
  lips: 0xd9826b,
  wheelR: 0.3,
};
export const PUFFERFISH = { ...FISHCAR, body: 0xe8c25a, belly: 0xfff3d6, fin: 0xe0a63c, stripes: false, spikes: true, spots: true, mouth: "pout" };

// The fish, in the car's own units (before `scale`). Its axis runs
// along x from the tail stalk to the nose at height CY, its skin a
// radius `radius(x)` from the axis, stretched SY up and SZ across. The
// WELL is the cockpit (tray.js) cut into its back, its floor FLOOR, the
// back levelled round it to its rim, TOP. The fish is broad enough round
// the cockpit that its corners, and the lip round them, stay up on its
// back, where there is skin under them.
const TAILX = -1.25, NOSEX = 1.3, R = 0.8, SY = 1.0, SZ = 1.3, CY = 1.08;
const PEAK = 0.45, STALK = 0.18, NOSE = 0.04; // where the body is fattest (0 tail .. 1 nose), the tail stalk's share of R, the nose's rounding
const WELL = { x0: -0.6, x1: -0.6 + COCKPIT.len, z1: COCKPIT.half }, FLOOR = CY + 0.04, TOP = FLOOR + COCKPIT.depth;
const LEVEL = leveller(WELL, TOP);
const STRIPES = [[0.64, 0.8], [-0.88, -0.72]]; // x spans, each a few rings of the lathe, clear of the cockpit
const BELLY = -0.45; // the belly is the skin below this cosine of the angle from the top (between two of the lathe's rows, so the line is clean)

const radius = (x) => {
  const u = (x - TAILX) / (NOSEX - TAILX);
  if (u <= 0 || u >= 1) return 0;
  // swells from the stalk to the peak, then rounds off to the nose,
  // steeply at the very end so the nose is blunt, not pointed
  const hump = u < PEAK ? Math.pow(Math.sin((Math.PI / 2) * (u / PEAK)), 0.75) : Math.pow(Math.cos((Math.PI / 2) * ((u - PEAK) / (1 - PEAK))), 0.4);
  return R * (STALK + (1 - STALK) * hump) * Math.min(1, Math.sqrt((1 - u) / NOSE));
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

  // the tail fin, forked, out of the stalk; the dorsal fin on the back
  // behind the cockpit, its base sunk along the skin's slope; a
  // pectoral fin out of each flank, swept back and drooping
  const tail = new THREE.Shape();
  tail.moveTo(-1.1, 0.12);
  tail.lineTo(-1.6, 0.56);
  tail.quadraticCurveTo(-1.4, 0.2, -1.33, 0);
  tail.quadraticCurveTo(-1.4, -0.2, -1.6, -0.56);
  tail.lineTo(-1.1, -0.12);
  tail.closePath();
  add(fin(tail, 0.06), C.fin, 0, CY, 0);
  const DA = -0.78, DB = -1.14, dorsal = new THREE.Shape();
  dorsal.moveTo(DA, back(DA, 0) - 0.08);
  dorsal.lineTo(-0.93, back(DA, 0) + 0.42);
  dorsal.quadraticCurveTo(-1.0, back(DB, 0) + 0.2, DB, back(DB, 0) - 0.08);
  for (let i = 1; i < 6; i++) dorsal.lineTo(DB + ((DA - DB) * i) / 6, back(DB + ((DA - DB) * i) / 6, 0) - 0.08);
  dorsal.closePath();
  add(fin(dorsal, 0.05), C.fin, 0, 0, 0);
  // a pectoral fin: drawn flat as seen from above, its root along the
  // flank and its tip swept back and out, then turned onto the +z
  // flank and drooped; the other side is its mirror
  const pectoral = new THREE.Shape();
  pectoral.moveTo(0.05, 0);
  pectoral.quadraticCurveTo(-0.1, 0.3, -0.5, 0.4);
  pectoral.quadraticCurveTo(-0.3, 0.18, -0.25, 0);
  pectoral.closePath();
  const pectoralGeo = fin(pectoral, 0.035).rotateX(Math.PI / 2);
  for (const s of [-1, 1]) {
    const f = add(pectoralGeo, C.fin, 0.6, CY - 0.12, s * (SZ * radius(0.6) - 0.06));
    f.scale.z = s;
    f.rotation.x = s * 0.6;
  }

  // the eyes, the headlights: a lit ball sunk into each side of the
  // head with a dark pupil on its front; and the mouth, a line grinning
  // across the nose, a tube along the skin
  const eyeGeo = new THREE.SphereGeometry(0.17, 20, 14).translate(0, 0.1, 0);
  const pupilGeo = new THREE.SphereGeometry(0.08, 14, 10).translate(0, 0.22, 0);
  for (const s of [-1, 1]) {
    stickOn(0.98, s * 1.0, eyeGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.5 });
    stickOn(0.98, s * 1.0, pupilGeo, C.dash);
  }
  if (C.mouth === "pout") stickOn(NOSEX - 0.03, Math.PI, new THREE.TorusGeometry(0.07, 0.035, 10, 20).rotateX(Math.PI / 2), C.lips);
  else {
    const grin = [];
    for (let i = 0; i <= 16; i++) {
      const { at, normal } = onBody(NOSEX - 0.09, Math.PI + 1.1 * (i / 8 - 1));
      grin.push(at.addScaledVector(normal, 0.01));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(grin), 32, 0.022, 8, false), C.dash, 0, 0, 0);
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
      if (x > 0.78 && x < 1.18 && a > 0.65 && a < 1.35) return false; // the eyes
      if (x > 0.25 && x < 0.72 && a > 1.3 && a < 2.05) return false; // the pectorals
      if (x < -0.68 && a < 0.4) return false; // the dorsal fin
      return true;
    };
    const placed = (geo, x, phi, sink) => {
      const { at, normal } = onBody(x, phi);
      return geo.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, normal)).translate(...at.addScaledVector(normal, -sink).toArray());
    };
    const spikeGeo = new THREE.ConeGeometry(0.035, 0.13, 6).translate(0, 0.065, 0);
    const spotGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 14).translate(0, 0.01, 0);
    const spikes = [], spots = [], STEP = 0.16;
    steps(-0.95, 1.12, 13).forEach((x, i) => {
      const arc = STEP / (radius(x) * (SY + SZ) / 2), n = Math.floor(2.3 / arc);
      for (let j = -n; j <= n; j++) {
        const phi = (j + (i % 2) * 0.5) * arc;
        if (C.spikes && clear(x, phi)) spikes.push(placed(spikeGeo, x, phi, 0.01));
        // the spots between the spikes, on the back and flanks, a scatter of them
        const sx = x + STEP / 2, sphi = phi + arc / 2;
        if (C.spots && Math.abs(sphi) < 1.6 && sx < 1.1 && clear(sx, sphi) && Math.abs(Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1 > 0.4) spots.push(placed(spotGeo, sx, sphi, 0.005));
      }
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
  const roll = (dt, speed) => {
    for (const w of wheels) w.rotation.z -= (speed * dt) / C.wheelR;
  };
  return { group, wheels, roll, seat };
}
