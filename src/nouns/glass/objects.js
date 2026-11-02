import { solid } from "../../world/palette.js";

// A GLASS: a tumbler, a little narrower at the bottom than the mouth, its
// walls see-through, a drink standing in it. It stands on y = 0. In the
// library's own units, as the Mug is (a Table Setting can lay one in the
// mug's place).
//   radius   the mouth's, outside; `foot` the bottom's, a share of it
//   height   how tall it stands
//   wall     the glass's thickness, `base` its thick bottom's
//   full     how high the drink stands, 0 none to 1 brimming
//   opacity  how clouded the glass is, 0 clear to 1 solid
//   colors   `glass`, `drink`
export const GLASS = {
  radius: 0.13,
  foot: 0.82,
  height: 0.36,
  wall: 0.012,
  base: 0.05,
  sides: 24,
  full: 0.7,
  opacity: 0.35,
  colors: {
    glass: solid("#DCEFF2"),
    drink: solid("#F2B13C"),
  },
};
export const GLASS_DRINKS = { water: "#CFE8F0", juice: "#F2B13C", lemonade: "#F4E9A6", cola: "#4A2A20", milk: "#FBF7EE" };

export const GLASS_KNOBS = [
  { label: "radius", path: "radius", step: 0.01, min: 0.05, max: 0.4 },
  { label: "height", path: "height", step: 0.02, min: 0.1, max: 1 },
  { label: "foot", path: "foot", step: 0.05, min: 0.4, max: 1.2 },
  { label: "full", path: "full", step: 0.05, min: 0, max: 1 },
  { label: "opacity", path: "opacity", step: 0.05, min: 0.1, max: 1 },
  { label: "glass", path: "colors.glass.hex", color: true },
  { label: "drink", path: "colors.drink.hex", color: true },
];
