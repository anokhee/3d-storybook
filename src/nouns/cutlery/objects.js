import { solid } from "../../world/palette.js";

// CUTLERY: a fork, a knife, a spoon or a sharp knife, lying flat on the table at y = 0,
// its handle toward -z and the end it eats with toward +z (as a Table
// Setting lays them, for someone sat at -z). In the library's own units,
// as the Mug is. Each is its own entry (Food/Utensils/Fork, Knife, Spoon,
// Sharp Knife).
//   length   end to end
//   width    the handle's, across
//   thick    how thick it is
//   color    the steel
// and each one's own end: a fork's `tines` (how many), a spoon's `bowl`
// (its width, as a share of the length), a knife's `blade` (its width,
// likewise). A sharp knife — a kitchen knife, its blade coming to a
// point — is `sharp.scale` times as long, its blade `sharp.blade` wide,
// on a `sharp.handle` coloured handle with two rivets in it.
export const CUTLERY = {
  length: 0.5,
  width: 0.04,
  thick: 0.014,
  tines: 4,
  bowl: 0.22,
  blade: 0.13,
  color: solid("#BFC5CB"),
  sharp: { scale: 1.3, blade: 0.16, handle: solid("#3B2A2A") },
};
export const CUTLERY_KINDS = ["fork", "knife", "spoon", "sharp knife"];

const COMMON = [
  { label: "length", path: "length", step: 0.05, min: 0.2, max: 1.2 },
  { label: "width", path: "width", step: 0.005, min: 0.015, max: 0.1 },
  { label: "colour", path: "color.hex", color: true },
];
export const FORK_KNOBS = [...COMMON, { label: "tines", path: "tines", step: 1, min: 2, max: 5 }];
export const KNIFE_KNOBS = [...COMMON, { label: "blade", path: "blade", step: 0.01, min: 0.06, max: 0.3 }];
export const SPOON_KNOBS = [...COMMON, { label: "bowl", path: "bowl", step: 0.01, min: 0.1, max: 0.4 }];
export const SHARP_KNIFE_KNOBS = [
  ...COMMON,
  { label: "blade", path: "sharp.blade", step: 0.01, min: 0.06, max: 0.35 },
  { label: "handle colour", path: "sharp.handle.hex", color: true },
];
