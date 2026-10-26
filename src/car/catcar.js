/* ============================================================
   CAT CAR: the roadster (car.js) remade as a cat sitting in a loaf. The
   body is the LOAF, a long dome stood on a cream belly plate, tabby
   stripes across its back behind the cockpit and a haunch bulging out
   either side at the rear; at the front a round HEAD with two pointed
   ears, pink inside, wide green eyes with slit pupils, a pink nose over
   a cream muzzle, whiskers fanned out either side, and a red collar
   with a bell. Two front PAWS lie on the ground ahead of the body with
   headlights in their fronts, and the TAIL comes out of the back and
   curls forward along one flank, ringed in stripes. The COCKPIT is the
   cut-out cars' (tray.js), cut out of the loaf's back, the loaf levelled
   round it so its rim is four straight, level lines; in it the
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

// `fur` the body, head, paws and tail, `stripe` the tabby stripes and
// the tail's rings, `cream` the belly, muzzle, paw tips and ear fur,
// `inner` the insides of the ears, `nose` the nose, `eye` and `pupil`
// the eyes, `whisker` the whiskers, `collar` the collar, `bell` its
// bell, `trim` the seats and hubcaps, `dash` the
// cockpit's walls, the steering wheel and the axles.
export const CATCAR = {
  scale: 1.6, // built about 3.7 long; the game scales it up to fit a driver
  fur: 0xe8a35a,
  stripe: 0xb5652a,
  cream: 0xfff1d6,
  inner: 0xf4b7c0,
  nose: 0xf08a9b,
  eye: 0x8fd07a,
  pupil: 0x1e1a1c,
  whisker: 0xfff8ea,
  collar: 0xd94848,
  bell: 0xf2c230,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The body, in the car's own units (before `scale`). The LOAF is half
// an ellipsoid stood on the FLOOR: `x` where its middle is along the
// car, `rx`, `ry`, `rz` how far it reaches along, up and across. The
// WELL is the cockpit (tray.js) cut out of its back, its floor the
// FLOOR, the loaf levelled round it to its rim, TOP. The HEAD is a ball
// ahead of it, a little wider than tall.
const FLOOR = 0.45, BELLY = 0.16;
const LOAF = { x: -0.25, rx: 1.35, ry: 0.78, rz: 0.85 };
const WELL = { x0: -0.85, x1: -0.85 + COCKPIT.len, z1: COCKPIT.half }, TOP = FLOOR + COCKPIT.depth;
const HEAD = { x: 1.25, y: 0.88, rx: 0.46, ry: 0.43, rz: 0.5 };
const LEVEL = leveller(WELL, TOP);

const Y = new THREE.Vector3(0, 1, 0);
const steps = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const domeAt = (x, z) => FLOOR + LOAF.ry * Math.sqrt(Math.max(0, 1 - ((x - LOAF.x) / LOAF.rx) ** 2 - (z / LOAF.rz) ** 2));
const loafAt = (x, z) => LEVEL.height(domeAt(x, z), x, z);
const reshaped = (x, z) => LEVEL.reshaped(domeAt(x, z), x, z);
function loafNormal(x, z) {
  const e = 1e-3;
  return new THREE.Vector3(-(loafAt(x + e, z) - loafAt(x - e, z)) / (2 * e), 1, -(loafAt(x, z + e) - loafAt(x, z - e)) / (2 * e)).normalize();
}
// A point on the head's surface out from its middle in direction `d`,
// and the surface's normal there.
function onHead(d) {
  const v = new THREE.Vector3(...d).normalize();
  return { at: new THREE.Vector3(HEAD.x + HEAD.rx * v.x, HEAD.y + HEAD.ry * v.y, HEAD.rz * v.z), normal: new THREE.Vector3(v.x / HEAD.rx, v.y / HEAD.ry, v.z / HEAD.rz).normalize() };
}

export function buildCatCar(finish, C = CATCAR) {
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

  // the loaf, with the well cut out of its back, on a belly plate the
  // shape of its footprint; a haunch bulging out of each rear flank
  const dome = new THREE.SphereGeometry(1, 192, 96, 0, Math.PI * 2, 0, Math.PI / 2).scale(LOAF.rx, LOAF.ry, LOAF.rz).translate(LOAF.x, FLOOR, 0);
  add(cutThrough(dome, WELL, FLOOR, LEVEL), C.fur, 0, 0, 0, both);
  add(new THREE.CylinderGeometry(1, 1, BELLY, 64).scale(LOAF.rx - 0.03, 1, LOAF.rz - 0.03), C.cream, LOAF.x, FLOOR - BELLY / 2, 0);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(1, 28, 20).scale(0.42, 0.3, 0.26), C.fur, -1.3, 0.72, s * 0.66);

  // the cockpit, cut out of the loaf (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // the stripes: tabby bands across the loaf's back behind the well,
  // each a tube over its cross-section from flank to flank, and a short
  // one down each haunch
  const stripes = [];
  for (const x of [-1.05, -1.22, -1.4]) {
    const k = Math.sqrt(1 - ((x - LOAF.x) / LOAF.rx) ** 2);
    const pts = steps(0.12, Math.PI - 0.12, 32).map((a) => {
      const z = LOAF.rz * k * Math.cos(a);
      return new THREE.Vector3(x, (reshaped(x, z) ? loafAt(x, z) : FLOOR + LOAF.ry * k * Math.sin(a)) + 0.004, z);
    });
    stripes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.035, 6, false));
  }
  for (const s of [-1, 1])
    for (const x of [-1.15, -1.35]) stripes.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(x, 0.98, s * 0.72), new THREE.Vector3(x - 0.02, 0.62, s * 0.9)), 4, 0.03, 6, false));
  add(mergeGeometries(stripes), C.stripe, 0, 0, 0);

  // the head: a ball at the loaf's front, two ears standing on its top,
  // pink inside, the eyes wide with slit pupils, a pink nose over a cream
  // muzzle of two mounds, whiskers fanned from each, and two stripes up
  // its brow
  add(new THREE.SphereGeometry(1, 48, 32).scale(HEAD.rx, HEAD.ry, HEAD.rz), C.fur, HEAD.x, HEAD.y, 0);
  for (const s of [-1, 1]) {
    const { at, normal } = onHead([0.05, 0.85, s * 0.6]);
    const lean = normal.clone().add(new THREE.Vector3(-0.1, 0, s * 0.15)).normalize();
    standOn(at, lean, new THREE.ConeGeometry(0.17, 0.34, 4).rotateY(Math.PI / 4).translate(0, 0.17, 0), C.fur, undefined, 0.08);
    standOn(at.clone().add(new THREE.Vector3(0.07, 0, 0)), lean, new THREE.ConeGeometry(0.1, 0.24, 4).rotateY(Math.PI / 4).translate(0, 0.1, 0), C.inner, undefined, 0.06);
  }
  for (const s of [-1, 1]) {
    const { at, normal } = onHead([0.75, 0.3, s * 0.5]);
    const eye = at.clone().addScaledVector(normal, -0.035);
    add(new THREE.SphereGeometry(0.1, 18, 14).scale(1, 0.85, 1), C.eye, eye.x, eye.y, eye.z);
    const look = normal.clone().lerp(new THREE.Vector3(1, 0, 0), 0.5).normalize();
    const pupil = eye.clone().addScaledVector(look, 0.075);
    const slit = add(new THREE.CapsuleGeometry(0.018, 0.09, 4, 8), C.pupil, pupil.x, pupil.y, pupil.z);
    slit.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), look); // the capsule stands up its own y: a slit
    const glint = pupil.clone().addScaledVector(look, 0.03).add(new THREE.Vector3(0, 0.035, -s * 0.02));
    add(new THREE.SphereGeometry(0.016, 8, 6), C.whisker, glint.x, glint.y, glint.z);
  }
  {
    const { at, normal } = onHead([1, -0.15, 0]);
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.13, 18, 14).scale(1, 0.8, 1), C.cream, at.x - 0.06, at.y - 0.04, s * 0.11);
    standOn(at.clone().add(new THREE.Vector3(0.04, 0.09, 0)), normal, new THREE.CylinderGeometry(0.05, 0.05, 0.03, 3).rotateY(Math.PI / 2).translate(0, 0.015, 0), C.nose, undefined, 0.01); // a triangle, one point down
    const whisker = new THREE.CylinderGeometry(0.006, 0.006, 0.5, 6).translate(0, 0.25, 0);
    for (const s of [-1, 1])
      for (const tilt of [-0.2, 0, 0.2]) {
        const root = new THREE.Vector3(at.x - 0.02, at.y - 0.02, s * 0.14);
        const dir = new THREE.Vector3(0.35, tilt, s).normalize();
        standOn(root, dir, whisker, C.whisker, undefined, -0.02);
      }
    for (const s of [-1, 1]) {
      const g = new THREE.TubeGeometry(new THREE.LineCurve3(onHead([0.6, 0.65, s * 0.15]).at, onHead([0.25, 0.9, s * 0.2]).at), 4, 0.022, 6, false);
      add(g, C.stripe, 0.01, 0.01, 0);
    }
  }
  // the collar: a red ring round the neck where the head meets the
  // loaf, a gold bell hanging from its front
  const collar = add(new THREE.TorusGeometry(0.46, 0.04, 10, 36).rotateY(Math.PI / 2), C.collar, 1.02, 0.72, 0);
  collar.rotation.z = -0.3;
  add(new THREE.SphereGeometry(0.075, 14, 10), C.bell, 1.2, 0.26, 0);
  add(new THREE.SphereGeometry(0.02, 8, 6), C.pupil, 1.27, 0.24, 0);

  // the paws: two rounded pads lying on the ground ahead of the loaf,
  // three cream toes at the front of each, and a headlight set in each
  // front, between the toes
  const pawGeo = new THREE.CapsuleGeometry(0.15, 0.3, 6, 14).rotateZ(Math.PI / 2).scale(1, 0.75, 1);
  const toeGeo = new THREE.SphereGeometry(1, 12, 8).scale(0.07, 0.05, 0.06);
  const lampGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 14).rotateZ(-Math.PI / 2).translate(0.03, 0, 0);
  for (const s of [-1, 1]) {
    add(pawGeo, C.fur, 1.5, 0.12, s * 0.34);
    for (const k of [-1, 0, 1]) add(toeGeo, C.cream, 1.78, 0.1, s * 0.34 + k * 0.1);
    add(lampGeo, C.lamp, 1.76, 0.17, s * 0.34, { emissive: C.lamp, emissiveIntensity: 0.6 });
  }

  // the tail: a tube along a curve out of the loaf's back, curling round
  // the right flank and forward along it, tapering to a rounded tip,
  // three stripe rings along it
  const TAIL = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.35, 0.5, 0.1), new THREE.Vector3(-1.75, 0.46, 0.45), new THREE.Vector3(-1.55, 0.46, 0.95), new THREE.Vector3(-0.95, 0.5, 1.12), new THREE.Vector3(-0.3, 0.52, 1.1), new THREE.Vector3(0.1, 0.6, 1.0)]);
  const tailGeo = new THREE.TubeGeometry(TAIL, 48, 0.11, 10, false);
  {
    const pos = tailGeo.attributes.position, uv = tailGeo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i), on = TAIL.getPointAt(u);
      v.fromBufferAttribute(pos, i).sub(on).multiplyScalar(1 - 0.3 * u).add(on);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    tailGeo.computeVertexNormals();
  }
  add(tailGeo, C.fur, 0, 0, 0);
  const tip = TAIL.getPointAt(1);
  add(new THREE.SphereGeometry(0.11 * 0.7, 12, 10), C.stripe, tip.x, tip.y, tip.z);
  for (const u of [0.45, 0.62, 0.8]) {
    const on = TAIL.getPointAt(u), ring = add(new THREE.TorusGeometry(0.11 * (1 - 0.3 * u) + 0.003, 0.025, 6, 20), C.stripe, on.x, on.y, on.z);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), TAIL.getTangentAt(u));
  }

  // tail lights low on the loaf's rear flanks
  const lightGeo = new THREE.BoxGeometry(0.16, 0.04, 0.1).translate(0, 0.02, 0);
  for (const s of [-1, 1]) {
    const x = -1.5, z = s * 0.45, at = new THREE.Vector3(x, loafAt(x, z), z);
    standOn(at, loafNormal(x, z), lightGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);
  }

  // four wheels, each with a hubcap, turning on axles along z under the
  // belly, the same distance either side of the loaf's middle
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.7, 10).rotateX(Math.PI / 2);
  for (const x of [LOAF.x - 0.67, LOAF.x + 0.53]) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
    for (const z of [-0.82, 0.82]) {
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
