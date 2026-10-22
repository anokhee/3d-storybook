// What the trampoline actually is. A press over the sheet is graded once,
// at the moment it is made, by how long the doll still had to fall — press
// as you meet the mat and it is perfect, press on the way up and it is a
// doll straightening its legs at the top of a jump. The grade rides along
// until the next landing spends it.
import * as THREE from "three";

import { lerp } from "../renderGrid/utils.js";
import { matUnder, matTop, nearestMat } from "./mats.js";
import { FALL, MOVE, MAT, JUMP } from "./tuning.js";

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _t1 = new THREE.Vector3();
const _t2 = new THREE.Vector3();

// How much fall is left: solve gap + climb·t − g·t²/2 = 0. The vertical air
// resistance is left out — the doll never sees this number, only which side
// of the window it fell.
function fallLeft(you, mat) {
  const gap = you.alt - matTop(you, mat);
  const climb = you.vel.dot(you.dir);
  const g = FALL.gravity;
  return gap <= 0 ? 0 : (climb + Math.sqrt(climb * climb + 2 * g * gap)) / g;
}

// SPACE pressed. One press per flight and it is the FIRST one: you commit,
// like on a real trampoline, and find out when you land. -1 is "no press
// this flight" — a third case, not a bad grade. The press makes no sound
// of its own: the landing that spends it does, if the sheet lights.
export function pumpPress(you) {
  const mat = matUnder(you);
  if (!mat) return;
  const P = MAT.pump;
  // Stood still on the sheet there is no fall to time: the press IS the
  // jump, straight off the mat at the jump's own speed, to get a run going.
  // It counts as a perfect one, so the first landing has something to give
  // back.
  if (you.resting) {
    const climb = you.vel.dot(you.dir);
    you.vel.addScaledVector(you.dir, JUMP.speed - climb);
    you.pumpGrade = 1;
    return;
  }
  if (you.pumpGrade >= 0) return;
  const wait = fallLeft(you, mat);
  const off = (wait - P.sweet) / (P.window - P.sweet);
  you.pumpGrade = wait <= P.sweet ? 1 : Math.max(0, 1 - off) ** P.ease;
}

// A landing on the sheet: what it gives back, and what the sheet does about
// it. Takes the speed it arrived with, returns the speed it leaves with.
export function matLand(you, mat, speed) {
  const P = MAT.pump;
  const D = MAT.dip;
  const grade = you.pumpGrade;
  you.pumpGrade = -1; // spent — the flight this launches gets its own press
  const sink = grade < 0 ? 1 : lerp(D.sink, 1, grade);
  mat.dip = Math.min(D.max, speed * D.per * sink);
  mat.flash = Math.max(mat.flash, Math.max(0, grade));
  if (grade < 0) return speed * MAT.restitution;
  // Between a perfect press and a mistimed one there is nothing but the
  // interpolation, and the kick is only ever paid in proportion.
  return Math.min(
    P.ceiling,
    speed * lerp(P.miss, P.give, grade) + P.kick * grade,
  );
}

// A launch also picks where it comes down: a fresh point within
// landingRadius of the sheet's center, so a run wanders instead of pogoing
// on one spot. Sets the tangential velocity that lands there.
export function matDrift(you, mat, v) {
  const R = you.body.radius;
  // Any two tangents at the mat's center.
  _t1.set(1, 0, 0);
  if (Math.abs(mat.dir.x) > 0.9) _t1.set(0, 1, 0);
  _t1.addScaledVector(mat.dir, -_t1.dot(mat.dir)).normalize();
  _t2.crossVectors(mat.dir, _t1);
  // sqrt for area-uniform: without it the picks bunch at the center
  const r = MAT.landingRadius * Math.sqrt(Math.random());
  const a = Math.random() * Math.PI * 2;
  _a.copy(mat.dir)
    .multiplyScalar(R)
    .addScaledVector(_t1, Math.cos(a) * r)
    .addScaledVector(_t2, Math.sin(a) * r)
    .normalize()
    .multiplyScalar(R);
  // The chord from here to there, flattened onto the tangent plane.
  _b.copy(_a).addScaledVector(you.dir, -R);
  _b.addScaledVector(you.dir, -_b.dot(you.dir));
  const d = _b.length();
  if (d < 1e-4) return;
  // Distance under e-folding drag k from one shove vh over flight T:
  // d = vh·(1−e^(−kT))/k, inverted for vh. T from the launch speed alone.
  const T = (2 * v) / FALL.gravity;
  const vh = Math.min(
    MOVE.max,
    (d * MOVE.damp) / (1 - Math.exp(-MOVE.damp * T)),
  );
  const climb = you.vel.dot(you.dir);
  you.vel
    .copy(you.dir)
    .multiplyScalar(climb)
    .addScaledVector(_b.divideScalar(d), vh);
}

// The leash. Steering on the climb can carry the doll away from the sheet.
// Fall within escapeRadius of ANY sheet and the descent is pulled toward
// that one's center, sized by how much fall is left — so a jump aimed at
// the next trampoline is caught by it once it gets close enough, and a jump
// aimed at nothing is let go for good. Only holds flights a mat launched.
export function matHoming(you, dt) {
  if (!you.matFlight) return;
  const R = you.body.radius;
  const { mat, dist } = nearestMat(you);
  if (!mat || dist > MAT.escapeRadius) {
    you.matFlight = null; // committed; the landing out there resets the latch
    return;
  }
  you.matFlight = mat; // whichever sheet is nearest now owns the flight
  const climb = you.vel.dot(you.dir);
  // The pull is a falling thing: on the climb you are free to steer.
  if (climb > 0 || matUnder(you) === mat) return;
  const T = fallLeft(you, mat);
  if (T <= 0) return;
  _b.copy(mat.dir).multiplyScalar(R).addScaledVector(you.dir, -R);
  _b.addScaledVector(you.dir, -_b.dot(you.dir));
  const d = _b.length();
  if (d < 1e-4) return;
  // Cover the distance in the fall remaining, with a margin for the drag and
  // the lag of the chase; capped at flying speed.
  const vh = Math.min(MOVE.max, (d / Math.max(T, 0.25)) * 1.25);
  _a.copy(_b).multiplyScalar(vh / d);
  // Chase the tangential velocity and leave the vertical alone — gravity
  // owns that axis.
  const k = 1 - Math.exp(-MAT.homing * dt);
  you.vel.addScaledVector(you.dir, -climb);
  you.vel.lerp(_a, k);
  you.vel.addScaledVector(you.dir, climb);
}
