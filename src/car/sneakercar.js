/* ============================================================
   SNEAKER CAR: the roadster (car.js) remade as a chunky trainer. The
   body is the shoe, lofted along the car from a rounded heel to a
   rounded toe: under it a thick SOLE, a white MIDSOLE over a darker
   OUTSOLE band with a row of tread lugs round its edge, the midsole
   rising at the front into a TOE BUMPER; on it the UPPER, high at the
   ankle and sloping down over the instep to the toe, with a TOE CAP and
   a HEEL COUNTER laid over it and a wavy STRIPE along each side. The
   COCKPIT is the cut-out cars' (tray.js), cut down into the ankle
   opening where the foot would go, the upper levelled round it so its
   rim is four straight, level lines; a padded COLLAR runs round its back
   and sides, rising to a PULL TAB at the heel. Ahead of it the TONGUE
   lies over the instep, its back end curling up before the windshield,
   and the LACES cross over it between two rows of eyelets, tied in a
   bow at the top. In the cockpit the roadster's two bucket seats,
   dashboard and steering wheel, and an arched windshield
   raked back from its front edge. Headlights in the toe, tail lights in the
   heel, and four wheels with hubcaps standing out either side of the
   sole, on axles under it. Faces +X (the toe); its origin on the
   ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `upper` the shoe's body, `tongue` its tongue, `overlay` its toe cap and heel
// counter, `collar` the padded rim and pull tab, `stripe` the wavy band
// along each side, `laces` the laces, `sole` the midsole, toe bumper and
// tread lugs, `outsole` the band under it, `trim` the seats, eyelets,
// hubcaps, `dash` the cockpit's floor, walls and
// lip, the dashboard, the steering wheel and the axles.
export const SNEAKERCAR = {
  scale: 1.6, // built about 3.3 long; the game scales it up to fit a driver
  upper: 0xe5483b,
  tongue: 0x2c3a63,
  overlay: 0x2c3a63,
  collar: 0x2c3a63,
  stripe: 0xfaf6ee,
  laces: 0xfaf6ee,
  sole: 0xf6f3ec,
  outsole: 0x2c3a63,
  trim: 0xe9e4d8,
  dash: 0x34363d,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The shoe, in the car's own units (before `scale`). It runs from the
// heel at HEEL to the toe at TOE; at each x along it a cross-section,
// a rounded square (a superellipse) `w` either side of the middle. The
// sole: its underside UNDER, just clear of the axles, lifting a little
// at the toe (the toe spring); the outsole band OUT thick, the midsole
// on it up to SOLE, a little higher at the heel and rising at the toe
// into the bumper. The upper: from inside the sole up to its top `H`,
// high round the ankle and sloping down over the instep. The WELL is
// the cockpit, in the ankle opening, its rim TOP and its floor FLOOR
// just over the midsole.
const HEEL = -1.72, TOE = 1.62;
const UNDER = 0.36, OUT = 0.11, SOLE = 0.66;
const WELL = { x0: -1.25, x1: -1.25 + COCKPIT.len, z1: COCKPIT.half }, TOP = 1.42, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP, { cap: false }); // the collar and pull tab rise over the rim

const Y = new THREE.Vector3(0, 1, 0);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// a signed power, for the superellipse
const spow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

// The shoe's footprint: `w` either side of the middle at x, before its
// ends are rounded, widest across the ball of the foot; and how much of
// that is left as the heel (blunt) and the toe (rounder) round off.
const footW = (x) => 0.86 + 0.06 * Math.exp(-(((x - 0.75) / 0.6) ** 2)) - 0.05 * smooth(1.0, 1.6, x);
const ends = (x) => {
  const h = clamp01((x - HEEL) / 0.5), t = clamp01((TOE - x) / 0.95);
  return (1 - (1 - h) ** 4) ** 0.25 * (1 - (1 - t) ** 2.5) ** 0.4;
};
// the sole's underside, lifting at the toe, and the midsole's top,
// higher at the heel and rising at the toe into the bumper
const underAt = (x) => UNDER + 0.14 * smooth(1.0, TOE, x) ** 2;
const soleTop = (x) => SOLE + 0.05 * (1 - smooth(-1.4, -0.8, x)) + 0.16 * smooth(1.1, 1.5, x);
// the upper's top along its middle: up round the ankle, then down over
// the instep to the toe
const H = (x) => 0.92 + 0.68 * (0.5 + 0.5 * Math.cos(Math.PI * clamp01((x + 0.3) / 1.9)));
const UB = SOLE - 0.1; // the upper's bottom, hidden in the sole
const N_TOP = 2.6, N_LOW = 4; // its section: rounded on top, squarer under

// The upper's cross-section at x: `w` either side, its middle at `yc`,
// `ry` up (and down) from it, rounded off toward the heel and the toe.
function upperAt(x) {
  const f = ends(x), top = H(x);
  return { w: footW(x) * f, yc: (top + UB) / 2, ry: ((top - UB) / 2) * f ** 0.5 };
}
// The upper's top over (x, z), before and after levelling round the well.
function upperTop(x, z) {
  const { w, yc, ry } = upperAt(x);
  return yc + ry * Math.max(0, 1 - Math.abs(z / w) ** N_TOP) ** (1 / N_TOP);
}
const surfAt = (x, z) => LEVEL.height(upperTop(x, z), x, z);
function surfNormal(x, z) {
  const e = 1e-3;
  return new THREE.Vector3(-(surfAt(x + e, z) - surfAt(x - e, z)) / (2 * e), 1, -(surfAt(x, z + e) - surfAt(x, z - e)) / (2 * e)).normalize();
}

// A loft along x from `xa` to `xb` (`along` stations, closer together
// toward the ends): at each x the section `sec(x)` -> { w, yc, ry, n,
// nLow } run round from angle `ta` to `tb` (all the way round by
// default) in `around` steps, a superellipse `w` across and `ry` up and
// down, its top half's power `n` and its bottom half's `nLow`; `grow`
// pushes it out from its middle. Wound so its faces look out.
function loft(xa, xb, sec, { along = 64, around = 48, ta = -Math.PI, tb = Math.PI, grow = 0 } = {}) {
  const pos = [], idx = [];
  for (let i = 0; i <= along; i++) {
    const x = xa + (xb - xa) * (0.5 - 0.5 * Math.cos((Math.PI * i) / along));
    const { w, yc, ry, n, nLow = n } = sec(x);
    for (let j = 0; j <= around; j++) {
      const t = ta + ((tb - ta) * j) / around, c = Math.cos(t), s = Math.sin(t);
      const z = spow(c, 2 / (s >= 0 ? n : nLow)) * (w + grow), y = yc + spow(s, 2 / (s >= 0 ? n : nLow)) * (ry + grow);
      pos.push(x, y, z);
      if (i < along && j < around) {
        const a = i * (around + 1) + j, b = a + around + 1;
        idx.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// The sole's outline's outward normal in plan at x on the `side` (+1 or
// -1) of a sole `w(x)` either side.
function outward(w, x, side) {
  const e = 1e-3, slope = (w(x + e) - w(x - e)) / (2 * e);
  return new THREE.Vector3(-slope, 0, side).normalize();
}

export function buildSneakerCar(finish, C = SNEAKERCAR) {
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
  // a part with the cockpit cut through it, two-sided so the well looks in at it
  const piece = (geo, color) => add(cutThrough(geo, WELL, FLOOR, LEVEL), color, 0, 0, 0, both);

  // the sole: the outsole band, and the midsole on it bulging a little
  // wider, its top rising at the toe into the bumper that wraps the
  // upper's front
  const outW = (x) => (footW(x) + 0.02) * ends(x);
  const midW = (x) => (footW(x) + 0.05) * ends(x);
  add(loft(HEEL, TOE, (x) => ({ w: outW(x), yc: underAt(x) + OUT / 2, ry: OUT / 2, n: 6 })), C.outsole, 0, 0, 0);
  add(loft(HEEL - 0.01, TOE + 0.02, (x) => {
    const y0 = underAt(x) + OUT - 0.02, y1 = soleTop(x);
    return { w: (footW(x) + 0.05) * ends(x - 0.01), yc: (y0 + y1) / 2, ry: (y1 - y0) / 2, n: 5 };
  }), C.sole, 0, 0, 0);

  // the tread: little lugs in a row round the outsole's edge, each
  // turned to face out of the outline where it sits
  const lugs = [];
  for (let x = HEEL + 0.1; x < TOE - 0.1; x += 0.12)
    for (const side of [-1, 1]) {
      const n = outward(outW, x, side), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      lugs.push(new THREE.BoxGeometry(0.06, 0.05, 0.04).applyQuaternion(q).translate(x, underAt(x) + OUT / 2, side * outW(x)));
    }
  add(mergeGeometries(lugs), C.sole, 0, 0, 0);

  // the upper, the cockpit cut down into its ankle opening and its top
  // levelled round it
  const upperSec = (x) => ({ ...upperAt(x), n: N_TOP, nLow: N_LOW });
  piece(loft(HEEL + 0.03, TOE - 0.04, upperSec, { along: 96, around: 64 }), C.upper);

  // the toe cap and the heel counter, laid over the upper: the toe cap
  // all round its front, the heel counter round the back and up the
  // sides to under the collar
  add(loft(1.05, TOE - 0.04, upperSec, { along: 24, around: 48, grow: 0.012 }), C.overlay, 0, 0, 0);
  add(loft(HEEL + 0.03, -1.0, upperSec, { along: 24, around: 48, ta: Math.PI - 0.35, tb: 2 * Math.PI + 0.35, grow: 0.012 }), C.overlay, 0, 0, 0, both);

  // the stripe: a wavy band along each side of the upper, from the heel
  // counter to the toe cap, a little proud of it
  for (const side of [-1, 1]) {
    const ALONG = 60, ACROSS = 3, pos = [], idx = [];
    for (let i = 0; i <= ALONG; i++) {
      const x = -1.0 + (2.05 * i) / ALONG, mid = 0.22 + 0.1 * Math.sin(2.4 * x + 0.6), half = 0.075 * Math.min(1, 4 * Math.min(i, ALONG - i) / ALONG + 0.3);
      const { w, yc, ry } = upperAt(x);
      for (let j = 0; j <= ACROSS; j++) {
        const t = mid - half + (2 * half * j) / ACROSS, c = Math.cos(t), s = Math.sin(t);
        pos.push(x, yc + spow(s, 2 / N_TOP) * (ry + 0.014), side * spow(c, 2 / N_TOP) * (w + 0.014));
        if (i < ALONG && j < ACROSS) {
          const a = i * (ACROSS + 1) + j, b = a + ACROSS + 1;
          idx.push(...(side > 0 ? [a, b, b + 1, a, b + 1, a + 1] : [a, b + 1, b, a, a + 1, b + 1]));
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    add(g, C.stripe, 0, 0, 0, both);
  }

  // the collar: a padded roll round the back and sides of the opening,
  // just outside its rim, rising toward the heel, its open ends at the
  // front corners rounded off
  const OFF = 0.14, PAD = 0.085, { x0, x1, z1 } = WELL;
  const collarY = (x) => TOP + 0.02 + 0.07 * (1 - smooth(x0, x1, x));
  const corner = 0.22, path = [];
  const pt = (x, z) => path.push(new THREE.Vector3(x, collarY(x), z));
  pt(x1, -(z1 + OFF));
  pt((x0 + x1) / 2, -(z1 + OFF));
  pt(x0 - OFF + corner, -(z1 + OFF));
  pt(x0 - OFF + corner * 0.3, -(z1 + OFF) + corner * 0.3);
  pt(x0 - OFF, -(z1 + OFF) + corner);
  pt(x0 - OFF, 0);
  pt(x0 - OFF, z1 + OFF - corner);
  pt(x0 - OFF + corner * 0.3, z1 + OFF - corner * 0.3);
  pt(x0 - OFF + corner, z1 + OFF);
  pt((x0 + x1) / 2, z1 + OFF);
  pt(x1, z1 + OFF);
  const collar = new THREE.CatmullRomCurve3(path, false, "centripetal");
  add(new THREE.TubeGeometry(collar, 120, PAD, 14, false), C.collar, 0, 0, 0);
  for (const end of [path[0], path[path.length - 1]]) add(new THREE.SphereGeometry(PAD, 14, 10), C.collar, end.x, end.y, end.z);

  // the pull tab: a loop standing up at the heel, leaning back a little
  const tab = new THREE.Shape();
  const rr = (s, hw, y0, y1, r) => {
    s.moveTo(-hw + r, y0);
    s.lineTo(hw - r, y0);
    s.quadraticCurveTo(hw, y0, hw, y0 + r);
    s.lineTo(hw, y1 - r);
    s.quadraticCurveTo(hw, y1, hw - r, y1);
    s.lineTo(-hw + r, y1);
    s.quadraticCurveTo(-hw, y1, -hw, y1 - r);
    s.lineTo(-hw, y0 + r);
    s.quadraticCurveTo(-hw, y0, -hw + r, y0);
    return s;
  };
  rr(tab, 0.15, -0.25, 0.3, 0.08);
  tab.holes.push(rr(new THREE.Path(), 0.075, 0.08, 0.22, 0.04));
  const tabGeo = new THREE.ExtrudeGeometry(tab, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 })
    .translate(0, 0, -0.03)
    .rotateY(-Math.PI / 2)
    .rotateZ(0.22);
  add(tabGeo, C.collar, x0 - OFF - 0.12, TOP + 0.04, 0);

  // the tongue: a padded flap lying over the instep, narrowing toward
  // the toe, its back end curling up just before the windshield
  const T0 = x1 + 0.1, TL = 0.95, THICK = 0.06;
  const tongueTop = (x, z) => surfAt(x, z) + THICK + 0.26 * (1 - smooth(T0, T0 + 0.3, x)) ** 2;
  const tongue = new THREE.BoxGeometry(1, 1, 1, 16, 1, 8);
  const tp = tongue.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    const u = tp.getX(i) + 0.5, w = tp.getY(i) + 0.5, x = T0 + u * TL, z = tp.getZ(i) * 0.7 * (1 - 0.25 * u);
    const lift = 0.26 * (1 - smooth(T0, T0 + 0.3, x)) ** 2;
    tp.setXYZ(i, x, surfAt(x, z) - 0.01 + lift + w * THICK, z);
  }
  tongue.computeVertexNormals();
  add(tongue, C.tongue, 0, 0, 0);

  // the eyelets: two rows either side of the tongue, each a little ring
  // lying on the upper; and the laces crossing between them over the
  // tongue, a bar across the front row and a bow at the top
  const ROWS = [T0 + 0.12, T0 + 0.3, T0 + 0.48, T0 + 0.66, T0 + 0.84], EZ = 0.38;
  const eyelets = [];
  for (const x of ROWS)
    for (const s of [-1, 1]) {
      const z = s * EZ, n = surfNormal(x, z);
      eyelets.push(new THREE.TorusGeometry(0.04, 0.014, 6, 14).rotateX(Math.PI / 2).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, n)).translate(x, surfAt(x, z) + 0.008, z));
    }
  add(mergeGeometries(eyelets), C.trim, 0, 0, 0);
  // a lace from (xa, za) to (xb, zb), riding over the tongue, `rise` higher still
  const lace = (xa, za, xb, zb, rise = 0) => {
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const x = xa + ((xb - xa) * k) / 10, z = za + ((zb - za) * k) / 10, over = 1 - smooth(0.3, 0.38, Math.abs(z));
      pts.push(new THREE.Vector3(x, Math.max(surfAt(x, z) + 0.03, over * (tongueTop(x, z) + 0.025 + rise)), z));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.026, 6, false);
  };
  const laces = [lace(ROWS[4], -EZ, ROWS[4], EZ)];
  for (let r = 0; r < ROWS.length - 1; r++) laces.push(lace(ROWS[r], -EZ, ROWS[r + 1], EZ), lace(ROWS[r], EZ, ROWS[r + 1], -EZ, 0.03));
  // the bow: two loops and two tails, from a knot in the middle of the top row
  const kx = ROWS[0], ky = tongueTop(kx, 0) + 0.06;
  laces.push(new THREE.SphereGeometry(0.045, 10, 8).translate(kx, ky, 0));
  for (const s of [-1, 1]) {
    laces.push(new THREE.TorusGeometry(0.09, 0.024, 6, 18).scale(0.8, 0.45, 1.2).rotateZ(0.5).translate(kx - 0.02, ky + 0.03, s * 0.12));
    const tail = [new THREE.Vector3(kx, ky, 0), new THREE.Vector3(kx + 0.06, ky - 0.03, s * 0.08), new THREE.Vector3(kx + 0.14, surfAt(kx + 0.14, s * 0.22) + THICK + 0.03, s * 0.22)];
    laces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tail), 12, 0.022, 6, false));
  }
  add(mergeGeometries(laces), C.laces, 0, 0, 0);

  // the cockpit, cut down into the ankle opening (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // headlights in the toe bumper, tail lights in the heel of the
  // midsole, each turned to face out of the outline where it sits
  const lampGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.08, 14).translate(0, 0.04, 0);
  const tailGeo = new THREE.BoxGeometry(0.18, 0.05, 0.08).translate(0, 0.025, 0);
  // where the midsole's outline is `z` out, searching from `a` toward `b`
  const onOutline = (z, a, b) => {
    for (let k = 0; k < 40; k++) {
      const m = (a + b) / 2;
      if (midW(m) > z === a < b) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  for (const s of [-1, 1]) {
    const hx = onOutline(0.42, 1.0, TOE + 0.02), head = add(lampGeo, C.lamp, hx - 0.02, soleTop(hx) - 0.13, s * 0.42, { emissive: C.lamp, emissiveIntensity: 0.6 });
    head.quaternion.setFromUnitVectors(Y, outward(midW, hx, s));
    const bx = onOutline(0.45, -1.0, HEEL - 0.01), tail = add(tailGeo, C.tail, bx + 0.02, (UNDER + OUT + soleTop(bx)) / 2, s * 0.45, { emissive: C.tail, emissiveIntensity: 0.5 });
    tail.quaternion.setFromUnitVectors(Y, outward(midW, bx, s));
  }

  // four wheels, each with a hubcap, standing out either side of the
  // sole, turning on axles along z under it
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 10).rotateX(Math.PI / 2);
  for (const x of [-1.0, 1.0]) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
    for (const z of [-1.02, 1.02]) {
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
