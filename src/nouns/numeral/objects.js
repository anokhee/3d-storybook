import { solid } from "../../world/palette.js";
import { CAT_HEIGHT } from "../house/objects.js";

// A numeral: a cake-top number, a "1", standing upright on its foot with
// its face to +z. `height` is its full height, `thick` how far it
// is from front to back, `bevel` how much its edges are rounded, and
// `color` its own.
export const NUMERAL = {
  scale: CAT_HEIGHT / 8,
  height: 1.5,
  thick: 0.3,
  bevel: 0.06,
  color: solid("#F26D8D"),
};

export const NUMERAL_KNOBS = [
  { label: "height", path: "height", step: 0.1, min: 0.6, max: 3 },
  { label: "thickness", path: "thick", step: 0.02, min: 0.1, max: 0.8 },
  { label: "bevel", path: "bevel", step: 0.01, min: 0, max: 0.12 },
  { label: "color", path: "color.hex", color: true },
];
