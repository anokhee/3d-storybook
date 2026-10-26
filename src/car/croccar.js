/* ============================================================
   CROCODILE CAR: the roadster (car.js) remade as a crocodile. The body
   is a long, low BODY dome stood on a pale belly plate, two rows of
   pointed SCUTES studded down its back either side of the cockpit and a
   row down its middle before and behind it. Out of the front comes the
   HEAD, a flat skull with two eye bumps on top, each a yellow eye with
   a slit pupil, and the SNOUT: a long flat upper jaw with headlights for
   nostrils at its tip over a lower jaw hung a little open, a row of
   white teeth round each. Behind, a thick TAIL tapers out and curls a
   little to one side, scutes down its ridge; four stubby LEGS splay out
   by the wheels, three claws each. The COCKPIT is the cut-out cars'
   (tray.js), cut out of the body's back, the body levelled round it so
   its rim is four straight, level lines; in it the roadster's two bucket
   seats, dashboard and steering wheel, and an arched windshield
   raked back from its front edge. Faces +X; its origin on the ground under
   the axles. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `skin` the body, head, tail and legs, `scute` the studs down its back
// and the darker patches, `belly` the plate under it and the lower jaw's
// underside, `tooth` the teeth and claws, `eye` and `pupil` the eyes,
// `mouth` the inside of the mouth, `trim` the seats and hubcaps,
// `dash` the cockpit's walls, the steering wheel and
// the axles.
export const CROCCAR = {
  scale: 1.6, // built about 5.6 long; the game scales it up to fit a driver
  skin: 0x5b8a46,
  scute: 0x3a5e2e,
  belly: 0xd6d99a,
  tooth: 0xfff8ea,
  eye: 0xe8c84a,
  pupil: 0x1e1a1c,
  mouth: 0xc9657a,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The body, in the car's own units (before `scale`). The BODY is half an
// ellipsoid stood on the FLOOR, long and low: `x` where its middle is
// along the car, `rx`, `ry`, `rz` how far it reaches along, up and
// across. The WELL is the cockpit (tray.js) cut out of its back, its
// floor the FLOOR, the body levelled round it to its rim, TOP. The HEAD
// and the two JAWs are whole ellipsoids ahead of it, `y` their middles'
// height.
const FLOOR = 0.45, BELLY = 0.16;
const BODY = { x: -0.3, rx: 1.45, ry: 0.64, rz: 0.82 };
const WELL = { x0: -0.85, x1: -0.85 + COCKPIT.len, z1: COCKPIT.half }, TOP = FLOOR + COCKPIT.depth;
const HEAD = { x: 1.3, y: 0.76, rx: 0.5, ry: 0.3, rz: 0.56 };
const UPPER = { x: 2.05, y: 0.84, rx: 0.78, ry: 0.16, rz: 0.36 };
const LOWER = { x: 1.98, y: 0.6, rx: 0.72, ry: 0.11, rz: 0.33 };
const LEVEL = leveller(WELL, TOP);

const Y = new THREE.Vector3(0, 1, 0);
const steps = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
// The body's dome over (x, z), the floor outside its footprint; that
// levelled round the well; and its normal there.
const domeAt = (x, z) => FLOOR + BODY.ry * Math.sqrt(Math.max(0, 1 - ((x - BODY.x) / BODY.rx) ** 2 - (z / BODY.rz) ** 2));
const bodyAt = (x, z) => LEVEL.height(domeAt(x, z), x, z);
function bodyNormal(x, z) {
  const e = 1e-3;
  return new THREE.Vector3(-(bodyAt(x + e, z) - bodyAt(x - e, z)) / (2 * e), 1, -(bodyAt(x, z + e) - bodyAt(x, z - e)) / (2 * e)).normalize();
}
// A point on a whole ellipsoid's surface out from its middle in
// direction `d`, and the surface's normal there.
function onBlob(E, d) {
  const v = new THREE.Vector3(...d).normalize();
  return { at: new THREE.Vector3(E.x + E.rx * v.x, E.y + E.ry * v.y, E.rz * v.z), normal: new THREE.Vector3(v.x / E.rx, v.y / E.ry, v.z / E.rz).normalize() };
}
const blobGeo = (E) => new THREE.SphereGeometry(1, 36, 24).scale(E.rx, E.ry, E.rz).translate(E.x, E.y, 0);

export function buildCrocCar(finish, C = CROCCAR) {
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
  // Something stood up at `at` on a surface whose normal is `normal`,
  // `geo` built standing up from its base at the origin, sunk `sink` in.
  const standOn = (at, normal, geo, color, extra, sink = 0) => {
    const mesh = add(geo, color, 0, 0, 0, extra);
    mesh.position.copy(at).addScaledVector(normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, normal);
    return mesh;
  };

  // the body, with the well cut out of its back, on a belly plate the
  // shape of its footprint
  const dome = new THREE.SphereGeometry(1, 192, 96, 0, Math.PI * 2, 0, Math.PI / 2).scale(BODY.rx, BODY.ry, BODY.rz).translate(BODY.x, FLOOR, 0);
  add(cutThrough(dome, WELL, FLOOR, LEVEL), C.skin, 0, 0, 0, both);
  add(new THREE.CylinderGeometry(1, 1, BELLY, 64).scale(BODY.rx - 0.03, 1, BODY.rz - 0.03), C.belly, BODY.x, FLOOR - BELLY / 2, 0);

  // the cockpit, cut out of the body (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP);

  // the scutes: four-sided studs stood on the levelled body, a row down
  // each flank outside the well and one down the middle before and
  // behind it, each turned to the surface under it
  const studGeo = new THREE.ConeGeometry(0.075, 0.13, 4).translate(0, 0.05, 0);
  const studs = [];
  const stud = (x, z) => {
    const at = new THREE.Vector3(x, bodyAt(x, z), z), n = bodyNormal(x, z), g = studGeo.clone();
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, n)).translate(at.x - n.x * 0.02, at.y - n.y * 0.02, at.z - n.z * 0.02);
    studs.push(g);
  };
  for (const x of steps(-1.35, 0.75, 9)) for (const z of [-0.5, 0.5]) stud(x, z);
  for (const x of steps(0.5, 0.95, 2)) stud(x, 0);
  for (const x of steps(-1.6, -1.05, 3)) stud(x, 0);

  // the head: a flat skull out of the body's front, two eye bumps on its
  // top, in each a yellow eye with a slit pupil looking ahead
  add(blobGeo(HEAD), C.skin, 0, 0, 0);
  for (const s of [-1, 1]) {
    const bump = onBlob(HEAD, [0.1, 0.9, s * 0.55]).at;
    add(new THREE.SphereGeometry(0.15, 18, 14), C.skin, bump.x, bump.y - 0.03, bump.z);
    const eye = bump.clone().add(new THREE.Vector3(0.06, 0.03, 0));
    add(new THREE.SphereGeometry(0.1, 18, 14), C.eye, eye.x, eye.y, eye.z);
    add(new THREE.BoxGeometry(0.02, 0.1, 0.03).translate(0.095, 0, 0), C.pupil, eye.x, eye.y + 0.01, eye.z);
  }
  // the snout: the upper jaw straight out of the skull, the lower hung
  // from its root and dropped open a little; a dark gap between them,
  // teeth round the upper jaw's edge pointing down and the lower's up
  add(blobGeo(UPPER), C.skin, 0, 0, 0);
  const lower = new THREE.Group();
  lower.position.set(LOWER.x - LOWER.rx, LOWER.y, 0);
  lower.rotation.z = -0.1;
  group.add(lower);
  add(new THREE.SphereGeometry(1, 36, 24).scale(LOWER.rx, LOWER.ry, LOWER.rz).translate(LOWER.rx, 0, 0), C.skin, 0, 0, 0, undefined, lower);
  add(new THREE.SphereGeometry(1, 36, 24).scale(LOWER.rx - 0.02, LOWER.ry * 0.7, LOWER.rz - 0.02).translate(LOWER.rx, -0.03, 0), C.belly, 0, 0, 0, undefined, lower);
  add(new THREE.SphereGeometry(1, 24, 16).scale(LOWER.rx - 0.08, 0.03, LOWER.rz - 0.06).translate(LOWER.rx, LOWER.ry - 0.01, 0), C.mouth, 0, 0, 0, undefined, lower);
  const toothGeo = new THREE.ConeGeometry(0.03, 0.1, 8).translate(0, 0.05, 0);
  const teeth = [];
  const tooth = (p, dir) => {
    const g = toothGeo.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, dir)).translate(p.x, p.y, p.z);
    teeth.push(g);
  };
  for (const u of steps(0.12, 0.88, 6)) {
    const a = u * Math.PI; // round the jaw's edge from one side of its root to the other
    for (const [E, up, dy] of [[UPPER, -1, -0.04], [LOWER, 1, 0.03]]) {
      const x = E.x + E.rx * Math.sin(a) * 0.97, z = E.rz * Math.cos(a) * 0.9;
      if (E === LOWER) {
        const g = toothGeo.clone().translate(x - (LOWER.x - LOWER.rx), dy, z);
        g.applyMatrix4(new THREE.Matrix4().makeRotationZ(lower.rotation.z)).translate(lower.position.x, lower.position.y, 0);
        teeth.push(g);
      } else tooth(new THREE.Vector3(x, E.y + dy, z), new THREE.Vector3(0, up, 0));
    }
  }
  add(mergeGeometries(teeth), C.tooth, 0, 0, 0);
  // headlights for nostrils at the snout's tip, each turned to face out
  const lampGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 14).translate(0, 0.03, 0);
  for (const s of [-1, 1]) {
    const { at, normal } = onBlob(UPPER, [0.85, 0.35, s * 0.5]);
    standOn(at, normal, lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.03);
  }

  // the tail: a tube along a curve out of the body's rear, thick at the
  // root and tapering to a point, curling to one side; a row of scutes
  // down its ridge
  const TAIL = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.2, 0.68, 0), new THREE.Vector3(-1.75, 0.66, 0.02), new THREE.Vector3(-2.2, 0.56, 0.18), new THREE.Vector3(-2.6, 0.45, 0.5), new THREE.Vector3(-2.8, 0.38, 0.85)]);
  const tail = new THREE.TubeGeometry(TAIL, 36, 0.46, 14, false);
  {
    const pos = tail.attributes.position, uv = tail.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i), on = TAIL.getPointAt(u), k = (1 - 0.92 * u) * (1 - 0.3 * u * u);
      v.fromBufferAttribute(pos, i).sub(on);
      v.y *= 0.8; // a little flattened
      v.multiplyScalar(k).add(on);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    tail.computeVertexNormals();
  }
  add(tail, C.skin, 0, 0, 0);
  for (const u of steps(0.12, 0.9, 7)) {
    const on = TAIL.getPointAt(u), r = 0.46 * (1 - 0.92 * u) * (1 - 0.3 * u * u) * 0.8;
    const g = studGeo.clone().scale(1 - 0.5 * u, 1 - 0.5 * u, 1 - 0.5 * u).translate(on.x, on.y + r - 0.02, on.z);
    studs.push(g);
  }
  add(mergeGeometries(studs), C.scute, 0, 0, 0);

  // four stubby legs splayed out from under the body by the wheels, each
  // a thick thigh out and a foot flat on the ground, three claws
  const thighGeo = new THREE.SphereGeometry(1, 18, 12).scale(0.22, 0.15, 0.42);
  const footGeo = new THREE.SphereGeometry(1, 18, 12).scale(0.22, 0.09, 0.2);
  const clawGeo = new THREE.ConeGeometry(0.03, 0.1, 8).rotateX(Math.PI / 2);
  for (const [x, ang] of [[0.78, 0.55], [-1.22, -0.5]])
    for (const s of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.32, s * 0.4); // rooted well inside the body
      leg.rotation.y = s * ang;
      leg.scale.z = s;
      group.add(leg);
      add(thighGeo, C.skin, 0, 0, 0.3, undefined, leg);
      add(footGeo, C.skin, 0.08, -0.22, 0.62, undefined, leg);
      for (const k of [-1, 0, 1]) add(clawGeo, C.tooth, 0.08 + k * 0.08, -0.25, 0.78 - 0.03 * Math.abs(k), undefined, leg);
    }

  // tail lights low on the body's rear flanks, either side of the tail
  const tailGeo = new THREE.BoxGeometry(0.16, 0.04, 0.1).translate(0, 0.02, 0);
  for (const s of [-1, 1]) {
    const x = -1.62, z = s * 0.52, at = new THREE.Vector3(x, bodyAt(x, z), z);
    standOn(at, bodyNormal(x, z), tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);
  }

  // four wheels, each with a hubcap, turning on axles along z under the
  // belly, the same distance either side of the body's middle
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.7, 10).rotateX(Math.PI / 2);
  for (const x of [BODY.x - 0.62, BODY.x + 0.58]) {
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
