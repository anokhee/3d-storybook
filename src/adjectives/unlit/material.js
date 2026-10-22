import { hue } from "../../world/palette.js";
import { toon } from "./toon.js";

// One material per COLOUR rather than one per object — a module Map rather
// than a hook, so everything unlit in a color shares one material no matter
// where it stands.
const mats = new Map();

// Something unlit is just an object in the world, so it shades: toon, the
// light stepped into flat bands — see TOON. No specular at all, which is
// the fastest way to keep a painted thing from looking like plastic.
export const unlitMat = (swatch) => {
  if (!mats.has(swatch.hex)) {
    mats.set(swatch.hex, toon(hue(swatch)));
  }
  return mats.get(swatch.hex);
};
