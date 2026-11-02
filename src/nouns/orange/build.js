import * as THREE from "three";

import { fruitMat, leafOf } from "../../world/fruit/parts.js";

export { disposeFruit } from "../../world/fruit/parts.js";

// THE ORANGE, built (see ORANGE in ./objects.js): a THREE.Group resting
// on y = 0, plain three.js so a shopping bag can carry clones of it.
// `disposeFruit` frees one built here (or an apple, or a banana).
export function buildOrange(C) {
  const r = C.radius, h = r * C.squash;
  const group = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r, C.detail, Math.round(C.detail * 0.7)), fruitMat(C.colors.skin));
  ball.scale.y = C.squash;
  ball.position.y = h;
  group.add(ball);
  // the calyx: a thin star pressed flat on the top
  const K = C.calyx;
  if (K) {
    const star = new THREE.Shape();
    const n = K.points, out = r * K.radius, inn = out * 0.45;
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2, d = i % 2 ? inn : out;
      i ? star.lineTo(Math.cos(a) * d, Math.sin(a) * d) : star.moveTo(d, 0);
    }
    const g = new THREE.ExtrudeGeometry(star, { depth: r * 0.06, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, fruitMat(C.colors.calyx));
    m.position.y = 2 * h - r * 0.03;
    group.add(m);
  }
  if (C.leaf) group.add(leafOf(r * C.leaf.length, r * C.leaf.width, C.colors.leaf, [r * 0.05, 2 * h, 0]));
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return group;
}
