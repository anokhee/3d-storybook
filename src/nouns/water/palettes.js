import { PALETTE, solid } from "../../world/palette.js";

// The colors a pool comes in, by name: its sheet and the foam on it.
// Not picked by hand — the water takes its color off the grass it lies
// in (see level/groundCover.js's waterColorsOf): clear blue in a lush
// field, a murky green in a dry one, pale ice in a frosted one.
export const WATER_PALETTES = {
  // The stock pool: the palette's own blue, off-white foam.
  clear: { surface: PALETTE.water.surface, foam: PALETTE.water.foam },
  // A pond in parched ground: green-brown water, foam gone to scum.
  murky: { surface: solid("#6F9A6E"), foam: solid("#E4E3C4") },
  // Rimed over: pale, milky blue, the foam white as frost.
  icy: { surface: solid("#9ED3E8"), foam: solid("#F6FBFF") },
};
