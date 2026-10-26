/* ============================================================
   BANANA CAR: the roadster (car.js) remade as a banana. The body is one
   banana lying on its back, curving up at both ends like a boat: a tube
   swept along a bent spine, fat in the middle and tapering to the ends,
   its cross-section the fruit's five rounded ridges, each ridge drawn
   along it as a darker line; a brown stem out of the front end and a
   dark tip at the back. The COCKPIT is the cut-out cars' (tray.js), cut
   into the top of the banana in its middle like a cookie cutter, the
   peel eased level round it so its rim is four straight, level lines,
   its floor, walls and lip in a darker colour; in it the roadster's two
   bucket seats, dashboard and steering wheel, and an arched windshield
   raked back from its front edge. Headlights on the stem end's slope, tail lights on the
   tip's, four wheels with hubcaps on two axles under the belly, and
   brown speckles on the peel for a ripe one. Faces +X; its origin on
   the ground under the axles. Up is +Y.

   Where something has to sit ON the peel (the lamps, the speckles) its place is found by casting a ray at the body
   and taking the hit, so the bend and the ridges need no second
   reckoning. `finish(color, extra)` makes every material, so a page can
   hand in its own (the game's toon, or the stage's). `roll(dt, speed)`
   turns the wheels as the game does for a car going `speed` world units
   a second.
   ============================================================ */
import * as THREE from "three";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `peel` the banana, `ridge` the lines along it, `stem` and `tip` its two
// ends, `speckles` how ripe it is (that many brown speckles, 0 for none),
// `bend` how steeply the ends curve up, `trim` the seats and hubcaps,
// `well` the cockpit's floor, walls and lip.
export const BANANACAR = {
  scale: 1.6, // built about 2.9 long; the game scales it up to fit a driver
  peel: 0xf6d035,
  ridge: 0xcfa72c,
  stem: 0x6e4b24,
  tip: 0x3b2a19,
  speck: 0x5c3d1c,
  speckles: 10,
  bend: 0.28,
  trim: 0xf3e3b4,
  well: 0x4a3728,
  dash: 0x3a3330, // the dashboard and the steering wheel
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The banana, in the car's own units (before `scale`): its spine runs
// `LEN` along x, `SPINE` up at the middle and rising `bend` x² toward
// either end; the tube is `R` across at the middle (`RZ` times wider
// than tall), drawn in toward the spine at the ends by `taper`, and
// swelled `LOBE` at five ridges round it, one straight under, and wide
// enough for the cockpit. The WELL is the cockpit, its rim at TOP and
// its floor FLOOR; the peel is eased to the rim round it, but not
// flattened beyond, so the ends still curve up.
const LEN = 2.8, SPINE = 0.8, R = 0.5, RZ = 1.9, LOBE = 0.1;
const WELL = { x0: -0.75, x1: -0.75 + COCKPIT.len, z1: COCKPIT.half }, TOP = 1.25, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP, { cap: false });
// whether (x, z) in plan is more than `grow` outside the well's footprint
const clear = (x, z, grow) => x < WELL.x0 - grow || x > WELL.x1 + grow || Math.abs(z) > WELL.z1 + grow;
const SEGS = 96, RINGS = 40; // along the tube, and around it
const taper = (u) => 1 - 0.78 * Math.pow(2 * Math.abs(u - 0.5), 2.5);
const RIDGES = [36, 108, 180, -108, -36]; // degrees round the spine, 0 the top
const Y = new THREE.Vector3(0, 1, 0);
const wrap = (a) => Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));

export function buildBananaCar(finish, C = BANANACAR) {
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

  // the body: a tube along the bent spine, then every ring of it drawn
  // in by how near the end it is and swelled at the five ridges, and
  // stretched across to a fat banana
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const x = -LEN / 2 + (LEN * i) / 10;
    pts.push(new THREE.Vector3(x, SPINE + C.bend * x * x, 0));
  }
  const spine = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(spine, SEGS, R, RINGS, false);
  const pos = geo.attributes.position, uv = geo.attributes.uv, on = new THREE.Vector3(), off = new THREE.Vector3();
  const phi = new Float32Array(RINGS + 1); // where round the spine each ring index falls
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    spine.getPointAt(u, on);
    off.fromBufferAttribute(pos, i).sub(on);
    const a = Math.atan2(off.z, off.y);
    if (Math.floor(i / (RINGS + 1)) === SEGS / 2) phi[i % (RINGS + 1)] = a;
    off.multiplyScalar(taper(u) * (1 - LOBE * Math.cos(5 * a)));
    off.z *= RZ;
    pos.setXYZ(i, on.x + off.x, on.y + off.y, on.z + off.z);
  }
  geo.computeVertexNormals();
  const nor = geo.attributes.normal;
  const body = add(cutThrough(geo, WELL, FLOOR, LEVEL), C.peel, 0, 0, 0, { side: THREE.DoubleSide }); // the well cut through it; two-sided, so the well looks in at it
  body.updateMatrixWorld();
  // a ray at the body, from (ox, oy, oz) toward (dx, dy, dz): where it
  // lands on the peel and the peel's normal there, or null if it misses
  const caster = new THREE.Raycaster(), from = new THREE.Vector3(), toward = new THREE.Vector3();
  const hit = (ox, oy, oz, dx, dy, dz) => {
    caster.set(from.set(ox, oy, oz), toward.set(dx, dy, dz).normalize());
    const h = caster.intersectObject(body, false)[0];
    return h ? { at: h.point.clone(), normal: h.face.normal.clone() } : null;
  };
  // Something stood on the peel where a ray `h` landed: `geo` built
  // standing up from its base at the origin, turned to the peel's normal
  // there, and sunk `sink` into it.
  const stickOn = (h, geo, color, extra, sink = 0) => {
    const mesh = add(geo, color, 0, 0, 0, extra);
    mesh.position.copy(h.at).addScaledVector(h.normal, -sink);
    mesh.quaternion.setFromUnitVectors(Y, h.normal);
    return mesh;
  };

  // the ridges: five darker lines along the peel, each a thin tube
  // through the body's own vertices at that angle round the spine, eased
  // with the peel round the well, and broken where it would cross it
  for (const deg of RIDGES) {
    const want = (deg * Math.PI) / 180;
    let j = 0;
    for (let k = 1; k <= RINGS; k++) if (wrap(phi[k] - want) < wrap(phi[j] - want)) j = k;
    const runs = [[]];
    for (let i = 3; i <= SEGS - 3; i++) {
      const k = i * (RINGS + 1) + j, p = new THREE.Vector3().fromBufferAttribute(pos, k);
      if (p.y > FLOOR && !clear(p.x, p.z, 0.08)) runs.push([]);
      else {
        if (nor.getY(k) > 0.05) p.y = LEVEL.height(p.y, p.x, p.z);
        runs[runs.length - 1].push(p);
      }
    }
    for (const run of runs) if (run.length > 2) add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(run), run.length, 0.013, 6, false), C.ridge, 0, 0, 0);
  }

  // the speckles of a ripe banana: flat brown spots stood on the peel,
  // scattered (the same way each time) over its top and flanks, clear
  // of the well
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const speckGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12).translate(0, 0.01, 0);
  for (let placed = 0, tries = 0; placed < C.speckles && tries < 200; tries++) {
    const x = -1.2 + 2.4 * rand(), a = -2.3 + 4.6 * rand(); // along, and round the spine from the top
    const dy = Math.cos(a), dz = Math.sin(a) * RZ, y = SPINE + C.bend * x * x;
    const h = hit(x, y + 3 * dy, 3 * dz, 0, -dy, -dz);
    if (!h || (h.at.y > FLOOR && !clear(h.at.x, h.at.z, 0.25)) || Math.abs(h.at.x) > 1.3) continue;
    const s = 0.6 + 0.8 * rand();
    stickOn(h, speckGeo, C.speck, undefined, 0.006).scale.set(s * (1 + rand()), 1, s);
    placed++;
  }

  // the two ends: a dome closing each, the stem out of the front one
  // (thick at its root, brown) and a dark tip off the back one
  const nose = spine.getPointAt(1), noseDir = spine.getTangentAt(1);
  const tail = spine.getPointAt(0), tailDir = spine.getTangentAt(0).negate();
  const end = R * taper(0) * 1.12;
  add(new THREE.SphereGeometry(end, 16, 12).scale(1, 1, RZ), C.peel, nose.x, nose.y, nose.z);
  const stem = add(new THREE.CylinderGeometry(0.065, 0.09, 0.34, 10).translate(0, 0.17, 0), C.stem, 0, 0, 0);
  stem.position.copy(nose).addScaledVector(noseDir, 0.04);
  stem.quaternion.setFromUnitVectors(Y, noseDir);
  add(new THREE.SphereGeometry(end * 1.02, 16, 12).scale(1, 1, RZ), C.tip, tail.x, tail.y, tail.z);
  const tip = add(new THREE.ConeGeometry(0.1, 0.2, 10).translate(0, 0.1, 0), C.tip, 0, 0, 0);
  tip.position.copy(tail).addScaledVector(tailDir, 0.06);
  tip.quaternion.setFromUnitVectors(Y, tailDir);

  // headlights on the front slope, either side of the stem, and tail
  // lights on the back one (lit for the night)
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 14).translate(0, 0.04, 0);
  const tailGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12).translate(0, 0.025, 0);
  for (const s of [-1, 1]) {
    stickOn(hit(3, SPINE + 0.2, s * 0.24, -1, 0, 0), lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.03);
    stickOn(hit(-3, SPINE + 0.2, s * 0.24, 1, 0, 0), tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);
  }

  // the cockpit, cut into the peel (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP, C.well);

  // four wheels, each with a hubcap, turning on an axle along z under
  // the belly
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.7, 10).rotateX(Math.PI / 2);
  for (const x of [-0.92, 0.92]) {
    add(axleGeo, C.wheel, x, C.wheelR, 0);
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
