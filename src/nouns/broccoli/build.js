import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { fruitMat } from "../../world/fruit/parts.js";

export { disposeFruit as disposeBroccoli } from "../../world/fruit/parts.js";

// THE BROCCOLI, built (see BROCCOLI in ./objects.js): a THREE.Group
// standing on y = 0, plain three.js so a shopping bag can carry clones of
// it. Built a crown 1 round, then scaled to `size`. The crown is the
// Broccoli Car's (src/car/broccolicar.js): florets laid round the core's
// top and flanks along an even spiral, each nudged a little so they pack
// close without lining up, each a rounded lump with a few smaller knobs on
// its outer face, lighter the higher it sits, merged per colour.
const A = 1, B = 0.72, SQUASH = 0.6;

export function buildBroccoli(C) {
  const g = new THREE.Group(), S = C.stalk;
  const CY = S.height + B * SQUASH * 0.7; // the core's middle, off the ground
  let seed = Math.max(1, Math.round(C.seed));
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const add = (geo, swatch) => { const m = new THREE.Mesh(geo, fruitMat(swatch)); g.add(m); return m; };

  // the core, an ellipsoid squashed underneath (hidden under the florets)
  const core = new THREE.SphereGeometry(1, 32, 20).scale(A, B, A);
  const cp = core.attributes.position;
  for (let i = 0; i < cp.count; i++) if (cp.getY(i) < 0) cp.setY(i, cp.getY(i) * SQUASH);
  core.computeVertexNormals();
  core.translate(0, CY, 0);
  add(core, C.colors.dark);

  // a point on the core's skin in direction (dx, dy, dz), and its normal
  const skin = (dx, dy, dz) => {
    const Bv = dy < 0 ? B * SQUASH : B, k = 1 / Math.hypot(dx / A, dy / Bv, dz / A);
    return {
      p: new THREE.Vector3(dx * k, CY + dy * k, dz * k),
      n: new THREE.Vector3(dx / (A * A), dy / (Bv * Bv), dz / (A * A)).normalize(),
    };
  };
  const lumps = { floret: [], dark: [], tip: [] };
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler();
  const ball = new THREE.SphereGeometry(1, 9, 6);
  const lump = (list, x, y, z, sx, sy, sz) => {
    e4.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
    m4.compose(new THREE.Vector3(x, y, z), q4.setFromEuler(e4), new THREE.Vector3(sx, sy, sz));
    list.push(ball.clone().applyMatrix4(m4));
  };
  const count = Math.max(0, Math.round(C.florets)), golden = Math.PI * (3 - Math.sqrt(5));
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  const placed = [];
  for (let i = 0; i < count; i++) {
    // the spiral over the sphere from under its equator to the top
    const v = -0.25 + 1.25 * ((i + 0.5) / count) + 0.03 * (rand() - 0.5), u = i * golden + 0.4 * (rand() - 0.5);
    const rr = Math.sqrt(Math.max(0, 1 - v * v));
    const r = 0.26 + 0.1 * rand();
    const { p, n } = skin(Math.cos(u) * rr * A, v * (v < 0 ? B * SQUASH : B), Math.sin(u) * rr * A);
    p.addScaledVector(n, r * 0.3);
    if (placed.some((o) => o.distanceTo(p) < 0.55 * (r + o.r))) continue;
    p.r = r;
    placed.push(p);
    const h = (p.y - (CY - B * SQUASH)) / (B * (1 + SQUASH)); // 0 the crown's bottom, 1 its top
    const list = h > 0.72 + 0.2 * rand() ? lumps.tip : h < 0.35 + 0.2 * rand() ? lumps.dark : lumps.floret;
    lump(list, p.x, p.y, p.z, r * (0.95 + 0.15 * rand()), r * (0.85 + 0.15 * rand()), r * (0.95 + 0.15 * rand()));
    // the knobs on its outer face, in its own colour
    const t1 = new THREE.Vector3().crossVectors(n, Math.abs(n.y) > 0.9 ? X : Y).normalize(), t2 = new THREE.Vector3().crossVectors(n, t1);
    for (let k = 0; k < 3; k++) {
      const a = rand() * 6.28, b = 0.35 + 0.6 * rand(), c = Math.sqrt(1 - b * b);
      const q = p.clone().addScaledVector(n, b * r * 0.75).addScaledVector(t1, Math.cos(a) * c * r * 0.75).addScaledVector(t2, Math.sin(a) * c * r * 0.75);
      lump(list, q.x, q.y, q.z, r * 0.42, r * 0.38, r * 0.42);
    }
  }
  ball.dispose();
  for (const k of ["floret", "dark", "tip"]) {
    if (!lumps[k].length) continue;
    add(mergeGeometries(lumps[k].map((x) => (x.index ? x.toNonIndexed() : x))), C.colors[k]);
    lumps[k].forEach((x) => x.dispose());
  }

  // the stalk: a thick pale trunk up into the crown, a little wider at its
  // foot, its cut end a lighter disc on the ground; branch stems forking up
  // out of its top into the crown all round
  const R = S.radius;
  add(new THREE.CylinderGeometry(R * 0.9, R, CY, 16).translate(0, CY / 2, 0), C.colors.stalk);
  add(new THREE.CylinderGeometry(R * 0.92, R * 0.92, 0.02, 16).translate(0, 0.005, 0), C.colors.cut);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    const stem = add(new THREE.CylinderGeometry(R * 0.35, R * 0.55, B * 0.9, 10).translate(0, B * 0.45, 0), C.colors.stalk);
    stem.position.set(0, S.height * 0.8, 0);
    stem.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75);
  }
  const out = new THREE.Group();
  g.scale.setScalar(C.size);
  out.add(g);
  out.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return out;
}

// How tall it stands, in the world: the stalk and the crown on it.
export const broccoliHeightOf = (C) => C.size * (C.stalk.height + B * SQUASH * 0.7 + B + 0.35);
