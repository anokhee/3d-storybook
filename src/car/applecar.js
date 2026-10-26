/* ============================================================
   APPLE CAR: the roadster (car.js) remade as an apple. The body is one
   plump round apple standing the way an apple stands, a little wider
   than tall, fat in the shoulders and drawn in toward its base, with
   the dimple at its top; it is leant back a touch and set back over the
   axles, so the dimple and the short brown stem rising out of it, with
   a leaf on the stem, are behind the cockpit. A BITE is taken out of
   the right flank (+z, the side the catalog sees), high and toward the
   front, showing the pale flesh, and out of the flesh a WORM comes
   curling up and out: a green tube with a round head and two eyes,
   looking out of the bite. A small pale highlight sits high on each
   shoulder. The COCKPIT is the cut-out cars' (tray.js), cut into
   the top of the apple ahead of the dimple like a cookie cutter, the
   skin eased level round it so its rim is four straight, level lines,
   its floor, walls and lip in a darker colour; in it the roadster's two
   bucket seats, dashboard and steering wheel, and an arched windshield
   raked back from its front edge. Headlights in dark rims on the front
   slope, tail lights on the back one, four wheels with hubcaps on two
   axles under the belly. Faces +X; its origin on the ground under the
   axles. Up is +Y.

   The apple is a sphere pushed into shape by `local(dx, dy, dz)` (a
   unit direction from its centre to the skin, in the apple's own
   upright frame), then leant and set back by `toWorld`; `inside(p)`
   says whether a world point is within the skin, which is how the bite
   is cut. Where something has to sit ON the skin (the lamps, the
   highlights) its place is found by casting a ray at the body and
   taking the hit. `finish(color, extra)` makes every material, so a
   page can hand in its own (the game's toon, or the stage's).
   `roll(dt, speed)` turns the wheels as the game does for a car going
   `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `skin` the apple, `flesh` the bite, `worm` the worm in it, `shine`
// the highlight patches, `stem` and `leaf` the top, `trim` the seats
// and hubcaps, `well` the cockpit's floor, walls and lip.
export const APPLECAR = {
  scale: 1.45, // built about 3.2 long and nearly as tall; the game scales it up to fit a driver
  skin: 0xd8281f,
  flesh: 0xfff3d2,
  worm: 0x9bd36b,
  shine: 0xf7b2a6,
  stem: 0x6b4423,
  leaf: 0x4f9d3a,
  trim: 0xf3e3b4,
  well: 0x5a1612,
  dash: 0x3a3330, // the dashboard and the steering wheel
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The apple, in the car's own units (before `scale`): RX long, RZ
// across and RY tall at the unit sphere (a little oval, long-ways), its
// shoulders swelled and its base drawn in, the top dimple DIMPLE deep;
// its centre at (OX, CY), leant back TILT radians (which lifts its
// nose a touch). The BITE is a sphere, where it meets the skin. The WELL
// is the cockpit, its rim at TOP and its floor FLOOR; the skin is eased
// to the rim round it.
const RX = 1.6, RZ = 1.5, RY = 1.35, DIMPLE = 0.3, OX = -0.15, CY = 1.5, TILT = 0.3;
const BITE = { at: new THREE.Vector3(0.5, 2.0, 1.55), r: 0.6 };
const WELL = { x0: -0.1, x1: -0.1 + COCKPIT.len, z1: COCKPIT.half }, TOP = 2.3, FLOOR = TOP - COCKPIT.depth;
// the skin is eased to the rim round the well, but only the skin up at
// the rim's height: the apple is round, so its nose and tail slope down
// past the rim not far ahead of and behind the well, and they must keep
// their shape
const EASE = leveller(WELL, TOP, { cap: false });
const LEVEL = { ...EASE, reshaped: (h, x, z) => h > TOP - 0.05 && EASE.reshaped(h, x, z) };
const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);

// the skin in the apple's own frame for a unit direction (dx, dy, dz)
// from its centre: fat above the middle, drawn in below, dimpled on top
function local(dx, dy, dz, out = new THREE.Vector3()) {
  const shoulder = dy > 0 ? 1 + 0.06 * dy : 1 + 0.24 * dy;
  const r2 = dx * dx + dz * dz;
  const y = dy * RY - DIMPLE * Math.exp(-r2 / 0.1) * Math.max(dy, 0);
  return out.set(dx * RX * shoulder, y, dz * RZ * shoulder);
}
const toWorld = (v) => v.applyAxisAngle(Z, TILT).add(new THREE.Vector3(OX, CY, 0));
const fromWorld = (v) => v.clone().sub(new THREE.Vector3(OX, CY, 0)).applyAxisAngle(Z, -TILT);
// whether a world point is within the skin (the apple is star-shaped
// about its centre, so it is a matter of how far out it is along its
// own direction)
const inside = (p) => {
  const l = fromWorld(p), d = l.length();
  if (d < 1e-6) return true;
  return d < local(l.x / d, l.y / d, l.z / d).length();
};

export function buildAppleCar(finish, C = APPLECAR) {
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

  // the body: a sphere pushed into an apple, its seam welded shut, its
  // axis (z) taken as the apple's up so the seam falls in the dimple (a
  // quarter turn, not a swap, so the skin keeps facing out)
  let geo = new THREE.SphereGeometry(1, 96, 72);
  geo.deleteAttribute("uv");
  geo.deleteAttribute("normal");
  geo = mergeVertices(geo, 1e-4);
  const pos = geo.attributes.position, p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    toWorld(local(p.x, p.z, -p.y, p));
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  // the bite: the skin's triangles wholly within the bite's sphere go,
  // and the ones its edge crosses are drawn to the sphere, so the hole's
  // edge lies right on it
  const inBite = (i) => p.fromBufferAttribute(pos, i).distanceTo(BITE.at) < BITE.r;
  const kept = [], index = geo.index.array;
  for (let t = 0; t < index.length; t += 3) {
    const ins = [index[t], index[t + 1], index[t + 2]].filter(inBite).length;
    if (ins < 3) kept.push(index[t], index[t + 1], index[t + 2]);
  }
  for (let i = 0; i < pos.count; i++) {
    if (!inBite(i)) continue;
    p.sub(BITE.at).setLength(BITE.r).add(BITE.at);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  geo.setIndex(kept);
  geo.computeVertexNormals();
  const body = add(cutThrough(geo, WELL, FLOOR, LEVEL), C.skin, 0, 0, 0, { side: THREE.DoubleSide });
  body.updateMatrixWorld();
  // the flesh: the part of the bite's sphere that is within the apple,
  // facing in
  const ball = new THREE.SphereGeometry(BITE.r, 48, 32).translate(BITE.at.x, BITE.at.y, BITE.at.z);
  const bp = ball.attributes.position, bi = ball.index.array, F = [], N = [];
  for (let t = 0; t < bi.length; t += 3) {
    const tri = [bi[t], bi[t + 1], bi[t + 2]].map((i) => new THREE.Vector3().fromBufferAttribute(bp, i));
    if (!tri.some(inside)) continue;
    for (const v of [tri[0], tri[2], tri[1]]) {
      F.push(v.x, v.y, v.z);
      const n = BITE.at.clone().sub(v).normalize();
      N.push(n.x, n.y, n.z);
    }
  }
  const flesh = new THREE.BufferGeometry();
  flesh.setAttribute("position", new THREE.Float32BufferAttribute(F, 3));
  flesh.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
  add(flesh, C.flesh, 0, 0, 0, { side: THREE.DoubleSide });

  // the worm: out of a hole in the flesh (a dark disc on it) a tube
  // curling out of the bite, up and toward the viewer, a round head on
  // its end with two eyes looking out
  const into = new THREE.Vector3(-0.32, -0.27, -0.91).normalize(); // from the bite's centre into the apple
  const hole = BITE.at.clone().addScaledVector(into, BITE.r); // on the flesh
  const out = into.clone().negate();
  const path = new THREE.CatmullRomCurve3([
    hole.clone().addScaledVector(into, 0.3),
    hole.clone(),
    hole.clone().addScaledVector(out, 0.28).add(new THREE.Vector3(0.02, 0.08, 0)),
    hole.clone().addScaledVector(out, 0.46).add(new THREE.Vector3(0.06, 0.3, 0.04)),
    hole.clone().addScaledVector(out, 0.5).add(new THREE.Vector3(0.1, 0.5, 0.08)),
  ]);
  const holeDisc = new THREE.CircleGeometry(0.15, 20);
  const disc = add(holeDisc, C.well, 0, 0, 0, { side: THREE.DoubleSide });
  disc.position.copy(hole).addScaledVector(out, 0.01);
  disc.quaternion.setFromUnitVectors(Z, out);
  add(new THREE.TubeGeometry(path, 32, 0.11, 12, false), C.worm, 0, 0, 0);
  const headAt = path.getPoint(1);
  const head = add(new THREE.SphereGeometry(0.16, 20, 14), C.worm, headAt.x, headAt.y, headAt.z);
  const eyeGeo = new THREE.SphereGeometry(0.05, 12, 8), pupilGeo = new THREE.SphereGeometry(0.025, 10, 6);
  for (const s of [-1, 1]) {
    const e = new THREE.Vector3(0.03 + s * 0.065, 0.05, 0.12).normalize();
    add(eyeGeo, 0xfafafa, e.x * 0.16, e.y * 0.16, e.z * 0.16, undefined, head);
    add(pupilGeo, C.dash, e.x * 0.2, e.y * 0.2, e.z * 0.2, undefined, head);
  }

  const caster = new THREE.Raycaster(), from = new THREE.Vector3(), toward = new THREE.Vector3();
  const hit = (ox, oy, oz, dx, dy, dz) => {
    caster.set(from.set(ox, oy, oz), toward.set(dx, dy, dz).normalize());
    const h = caster.intersectObject(body, false)[0];
    return h ? { at: h.point.clone(), normal: h.face.normal.clone() } : null;
  };
  const stickOn = (h, g, color, extra, sink = 0) => {
    const mesh = add(g, color, 0, 0, 0, extra);
    mesh.position.copy(h.at).addScaledVector(h.normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, h.normal);
    return mesh;
  };

  // a small pale highlight high on each shoulder, toward the front
  const shineGeo = new THREE.SphereGeometry(1, 16, 10).scale(0.2, 0.03, 0.11);
  for (const s of [-1, 1]) {
    const h = hit(0.4, CY + 2, s * 1.2, -0.15, -1, -s * 0.3);
    if (!h) continue;
    stickOn(h, shineGeo, C.shine, undefined, 0.012).rotateY(s * 0.7);
  }

  // the stem out of the dimple, leaning back a little more than the
  // apple, and a leaf on it: a pointed oval with a midrib, held out to
  // the right and tipped up
  const top = toWorld(local(0, 1, 0)), up = new THREE.Vector3(-Math.sin(TILT + 0.3), Math.cos(TILT + 0.3), 0);
  const stem = add(new THREE.CylinderGeometry(0.05, 0.075, 0.55, 10).translate(0, 0.275, 0), C.stem, 0, 0, 0);
  stem.position.copy(top).addScaledVector(up, -0.08);
  stem.quaternion.setFromUnitVectors(Y, up);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.26, 0.2, 0.62, 0);
  leafShape.quadraticCurveTo(0.26, -0.2, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.02, bevelEnabled: false }).translate(0, 0, -0.01);
  const leafAt = top.clone().addScaledVector(up, 0.22);
  const leafHold = new THREE.Group();
  leafHold.position.copy(leafAt);
  leafHold.rotation.set(-1.25, 0.4, 0.55); // flat-ish, swung to +z, tipped up
  group.add(leafHold);
  add(leafGeo, C.leaf, 0, 0, 0, { side: THREE.DoubleSide }, leafHold);
  add(new THREE.BoxGeometry(0.5, 0.012, 0.03).translate(0.29, 0, 0), C.stem, 0, 0, 0.012, undefined, leafHold); // the midrib

  // headlights on the front slope and tail lights on the back one,
  // each in a dark rim (lit for the night)
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 14).translate(0, 0.04, 0);
  const rimGeo = new THREE.TorusGeometry(0.1, 0.018, 8, 20).rotateX(Math.PI / 2).translate(0, 0.055, 0);
  const tailGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12).translate(0, 0.025, 0);
  const tailRim = new THREE.TorusGeometry(0.07, 0.015, 8, 20).rotateX(Math.PI / 2).translate(0, 0.035, 0);
  for (const s of [-1, 1]) {
    const f = hit(4, 1.3, s * 0.55, -1, 0, 0), b = hit(-4, 1.3, s * 0.55, 1, 0, 0);
    if (f) {
      stickOn(f, lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.03);
      stickOn(f, rimGeo, C.dash, undefined, 0.03);
    }
    if (b) {
      stickOn(b, tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);
      stickOn(b, tailRim, C.dash, undefined, 0.02);
    }
  }

  // the cockpit, cut into the skin (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP, C.well);

  // four wheels, each with a hubcap, turning on an axle along z under the belly
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.9, 10).rotateX(Math.PI / 2);
  for (const x of [-0.9, 0.9]) {
    add(axleGeo, C.wheel, x, C.wheelR, 0);
    for (const z of [-0.95, 0.95]) {
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
