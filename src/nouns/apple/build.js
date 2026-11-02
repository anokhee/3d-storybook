import * as THREE from "three";

import { fruitMat, leafOf } from "../../world/fruit/parts.js";

export { disposeFruit } from "../../world/fruit/parts.js";

// THE APPLE, built (see APPLE in ./objects.js): a THREE.Group resting on
// y = 0, plain three.js so a shopping bag can carry clones of it. Turned
// on a lathe from bottom to top: out round the side (wider at the
// shoulders), each end pulled in to a dimple.
export function buildApple(C) {
  const r = C.radius, half = r * C.height, steps = 24;
  const at = (k) => {
    const a = (k / steps) * Math.PI; // 0 the bottom, π the top
    const x = r * Math.sin(a) * (1 - C.shoulder * Math.cos(a) * 0.5);
    let y = half * (1 - Math.cos(a));
    y += C.dimple * r * Math.exp(-((a / 0.45) ** 2)); // the bottom's, pushed up
    y -= C.dimple * r * Math.exp(-(((Math.PI - a) / 0.45) ** 2)); // the top's, pulled down
    return new THREE.Vector2(Math.max(x, 0.0001 * r), y);
  };
  const pts = Array.from({ length: steps + 1 }, (_, k) => at(k));
  const low = Math.min(...pts.map((p) => p.y));
  const body = new THREE.LatheGeometry(pts, C.detail);
  body.computeVertexNormals();
  const group = new THREE.Group();
  const apple = new THREE.Mesh(body, fruitMat(C.colors.skin));
  apple.position.y = -low;
  group.add(apple);
  const top = pts[steps].y - low;
  // the stalk: out of the top dimple, leaning
  const S = C.stalk;
  if (S) {
    const len = S.length * r, lean = (S.lean * Math.PI) / 180;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(S.radius * r * 0.8, S.radius * r, len, 6), fruitMat(C.colors.stalk));
    st.position.set(Math.sin(lean) * len * 0.5, top + Math.cos(lean) * len * 0.5 - r * 0.05, 0);
    st.rotation.z = -lean;
    group.add(st);
    if (C.leaf) {
      // its base on the stalk, a third of the way up
      const base = top - r * 0.05;
      group.add(leafOf(r * C.leaf.length, r * C.leaf.width, C.colors.leaf, [Math.sin(lean) * len * 0.35, base + Math.cos(lean) * len * 0.35, 0]));
    }
  }
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return group;
}
