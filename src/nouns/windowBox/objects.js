import { solid, PALETTE } from "../../world/palette.js";
import { PLANT_KINDS } from "../potPlant/objects.js";

// A WINDOW BOX: a trough of soil with plants in it, its foot on y = 0 and
// its middle on the origin, running along x — the cupcake house's, under
// each window (see CUPCAKE.boxes), and a shopfront's (see SHOPFRONT).
//
//   width, height, depth   the trough; a lip round its top
//   color, soil            the trough's and the soil's
//   flowers   what grows in it, or null: `count` of them in a row, each
//             on a stem `stem` long in `stemColor`, tipped with a plant
//             of `kind` — any of the pot plant's (PLANT_KINDS: "bush" a
//             ball of leaves, "leaf" a blade, or a flower: "daisy",
//             "tulip", "poppy") — `radius` big, in `colors` taken in turn
//             (swatches); a bush thrown in `clay`, a blade shaped by `leaf`;
//             the row `forward` of the depth toward the front (0 the middle,
//             0.25 halfway to the front edge: clear of a wall behind).
//             Or "ivy" (a window box's own, not a pot plant's): a low mound
//             of leaves over the soil and strands trailing over the front
//             lip and both ends, hanging down — see `ivy`
//   ivy       the ivy's: about `strands` trailing strands for each of the
//             row's plants (`count`), hanging `trail` times the box's height
//             below its top (each a little more or less), leaves `leaf`
//             times the plants' `radius` big, `spacing` of a leaf apart down
//             a strand, `mound` leaves on the soil, in `colors` (greens, a
//             leaf each at random) on stems in `stem`; `seed` the scatter
export const WINDOW_BOX = {
  width: 1.8,
  height: 0.55,
  depth: 0.5,
  color: solid("#A8744F"),
  soil: solid("#4A3322"),
  flowers: {
    count: 4,
    forward: 0,
    kind: "daisy",
    radius: 0.17,
    stem: 0.3,
    stemColor: solid("#6B8E3D"),
    colors: PALETTE.cupcake.sprinkles,
    clay: { amount: 0.5, seed: 62 },
    leaf: { aspect: 2.3, flat: 0.25 },
  },
  ivy: {
    strands: 1.5,
    trail: 2.2,
    leaf: 0.75,
    spacing: 1.1,
    mound: 3,
    colors: [solid("#3F6B45"), solid("#4F7A4A"), solid("#5E8F4E"), solid("#2F5A3C")],
    stem: solid("#5A4A32"),
    seed: 71,
  },
};
export const WINDOW_BOX_PLANTS = [...PLANT_KINDS, "ivy"];

export const WINDOW_BOX_KNOBS = {
  width: { path: "width", range: [0.3, 4, 0.05] },
  height: { path: "height", range: [0.1, 1.2, 0.05] },
  depth: { path: "depth", range: [0.1, 1.2, 0.05] },
  plant: { path: "flowers.kind", options: [...PLANT_KINDS, "ivy"], name: "plant" },
  count: { path: "flowers.count", range: [1, 12, 1], name: "plants" },
  size: { path: "flowers.radius", range: [0.03, 0.5, 0.01], name: "plant size" },
  stem: { path: "flowers.stem", range: [0.02, 1, 0.01], name: "stem" },
  ivyTrail: { path: "ivy.trail", range: [0.3, 5, 0.1], name: "ivy trail (times the box's height)" },
  ivyStrands: { path: "ivy.strands", range: [0.5, 4, 0.1], name: "ivy strands (a plant)" },
  boxColor: { path: "color.hex", color: true, name: "box color" },
};
