import { solid } from "../../world/palette.js";

// A SHOPPING BAG: a thin plastic carrier bag, the kind from the corner shop —
// a soft sack, full and bulging, gathered in a little at the top where its
// two sides run up into one loop of a handle, held (or hung) from the top of
// that loop. Its origin is the top of the handle, where a hand grips it: the
// bag hangs down from there.
//   height    the sack's height, under the handle
//   width     across (x), and `depth` front to back (z): flatter than wide
//   bulge     how far the middle swells out past the top and bottom
//   gather    how far in the top is drawn, as a share of the width
//   handle    the loop: `height` from the sack's top to the grip, `tube` its
//             thickness, `spread` how far apart its two ends sit (share of the width)
//   crumple   how creased the plastic is (a seeded noise on its surface)
//   contents  what peeks out of the top: "none", "baguette", "broccoli", "oranges", "apples" or
//             "bananas" (Food's own: ../broccoli/, ../orange/, ../apple/, ../banana/)
//   seed      which creases (and which way things lean)
//   opacity   the plastic is a little see-through
//   colors    the plastic, and a printed `band` round it (none if the same as the plastic)
export const SHOPPING_BAG = {
  height: 0.28,
  width: 0.26,
  depth: 0.15,
  bulge: 0.14,
  gather: 0.22,
  handle: { height: 0.12, tube: 0.008, spread: 0.55 },
  crumple: 0.012,
  contents: "baguette",
  seed: 7,
  opacity: 0.88,
  colors: {
    plastic: solid("#F7F5EF"),
    band: solid("#E0574B"),
  },
};

export const SHOPPING_BAG_CONTENTS = ["none", "baguette", "broccoli", "oranges", "apples", "bananas"];
// the plastics a bag comes in (the crowd deals from these): mostly white,
// some in a pale tint, a few with a printed band
export const SHOPPING_BAG_PLASTICS = ["#F7F5EF", "#F7F5EF", "#F7F5EF", "#F3EDD8", "#E8EEF4", "#F4E4E4", "#E6EFE2"];
export const SHOPPING_BAG_BANDS = ["#E0574B", "#3E6FB0", "#3F8F5A", "#E8B23A"];

export const SHOPPING_BAG_KNOBS = [
  { label: "height", path: "height", step: 0.01, min: 0.12, max: 0.6 },
  { label: "width", path: "width", step: 0.01, min: 0.12, max: 0.5 },
  { label: "depth", path: "depth", step: 0.01, min: 0.05, max: 0.35 },
  { label: "bulge", path: "bulge", step: 0.01, min: 0, max: 0.4 },
  { label: "gather", path: "gather", step: 0.01, min: 0, max: 0.6 },
  { label: "handle height", path: "handle.height", step: 0.01, min: 0.04, max: 0.3 },
  { label: "crumple", path: "crumple", step: 0.002, min: 0, max: 0.04 },
  { label: "contents", path: "contents", options: SHOPPING_BAG_CONTENTS },
  { label: "seed", path: "seed", step: 1, min: 0, max: 50 },
  { label: "opacity", path: "opacity", step: 0.02, min: 0.3, max: 1 },
  { label: "plastic", path: "colors.plastic.hex", color: true },
  { label: "band", path: "colors.band.hex", color: true },
];
