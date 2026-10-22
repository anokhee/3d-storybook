import * as THREE from "three";

import { hue } from "../../world/palette.js";

// One material per COLOUR rather than one per object — a module Map rather
// than a hook, so everything lit in a color shares one material no matter
// where it stands.
const mats = new Map();

// Basic, not standard: something lit is its own color at any hour and from
// any angle, shaded by nothing. Pair with a Glow to make it read as a light.
export const litMat = (swatch) => {
  if (!mats.has(swatch.hex)) {
    mats.set(swatch.hex, new THREE.MeshBasicMaterial({ color: hue(swatch) }));
  }
  return mats.get(swatch.hex);
};
