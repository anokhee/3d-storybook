import { solid } from "../../world/palette.js";

// AN APPLE: rounder at the shoulders than the bottom, a dimple at each
// end, a short stalk out of the top one and, if `leaf` is set, a leaf on
// it. It rests on the ground at y = 0. In the world's units, at the
// character's scale (they are 1.31 high), like ../orange/.
//   radius   across its widest
//   height   top to bottom, as a share of its width
//   shoulder how much wider the top half is than the bottom
//   dimple   how deep the dents at each end go, a share of the radius
//   detail   how many facets round it
//   stalk    `length` and `radius` as shares of the apple's, `lean` (degrees)
//   leaf     `length` and `width` as shares of the radius; or null
//   colors   `skin`, `stalk`, `leaf`
const LEAF = { length: 1, width: 0.45 };
export const APPLE = {
  radius: 0.036,
  height: 0.92,
  shoulder: 0.14,
  dimple: 0.18,
  detail: 20,
  stalk: { length: 0.55, radius: 0.06, lean: 14 },
  leaf: LEAF,
  colors: {
    skin: solid("#D8423C"),
    stalk: solid("#6B4A2E"),
    leaf: solid("#5FA14A"),
  },
};
// the skins an apple comes in
export const APPLE_SKINS = ["#D8423C", "#B8323A", "#9CC64A", "#E8C04A"];

export const APPLE_KNOBS = [
  { label: "size", path: "radius", step: 0.004, min: 0.01, max: 0.2 },
  { label: "height", path: "height", step: 0.02, min: 0.6, max: 1.3 },
  { label: "shoulder", path: "shoulder", step: 0.02, min: 0, max: 0.4 },
  { label: "dimple", path: "dimple", step: 0.02, min: 0, max: 0.4 },
  { label: "stalk lean", path: "stalk.lean", step: 2, min: -40, max: 40 },
  { label: "leaf", path: "leaf", bool: true, on: LEAF, off: null },
  { label: "skin", path: "colors.skin.hex", color: true },
  { label: "leaf colour", path: "colors.leaf.hex", color: true },
];
