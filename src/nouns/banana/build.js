import * as THREE from "three";

import { fruitMat } from "../../world/fruit/parts.js";

export { disposeFruit } from "../../world/fruit/parts.js";

// THE BANANA, built (see BANANA in ./objects.js): a THREE.Group resting on
// y = 0, plain three.js so a shopping bag can carry clones of it.

// One banana's body: rings of `sides` corners along an arc in the xy
// plane, the arc's low middle at the origin, `t` 0 its stalk end (-x)
// and 1 its tip (+x). Returns the geometry, and where each end is and
// which way it points, for the stalk and the nub.
function bananaBody(C) {
  const bend = Math.max((C.curve * Math.PI) / 180, 0.001);
  const R = C.length / bend; // the arc's radius
  const rows = 24;
  const pos = [], idx = [];
  const at = (t) => {
    const a = (t - 0.5) * bend;
    return {
      p: new THREE.Vector3(R * Math.sin(a), R * (1 - Math.cos(a)), 0),
      along: new THREE.Vector3(Math.cos(a), Math.sin(a), 0),
      up: new THREE.Vector3(-Math.sin(a), Math.cos(a), 0),
    };
  };
  // fat in the middle, narrowing toward each end, the stalk end longer
  const widthAt = (t) => C.thick * (0.36 + 0.64 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.85)), 0.6));
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, { p, up } = at(t), w = widthAt(t);
    for (let k = 0; k < C.sides; k++) {
      const a = (k / C.sides) * Math.PI * 2;
      const v = p.clone().addScaledVector(up, Math.cos(a) * w).add(new THREE.Vector3(0, 0, Math.sin(a) * w));
      pos.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < rows; i++)
    for (let k = 0; k < C.sides; k++) {
      const a = i * C.sides + k, b = i * C.sides + ((k + 1) % C.sides);
      const c = a + C.sides, d = b + C.sides;
      idx.push(a, b, c, b, d, c); // outward: along × round points out
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { g, start: at(0), end: at(1), w0: widthAt(0), w1: widthAt(1) };
}

// One banana's body and the dark nub at its tip; its stalk is the
// bunch's (buildBanana).
function oneBanana(C) {
  const banana = new THREE.Group();
  const { g, start, end, w1 } = bananaBody(C);
  banana.add(new THREE.Mesh(g, fruitMat(C.colors.skin, true)));
  const nub = new THREE.Mesh(new THREE.ConeGeometry(w1 * 1.02, w1 * 1.6, C.sides), fruitMat(C.colors.tip, true));
  nub.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.along);
  nub.position.copy(end.p).addScaledVector(end.along, w1 * 0.6);
  banana.add(nub);
  return { banana, start };
}

export function buildBanana(C) {
  const group = new THREE.Group();
  const n = Math.max(1, Math.round(C.count));
  let start;
  for (let i = 0; i < n; i++) {
    const one = oneBanana(C);
    start = one.start;
    // a bunch: every one from the same stalk end, fanned out in plan and
    // each tipped up a little more than the last, so they lie over one
    // another toward their tips
    const pivot = new THREE.Group();
    pivot.position.copy(start.p);
    one.banana.position.sub(start.p);
    pivot.add(one.banana);
    pivot.rotation.set(0, ((i - (n - 1) / 2) * C.fan * Math.PI) / 180, i * 0.1, "YZX");
    group.add(pivot);
  }
  // the one stalk they all grow from, back out of their shared end, the
  // tip's dark colour, thicker for a bigger bunch
  const S = C.stalk, len = S.length * C.thick * (1 + 0.15 * (n - 1));
  const sr = S.radius * C.thick * (1 + 0.15 * (n - 1));
  const back = start.along.clone().negate();
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(sr * 0.8, sr, len, C.sides), fruitMat(C.colors.stalk, true));
  stalk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), back);
  stalk.position.copy(start.p).addScaledVector(back, len / 2 - sr * 0.3);
  group.add(stalk);
  const wrap = new THREE.Group();
  group.position.y = C.thick * 0.85; // its underside's facets on the ground
  wrap.add(group);
  wrap.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return wrap;
}
