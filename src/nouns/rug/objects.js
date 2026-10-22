import { PALETTE } from "../../world/palette.js";
import { PATTERN } from "../pattern/objects.js";

// A rug: a slab of color lying on the floor, for other things to stand
// on — it keeps nothing off it, the way ground does (see IN_GROUND in
// ../water/objects.js). A rounded rectangle, `width` across and `length`
// along, its corners `cornerRadius` round (world units, 0 square, no
// rounder than half the short side), `thickness` thick, `color` its own,
// and `pattern` the dots raised on it (see PATTERN in
// ../pattern/objects.js).
export const RUG = {
  width: 6,
  length: 4,
  cornerRadius: 0.6,
  thickness: 0.08,
  color: PALETTE.rug.wool,
  pattern: PATTERN,
};
