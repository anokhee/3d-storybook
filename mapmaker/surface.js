// THE SURFACE things are placed on. A placement is kept as a bearing — a
// unit direction from the surface's middle — with a yaw (its turn about its
// own up), a scale and a lift, and the surface says where that bearing
// stands and which way is up there. Games keep the bearing and stand each
// thing on their OWN ground (see ../runtime/mapLoader.js).
//
// The BASE ground is a plain ball. Over it lies the map's OWN terrain — its
// plateaus and ramps (../runtime/terrain.js), which the game builds from
// the map the same way — so a lamp placed on a plateau stands on the
// plateau. Their drawn previews (Terrain.jsx) are `risers`: the pointer
// hits those too. The map is the ground's one source: a game builds its
// ball from the map, not the other way round.
//
// A flat surface, when a game wants one, is this same interface with up
// always +y: `dir` becomes a point on the plane.
import * as THREE from "three";
import { standOn } from "../src/world/layout.js";
import { terrainField } from "../runtime/terrain.js";
import { lobeDistance } from "../runtime/cover.js";

const Y = new THREE.Vector3(0, 1, 0);

// Whether a point seen from `origin` lies behind the ball (radius R): the
// line from the eye to it passes through the ball on the way. The pass is
// counted only strictly between the two, so a point in a basin (the ground
// there dips under R) or on a thing's side is not behind; and a little
// slack, the depth of a basin, for a ray that bottoms out in one.
const _v = new THREE.Vector3(), _c = new THREE.Vector3();
export function behindBall(origin, point, R) {
  _v.copy(point).sub(origin);
  const l2 = _v.lengthSq();
  if (l2 < 1e-9) return false;
  const t = -origin.dot(_v) / l2;
  if (t <= 0 || t >= 1) return false;
  _c.copy(origin).addScaledVector(_v, t);
  return _c.length() < R - Math.min(4.5, R * 0.15);
}

export function planetSurface(radius, field = terrainField([], radius), risers = () => [], basin = null, roads = []) {
  const R = radius;
  const caster = new THREE.Raycaster();
  const heights = new Map(); // a bearing (rounded) → how far out the ground with the map's terrain on it is
  const keyOf = (d) => `${d.x.toFixed(4)},${d.y.toFixed(4)},${d.z.toFixed(4)}`;
  // How far from the middle the BASE ground is at a bearing: the ball itself.
  const baseAt = () => R;
  // …how far the ground falls into a water patch's BASIN there (the game
  // digs one under every pond, ../runtime/cover.js's BASIN)
  const dug = !!basin && !basin.empty;
  const dropAt = (d) => (dug ? basin.drop(d) : 0);
  // …whether a bearing is in a basin at all, and on a road's tarmac (a
  // little past it), where the game builds a BRIDGE over a basin: its deck
  // at the water's level
  const inBasin = (d) => !!basin && !basin.empty && basin.drop(d) > 1e-3;
  const onRoad = (d) => roads.some((l) => lobeDistance(l, d) < 0.6);
  // …and the ground things stand on: the base, raised by the map's terrain
  // (a step at a plateau's edge, a kerb along a ramp's), sunk by the basins
  // — or the bridge's deck, where a road crosses one (the game's onDeck).
  const radiusAt = (d) => {
    if (field.empty && !dug && !roads.length) return baseAt(d);
    const key = keyOf(d);
    if (heights.has(key)) return heights.get(key);
    let r = baseAt(d) + field.rise(d, true) - dropAt(d);
    if (inBasin(d) && onRoad(d)) r = Math.max(r, R + basin.levelOf(d));
    heights.set(key, r);
    return r;
  };
  // …and where a ROAD lies: on the ground, or, over a basin, on the deck of
  // the bridge the game builds there, at the water's own level (the game's
  // onDeck).
  const deckAt = (d) => {
    const r = radiusAt(d);
    return inBasin(d) ? Math.max(r, R + basin.levelOf(d)) : r;
  };
  return {
    kind: "planet",
    radius: R,
    field,
    basin,
    dug,
    baseAt,
    dropAt,
    radiusAt,
    deckAt,
    // Where a bearing stands: on the ground there, `lift` above it, turned so +y is up.
    standAt(dir, lift = 0, yaw = 0) {
      const d = new THREE.Vector3().fromArray(dir).normalize();
      const q = standOn(d);
      if (yaw) q.multiply(new THREE.Quaternion().setFromAxisAngle(Y, yaw));
      return { position: d.clone().multiplyScalar(radiusAt(d) + lift), quaternion: q };
    },
    // Where a ray from the camera meets the ground: the bearing, or null if it misses.
    hit(ray) {
      const targets = risers();
      if (targets.length) {
        caster.ray.copy(ray);
        caster.far = Infinity;
        caster.firstHitOnly = false;
        // the nearest hit this side of the ball: a riser on the far side, seen through it, is not under the pointer
        const hit = caster.intersectObjects(targets, false).find((h) => !behindBall(ray.origin, h.point, R));
        caster.firstHitOnly = true;
        if (hit) return hit.point.normalize().toArray();
      }
      const o = ray.origin, d = ray.direction;
      const b = o.dot(d);
      const c = o.lengthSq() - R * R;
      const disc = b * b - c;
      if (disc < 0) return null;
      const t = -b - Math.sqrt(disc);
      if (t < 0) return null;
      return o.clone().addScaledVector(d, t).normalize().toArray();
    },
    // A bearing nudged along the surface by (dx, dz) world units in its own frame.
    nudge(dir, dx, dz) {
      const { quaternion } = this.standAt(dir);
      const d = new THREE.Vector3().fromArray(dir).multiplyScalar(R);
      d.add(new THREE.Vector3(dx, 0, dz).applyQuaternion(quaternion));
      return d.normalize().toArray();
    },
  };
}

export function surfaceOf(spec, field, risers, basin, roads) {
  return planetSurface(spec.radius ?? 36, field, risers, basin, roads);
}
