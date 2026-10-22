// Everywhere the doll can sit down, as the player sees it: a rectangle of
// seat, on which ball, where on it (a direction from that ball's center to
// its middle), how high its top stands off the ground, and which way it
// faces — `frame` the thing's own world rotation, its y the ground's up
// there and its z the way a sitter looks. Things register themselves on
// mount — see Bench.jsx — the way the columns do in solids.js. Press `e`
// beside one and the doll sits on it, its legs over the front edge; press
// again, or any travel key, and it stands up in front of it. The knobs are
// SEAT in tuning.js.
import * as THREE from "three";

import { SEAT } from "./tuning.js";

const seats = new Set();

export function registerSeat({ body, dir, top, frame, halfWidth, halfLength }) {
  const seat = {
    body,
    dir,
    top,
    halfWidth,
    halfLength,
    frame: frame.clone(),
    into: frame.clone().invert(),
    // Its middle on the ground, from the ball's center.
    origin: dir.clone().multiplyScalar(body.radius),
  };
  seats.add(seat);
  return seat;
}

export function unregisterSeat(seat) {
  seats.delete(seat);
}

// The doll's spot on the ground, carried into the seat's own frame: x
// along the seat, z across it toward the front, y its height — below the
// ball's radius down, it is on the far side of the ball.
const _l = new THREE.Vector3();
function localOf(you, seat) {
  return _l
    .copy(you.dir)
    .multiplyScalar(you.body.radius)
    .sub(seat.origin)
    .applyQuaternion(seat.into);
}

// The nearest seat to the doll on its own ball and how far it is, as
// ground distance from the seat's edge — 0 over it — at any distance; the
// caller decides what counts as close.
export function nearestSeat(you) {
  let best = null,
    dist = Infinity;
  for (const seat of seats) {
    if (seat.body !== you.body) continue;
    const { x, y, z } = localOf(you, seat);
    if (y <= -you.body.radius) continue; // the far side of the ball
    const d = Math.hypot(
      Math.max(Math.abs(x) - seat.halfWidth, 0),
      Math.max(Math.abs(z) - seat.halfLength, 0),
    );
    if (d < dist) ((best = seat), (dist = d));
  }
  return { seat: best, dist };
}

// Where on the seat the doll sits, written to `dir`: along it, wherever it
// was standing, kept a body's half width in from the ends; across it, a
// thigh's length back from the front edge less `SEAT.edge`, so the knees
// hang just past it and the shins drop in front — see SEAT.legs. Never
// further back than the seat's middle: a short seat under long legs sits
// the doll in the middle of it.
export function seatSpot(you, seat, dir) {
  const { x } = localOf(you, seat);
  const span = Math.max(0, seat.halfWidth - you.m.bodyHalf);
  const thigh = you.doll.cfg.legs.length * SEAT.legs.knee;
  return spotOf(
    seat,
    Math.min(span, Math.max(-span, x)),
    Math.max(0, seat.halfLength - (thigh - SEAT.edge)),
    dir,
  );
}

// Where the doll stands up to: straight ahead of where it sat, its body
// clear of the front edge by `SEAT.step`.
export function seatExit(you, seat, dir) {
  const { x } = localOf(you, seat);
  return spotOf(seat, x, seat.halfLength + you.m.bodyHalf + SEAT.step, dir);
}

// A spot in the seat's own plane, as a direction from the ball's center.
const _p = new THREE.Vector3();
function spotOf(seat, x, z, dir) {
  _p.set(x, 0, z).applyQuaternion(seat.frame).add(seat.origin);
  return dir.copy(_p).normalize();
}

// The way a sitter looks: the seat's own z, in the world.
export const seatFacing = (seat, out) =>
  out.set(0, 0, 1).applyQuaternion(seat.frame);
