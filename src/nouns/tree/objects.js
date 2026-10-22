import { PALETTE } from "../../world/palette.js";
import { TREE_PALETTES } from "./palettes.js";

// A tree: a clay trunk with, on top of it, a canopy — by `kind`,
// "deciduous", a few lobes of leaf-green clay bunched on the trunk;
// "flowering", the same in bloom, flower heads (see ../flower) laid all
// over the lobes; "conifer", tiers of cone stacked up it, each smaller than the
// last; or "dead", no canopy at all, a bare trunk with a few branches
// flung out of it. Colors come from PALETTE (src/world/palette.js). Trees grow wild
// as a ground cover layer (see ../groundCover/objects.js) and stand in a
// lot as a noun (see ../station/Station.jsx), the same tree either way.
//
//   kind       which of the four
//   trunk      `radius` at the foot, `taper` the crown's radius as a share
//              of it, `height` foot to crown in world units, `sides` its
//              facets, `clay` how lumpy (see CLAY), `color` its bark —
//              the live trees'; a dead tree's is `deadColor`
//   sink       how far the foot is set into the ground
//   deciduous  the canopy: `lobes` clay balls, the first `radius` big
//              sat on the trunk's crown, the rest smaller by `shrink`
//              and pushed out `spread` of the radius round it and down
//              `drop` of it, `clay` as the trunk's, `color` the leaves —
//              a flowering tree's canopy too
//   blooms     a flowering tree's blossoms: `count` on each lobe, each a
//              flower head of `type` (see FLOWER_TYPES) `radius` big, its
//              `shape` over the type's — the petals pitched up, so each
//              bells out the way it faces rather than lying flat on the
//              lobe — its petals and its middle both in `color`, a blossom
//              rather than a daisy in the grass — laid on the lobe's skin
//              facing out, pressed `sink` of its radius into it, scattered
//              over it from `above` (-1 the underside, 1 the crown) up,
//              `seed` for the scatter
//   conifer    the canopy: `tiers` cones up the trunk, the lowest `radius`
//              wide and `height` tall with its base `from` of the way up
//              the trunk, each above `step` the size of the one below
//              and overlapping it by `overlap` of its height, `clay` as
//              the trunk's, `color` the needles
//   dead       the branches: `count` of them, each `length` long and
//              `radius` thick at the trunk, thrown `rise` degrees up from
//              level, the lowest `from` of the way up the trunk and the
//              rest spaced `spacing` of the height apart, turned round it
//              by `turn` degrees each
export const TREE = {
  kind: "deciduous",
  trunk: {
    radius: 1,
    taper: 0.55,
    height: 10.2,
    sides: 4,
    clay: { amount: 0.35, seed: 31 },
    color: PALETTE.tree.bark,
    deadColor: TREE_PALETTES.bare[0],
  },
  sink: 0.15,
  deciduous: {
    lobes: 3,
    radius: 5.7,
    shrink: 0.7,
    spread: 0.75,
    drop: 0.35,
    clay: { amount: 0.5, seed: 32 },
    color: TREE_PALETTES.leaves[0],
  },
  blooms: {
    type: "daisy",
    shape: { petalPitch: 40 },
    count: 10,
    radius: 0.55,
    sink: 0.1,
    above: -0.15,
    seed: 34,
    color: PALETTE.white,
  },
  conifer: {
    tiers: 3,
    radius: 5.5,
    height: 6.7,
    from: 0.3,
    step: 0.78,
    overlap: 0.45,
    clay: { amount: 0.4, seed: 33 },
    color: TREE_PALETTES.needles[0],
  },
  dead: {
    count: 4,
    length: 1.4,
    radius: 0.11,
    rise: 35,
    from: 0.45,
    spacing: 0.16,
    turn: 140,
  },
};
export const TREE_KINDS = ["deciduous", "flowering", "conifer", "dead"];

// The knobs the catalog shows for a tree (stories/helpers/knobs.js). The
// leaf color and the canopy's radius write to the deciduous and the
// conifer settings both, so one knob serves every kind.
export const TREE_KNOBS = {
  barkColor: { path: "trunk.color", color: "block", name: "bark color" },
  leafColor: { path: ["deciduous.color", "conifer.color"], color: "block", name: "leaf color" },
  trunkHeight: { path: "trunk.height", range: [2, 20, 0.2] },
  canopyRadius: { path: ["deciduous.radius", "conifer.radius"], range: [1, 10, 0.1] },
  lobes: { path: "deciduous.lobes", range: [1, 6, 1] },
  tiers: { path: "conifer.tiers", range: [1, 6, 1] },
  blooms: { path: "blooms.count", range: [0, 40, 1] },
};
