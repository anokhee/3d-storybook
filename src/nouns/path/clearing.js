import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { mulberry32 } from "../../world/random.js";
import { latLonDir } from "../../world/layout.js";
import { PLANET } from "../planet/objects.js";
import { PATH } from "./objects.js";

// Where a path keeps the grass back: a strip along the ground from one
// place on the ball to another, as `{ points, halfWidths }` — `points`
// unit bearings from the ball's center, in order, and `halfWidths` how far
// out the bare ground reaches either side at each of them, in world units.
// The ground cover tests a plant against the chain of great-circle
// segments between them (see GroundCover). Only the planet grows grass,
// so it is measured there.
//
// The strip is the shortest way between its ends, sampled every `step`,
// then swayed sideways by `wobble` — a sine along its length, damped to
// nothing at both ends so it still lands where it was sent, with a
// second, faster wave laid over it at a rolled phase so no two paths
// wander alike — and its edge frayed by `ragged` the same way.
export function pathClearing(from, to, config) {
  const P = merge(PATH, config);
  const R = PLANET.radius;
  const a = latLonDir(from.lat, from.lon);
  const b = latLonDir(to.lat, to.lon);
  const angle = a.angleTo(b);
  // The sideways direction along the whole arc: across the plane the two
  // ends and the center share. Two ends on top of each other, or opposite,
  // have no such plane and get no sway.
  const n = new THREE.Vector3().crossVectors(a, b);
  const swayable = n.lengthSq() > 1e-9;
  if (swayable) n.normalize();

  const rand = mulberry32(P.seed);
  const phase = rand() * Math.PI * 2;
  const phase2 = rand() * Math.PI * 2;
  const count = Math.max(2, Math.ceil((angle * R) / P.step) + 1);
  const points = [];
  const halfWidths = [];
  const base = new THREE.Vector3();
  const side = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    // Along the arc: the two ends blended by angle, which is the great
    // circle between them (slerp — Vector3 has none of its own).
    if (angle < 1e-6) base.copy(a);
    else
      base
        .copy(a)
        .multiplyScalar(Math.sin((1 - t) * angle))
        .addScaledVector(b, Math.sin(t * angle))
        .divideScalar(Math.sin(angle));
    // Damped to zero at the ends so the path meets its stations squarely.
    const hold = Math.sin(t * Math.PI);
    const sway =
      swayable && P.wobble.amount > 0 ?
        P.wobble.amount *
        hold *
        (Math.sin(t * Math.PI * 2 * P.wobble.turns + phase) * 0.75 +
          Math.sin(t * Math.PI * 2 * P.wobble.turns * 2.7 + phase2) * 0.25)
      : 0;
    side.crossVectors(n, base).normalize();
    // Pushed across the ball's surface and put back on it — a small move,
    // so the arc is as good as the straight.
    points.push(
      base
        .clone()
        .addScaledVector(side, sway / R)
        .normalize(),
    );
    const fray =
      P.ragged > 0 ?
        1 +
        P.ragged *
          Math.sin(t * Math.PI * 2 * 3.3 * (1 + P.wobble.turns) + phase2)
      : 1;
    halfWidths.push((P.width / 2) * fray);
  }
  return { points, halfWidths };
}
