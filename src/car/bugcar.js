/* ============================================================
   BUG CARS: the roadster (car.js) remade as a beetle. The body is the
   bug itself: a round HEAD dome at the front, its headlights for eyes,
   grown into a big SHELL dome behind it with a seam down the middle,
   the two on a thin belly plate with the wheels tucked under the skirt.
   The COCKPIT is cut out of the shell's top: a well sunk to the floor,
   the shell's top flattened round it so its rim is four straight, level
   lines, and in it the roadster's two bucket seats, a dashboard, a
   steering wheel on its column, and a framed windshield standing on the
   shell at the well's front. A LADYBUG has a red shell with black
   spots, a black head and two antennae; a STAGBEETLE a dark shell, no
   spots, and a great forked horn curving out of its head; a HORNEDBEETLE
   a jewel beetle, a violet shell with two lilac bands over its rear and
   a pair of horns out of its head; a LONGHORN a powder-blue spotted
   shell with a pair of antennae longer than itself, beaded along their
   length, sweeping back over its flanks; a BUTTERFLY a dark banded body
   with a tapering tail, long clubbed antennae, and two great patterned
   wings each side that flap as it drives. Faces +X;
   its origin on the ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// What every bug car shares, and what each kind changes: `shell` and
// `head` their colours, `spots` how many spots the shell wears (in
// `spot` colour, mirrored each side, 0 for none), `antennae` whether
// the head grows two (`antennaLen` long, `knob` the ball on each tip;
// `antennaSweep` whether they arc up, out and back over the flanks as a
// longhorn's do, instead of standing straight, and `antennaBeads` how
// many beads mark the joints along each of those),
// `horn` how long the horns out of the head are (0 for none) and `horns`
// how many: one standing in the middle, forked at the tip like a stag
// beetle's, or a pair either side of it, curving outward to a point like
// a rhinoceros beetle's. `trim` the seats, bumper and hubcaps, `dash` the cockpit's
// walls, the steering wheel and the belly. A butterfly's: `wings`
// whether it has them (`wing` their colour, `wingEdge` the border and
// eyespots, `wingDot` the dots in the border and the eyespots' middles),
// `bands` how many stripes cross the shell's rear (in `band` colour),
// and `abdomen` how long a tail tapers out behind the shell (0 none).
export const BUGCAR = {
  scale: 1.6, // built about 2.9 long; the game scales it up to fit a driver
  shell: 0xd9303a,
  spot: 0x1e1a1c,
  spots: 6,
  head: 0x1e1a1c,
  antennae: true,
  antennaLen: 0.4,
  knob: 0.045,
  antennaSweep: false,
  antennaBeads: 0,
  horn: 0,
  horns: 1,
  wings: false,
  wing: 0xf08a24,
  wingEdge: 0x1e1a1c,
  wingDot: 0xfff8ea,
  bands: 0,
  band: 0xf2b134,
  abdomen: 0,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};
export const LADYBUG = { ...BUGCAR };
export const STAGBEETLE = { ...BUGCAR, shell: 0x4f3a2d, head: 0x2a1d17, spots: 0, antennae: false, horn: 1, trim: 0xd8c08a };
export const BUTTERFLY = { ...BUGCAR, shell: 0x2e2836, head: 0x2e2836, spot: 0x1e1a1c, spots: 0, antennaLen: 0.65, knob: 0.065, wings: true, bands: 3, abdomen: 0.8 };
export const HORNEDBEETLE = { ...BUGCAR, shell: 0x6b3fa6, head: 0x2a1f33, spot: 0x3d2566, spots: 0, antennae: false, horn: 0.9, horns: 2, bands: 2, band: 0xb48ae6, trim: 0xefe4f6 };
export const LONGHORN = { ...BUGCAR, shell: 0x8fb0cc, head: 0x26262c, spots: 6, antennaLen: 2.3, knob: 0.04, antennaSweep: true, antennaBeads: 5, bands: 1, band: 0x1e1a1c, trim: 0xeef2f5 };

// The body, in the car's own units (before `scale`). Each dome is half
// an ellipsoid stood on the FLOOR: `x` where its middle is along the
// car, `rx`, `ry`, `rz` how far it reaches along, up and across. The
// head's rear runs into the shell's front. The WELL is the cockpit
// (tray.js) cut out of the shell's top, its floor the FLOOR, the shell
// flattened round it to its rim, TOP, and run down ahead of it.
const FLOOR = 0.45, BELLY = 0.16;
const SHELL = { x: -0.32, rx: 1.2, ry: 0.92, rz: 0.88 };
const HEAD = { x: 0.95, rx: 0.4, ry: 0.4, rz: 0.5 };
const WELL = { x0: -0.85, x1: -0.85 + COCKPIT.len, z1: COCKPIT.half }, TOP = FLOOR + COCKPIT.depth;

const Y = new THREE.Vector3(0, 1, 0);
// A point on a dome's surface, out from its middle in direction `d`,
// and the surface's normal there.
function onDome(D, d) {
  const v = new THREE.Vector3(...d).normalize();
  const at = new THREE.Vector3(D.x + D.rx * v.x, FLOOR + D.ry * v.y, D.rz * v.z);
  if (D === SHELL && reshaped(at.x, at.z)) return { at: at.setY(shellAt(at.x, at.z)), normal: shellNormal(at.x, at.z) };
  return { at, normal: new THREE.Vector3(v.x / D.rx, v.y / D.ry, v.z / D.rz).normalize() };
}
// How high a dome's surface is over the point (x, z): the floor where
// the point is outside its footprint.
const heightAt = (D, x, z) => FLOOR + D.ry * Math.sqrt(Math.max(0, 1 - ((x - D.x) / D.rx) ** 2 - (z / D.rz) ** 2));
// The level the shell's top is eased and capped to: the rim's height,
// TOP, behind and beside the well, and ahead of it a quarter-ellipse
// falling from the rim to the shell's front edge, so the top runs down
// into the head in one curve instead of a shelf with a shoulder
const FRONT = SHELL.x + SHELL.rx;
const levelAt = (x) => (x <= WELL.x1 ? TOP : FLOOR + (TOP - FLOOR) * Math.sqrt(Math.max(0, 1 - ((x - WELL.x1) / (FRONT - WELL.x1)) ** 2)));
const LEVEL = leveller(WELL, levelAt);
// The shell's height over (x, z), levelled round the well; whether that
// differs from the dome's there; and its normal.
const shellAt = (x, z) => LEVEL.height(heightAt(SHELL, x, z), x, z);
const reshaped = (x, z) => LEVEL.reshaped(heightAt(SHELL, x, z), x, z);
function shellNormal(x, z) {
  const e = 1e-3;
  return new THREE.Vector3(-(shellAt(x + e, z) - shellAt(x - e, z)) / (2 * e), 1, -(shellAt(x, z + e) - shellAt(x, z - e)) / (2 * e)).normalize();
}
// A dome, with the well cut out of it if `well`.
function domeGeo(D, well = false) {
  const geo = new THREE.SphereGeometry(1, well ? 192 : 96, well ? 96 : 48, 0, Math.PI * 2, 0, Math.PI / 2).scale(D.rx, D.ry, D.rz).translate(D.x, FLOOR, 0);
  return well ? cutThrough(geo, WELL, FLOOR, LEVEL) : geo;
}
const steps = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

export function buildBugCar(finish, C = BUGCAR) {
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
  // Something stood on a dome's surface: `geo` built standing up from
  // its base at the origin, turned to the surface's normal where `d`
  // points, and sunk `sink` into it.
  const stickOn = (D, d, geo, color, extra, sink = 0) => {
    const { at, normal } = onDome(D, d);
    const mesh = add(geo, color, 0, 0, 0, extra);
    mesh.position.copy(at).addScaledVector(normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, normal);
    return mesh;
  };
  const both = { side: THREE.DoubleSide };

  // the shell, with the well cut out of its top, and the head grown
  // into its front; under each a belly plate the shape of its footprint
  add(domeGeo(SHELL, true), C.shell, 0, 0, 0, both);
  add(domeGeo(HEAD), C.head, 0, 0, 0);
  for (const D of [SHELL, HEAD]) add(new THREE.CylinderGeometry(1, 1, BELLY, 48).scale(D.rx - 0.03, 1, D.rz - 0.03), C.dash, D.x, FLOOR - BELLY / 2, 0);

  // the cockpit, cut out of the shell (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);
  const { x0, x1 } = WELL;

  // the seam over the shell's top, in two runs that stop at the well,
  // each a tube along the shell's middle from its rim to the well's edge
  const seam = (from, to) => {
    const pts = steps(from, to, 48).map((a) => {
      const x = SHELL.x + SHELL.rx * Math.cos(a), z = 0;
      return new THREE.Vector3(x, (reshaped(x, z) ? shellAt(x, z) : FLOOR + SHELL.ry * Math.sin(a)) + 0.004, z);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.014, 6, false);
  };
  const along = (x) => Math.acos(THREE.MathUtils.clamp((x - SHELL.x) / SHELL.rx, -1, 1)); // the seam's angle over a point along the car
  add(seam(along(x0), Math.PI), C.spot, 0, 0, 0);
  add(seam(0, along(x1)), C.spot, 0, 0, 0);
  // the spots: flat discs stood on the shell, mirrored each side, on
  // its flanks and over its rear, clear of the well
  const SPOTS = [[0.1, 0.45, 0.9], [-0.45, 0.4, 0.85], [-0.75, 0.6, 0.3], [-0.9, 0.25, 0.5]];
  const spotGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.03, 20).translate(0, 0.015, 0);
  for (let i = 0; i < Math.min(C.spots, 2 * SPOTS.length); i++) {
    const [x, y, z] = SPOTS[Math.floor(i / 2)];
    stickOn(SHELL, [x, y, i % 2 ? -z : z], spotGeo, C.spot, undefined, 0.02);
  }
  // the bands: stripes across the shell's rear, behind the well, each a
  // tube over the shell's cross-section there from flank to flank
  for (let i = 0; i < C.bands; i++) {
    const x = -1.13 - i * 0.14, k = Math.sqrt(1 - ((x - SHELL.x) / SHELL.rx) ** 2);
    const pts = steps(0.08, Math.PI - 0.08, 32).map((a) => {
      const z = SHELL.rz * k * Math.cos(a);
      return new THREE.Vector3(x, (reshaped(x, z) ? shellAt(x, z) : FLOOR + SHELL.ry * k * Math.sin(a)) + 0.004, z);
    });
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.035, 6, false), C.band, 0, 0, 0);
  }

  // the head's face: headlights for eyes, and antennae or a horn out
  // of its top
  const lampGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14).translate(0, 0.04, 0);
  for (const s of [-1, 1]) stickOn(HEAD, [0.8, 0.4, s * 0.55], lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.03);
  if (C.antennae && C.antennaSweep) {
    // a longhorn's antennae: each a tube along a curve out of the head's
    // top, up and forward a little, then arcing out past the shell's
    // flank and back along it, thinning to the tip, a bead at each joint
    // along it and a knob on the end
    const L = C.antennaLen;
    for (const s of [-1, 1]) {
      const root = onDome(HEAD, [0.5, 0.8, s * 0.45]).at;
      const at = (dx, dy, z) => new THREE.Vector3(root.x + dx, root.y + dy, s * z);
      const curve = new THREE.CatmullRomCurve3([root.clone().add(new THREE.Vector3(-0.05, -0.1, 0)), root, at(0.35, 0.45, 0.4), at(-0.3 * L, 0.6, SHELL.rz + 0.1), at(-0.7 * L, 0.45, SHELL.rz + 0.3), at(-L, 0.25, SHELL.rz + 0.35)]);
      const tube = new THREE.TubeGeometry(curve, 40, 0.03, 8, false);
      const pos = tube.attributes.position, uv = tube.attributes.uv, v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        const u = uv.getX(i), on = curve.getPointAt(u);
        v.fromBufferAttribute(pos, i).sub(on).multiplyScalar(1 - 0.5 * u).add(on);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      tube.computeVertexNormals();
      add(tube, C.head, 0, 0, 0);
      for (let i = 1; i <= C.antennaBeads; i++) {
        const p = curve.getPointAt(0.15 + (0.8 * i) / (C.antennaBeads + 1));
        add(new THREE.SphereGeometry(0.03 * (1 - 0.4 * (i / C.antennaBeads)) + 0.018, 10, 8), C.shell, p.x, p.y, p.z);
      }
      const tip = curve.getPointAt(1);
      add(new THREE.SphereGeometry(C.knob, 10, 8), C.head, tip.x, tip.y, tip.z);
    }
  } else if (C.antennae) {
    const stalk = new THREE.CylinderGeometry(0.015, 0.015, C.antennaLen, 8).translate(0, C.antennaLen / 2, 0);
    const knob = new THREE.SphereGeometry(C.knob, 10, 8).scale(1, C.knob > 0.05 ? 1.6 : 1, 1).translate(0, C.antennaLen, 0); // a long knob is a butterfly's club
    for (const s of [-1, 1]) {
      stickOn(HEAD, [0.5, 0.8, s * 0.45], stalk, C.head, undefined, 0.03);
      stickOn(HEAD, [0.5, 0.8, s * 0.45], knob, C.head, undefined, 0.03);
    }
  }
  if (C.horn > 0 && C.horns > 0) {
    // the horns: each a tube along a curve out of the head's top,
    // sweeping forward and up, thick at the root and tapering — each
    // ring of the tube drawn in toward the curve by how far along it is.
    // One horn stands in the middle, forked at the tip like a stag
    // beetle's, two prongs splayed apart; a pair stand either side of
    // the middle, each curving a little outward, and ending in a point
    // like a rhinoceros beetle's
    const pair = C.horns >= 2, R = pair ? 0.09 : 0.13;
    for (const s of pair ? [-1, 1] : [0]) {
      const root = onDome(HEAD, [0.3, 1, s * 0.4]).at;
      const bend = (dx, dy, dz) => root.clone().add(new THREE.Vector3(dx * C.horn, dy * C.horn, s * dz * C.horn));
      const curve = new THREE.CatmullRomCurve3([root.clone().add(new THREE.Vector3(0, -0.15, 0)), root, bend(0.3, 0.25, 0.05), bend(0.6, 0.6, 0.15), bend(0.72, 0.95, 0.28)]);
      const tube = new THREE.TubeGeometry(curve, 20, R, 12, false);
      const pos = tube.attributes.position, uv = tube.attributes.uv, v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        const u = uv.getX(i), on = curve.getPointAt(u);
        v.fromBufferAttribute(pos, i).sub(on).multiplyScalar(1 - 0.65 * u).add(on);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      tube.computeVertexNormals();
      add(tube, C.head, 0, 0, 0);
      const tip = curve.getPointAt(1), dir = curve.getTangentAt(1);
      if (pair) {
        const point = add(new THREE.ConeGeometry(R * 0.35, 0.22, 10).translate(0, 0.11, 0), C.head, 0, 0, 0);
        point.position.copy(tip).addScaledVector(dir, -0.02);
        point.quaternion.setFromUnitVectors(Y, dir);
        continue;
      }
      for (const p of [-1, 1]) {
        const prong = add(new THREE.ConeGeometry(0.05, 0.3, 10).translate(0, 0.15, 0), C.head, 0, 0, 0);
        prong.position.copy(tip).addScaledVector(dir, -0.03);
        prong.quaternion.setFromUnitVectors(Y, dir.clone().add(new THREE.Vector3(0, 0, p * 0.4)).normalize());
      }
    }
  }

  // tail lights on the shell's rear
  const tailGeo = new THREE.BoxGeometry(0.2, 0.04, 0.1).translate(0, 0.02, 0);
  for (const s of [-1, 1]) stickOn(SHELL, [-0.95, 0.15, s * 0.4], tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);

  // the abdomen: a tail out of the shell's rear, low, tapering to a
  // rounded point, turned on a lathe along the car, ringed in the
  // bands' colour
  if (C.abdomen > 0) {
    const A0 = SHELL.x - SHELL.rx + 0.3, AR = 0.3, AY = FLOOR + 0.22; // where it starts inside the shell, its radius there, its axis's height
    const r = (t) => AR * Math.sqrt(1 - t * t) * (1 - 0.35 * t); // t 0 at the root .. 1 at the tip
    const profile = steps(1, 0, 24).map((t) => new THREE.Vector2(r(t), A0 - t * C.abdomen));
    add(new THREE.LatheGeometry(profile, 24).rotateZ(-Math.PI / 2), C.shell, 0, AY, 0);
    for (const t of [0.45, 0.62, 0.77]) {
      const ring = new THREE.TorusGeometry(r(t) + 0.004, 0.025, 6, 24).rotateY(Math.PI / 2);
      add(ring, C.band, A0 - t * C.abdomen, AY, 0);
    }
  }

  // the wings: a forewing and a hindwing each side, hinged along the
  // shell's flank and lifted, each a black wing with a coloured panel
  // inside its border, white dots round the border and an eyespot, all
  // flat shapes laid out from the hinge (x along the car, s outward)
  const flaps = [];
  if (C.wings) {
    const HINGE_Z = 0.7, HINGE_Y = FLOOR + 0.42;
    const FORE = [[0.15, -0.05], [0.3, 0.45], [0.55, 1.05], [0.45, 1.35], [0.05, 1.32], [-0.3, 0.95], [-0.38, 0.35], [-0.32, -0.05]];
    const HIND = [[-0.25, -0.05], [-0.22, 0.55], [-0.5, 0.92], [-0.95, 0.85], [-1.2, 0.5], [-1.0, 0.12], [-0.85, -0.05]];
    const shapeOf = (pts) => new THREE.Shape(pts);
    // a flat shape laid out from the hinge: shape y outward (+z), `depth` thick, centred
    const lay = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, -depth / 2).rotateX(Math.PI / 2);
    const wingGeos = (pts, eye) => {
      const outer = new THREE.Shape().setFromPoints(new THREE.SplineCurve([...pts, pts[0]].map(([x, y]) => new THREE.Vector2(x, y))).getSpacedPoints(80));
      const edge = outer.getPoints(), c = edge.reduce((m, p) => m.add(p), new THREE.Vector2()).divideScalar(edge.length);
      const toward = (p, k) => p.clone().sub(c).multiplyScalar(k).add(c);
      const dots = edge.filter((p, i) => i % 6 === 0 && p.y > 0.3).map((p) => toward(p, 0.9));
      return {
        edge: lay(outer, 0.03),
        panel: lay(shapeOf(edge.map((p) => toward(p, 0.8))), 0.04),
        dots: dots.map((p) => lay(new THREE.Shape().absarc(p.x, p.y, 0.035, 0, Math.PI * 2), 0.05)),
        eye: [lay(new THREE.Shape().absarc(eye[0], eye[1], 0.12, 0, Math.PI * 2), 0.05), lay(new THREE.Shape().absarc(eye[0], eye[1], 0.05, 0, Math.PI * 2), 0.06)],
      };
    };
    const kinds = [
      [wingGeos(FORE, [0.15, 0.95]), 0],
      [wingGeos(HIND, [-0.75, 0.5]), -0.03], // the hindwing a little under the forewing
    ];
    for (const s of [-1, 1])
      for (const [g, dy] of kinds) {
        const hinge = new THREE.Group();
        hinge.position.set(0, HINGE_Y + dy, s * HINGE_Z);
        hinge.scale.z = s;
        group.add(hinge);
        add(g.edge, C.wingEdge, 0, 0, 0, both, hinge);
        add(g.panel, C.wing, 0, 0, 0, both, hinge);
        for (const d of g.dots) add(d, C.wingDot, 0, 0, 0, both, hinge);
        add(g.eye[0], C.wingEdge, 0, 0, 0, both, hinge);
        add(g.eye[1], C.wingDot, 0, 0, 0, both, hinge);
        flaps.push([hinge, s]);
      }
  }
  // the wings' lift over level, and how far they flap either way of it
  const LIFT = 0.35, FLAP = 0.3;
  let flapT = 0;
  const flap = (amount) => {
    for (const [hinge, s] of flaps) hinge.rotation.x = -s * (LIFT + FLAP * amount);
  };
  flap(0);

  // four wheels, each with a hubcap, turning on an axle along z, the
  // axles across under the belly
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.7, 10).rotateX(Math.PI / 2);
  // the axles the same distance either side of the shell's middle
  for (const x of [SHELL.x - 0.6, SHELL.x + 0.6]) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
    for (const z of [-0.82, 0.82]) {
      const w = add(wheelGeo, C.wheel, x, C.wheelR, z);
      add(capGeo, C.trim, 0, 0, 0, undefined, w);
      wheels.push(w);
    }
  }
  group.scale.setScalar(C.scale);
  // the wheels turn with the speed; the wings flap while it drives, a
  // little faster the faster it goes, and settle as it stops
  const roll = (dt, speed) => {
    for (const w of wheels) w.rotation.z -= (speed * dt) / C.wheelR;
    if (!flaps.length) return;
    flapT += dt * (5 + speed * 0.25);
    flap(Math.sin(flapT) * Math.min(1, speed / 4));
  };
  return { group, wheels, roll, seat };
}
