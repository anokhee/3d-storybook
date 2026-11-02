import { solid } from "../../world/palette.js";

// A CRUET: a glass bottle for the table, the liquid in it showing through,
// a stopper in its neck. Two of them, each its own entry under
// Food/Condiments: OIL, a tall slim bottle with a long neck and a cork,
// golden; VINEGAR, a round-bellied one with a short neck and a round glass
// stopper, dark. Turned on a lathe from `profile` (pairs of [radius, height]
// as shares of `radius` and `height`, from the foot up to the lip). In the
// library's own units, as the Mug is.
//   height   to the lip; `radius` the widest
//   full     how high the liquid comes, a share of the height
//   stopper  "cork" or "ball", `size` (a share of the neck's radius)
//   opacity  how clouded the glass is
//   colors   `glass`, `liquid`, `stopper`
const OIL_PROFILE = [[0.92, 0], [1, 0.04], [1, 0.55], [0.85, 0.66], [0.42, 0.76], [0.3, 0.84], [0.3, 0.97], [0.36, 1]];
const VINEGAR_PROFILE = [[0.7, 0], [0.85, 0.05], [1, 0.3], [0.95, 0.5], [0.6, 0.68], [0.32, 0.78], [0.3, 0.94], [0.38, 1]];

export const OIL = {
  height: 0.85,
  radius: 0.13,
  sides: 22,
  profile: OIL_PROFILE,
  full: 0.66,
  stopper: { kind: "cork", size: 1 },
  opacity: 0.4,
  colors: { glass: solid("#E6F2EE"), liquid: solid("#D9B23A"), stopper: solid("#C8A06A") },
};
export const VINEGAR = {
  height: 0.6,
  radius: 0.16,
  sides: 22,
  profile: VINEGAR_PROFILE,
  full: 0.55,
  stopper: { kind: "ball", size: 1.3 },
  opacity: 0.4,
  colors: { glass: solid("#E6F2EE"), liquid: solid("#5A2630"), stopper: solid("#E6F2EE") },
};

export const CRUET_KNOBS = [
  { label: "height", path: "height", step: 0.05, min: 0.2, max: 2 },
  { label: "radius", path: "radius", step: 0.01, min: 0.05, max: 0.4 },
  { label: "full", path: "full", step: 0.05, min: 0, max: 0.95 },
  { label: "liquid", path: "colors.liquid.hex", color: true },
  { label: "stopper", path: "colors.stopper.hex", color: true },
  { label: "glass", path: "colors.glass.hex", color: true },
];
