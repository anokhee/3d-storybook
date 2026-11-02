import * as THREE from "three";

import { toon } from "../../adjectives/unlit/toon.js";

// The fruits' paint and parts (an orange, an apple, a banana): the world's cel look,
// one material per colour, shared by every fruit built — the shopping bag
// clones them into many hands. `flat` for a faceted one (a banana's sides).
const mats = new Map();
export function fruitMat(swatch, flat = false) {
  const hex = swatch?.hex ?? swatch;
  const key = `${hex}|${flat}`;
  if (!mats.has(key)) mats.set(key, toon(new THREE.Color(hex), flat ? { flatShading: true } : {}));
  return mats.get(key);
}

// A leaf: a flattened ball, its base held at `at` (on a stalk, or the top
// of a fruit) and its blade running out from there along `turn` (radians
// round from +x), tipped `tilt` up from flat. Turned about its base, so it
// stays on whatever it grows from.
export function leafOf(length, width, swatch, at, turn = 0, tilt = 0.35) {
  const pivot = new THREE.Group();
  pivot.position.set(at[0], at[1], at[2] ?? 0);
  pivot.rotation.set(0, turn, tilt, "YZX");
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), fruitMat(swatch));
  m.scale.set(length, width * 0.18, width);
  m.position.x = length * 0.46; // its base just over the pivot
  pivot.add(m);
  return pivot;
}

export function disposeFruit(group) {
  group.traverse((o) => o.isMesh && o.geometry.dispose());
}
