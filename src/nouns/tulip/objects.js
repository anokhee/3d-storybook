import { solid } from "../../world/palette.js";
import { CAT_HEIGHT } from "../house/objects.js";

// One tulip, standing on its stem's foot: a flower (see FLOWER_TYPES.tulip)
// cupped mouth-up on a stem, two leaves leaning out low down it. `radius`
// is the bloom's, `stem` the stem's `height` and `radius`, `leaf` each
// leaf's `length` and `width` and how far it `lean`s out, in degrees from
// upright, and `color` the petals'.
export const TULIP = {
  scale: CAT_HEIGHT / 8,
  radius: 1,
  stem: { height: 1.2, radius: 0.07, color: solid("#6B8E3D") },
  leaf: { length: 1.1, width: 0.28, lean: 35, color: solid("#5FA14A") },
  color: solid("#F26D8D"),
};

export const TULIP_KNOBS = [
  { label: "bloom", path: "radius", step: 0.05, min: 0.3, max: 2 },
  { label: "stem length", path: "stem.height", step: 0.1, min: 0.2, max: 3 },
  { label: "leaf length", path: "leaf.length", step: 0.05, min: 0.2, max: 2 },
  { label: "leaf lean", path: "leaf.lean", step: 1, min: 0, max: 80 },
  { label: "petals", path: "color.hex", color: true },
  { label: "stem", path: "stem.color.hex", color: true },
  { label: "leaves", path: "leaf.color.hex", color: true },
];
