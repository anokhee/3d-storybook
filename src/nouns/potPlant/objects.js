import { PALETTE } from "../../world/palette.js";

// A pot plant: a pot with soil in it and stems growing up out of it,
// each tipped with what the plant is — a lumpy ball of leaves, a bush,
// a single leaf blade like the ones on the claybabies' heads (see
// LEAF_GEO in src/parts/antennae.js), or a flower (see FLOWER_TYPES in
// ../flower/objects.js: a daisy, a tulip, a poppy). It stands on the ground with its pot's middle at the
// origin, and on a table stands on its top (see `surface` in
// ../station/Station.jsx). Colors come from PALETTE (src/world/palette.js).
//
//   pot    the pot: `radius` at its rim, `flare` how wide its foot is as a
//          share of that (1 straight, less tapered), `height`, `detail`
//          and `clay` as any primitive's, `color`
//   soil   the soil in it: `depth` how far below the rim it lies, `color`
//   stems  the stems: `count` of them, fanned out evenly round the pot,
//          each `radius` thick and `height` tall, its tip leaning out
//          `spread` of the pot's radius from its middle; `color`; and
//          `leaves` blades up each one (0 none), `leafSize` times the
//          plant's `size`, turned in turn round the stem and up from it
//   plant  what tips each stem: `kind` — "bush" for a ball of leaves,
//          "leaf" for a blade, or a flower's name — `size` its radius
//          (a blade's half-width), `clay` a bush's lumps, `leaf` a
//          blade's shape — `aspect` how long it is in half-widths,
//          `flat` how thick, as a share of its half-width — `color`
export const POT_PLANT = {
  pot: {
    radius: 0.55,
    flare: 0.75,
    height: 0.7,
    detail: 1,
    clay: { amount: 0.2, seed: 61 },
    color: PALETTE.potPlant.pot,
  },
  soil: { depth: 0.08, color: PALETTE.potPlant.soil },
  stems: {
    count: 3,
    radius: 0.045,
    height: 0.9,
    spread: 0.5,
    color: PALETTE.potPlant.stem,
    leaves: 0,
    leafSize: 0.8,
  },
  plant: {
    kind: "bush",
    size: 0.35,
    clay: { amount: 0.5, seed: 62 },
    leaf: { aspect: 2.3, flat: 0.25 },
    color: PALETTE.potPlant.leaves,
  },
};
export const PLANT_KINDS = ["bush", "leaf", "daisy", "tulip", "poppy"];

// A TALL POT PLANT, laid over POT_PLANT: a floor plant, as tall as a
// person and more — a tall straight pot, a few long stems standing
// near upright, blades all the way up them and one on each tip (a
// rubber plant, a fiddle-leaf fig)
export const POT_PLANT_TALL = {
  pot: { radius: 0.45, flare: 0.85, height: 1.15 },
  stems: { count: 5, radius: 0.04, height: 2.5, spread: 1.3, leaves: 5, leafSize: 1.15 },
  plant: { kind: "leaf", size: 0.32, leaf: { aspect: 2.1, flat: 0.25 } },
};

// The knobs the catalog shows for a pot plant (stories/helpers/knobs.js)
export const POT_PLANT_KNOBS = {
  potColor: { path: "pot.color", color: true, name: "pot color" },
  potRadius: { path: "pot.radius", range: [0.2, 2, 0.05], name: "pot radius" },
  potHeight: { path: "pot.height", range: [0.2, 2.5, 0.05], name: "pot height" },
  potFlare: { path: "pot.flare", range: [0.3, 1.5, 0.05], name: "pot flare (base vs rim)" },
  soilColor: { path: "soil.color", color: true, name: "soil color" },
  stemCount: { path: "stems.count", range: [1, 9, 1], name: "stems" },
  stemHeight: { path: "stems.height", range: [0.1, 3, 0.05], name: "stem height" },
  stemSpread: { path: "stems.spread", range: [0, 2, 0.05], name: "stem spread" },
  stemColor: { path: "stems.color", color: true, name: "stem color" },
  stemLeaves: { path: "stems.leaves", range: [0, 10, 1], name: "leaves up each stem" },
  stemLeafSize: { path: "stems.leafSize", range: [0.2, 2, 0.05], name: "those leaves' size (of the plant's)" },
  plantSize: { path: "plant.size", range: [0.1, 1.5, 0.05], name: "plant size" },
  plantColor: { path: "plant.color", color: true, name: "plant color" },
  leafAspect: { path: "plant.leaf.aspect", range: [0.5, 5, 0.1], name: "leaf length" },
  leafFlat: { path: "plant.leaf.flat", range: [0.05, 1, 0.05], name: "leaf flat" },
};
