import * as THREE from "three";

import { standOn } from "../../world/layout.js";
import { BODIES } from "./bodies.js";

// The ground is a ball, so a point `x` across and `z` along a station's
// tangent plane is above the surface: each thing is dropped onto it and
// tipped to its own local up, the way OnPlanet stands things on the globe,
// only measured from the station's middle, where the ground is at y = 0.
// `lift` is then how far it stands above that bit of ground, and `body`
// which ball it is — the tighter the ball, the sooner the ground falls away.
export function standAt(x, z, lift = 0, body = BODIES.planet) {
  const R = body.radius;
  const dir = new THREE.Vector3(x, R, z).normalize(); // from the center
  return {
    position: dir
      .clone()
      .multiplyScalar(R + lift)
      .sub(new THREE.Vector3(0, R, 0)),
    quaternion: standOn(dir).toArray(),
  };
}
