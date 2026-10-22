import * as THREE from "three";

// The look of something that cannot be where it is: a translucent red,
// worn by every mesh of it in place of its own, until it can. One
// material, shared — see Invalid in nouns/station/Station.jsx for how it
// is put on and taken off.
export const INVALID = {
  color: "#ff3b3b",
  opacity: 0.45,
};

export const INVALID_MATERIAL = new THREE.MeshBasicMaterial({
  color: INVALID.color,
  transparent: true,
  opacity: INVALID.opacity,
  depthWrite: false,
});
