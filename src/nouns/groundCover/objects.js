import { GRASS } from "../grass/objects.js";
import { GRASS_PALETTES } from "../grass/palettes.js";
import { PEBBLE } from "../pebble/objects.js";
import { TREE } from "../tree/objects.js";
import { FLOWER_PALETTES } from "../flower/palettes.js";
import { TREE_PALETTES } from "../tree/palettes.js";
import { LIGHT } from "../../adjectives/lit/objects.js";

// Everything growing or lying on the ground, as LAYERS planted one over the
// other: a carpet of grass, daisies in clumps, pebbles. Each layer is one
// kind of thing scattered over the ball on its own terms; a layer leaves out
// what it does not change from LAYER.
//
//   type        what is planted: "grass", "pebbles", "tree", any
//               FLOWER_TYPES name, or a primitive spec `{ shape, radius, sides?, detail?, form?, rotation? }`
//               (`form` pushes the solid about — see FORM — and `rotation`
//               is degrees round x, y, z — see ROTATION)
//   grass       for a grass layer: overrides on the blade itself (see
//               GRASS) — `baseRadius`, `taper`, or any other field
//   pebble      for a pebbles layer: the same, on the stone (see PEBBLE)
//   tree        for a tree layer: the same, on the tree (see TREE) — its
//               `kind` above all. The canopy takes the layer's `colors`,
//               the trunk the tree's own bark — a flowering tree's too,
//               its blossoms in the tree's own blossom color over it; a
//               dead tree, all trunk, takes the layer's colors itself
//   variants    for a grass or pebbles layer: how many differently pinched
//               tufts (or rolled stones) the field is grown from, `density`
//               shared between them — each its own shape rolled from the
//               plant's `hand` and its own clay seed, so no two neighbors
//               are the same one. 1 is one everywhere
//   ground      where it may grow: "open", anywhere the clearings leave;
//               "clearings", only inside the dry ones — the bare ground
//               round the stations where the grass is kept back; or
//               "water", only on the bed of the pools (see WATER)
//   density     how many, at full coverage of the whole ball — a clearings
//               layer keeps only the share that lands in them
//   jitter      how far each is shaken off its spot on the even scatter,
//               `[min, max]` as shares of the spacing between neighbors:
//               at least `min`, so none sits on the lattice, and at most
//               `max` — 1 lets them land on each other's spots (see
//               scatter in world/layout.js). Or one number, 0 to that
//   apart       how far apart neighbors must stand, as a multiple of their
//               two reaches together: 0 lets them land on each other, 1
//               keeps them from touching, 1.5 leaves half a stone between.
//               Counted across a layer's variants, and across every layer
//               that asks — a conifer keeps off a leafy tree's patch too,
//               each layer planted after the ones above it — so no two of
//               them overlap either. Every instance is checked against
//               every other, so keep it for sparse layers, not the grass
//   patchiness  how many clumps it grows in — 0 is the whole ball
//   patchSize   a clump's radius, in world units
//   size        multiplier on the plant's own size, rolled per instance
//   lean        degrees it may tip off straight up, either way
//   sink        how far into the ground its root is set, rolled, times size
//   lift        how far above the ground it stands (a flower on its stem)
//   stem        for lifted things: the stalk down to the ground, or null
//               — `radius` at the ground, `taper` the top's as a share of
//               it, `color`, and `leaves`, if any: `count` leaf cards off
//               it, each `length` long and `width` wide at the base,
//               drawn to `taper` of that at the tip, pitched `pitch`
//               degrees up from level, set from `from` to `to` of the way
//               down the stem, or null for a bare stalk
//   colors      swatches, one rolled per instance, drifted by the wash
//   wash        how many turns the color drift takes across the ball —
//               low is a few big pools, high is confetti
//   grain       the per-instance jitter laid over the wash
//   seed        so the same ball comes back on reload
//   light       { type, brightness, color } (see LIGHT): "lit", every instance is
//               its own color from any angle with a halo pooled round it,
//               as much as `brightness` says. Halos only — a field of real
//               point lights would be a field of nothing else — so there is
//               no `casts` here
//   tread       how it gives way under the player: instances within `reach`
//               of the doll's lowest point tip away from it about their
//               roots, up to `tilt` degrees right underneath, easing over
//               and springing back at `rate` per second; false stands firm
//               (false, not null: a null override falls through to this)
//   rustle      { tilt, rate, wobble }: a tree layer's leaves, set swinging
//               when the doll pushes through them — `tilt` degrees at
//               most, `wobble` radians a second, dying away at `rate` per
//               second once it has gone (see rustle in player/tread.js).
//               False for leaves that hold still
//   harmony     { color, amount }: every instance's color, once rolled, is
//               mixed `amount` of the way toward `color` — the light off
//               the grass on a bed of flowers, so whatever they are dealt
//               they sit in the field they stand in. Null for none
export const LAYER = {
  type: "grass",
  grass: {},
  pebble: {},
  tree: {},
  variants: 1,
  ground: "open",
  apart: 0,
  density: 1000,
  jitter: [0.25, 0.75],
  patchiness: 0,
  patchSize: 3,
  size: [1, 1],
  lean: 0,
  sink: [0, 0],
  lift: 0,
  stem: null,
  colors: [GRASS.color],
  wash: 1.2,
  grain: 0.3,
  seed: 1,
  light: LIGHT,
  tread: { reach: 2.4, tilt: 55, rate: 10 },
  rustle: false,
  harmony: null,
};

// A flower's stalk: as thick at the ground, this fraction of that under the
// head, in the grass's green, with a couple of leaves on the way down.
const STEM = {
  radius: 0.03,
  taper: 0.5,
  color: GRASS.color,
  leaves: {
    count: 2,
    length: 0.32,
    width: 0.11,
    taper: 0.15,
    pitch: 30,
    from: 0.35,
    to: 0.7,
  },
};

export const GROUND_COVER = [
  // Clay tufts: few and fat, each variant pinched its own way from
  // GRASS.hand's ranges, in three blocks of green pooled across the ball
  // with hardly any grain — a block is one color.
  {
    type: "grass",
    variants: 12,
    density: 60000,
    size: [0.5, 1.5],
    lean: 20,
    sink: [0.05, 0.2],
    colors: GRASS_PALETTES.lush,
    wash: 0.9,
    grain: 0.1,
  },
  // Pebbles: clay stones lying in the bare ground round the stations, half
  // sunk, in three blocks of stone pooled the way the grass is.
  {
    type: "pebbles",
    ground: "clearings",
    variants: 8,
    density: 20000,
    size: [0.7, 1.4],
    lean: 25,
    sink: [0.04, 0.1],
    apart: 1.1,
    colors: PEBBLE.blocks,
    wash: 0.9,
    grain: 0.15,
    seed: 20260906,
    tread: false,
  },
  // Trees, very few, kept apart from each other and off the lots and
  // paths: leafy ones, some of them in blossom, conifers, and the odd
  // dead one. Rooted — a tree does not bend for a doll.
  {
    type: "tree",
    tree: { kind: "deciduous" },
    density: 20,
    size: [0.8, 1.4],
    lean: 4,
    sink: [0.1, 0.25],
    apart: 1.2,
    colors: TREE_PALETTES.leaves,
    wash: 0.8,
    grain: 0.2,
    seed: 20260914,
    tread: false,
  },
  {
    type: "tree",
    tree: { kind: "flowering" },
    density: 30,
    size: [0.8, 1.3],
    lean: 4,
    sink: [0.1, 0.25],
    apart: 1.2,
    colors: TREE_PALETTES.leaves,
    wash: 0.8,
    grain: 0.2,
    seed: 20260916,
    tread: false,
  },
  {
    type: "tree",
    tree: { kind: "conifer" },
    density: 20,
    size: [0.9, 1.5],
    lean: 3,
    sink: [0.1, 0.25],
    apart: 1.2,
    colors: TREE_PALETTES.needles,
    wash: 0.8,
    grain: 0.2,
    seed: 20260915,
    tread: false,
  },
  {
    type: "tree",
    tree: { kind: "dead" },
    density: 10,
    size: [0.8, 1.3],
    lean: 8,
    sink: [0.1, 0.3],
    apart: 1.2,
    colors: TREE_PALETTES.bare,
    wash: 0.8,
    grain: 0.3,
    seed: 20260916,
    tread: false,
  },
  {
    type: "daisy",
    density: 200,
    size: [1, 1.5],
    lean: 18,
    lift: 1.5,
    stem: STEM,
    colors: FLOWER_PALETTES.pastel,
    seed: 20260902,
  },
  {
    type: "tulip",
    density: 100,
    size: [1, 1.5],
    lean: 18,
    lift: 1.5,
    stem: STEM,
    colors: FLOWER_PALETTES.pastel,
    seed: 20260902,
  },
  // {
  //   type: { shape: "cylinder", radius: 0.2 },
  //   density: 100,
  //   size: [1, 1],
  //   sink: [0.05, 0.1],
  //   lift: 1.5,
  //   stem: STEM,
  //   colors: [PALETTE.white],
  //   light: { type: "lit", brightness: 1, alpha: 1 },
  //   seed: 20260907,
  //   tread: false,
  // },
];
