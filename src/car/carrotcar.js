/* ============================================================
   CARROT CAR: the roadster (car.js) remade as a carrot. The body is one
   long carrot lying along the car, its rounded shoulder at the back and
   its whole length drawn in to a rounded tip at the FRONT, so it drives
   tip-first like a rocket, the tip dipping toward the road ahead of the
   front wheels. Its skin is built straight from a profile (radius by
   how far along it is), a little wider than tall, with short darker
   scars round it on its flanks, the way a carrot's skin is lined, never
   full rings. Out of the crown at the back a big bushy top: stalks
   fanning up, back and out, each with pairs of lobed leaflets in two
   greens. The COCKPIT is the cut-out cars' (tray.js), cut into the top
   of the carrot behind its middle like a cookie cutter, the skin eased
   level round it so its rim is four straight, level lines, its floor,
   walls and lip in a darker colour; in it the roadster's two bucket
   seats, dashboard and steering wheel, and an arched windshield raked
   back from its front edge. Headlights on the nose's upper flanks, tail
   lights on the shoulder's, four wheels with hubcaps on two axles under
   the belly. Faces +X; its origin on the ground under the axles. Up is
   +Y.

   The skin is a function `at(u, angle)` (u 0 at the crown, 1 at the
   tip; the angle 0 on top, going round through +z) so anything that has
   to sit on it (the scars, the lamps) is put there outright, the
   skin's normal found from the function's slopes. `finish(color,
   extra)` makes every material, so a page can hand in its own (the
   game's toon, or the stage's). `roll(dt, speed)` turns the wheels as
   the game does for a car going `speed` world units a second.
   ============================================================ */
import * as THREE from "three";
import { COCKPIT, leveller, cutThrough, fitCockpit } from "./tray.js";

// `carrot` the root, `ring` the scars on its skin, `rings` how many of
// them, `leaf` the top's leaves (the stalks and the lighter leaflets
// are shades of it), `leaves` how many stalks, `trim` the seats and
// hubcaps, `well` the cockpit's floor, walls and lip.
export const CARROTCAR = {
  scale: 1.6, // built about 3.8 long; the game scales it up to fit a driver
  carrot: 0xf08a24,
  ring: 0xc9641c,
  rings: 11,
  leaf: 0x4a9e3a,
  leaves: 9,
  trim: 0xf3e3b4,
  well: 0x8a4a1c,
  dash: 0x3a3330, // the dashboard and the steering wheel
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.3,
};

// The carrot, in the car's own units (before `scale`): from X0 (the
// crown) to X1 (the tip) along x; its spine at height SPINE, falling
// DROP toward the tip over the front two thirds; R its half-height at
// the shoulder, RZ times that its half-width. The WELL is the cockpit,
// its rim at TOP and its floor FLOOR; the skin is eased to the rim
// round it.
const X0 = -1.5, X1 = 2.3, LEN = X1 - X0, SPINE = 0.9, DROP = 0.42, R = 0.66, RZ = 1.5, DOME = 0.07;
const WELL = { x0: -1.2, x1: -1.2 + COCKPIT.len, z1: COCKPIT.half }, TOP = 1.25, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP, { cap: false });
const clear = (x, z, grow) => x < WELL.x0 - grow || x > WELL.x1 + grow || Math.abs(z) > WELL.z1 + grow;
const SEGS = 120, RINGS = 40; // along the carrot, and around it
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// the skin's radius (half-height) at u along it: a rounded shoulder at
// the crown, then the whole length drawn in to a rounded tip
const radius = (u) => {
  const dome = u < DOME ? Math.sqrt(Math.max(0, 1 - ((DOME - u) / DOME) ** 2)) : 1;
  return R * dome * Math.pow(Math.max(0, 1 - u), 0.62);
};
const spineY = (u) => SPINE - DROP * smooth((u - 0.35) / 0.65);
// the skin at u along and `a` round (0 on top, pi underneath)
const at = (u, a, out = new THREE.Vector3()) => {
  const r = radius(u);
  return out.set(X0 + u * LEN, spineY(u) + r * Math.cos(a), RZ * r * Math.sin(a));
};
// the skin's outward normal there, from its slopes
const normalAt = (u, a) => {
  const e = 2e-3, uu = Math.min(1 - e, Math.max(e, u));
  const du = at(uu + e, a).sub(at(uu - e, a)), da = at(uu, a + e).sub(at(uu, a - e));
  const n = da.cross(du);
  return n.lengthSq() < 1e-12 ? new THREE.Vector3(u > 0.5 ? 1 : -1, 0, 0) : n.normalize();
};
const Y = new THREE.Vector3(0, 1, 0);

export function buildCarrotCar(finish, C = CARROTCAR) {
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

  // the body: the skin function sampled on a grid, closed at both ends
  // by the profile itself (the crown's dome and the tip both go to
  // nothing), the well cut through it
  const P = [], idx = [], p = new THREE.Vector3();
  for (let i = 0; i <= SEGS; i++) {
    for (let k = 0; k <= RINGS; k++) {
      at(i / SEGS, (2 * Math.PI * k) / RINGS, p);
      P.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < SEGS; i++) {
    for (let k = 0; k < RINGS; k++) {
      const a = i * (RINGS + 1) + k, b = a + RINGS + 1, c = a + 1, d = b + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  add(cutThrough(geo, WELL, FLOOR, LEVEL), C.carrot, 0, 0, 0, { side: THREE.DoubleSide }); // two-sided, so the well looks in at it

  // the scars: short darker lines part way round the carrot on its
  // flanks and back, staggered along it (the same way each time), each
  // a thin tube a hair off the skin, eased with the skin round the well
  // and broken where it would cross it
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = Math.max(0, Math.round(C.rings));
  for (let s = 0; s < n; s++) {
    const u = 0.1 + (0.82 * (s + 0.5)) / n + 0.02 * (rand() - 0.5);
    const side = s % 2 ? 1 : -1; // alternately either flank
    const mid = side * (0.55 + 0.6 * rand()), span = 0.7 + 0.9 * rand(); // round from the top, and how far round
    const runs = [[]];
    for (let k = 0; k <= 16; k++) {
      const a = mid + span * (k / 16 - 0.5);
      const q = at(u, a), nrm = normalAt(u, a);
      q.addScaledVector(nrm, 0.012);
      if (q.y > FLOOR && !clear(q.x, q.z, 0.08)) runs.push([]);
      else {
        if (nrm.y > 0.05) q.y = LEVEL.height(q.y, q.x, q.z);
        runs[runs.length - 1].push(q);
      }
    }
    const w = 0.018 * Math.max(0.5, radius(u) / R);
    for (const run of runs) if (run.length > 2) add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(run), run.length, w, 6, false), C.ring, 0, 0, 0);
  }

  // the top: stalks out of the crown fanning up, back and out, each
  // with pairs of lobed leaflets along it and one at its end, the
  // stalks and every other leaflet in lighter greens
  const leaf = new THREE.Color(C.leaf);
  const light = leaf.clone().lerp(new THREE.Color(0xdcf29a), 0.3).getHex(), stalkColor = leaf.clone().lerp(new THREE.Color(0xe6f5b4), 0.45).getHex();
  const crown = new THREE.Vector3(X0 + 0.08, SPINE + 0.1, 0), stalks = Math.max(0, Math.round(C.leaves)); // just inside the crown's back
  const leafletGeo = new THREE.SphereGeometry(1, 10, 7).scale(0.21, 0.065, 0.028); // narrow, flat and pointed
  for (let f = 0; f < stalks; f++) {
    const s = stalks === 1 ? 0 : (f / (stalks - 1)) * 2 - 1; // -1..1 across the fan
    const el = 0.5 + 0.75 * (1 - Math.abs(s)) + 0.12 * Math.sin(f * 2.3); // up from level
    const az = 0.95 * s + 0.1 * Math.cos(f * 1.9); // out to the side
    const len = 1.25 - 0.3 * Math.abs(s) + 0.12 * Math.cos(f * 1.7);
    const dir = new THREE.Vector3(-Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
    const stalk = add(new THREE.CylinderGeometry(0.018, 0.04, len, 8).translate(0, len / 2, 0), stalkColor, crown.x, crown.y, 0.1 * s);
    stalk.quaternion.setFromUnitVectors(Y, dir);
    // the leaflets, in pairs leaning out from the stalk and tipped up
    // along it like a fern's, the pair nearest the end the smallest;
    // and one at the end
    for (let i = 0; i < 4; i++) {
      const h = len * (0.36 + 0.17 * i), k = 1 - 0.15 * i, color = (f + i) % 2 ? light : C.leaf;
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(0, h, 0);
        pivot.rotation.set(0, side * (0.85 + 0.12 * i) + 0.3 * (i % 2), 0.55);
        stalk.add(pivot);
        add(leafletGeo, color, 0.18 * k, 0.03, 0, undefined, pivot).scale.setScalar(k);
      }
    }
    const tip = add(leafletGeo, (f % 2) ? C.leaf : light, 0, len + 0.06, 0, undefined, stalk);
    tip.rotation.z = Math.PI / 2;
    tip.scale.setScalar(0.7);
  }

  // headlights on the nose's upper flanks, tail lights on the
  // shoulder's, each stood on the skin along its normal (lit for the
  // night)
  const lampGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.07, 14).translate(0, 0.035, 0);
  const tailGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12).translate(0, 0.025, 0);
  const stand = (u, a, g, color, extra, sink) => {
    const nrm = normalAt(u, a), m = add(g, color, 0, 0, 0, extra);
    m.position.copy(at(u, a)).addScaledVector(nrm, -sink);
    m.quaternion.setFromUnitVectors(Y, nrm);
  };
  for (const s of [-1, 1]) {
    stand(0.84, s * 0.95, lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.025);
    stand(0.035, s * 1.45, tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.015);
  }

  // the cockpit, cut into the carrot (tray.js)
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP, C.well);

  // four wheels, each with a hubcap, turning on an axle along z under
  // the belly: the back pair under the shoulder, the front pair under
  // the nose's dip
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.7, 10).rotateX(Math.PI / 2);
  for (const x of [-0.95, 1.0]) {
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
