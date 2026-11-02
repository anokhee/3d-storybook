// A RAMP LAID AS A LINE. In the editor a ramp is drawn as a stroke from
// its foot toward the cliff (Scene.jsx's `line`), not as a box: its
// length is the stroke's, its width the stock, and where the stroke
// crosses a cliff's edge it SNAPS — turned square to the edge there and
// slid so its head reaches OVER in past the lip, as the seed lays its own
// ramps (seed.js). A ramp dragged about snaps the same way, keeping its
// length; a click near a cliff lays a stock one aimed at the nearest lip.
// A stroke that crosses no edge (on open ground, or lying all on one
// level) is kept as drawn. All in bearings on a ball of radius R.
import * as THREE from "three";
import { frameOf, toLocal, fromLocal } from "../runtime/cover.js";
import { RAMP_ARGS } from "../runtime/terrain.js";

export const OVER = 1.5; // how far the head reaches in past the lip it docks on (the seed's)
const SNAP = 4; // how far past the stroke's head an edge may still lie for the ramp to snap to it
const STEP = 0.1; // the march along the stroke, in units
const round = (v, to) => Math.round(v / to) * to;

// The yaw at `at` whose frame's Z runs `along` (a world vector, its part across the ground taken).
export const yawAlong = (at, along, R) => {
  const base = frameOf(at, 0, R);
  const Z = along.clone().addScaledVector(at, -along.dot(at)).normalize();
  return Math.atan2(Z.dot(base.X), Z.dot(base.Z));
};
// As drawn: a ramp lying along the stroke `a` → `b`, its middle halfway.
const asDrawn = (a, b, R, length) => {
  const mid = a.clone().add(b).normalize();
  const L = length ?? Math.max(1, round(a.angleTo(b) * R, 0.5));
  return { dir: mid.toArray(), yaw: yawAlong(mid, b.clone().sub(a), R), length: L, snapped: false };
};

// The ramp for a stroke from `a` to `b`: `{ dir, yaw, length, snapped }`,
// the placement's bearing and turn and its `length` arg. `length` given
// keeps that length (a dragged ramp's) instead of the stroke's.
export function rampAlong(field, a, b, R = 36, { length = null } = {}) {
  a = a.clone().normalize();
  b = b.clone().normalize();
  if (!field || field.empty || !field.tiers.length) return asDrawn(a, b, R, length);
  // the foot is the lower end: the stroke is read from it toward the other
  let ha = field.tierRise(a, true, true), hb = field.tierRise(b, true, true);
  if (hb < ha - 1e-3) [a, b, ha, hb] = [b, a, hb, ha];
  const tiers = field.tiers.filter((t) => t.h > ha + 1e-3);
  if (!tiers.length) return asDrawn(a, b, R, length);
  // march from the foot along the stroke (and a little past its head) for
  // the first edge it enters: the lip the ramp docks on
  const along = frameOf(a, yawAlong(a, b.clone().sub(a), R), R);
  const Lab = a.angleTo(b) * R;
  const P = new THREE.Vector3();
  let lip = null, u = 0, tier = null;
  for (u = 0.25; u <= Lab + SNAP; u += STEP) {
    fromLocal(along, 0, u, P);
    for (const t of tiers) {
      const m = t.raw(P);
      if (m < 0) {
        if (!tier || t.h < tier.h) tier = t;
      }
    }
    if (tier) {
      lip = P.clone();
      break;
    }
  }
  if (!lip) return asDrawn(a, b, R, length);
  // square to the edge there: the tier's field falls fastest straight in
  const F = frameOf(lip, 0, R);
  const e = 0.5;
  const at = (x, z) => tier.raw(fromLocal(F, x, z));
  let nx = -(at(e, 0) - at(-e, 0)) / (2 * e), nz = -(at(0, e) - at(0, -e)) / (2 * e);
  const g = Math.hypot(nx, nz);
  const d = toLocal(F, b); // the stroke's own way on, from the lip
  const dl = Math.hypot(d.x, d.z) || 1;
  // (over a corner's round, or where the edge wanders, the field's fall can
  // point oddly: then the stroke's own way is kept)
  if (g < 1e-3 || (nx * d.x + nz * d.z) / (g * dl) < 0.3) {
    nx = d.x / dl;
    nz = d.z / dl;
  } else {
    nx /= g;
    nz /= g;
  }
  const L = Math.max(2, round(length ?? u + OVER, 0.5));
  // the foot L − OVER back from the lip, the head OVER past it: the middle between
  const k = OVER - L / 2;
  const centre = fromLocal(F, nx * k, nz * k);
  const head = fromLocal(F, nx * OVER, nz * OVER);
  return { dir: centre.toArray(), yaw: yawAlong(centre, head.sub(centre), R), length: L, snapped: true, lip: lip.toArray() };
}

// A stock ramp for a click at `a`: aimed at the nearest cliff's lip and
// docked on it, if a cliff lies within reach; null where none does.
export function rampNear(field, a, R = 36, length = RAMP_ARGS.length) {
  a = a.clone().normalize();
  if (!field || field.empty || !field.tiers.length) return null;
  const h = field.tierRise(a, true, true);
  let best = null;
  for (const t of field.tiers) {
    if (t.h <= h + 1e-3) continue;
    const m = t.raw(a);
    if (m === Infinity || m < 0 || m > length + SNAP) continue;
    if (!best || m < best.m) best = { t, m };
  }
  if (!best) return null;
  const F = frameOf(a, 0, R);
  const e = 0.5;
  const at = (x, z) => best.t.raw(fromLocal(F, x, z));
  const nx = -(at(e, 0) - at(-e, 0)) / (2 * e), nz = -(at(0, e) - at(0, -e)) / (2 * e);
  const g = Math.hypot(nx, nz);
  if (g < 1e-3) return null;
  const b = fromLocal(F, (nx / g) * (best.m + 1), (nz / g) * (best.m + 1));
  const r = rampAlong(field, a, b, R, { length });
  return r.snapped ? r : null;
}
