import { primitiveGeometry } from "../primitive/geometry.js";

// A pebble's body: a clay sphere pulled `widen` across and `deepen` along,
// and pressed down to `squash` of its height so it lies rather than sits.
// Shared and cached by primitiveGeometry, since a field of pebbles is one
// geometry drawn many times.
export const pebbleGeometry = (P) =>
  primitiveGeometry(
    "sphere",
    P.radius,
    undefined,
    P.detail,
    { widen: P.widen, deepen: P.deepen, tall: P.squash },
    undefined,
    P.clay,
  );
