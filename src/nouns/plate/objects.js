import { solid } from "../../world/palette.js";
import { DESIGNS, DESIGN_COLORS, DESIGN_KNOBS } from "../bowl/designs.js";

// A PLATE: turned on a lathe, a flat well and a raised rim round it, lying
// on the tabletop at y = 0, and on it, if `food.on`, a heap of food. In
// the library's own units, as the Mug is — a Table Setting (Food/Kitchen/
// Table Setting) lays one, or a Bowl in its place.
//   radius   the rim's outer edge
//   rim      how broad the raised rim is
//   height   its thickness
//   color    the china (a "basic" plate's)
//   design   what's painted over its top (DESIGNS, the Bowl's: see
//            ../bowl/designs.js) — "basic" plain, or "chinoiserie",
//            "striped", "folk", each in its own `colors[design]`
//   food     a heap on it: `on` or not, `radius`, `color`
export const PLATE = {
  radius: 0.36,
  rim: 0.07,
  height: 0.035,
  color: solid("#F7F4EE"),
  design: "basic",
  colors: { ...DESIGN_COLORS },
  food: { on: true, radius: 0.2, color: solid("#D9A066") },
};

export const PLATE_KNOBS = [
  { label: "design", path: "design", options: DESIGNS },
  { label: "radius", path: "radius", step: 0.02, min: 0.12, max: 1 },
  { label: "rim", path: "rim", step: 0.01, min: 0.01, max: 0.3 },
  { label: "food", path: "food.on", bool: true },
  { label: "food size", path: "food.radius", step: 0.02, min: 0.05, max: 0.8 },
  { label: "plate colour", path: "color.hex", color: true, if: { arg: "design", eq: "basic" } },
  ...DESIGN_KNOBS,
  { label: "food colour", path: "food.color.hex", color: true },
];
