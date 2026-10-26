// THE SURFACE things are placed on. A placement is kept as a bearing — a
// unit direction from the surface's middle — with a yaw (its turn about its
// own up), a scale and a lift, and the surface says where that bearing
// stands and which way is up there. Games keep the bearing and stand each
// thing on their OWN ground (see ../runtime/mapLoader.js).
//
// The BASE ground is a plain ball, or a ball with a game's TERRAIN SNAPSHOT
// laid over it — a glb the game exported (the car page's ?terrain), whose
// ground meshes (named "ground:…") are what the pointer hits and what
// things stand on. Anything else in the snapshot (houses, trees: "stuff:…")
// is only seen. Over the base lies the map's OWN terrain — its plateaus and
// ramps (../runtime/terrain.js), which the game builds from the map the
// same way — so a lamp placed on a plateau stands on the plateau. Their
// drawn previews (Terrain.jsx) are `risers`: the pointer hits those too.
//
// A flat surface, when a game wants one, is this same interface with up
// always +y: `dir` becomes a point on the plane.
import * as THREE from "three";
import { standOn } from "../src/world/layout.js";
import { terrainField } from "../runtime/terrain.js";

const Y = new THREE.Vector3(0, 1, 0);

export function planetSurface(radius, ground = [], field = terrainField([], radius), risers = () => []) {
  const R = radius;
  const caster = new THREE.Raycaster();
  caster.firstHitOnly = true; // with a bounds tree on the ground (Scene.jsx), the nearest hit alone, fast
  const bases = new Map(); // a bearing (rounded) → how far out the base ground is
  const heights = new Map(); // …and the ground with the map's terrain on it
  const keyOf = (d) => `${d.x.toFixed(4)},${d.y.toFixed(4)},${d.z.toFixed(4)}`;
  // How far from the middle the BASE ground is at a bearing: a ray dropped
  // onto the snapshot from outside, or the ball itself with no snapshot (or
  // where the snapshot has a hole).
  const baseAt = (d) => {
    if (!ground.length) return R;
    const key = keyOf(d);
    if (bases.has(key)) return bases.get(key);
    caster.set(d.clone().multiplyScalar(R * 3), d.clone().negate());
    caster.far = R * 3;
    const hit = caster.intersectObjects(ground, false)[0];
    const r = hit ? hit.point.length() : R;
    bases.set(key, r);
    return r;
  };
  // …and the ground things stand on: the base, raised by the map's terrain
  // (a step at a plateau's edge, a kerb along a ramp's).
  const radiusAt = (d) => {
    if (field.empty) return baseAt(d);
    const key = keyOf(d);
    if (heights.has(key)) return heights.get(key);
    const r = baseAt(d) + field.rise(d, true);
    heights.set(key, r);
    return r;
  };
  return {
    kind: "planet",
    radius: R,
    hasTerrain: ground.length > 0,
    field,
    baseAt,
    radiusAt,
    // Where a bearing stands: on the ground there, `lift` above it, turned so +y is up.
    standAt(dir, lift = 0, yaw = 0) {
      const d = new THREE.Vector3().fromArray(dir).normalize();
      const q = standOn(d);
      if (yaw) q.multiply(new THREE.Quaternion().setFromAxisAngle(Y, yaw));
      return { position: d.clone().multiplyScalar(radiusAt(d) + lift), quaternion: q };
    },
    // Where a ray from the camera meets the ground: the bearing, or null if it misses.
    hit(ray) {
      const targets = [...ground, ...risers()];
      if (targets.length) {
        caster.ray.copy(ray);
        caster.far = Infinity;
        caster.firstHitOnly = false;
        const hit = caster.intersectObjects(targets, false)[0];
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

export function surfaceOf(spec, ground = [], field, risers) {
  return planetSurface(spec.radius ?? 36, ground, field, risers);
}
