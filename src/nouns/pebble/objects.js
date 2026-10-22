import { PALETTE } from "../../world/palette.js";
import { GRASS } from "../grass/objects.js";

// A pebble: a squashed ball of clay lying in the dirt, rolled from the same
// stock the grass is pinched from. Where it lies and how many is the ground
// cover's business (see GROUND_COVER) — this is the stone. See `hand` for
// how no two come out alike.
export const PEBBLE = {
  radius: 0.16, // the ball it is rolled from, before the size roll
  detail: 1.2, // facets, as a multiple of a sphere's (see PRIMITIVES)
  widen: 1.3, // across, as a multiple of the radius — 1 is round
  deepen: 1, // along, the same
  squash: 0.6, // how tall it stands, as a share of the radius — low is flat
  // Thumbed like a doll — see CLAY in ../primitive/objects.js. `amount` is
  // how lumpy, `seed` which lumps. Null for a smooth stone.
  clay: { texture: "bumpiness", amount: 0.4, seed: 0 },
  // Hand-rolled: the ranges a stone is rolled from when a field is grown in
  // variants (see LAYER.variants), so no two pebbles are the same one. Each
  // is an absolute range on the field of the same name above, and any left
  // out keeps the single value.
  hand: {
    radius: [0.09, 0.24],
    widen: [0.9, 1.7],
    deepen: [0.8, 1.3],
    squash: [0.45, 0.8],
  },
  // The same plasticine as the grass and the ground.
  finish: GRASS.finish,
  // The stone it is rolled from, where a layer names none, and the blocks a
  // field draws on.
  color: PALETTE.pebble.blocks[0],
  blocks: PALETTE.pebble.blocks,
  // And the darker, wetter stones a pond bed draws on.
  bed: PALETTE.pebble.bed,
};
