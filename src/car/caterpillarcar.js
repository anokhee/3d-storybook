/* ============================================================
   CATERPILLAR CAR: the roadster (car.js) remade as a caterpillar. The
   body is a row of three round SEGMENTS down the car, each a squashed
   ball overlapping the next so the body reads as ribbed, the three
   together about the size of a bug car's shell (bugcar.js), a yellow spot on
   each flank and a pair of stubby red feet under it; at the front a
   HEAD dome like the bug cars' (bugcar.js), grown into the first
   segment, with headlights for eyes and two knobbed antennae out of its
   top; at the back the last
   segment wears a little curved horn. The COCKPIT is the cut-out cars'
   (tray.js), cut down through the middle segments, the body levelled
   round it so its rim is four straight, level lines; in it the
   roadster's two bucket seats, dashboard and steering wheel, and an
   arched windshield raked back from its front edge. The wheels are
   tucked under the body outside the feet. Faces +X; its origin on the
   ground under the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `body` the segments, `head` the head, `spot` the spots on the flanks,
// `foot` the feet and the horn, `trim` the seats and hubcaps, `dash` the
// cockpit's walls, the steering wheel, the antennae and the axles.
export const CATERPILLARCAR = {
  scale: 1.6, // built about 2.9 long, as the bug cars are; the game scales it up to fit a driver
  body: 0x7cc24a,
  head: 0x8fd45a,
  spot: 0xf2c230,
  foot: 0xe0734a,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The body, in the car's own units (before `scale`). Each SEGMENT is a
// whole ellipsoid, `rx`, `ry`, `rz` how far it reaches along, up and
// across, its middle `y` up, at each of the XS along the car: three,
// spanning and standing as high and wide as the bug cars' shell does
// (bugcar.js, SHELL: 2.4 long, 0.88 across, its top 1.37 up); the HEAD
// half an ellipsoid stood on the FLOOR ahead of them, as the bug cars'
// is, `rx`, `ry`, `rz` how far it reaches along, up and across. The WELL is the cockpit (tray.js) cut
// down through the segments, its floor the FLOOR, the body levelled
// round it to its rim, TOP.
const FLOOR = 0.45;
const SEG = { y: 0.7, rx: 0.55, ry: 0.65, rz: 0.9 };
const XS = [-0.95, -0.27, 0.41];
const HEAD = { x: 1.0, rx: 0.45, ry: 0.5, rz: 0.65 }, BELLY = 0.3;
const WELL = { x0: -0.85, x1: -0.85 + COCKPIT.len, z1: COCKPIT.half }, TOP = FLOOR + COCKPIT.depth;
const LEVEL = leveller(WELL, TOP);

const Y = new THREE.Vector3(0, 1, 0);
// A point on a segment's surface out from its middle in direction `d`,
// and the surface's normal there (a whole ellipsoid, nothing levelled:
// the spots and feet sit on the flanks, clear of the well).
function onSeg(x, d) {
  const v = new THREE.Vector3(...d).normalize();
  return { at: new THREE.Vector3(x + SEG.rx * v.x, SEG.y + SEG.ry * v.y, SEG.rz * v.z), normal: new THREE.Vector3(v.x / SEG.rx, v.y / SEG.ry, v.z / SEG.rz).normalize() };
}
const onHead = (d) => {
  const v = new THREE.Vector3(...d).normalize();
  return { at: new THREE.Vector3(HEAD.x + HEAD.rx * v.x, FLOOR + HEAD.ry * v.y, HEAD.rz * v.z), normal: new THREE.Vector3(v.x / HEAD.rx, v.y / HEAD.ry, v.z / HEAD.rz).normalize() };
};

export function buildCaterpillarCar(finish, C = CATERPILLARCAR) {
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
  const standOn = (at, normal, geo, color, extra, sink = 0) => {
    const mesh = add(geo, color, 0, 0, 0, extra);
    mesh.position.copy(at).addScaledVector(normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, normal);
    return mesh;
  };
  const both = { side: THREE.DoubleSide };

  // the segments, one geometry, with the well cut down through them
  const segs = XS.map((x) => new THREE.SphereGeometry(1, 64, 40).scale(SEG.rx, SEG.ry, SEG.rz).translate(x, SEG.y, 0));
  add(cutThrough(mergeGeometries(segs), WELL, FLOOR, LEVEL), C.body, 0, 0, 0, both);

  // the cockpit, cut out of the segments (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // a yellow spot on each segment's flank, and a pair of stubby feet
  // under it: each one piece, a tube down out of the segment's underside
  // that bends forward along the ground into a toe, rounded off at its
  // end with a ball the tube's own size so the bend reads as one shape
  const spotGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16).translate(0, 0.015, 0);
  const FOOT_R = 0.07;
  const footPath = new THREE.CatmullRomCurve3([[0, 0.35], [0, 0.2], [0, 0.1], [FOOT_R, FOOT_R], [0.16, FOOT_R]].map(([dx, y]) => new THREE.Vector3(dx, y, 0)));
  const footGeo = mergeGeometries([new THREE.TubeGeometry(footPath, 16, FOOT_R, 10, false), new THREE.SphereGeometry(FOOT_R, 10, 8).translate(0.16, FOOT_R, 0)]);
  for (const x of XS)
    for (const s of [-1, 1]) {
      const { at, normal } = onSeg(x, [0, 0.35, s]);
      standOn(at, normal, spotGeo, C.spot, undefined, 0.02);
      add(footGeo, C.foot, x, 0, s * 0.55);
    }

  // the head: a dome grown into the first segment's front, a belly
  // plate the shape of its footprint under it, two round headlights for
  // eyes in its face, and two antennae out of its top, each a stalk
  // straight out of the dome with a knob on its tip, as the ladybug's
  add(new THREE.SphereGeometry(1, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2).scale(HEAD.rx, HEAD.ry, HEAD.rz).translate(HEAD.x, FLOOR, 0), C.head, 0, 0, 0);
  add(new THREE.CylinderGeometry(1, 1, BELLY, 48).scale(HEAD.rx - 0.03, 1, HEAD.rz - 0.03), C.dash, HEAD.x, FLOOR - BELLY / 2, 0);
  const lampGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14).translate(0, 0.04, 0);
  const stalk = new THREE.CylinderGeometry(0.018, 0.022, 0.5, 8).translate(0, 0.25, 0);
  for (const s of [-1, 1]) {
    const eye = onHead([0.8, 0.4, s * 0.55]);
    standOn(eye.at, eye.normal, lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.03);
    const { at, normal } = onHead([0.5, 0.8, s * 0.45]);
    standOn(at, normal, stalk, C.dash, undefined, 0.03);
    const tip = at.clone().addScaledVector(normal, 0.47);
    add(new THREE.SphereGeometry(0.06, 12, 10), C.spot, tip.x, tip.y, tip.z);
  }

  // the horn: a little cone on the last segment's top, leaning back
  {
    const { at, normal } = onSeg(XS[0], [-0.6, 0.8, 0]);
    standOn(at, normal, new THREE.ConeGeometry(0.06, 0.32, 10).translate(0, 0.16, 0), C.foot, undefined, 0.03);
  }

  // tail lights on the last segment's rear
  const tailGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14).translate(0, 0.025, 0);
  for (const s of [-1, 1]) {
    const { at, normal } = onSeg(XS[0], [-1, 0.1, s * 0.5]);
    standOn(at, normal, tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);
  }

  // four wheels, each with a hubcap, turning on axles along z under the
  // body, outside the feet
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 10).rotateX(Math.PI / 2);
  for (const x of [-0.92, 0.28]) {
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
