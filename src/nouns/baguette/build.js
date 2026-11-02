import * as THREE from "three";

import { fruitMat } from "../../world/fruit/parts.js";

export { disposeFruit as disposeBaguette } from "../../world/fruit/parts.js";

// THE BAGUETTE, built (see BAGUETTE in ./objects.js) standing up: its
// length along y, its middle at the origin, its slashes on the side facing
// +z. A THREE.Group, plain three.js so a shopping bag can stand clones of
// it up in it; Baguette.jsx lays it down.
export function buildBaguette(C) {
  const g = new THREE.Group(), r = C.radius;
  g.add(new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0, C.length - 2 * r), 6, 14), fruitMat(C.colors.crust)));
  // the slashes: darker strokes slanting across the face, spread along it
  const n = Math.max(0, Math.round(C.slashes)), span = C.length - 2 * r * 2.5;
  for (let k = 0; k < n; k++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(r * 1.2, r * 0.24, r * 0.4), fruitMat(C.colors.score));
    s.position.set(0, n > 1 ? -span / 2 + (span * k) / (n - 1) : 0, r - 0.06 * r);
    s.rotation.z = 0.5;
    g.add(s);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
