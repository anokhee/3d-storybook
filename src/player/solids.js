// Everything solid in the world that is not a trampoline, as the player
// sees it: a column stood on the ground — which ball, where on it (a
// direction from that ball's center), how far out it reaches, and how high
// it stands. The doll cannot fly into one from the side, lands on top of
// one like ground, and its ropes stay out of it. Things register themselves
// on mount — see Gachapon.jsx — the way the trampolines do in mats.js, and
// only the columns on the ball the doll is on count.
//
// A column is round unless it says otherwise: given a `frame` it is a BOX
// instead, `halfWidth` across its own x and `halfLength` along its own z,
// stood on the ground and turned by `frame` — the thing's own world
// rotation, its y the ground's up there — the way a bench is (see
// Bench.jsx). A box is measured in its own plane, the way a rectangular
// clearing is: the spot is carried into its frame and checked against its
// half sizes.
import * as THREE from "three";

import { MAT } from "./tuning.js";

const solids = new Set();

// `body` is the ball the column stands on, `dir` a unit vector from its
// center to the column's middle, `top` its crown's altitude above the
// ground there, `radius` how far out it reaches — or, for a box, `frame`,
// `halfWidth` and `halfLength`, its reach then being its corner.
export function registerSolid({
  body,
  dir,
  top,
  radius,
  frame,
  halfWidth,
  halfLength,
}) {
  const solid = { body, dir, top, radius, box: null };
  if (frame) {
    solid.radius = Math.hypot(halfWidth, halfLength);
    solid.box = {
      halfWidth,
      halfLength,
      frame: frame.clone(),
      into: frame.clone().invert(),
      // Its middle on the ground, from the ball's center.
      origin: dir.clone().multiplyScalar(body.radius),
    };
  }
  solids.add(solid);
  return solid;
}

export function unregisterSolid(solid) {
  solids.delete(solid);
}

// The altitude the doll's `alt` reads when it is standing on this column:
// its top, plus the contact gap, less the chin it measures from.
export function solidTop(you, solid) {
  return solid.top + MAT.contact - you.m.chin;
}

// A point (from the ball's center) carried into a box's own frame: x
// across it, z along it, y the height — below the ball's radius down, it
// is on the far side of the ball, and no box reaches there.
const _l = new THREE.Vector3();
function localOf(box, p) {
  return _l.copy(p).sub(box.origin).applyQuaternion(box.into);
}

// Whether the ground under `dir` is inside the column's reach, padded out
// by `pad`: by angle for a round one, in its own plane for a box.
const _g = new THREE.Vector3();
function within(you, solid, pad = 0) {
  const R = you.body.radius;
  if (!solid.box) return you.dir.angleTo(solid.dir) < (solid.radius + pad) / R;
  const { x, y, z } = localOf(solid.box, _g.copy(you.dir).multiplyScalar(R));
  return (
    y > -R &&
    Math.abs(x) < solid.box.halfWidth + pad &&
    Math.abs(z) < solid.box.halfLength + pad
  );
}

// The column under the doll, or null. Like a sheet, it only counts from
// ABOVE: the doll has to have been over its top before this frame's fall
// (`prior` is its altitude then). Come at it from the side and it is the
// wall you meet — see solidWall.
export function solidUnder(you, prior = you.alt) {
  for (const solid of solids) {
    if (solid.body !== you.body) continue;
    if (!within(you, solid)) continue;
    if (prior >= solidTop(you, solid) - 1e-3) return solid;
  }
  return null;
}

// Solid from the side: a doll below a column's top and inside its reach is
// set back out to the rim, and what speed it had toward the column is
// taken off it. Skips the one it is standing on. A box puts it out through
// whichever of its four sides is nearest.
const _axis = new THREE.Vector3();
const _in = new THREE.Vector3();
const _out = new THREE.Vector3();
const _q = new THREE.Quaternion();
export function solidWall(you) {
  const R = you.body.radius;
  for (const solid of solids) {
    if (solid.body !== you.body) continue;
    if (solid === you.solid || you.alt >= solidTop(you, solid)) continue;
    if (!within(you, solid, you.m.bodyHalf)) continue;
    if (solid.box) {
      const B = solid.box;
      const { x, z } = localOf(B, _g.copy(you.dir).multiplyScalar(R));
      const px = B.halfWidth + you.m.bodyHalf - Math.abs(x);
      const pz = B.halfLength + you.m.bodyHalf - Math.abs(z);
      if (px < pz) _out.set(Math.sign(x || 1) * px, 0, 0);
      else _out.set(0, 0, Math.sign(z || 1) * pz);
      _out.applyQuaternion(B.frame);
      // The way out, flattened onto the ground under the doll.
      _out.addScaledVector(you.dir, -_out.dot(you.dir));
      const far = _out.length();
      if (far < 1e-10) continue;
      _axis.crossVectors(you.dir, _out).normalize();
      _q.setFromAxisAngle(_axis, far / R);
      you.dir.applyQuaternion(_q).normalize();
      _in.copy(_out).divideScalar(-far);
    } else {
      const reach = (solid.radius + you.m.bodyHalf) / R;
      const a = you.dir.angleTo(solid.dir);
      _axis.crossVectors(solid.dir, you.dir);
      if (_axis.lengthSq() < 1e-10) continue; // dead under the middle
      _q.setFromAxisAngle(_axis.normalize(), reach - a);
      you.dir.applyQuaternion(_q).normalize();
      // The way in, flattened onto the ground under the doll.
      _in.copy(solid.dir).addScaledVector(you.dir, -solid.dir.dot(you.dir));
      if (_in.lengthSq() < 1e-10) continue;
      _in.normalize();
    }
    const toward = you.vel.dot(_in);
    if (toward > 0) you.vel.addScaledVector(_in, -toward);
  }
}

// The ropes must stay out of the columns too. World-space point in, pushed
// out of any column it has sunk into by the shorter way: up through the
// top, or sideways through the rim — a box's nearest side. Only the column
// ABOVE THE GROUND counts — see matCollider for what running it down
// through the ball did.
const _d = new THREE.Vector3();
const _p = new THREE.Vector3();
// `clear` grows the column by the point's own half-width (see
// planetCollider), so a foot rests on it rather than sinking to its center.
export const solidCollider = (p, clear = 0) => {
  for (const solid of solids) {
    const R = solid.body.radius + solid.top + clear;
    _d.copy(p).sub(solid.body.center);
    const alt = _d.dot(solid.dir);
    if (alt >= R || alt < solid.body.radius) continue;
    const up = R - alt;
    if (solid.box) {
      const B = solid.box;
      const { x, z } = localOf(B, _d);
      const sx = B.halfWidth + clear - Math.abs(x);
      const sz = B.halfLength + clear - Math.abs(z);
      if (sx <= 0 || sz <= 0) continue;
      if (up <= sx && up <= sz) p.addScaledVector(solid.dir, up);
      else if (sx < sz) _out.set(Math.sign(x || 1) * sx, 0, 0);
      else _out.set(0, 0, Math.sign(z || 1) * sz);
      if (up > sx || up > sz) p.add(_out.applyQuaternion(B.frame));
      continue;
    }
    // How far from the column's axis, in its top's plane.
    _p.copy(_d).addScaledVector(solid.dir, -alt);
    const out = _p.length();
    const rim = solid.radius + clear;
    if (out >= rim) continue;
    const side = rim - out;
    if (up < side || out <= 1e-6) p.addScaledVector(solid.dir, up);
    else p.addScaledVector(_p, side / out);
  }
};
