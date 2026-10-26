import { solid } from "../../world/palette.js";
import { CAT_HEIGHT } from "../house/objects.js";

const paint = { white: solid("#FFF8F0"), red: solid("#E5384B") };

// A peppermint: a round candy standing on its edge at y = 0, its face to
// +z, banded in a red swirl. Sizes are in its own units — its `radius` the
// disc's — and the whole is `scale` times that in the world.
//   thickness  how thick the disc is, in those units
//   wedges     how many red bands wind out from the middle
//   twist      degrees each band turns round between the middle and the rim
//   white, red the two colors
export const PEPPERMINT = {
  scale: CAT_HEIGHT / 8,
  radius: 0.6,
  thickness: 0.22,
  wedges: 8,
  twist: 80,
  white: paint.white,
  red: paint.red,
};

// What can be changed on a peppermint, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const PEPPERMINT_KNOBS = [
  { label: "size", path: "radius", step: 0.05, min: 0.2, max: 1.2 },
  { label: "thickness", path: "thickness", step: 0.02, min: 0.06, max: 0.5 },
  { label: "bands", path: "wedges", step: 1, min: 3, max: 16 },
  { label: "twist", path: "twist", step: 5, min: -240, max: 240 },
  { label: "white", path: "white.hex", color: true },
  { label: "red", path: "red.hex", color: true },
];
