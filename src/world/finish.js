import * as THREE from "three";

// What everything is finished in: plasticine. It has a faint waxy sheen
// where paint has none — a little clearcoat over a mostly rough body — and
// the grass, the ground, the dolls and every solid share this one so they
// read as one stock. A sharp specular highlight is the fastest way to make
// a painted thing look like plastic, so the coat is kept faint and rough.
export const FINISH = {
  roughness: 0.6,
  clearcoat: 0.18,
  clearcoatRoughness: 0.35,
};

// A fresh material in that finish. `color` is anything THREE.Color takes;
// `extra` is the odd per-use flag (a double-sided lip, say). Fresh rather
// than cached, so a caller that disposes what it made disposes only its own.
export const plasticine = (color, extra = {}) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: FINISH.roughness,
    metalness: 0,
    clearcoat: FINISH.clearcoat,
    clearcoatRoughness: FINISH.clearcoatRoughness,
    ...extra,
  });
