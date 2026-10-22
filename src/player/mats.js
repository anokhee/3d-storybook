// Every trampoline sheet in the world, as the player sees it: which ball
// it is on and where (a direction from that ball's center), its shape, and
// how it is currently pushed in and lit. Trampolines register themselves
// on mount — see Trampoline.jsx — and the flight asks which one, if any,
// is under the doll. Only the sheets on the ball the doll is on count.
import * as THREE from "three";

import { MAT } from "./tuning.js";

const mats = new Set();

// `body` is the ball the sheet stands on, `dir` a unit vector from its
// center to the sheet's center, `top` the sheet's altitude above the ground
// there, `radius` its size — all measured from where the sheet actually
// ended up, so it may sit anywhere in the tree. The record comes back so
// the sheet can draw its own dip and flash.
export function registerMat({ body, dir, top, radius }) {
  const mat = { body, dir, top, radius, dip: 0, flash: 0 };
  mats.add(mat);
  return mat;
}

export function unregisterMat(mat) {
  mats.delete(mat);
}

// The sheet under the doll, or null. A sheet only counts from ABOVE: the
// doll has to have been over its top before this frame's fall (`prior` is
// its altitude then). Come at it from the side, below the top, and it is
// the frame you meet, not the mat — see matWall.
export function matUnder(you, prior = you.alt) {
  for (const mat of mats) {
    if (mat.body !== you.body) continue;
    const reach = mat.radius + you.m.bodyHalf * MAT.catch;
    if (you.dir.angleTo(mat.dir) >= reach / you.body.radius) continue;
    if (prior >= matTop(you, mat) - 1e-3) return mat;
  }
  return null;
}

// The trampoline is solid from the side too: a doll below a sheet's top and
// inside its rim is set back out to the rim, and what speed it had toward
// the sheet is taken off it. Skips the sheet it is standing on.
const _axis = new THREE.Vector3();
const _in = new THREE.Vector3();
const _q = new THREE.Quaternion();
export function matWall(you) {
  for (const mat of mats) {
    if (mat.body !== you.body) continue;
    if (mat === you.mat || you.alt >= matTop(you, mat)) continue;
    const reach = (mat.radius + you.m.bodyHalf) / you.body.radius;
    const a = you.dir.angleTo(mat.dir);
    if (a >= reach) continue;
    _axis.crossVectors(mat.dir, you.dir);
    if (_axis.lengthSq() < 1e-10) continue; // dead under the middle
    _q.setFromAxisAngle(_axis.normalize(), reach - a);
    you.dir.applyQuaternion(_q).normalize();
    // The way in, flattened onto the ground under the doll.
    _in.copy(mat.dir).addScaledVector(you.dir, -mat.dir.dot(you.dir));
    if (_in.lengthSq() < 1e-10) continue;
    _in.normalize();
    const toward = you.vel.dot(_in);
    if (toward > 0) you.vel.addScaledVector(_in, -toward);
  }
}

// The nearest sheet to the doll on its own ball and how far it is, as
// ground distance from the sheet's center — at any distance; the caller
// decides what counts as close.
export function nearestMat(you) {
  let best = null,
    dist = Infinity;
  for (const mat of mats) {
    if (mat.body !== you.body) continue;
    const d = you.dir.angleTo(mat.dir) * you.body.radius;
    if (d < dist) ((best = mat), (dist = d));
  }
  return { mat: best, dist };
}

// The altitude the doll's `alt` reads when it is standing on this sheet: the
// sheet's height above the ground, plus the contact gap, less the chin it
// measures from — the lowest point, so no part of the figure is ever let
// through the mat.
export function matTop(you, mat) {
  return mat.top + MAT.contact - you.m.chin;
}

// The ropes must stay out of the sheets too. World-space point in, pushed
// out of the trampoline — sheet and skirt, a column from the ground to the
// sheet's top — by the shorter way: up through the top, or out through the
// rim. Only the column ABOVE THE GROUND counts. The test used to run down
// the sheet's axis forever, through the ball and out the far side, so a
// rope point at a sheet's antipode — or, for a sheet on the moon's far
// side, anywhere near the planet's pole under it — was "under the sheet"
// and lifted a couple of hundred units up to it: the limbs stretched at
// the moon.
const _d = new THREE.Vector3();
const _p = new THREE.Vector3();
// `clear` grows the sheet by the point's own half-width (see
// planetCollider), so a foot rests on it rather than sinking to its center.
export const matCollider = (p, clear = 0) => {
  for (const mat of mats) {
    const R = mat.body.radius + mat.top + clear;
    _d.copy(p).sub(mat.body.center);
    const alt = _d.dot(mat.dir);
    if (alt >= R || alt < mat.body.radius) continue;
    // How far from the sheet's axis, in the sheet's plane.
    _p.copy(_d).addScaledVector(mat.dir, -alt);
    const out = _p.length();
    const rim = mat.radius + clear;
    if (out >= rim) continue;
    const up = R - alt;
    const side = rim - out;
    if (up < side || out <= 1e-6) p.addScaledVector(mat.dir, up);
    else p.addScaledVector(_p, side / out);
  }
};
