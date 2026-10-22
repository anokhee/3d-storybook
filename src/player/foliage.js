// Everything soft in the world the doll pushes into: the canopies of the
// trees, as balls of leaf hung over their trunks. Not a wall — the trunk
// is that, see solids.js — but solid with give: a doll sinks into the
// leaf as far as FOLIAGE.give, slowed and eased back as it goes, and is
// held there, from the side or from above, so a crown is pushed into and
// bounced off rather than passed through. Each canopy also
// remembers that it was touched, and from which way, so the leaves can
// rustle after the doll — see rustle in tread.js. Registered per tree by
// the ground cover as it plants (see GroundCover.jsx); only the canopies
// on the ball the doll is on count.
import * as THREE from "three";

import { FOLIAGE } from "./tuning.js";
import { emit } from "./events.js";

const canopies = new Set();

// `body` the ball the tree stands on, `center` the canopy's middle in world
// space and `radius` how far the leaf reaches from it.
export function registerCanopy({ body, center, radius }) {
  const canopy = {
    body,
    center: center.clone(),
    radius,
    // When the doll was last in it, performance.now(), and the way the
    // leaves were pushed — from the doll into the canopy, along the
    // ground.
    touchedAt: -Infinity,
    away: new THREE.Vector3(),
  };
  canopies.add(canopy);
  return canopy;
}
export function unregisterCanopy(canopy) {
  canopies.delete(canopy);
}

// The doll as a capsule: its root out along its bearing, foot and head
// along its up (see TREAD.body), the same the festoons swing away from.
const _root = new THREE.Vector3();
const _foot = new THREE.Vector3();
const _head = new THREE.Vector3();
const _seg = new THREE.Vector3();
const _to = new THREE.Vector3();
const _near = new THREE.Vector3();
const _out = new THREE.Vector3();
const _flat = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _q = new THREE.Quaternion();
export function foliage(you, dt) {
  const B = you.body;
  if (!B) return;
  _root.copy(B.center).addScaledVector(you.dir, B.radius + you.alt);
  _foot.copy(_root).addScaledVector(you.up, you.m.chin);
  _head.copy(_root).addScaledVector(you.up, you.m.chin + you.m.height);
  _seg.subVectors(_head, _foot);
  const segLen2 = _seg.lengthSq();
  const now = performance.now();
  for (const c of canopies) {
    if (c.body !== B) continue;
    // The point of the doll nearest the canopy's middle.
    _to.subVectors(c.center, _foot);
    const t =
      segLen2 > 0 ? Math.min(1, Math.max(0, _to.dot(_seg) / segLen2)) : 0;
    _near.copy(_foot).addScaledVector(_seg, t);
    _out.subVectors(_near, c.center);
    const d = _out.length();
    const depth = c.radius + you.m.skullHalf - d;
    if (depth <= 0 || d < 1e-6) continue;
    _out.divideScalar(d); // from the canopy's middle out to the doll
    const give = FOLIAGE.give * c.radius;
    // How far into the give, 0 at the leaf's edge to 1 held.
    const deep = Math.min(1, depth / give);
    // Just come in — not in it last frame — and moving: the leaves rustle
    // (see events.js), louder the harder it was hit.
    const speed = you.vel.length();
    if (!touched(c, now) && speed > FOLIAGE.rustleSpeed)
      emit("rustle", { speed });
    // Slowed, by more the deeper, and eased back out.
    you.vel.multiplyScalar(Math.exp(-FOLIAGE.drag * deep * dt));
    you.vel.addScaledVector(_out, FOLIAGE.push * deep * dt);
    // Past the give it is held: set back out to the give, and what speed
    // it had into the leaf taken off it — the way a column's wall does
    // (see solidWall), only the leaf holds from above too.
    if (depth > give) {
      const back = depth - give;
      const rise = _out.dot(you.dir);
      you.alt += back * rise;
      _flat.copy(_out).addScaledVector(you.dir, -rise);
      const far = _flat.length() * back;
      if (far > 1e-6) {
        _axis.crossVectors(you.dir, _flat).normalize();
        _q.setFromAxisAngle(_axis, far / B.radius);
        you.dir.applyQuaternion(_q).normalize();
      }
      const into = you.vel.dot(_out);
      if (into < 0) you.vel.addScaledVector(_out, -into);
    }
    // The way the leaves were pushed, along the ground.
    c.away.copy(_out).addScaledVector(you.dir, -_out.dot(you.dir)).negate();
    c.touchedAt = now;
  }
}

// Whether a canopy has the doll in it, or had within the last moment.
export const touched = (canopy, now = performance.now()) =>
  now - canopy.touchedAt < FOLIAGE.linger;
