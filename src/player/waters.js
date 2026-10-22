// Every pool the doll can wade in, as the player sees it: a pool (see
// refactored/nouns/water/pools.js) — on which ball, where on it (a
// direction from that ball's center to its middle), and its lobes in its
// own frame — and how deep each lobe is. Standing in one the doll's floor
// is that much lower, so it sinks in to its knees and climbs back out.
// An above-ground pool's water stands UP off the ground instead (see
// TUB): its `rise` is how high, and the doll in it is that much higher.
// Pools register themselves on mount — see Water.jsx — the way the
// columns do in solids.js.
import * as THREE from "three";

import { poolDepthAt, poolDistance } from "../nouns/water/pools.js";
import { waterLevelOf } from "../nouns/water/sheet.js";
import { TUBBED } from "../nouns/water/objects.js";

const waters = new Set();

export function registerWater(pool) {
  const W = pool.W;
  // Where its bed lies, off the ground, for the kinds that stand on it —
  // or null, for one dug in as deep as each lobe says.
  const bed =
    TUBBED.includes(W.kind) ? W.tub.bed
    : W.kind === "kiddie" ? W.kiddie.bed
    : null;
  const water = {
    body: pool.body,
    pool,
    into: pool.frame.clone().invert(),
    // How high the water's surface stands off the ground — up a tub's
    // wall, a hair off a pond's ground, a little under a dug pool's rim —
    // and where its bed is.
    // The pool's own lift off the ground counts for both.
    rise: waterLevelOf(W).at + pool.lift,
    lift: pool.lift,
    bed,
    // Its middle on the ground, from the ball's center.
    origin: pool.dir.clone().multiplyScalar(pool.body.radius),
  };
  waters.add(water);
  return water;
}

export function unregisterWater(water) {
  waters.delete(water);
}

// The water under the doll: `{ depth, rise }` — how high the surface of
// the pool its ground point is in stands off the ground, and how deep the
// water is from there to its bed (the nearest lobe's, or the floor a tub
// or a kiddie pool stands on) — or 0 and 0 on dry ground. The pool is measured
// in its own plane the way a rounded clearing is: the spot is carried
// into its frame and read off the pool's field — and on the pool's own
// side of the ball, or its antipode would be a pool too.
const _l = new THREE.Vector3();
const DRY = { depth: 0, rise: 0 };
export function waterUnder(you) {
  for (const w of waters) {
    if (w.body !== you.body) continue;
    _l.copy(you.dir)
      .multiplyScalar(you.body.radius)
      .sub(w.origin)
      .applyQuaternion(w.into);
    if (_l.y <= -you.body.radius) continue;
    if (poolDistance(w.pool, _l.x, _l.z) <= 0) {
      const bed = (w.bed ?? -poolDepthAt(w.pool, _l.x, _l.z)) + w.lift;
      return { depth: w.rise - bed, rise: w.rise };
    }
  }
  return DRY;
}
export const waterDepthAt = (you) => waterUnder(you).depth;
