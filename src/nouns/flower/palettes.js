import { PALETTE, solid } from "../../world/palette.js";

// The color schemes a bed of flowers is dealt from, by name — the edit
// panel's colors picker (see level/groundCover.js), picked apart from
// the flower's shape, so any flower comes in any of them. Each is what
// one flower's petals may be, one rolled per flower; the pistil is the
// one warm yellow every flower shares (see FLOWER).
const pink = PALETTE.flower.pink;
const yellow = PALETTE.flower.pistil;
const coral = PALETTE.flower.coral;
export const FLOWER_PALETTES = {
  // The stock bed: pink, yellow, coral and white.
  pastel: [pink, yellow, coral, PALETTE.white],
  // A red, an orange and a pale pink.
  ember: [solid("#E4553F"), solid("#F0803C"), solid("#F6C1C7")],
  // Blues: a cornflower, a periwinkle, a pale sky and white.
  cornflower: [
    solid("#5B7FD9"),
    solid("#8A9BE8"),
    solid("#BFD4F5"),
    PALETTE.white,
  ],
};
