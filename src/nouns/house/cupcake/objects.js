import { PALETTE } from "../../../world/palette.js";
import { merge } from "../../../world/merge.js";
import { DWELLING } from "../objects.js";

// A cupcake house: a pleated paper case standing on the ground, the cake
// swelling over its rim, frosting swirled up on top in tiers, a cherry on
// the very top and sprinkles over the frosting, with an arched door and two
// round windows set into the case's front. It stands with its front
// facing +z, like a bench, and is a house (see ../objects.js, DWELLING):
// its door can be gone in at, and `interior` is DWELLING's. Colors come
// from PALETTE (src/world/palette.js).
//
//   cup      the paper case: `radius` at the rim, `foot` the bottom's
//            radius as a share of that, `height` from the ground to the
//            rim, `flutes` how many pleats go round it, `pleat` how deep
//            each is as a share of the radius, `sink` how far the foot
//            settles into the ground, `color` its own
//   cake     the dome over the rim: the top half of a sphere of `radius`
//            (a share of the cup's — over 1 and it swells past the rim),
//            pressed down to `squash` of its height, `detail` and `clay`
//            as any primitive's (see FORM, CLAY), `base` how thick the
//            disc closing its underside is, `color` its own
//   frosting the swirl: `tiers` stacked up from the cake's crown, each a
//            sphere of `radius` (a share of the cup's) pressed to `tall`
//            of its height, each sat `overlap` of its own half-height
//            down into the one below; `detail` and `clay` as the cake's;
//            `color`
//   cherry   on top: `radius`, `sink` how far it sits down into the
//            frosting as a share of its radius, `color`; `stem` the stalk
//            — `radius`, `height`, `lean` degrees off upright, `color` —
//            or null; or null for no cherry
//   sprinkles  over the frosting: `count` of them, each a little rod
//            `radius` thick and `length` long, laid flat on the frosting
//            where a `seed`ed roll puts it, from `lat` degrees up the
//            tier at the lowest to 90 at its crown, in `colors` taken in
//            turn; or null for none
//   windows  the two round panes, one each side of the door, as a
//            mushroom house's (see MUSHROOM_HOUSE.windows): `apart` how
//            far round the case each stands from the front, in degrees
//   door     the arched one on the front, its foot on the ground, as a
//            mushroom house's (see MUSHROOM_HOUSE.door)
export const CUPCAKE = merge(DWELLING, {
  cup: {
    radius: 3.2,
    foot: 0.76,
    height: 3.6,
    flutes: 14,
    pleat: 0.06,
    sink: 0.1,
    color: PALETTE.cupcake.cup,
  },
  cake: {
    radius: 1.1,
    squash: 0.4,
    detail: 2,
    clay: { amount: 0.3, seed: 41 },
    base: 0.3,
    color: PALETTE.cupcake.cake,
  },
  frosting: {
    tiers: [
      { radius: 0.9, tall: 0.5 },
      { radius: 0.66, tall: 0.5 },
      { radius: 0.42, tall: 0.55 },
    ],
    overlap: 0.45,
    detail: 2,
    clay: { amount: 0.35, seed: 43 },
    color: PALETTE.cupcake.frosting,
  },
  cherry: {
    radius: 0.5,
    sink: 0.35,
    color: PALETTE.cupcake.cherry,
    stem: { radius: 0.05, height: 0.8, lean: 20, color: PALETTE.cupcake.stem },
  },
  sprinkles: {
    count: 28,
    radius: 0.08,
    length: 0.45,
    seed: 7,
    lat: 15,
    colors: PALETTE.cupcake.sprinkles,
  },
  windows: {
    radius: 0.5,
    depth: 0.12,
    y: 2.3,
    apart: 46,
    detail: 1.5,
    clay: null,
    frame: { thickness: 0.14, depth: 0.2, color: PALETTE.cupcake.frame },
    light: { type: "lit", brightness: 0.35 },
    color: PALETTE.cupcake.pane,
  },
  door: {
    width: 1.5,
    height: 2,
    depth: 0.16,
    detail: 1.5,
    clay: null,
    frame: { thickness: 0.14, depth: 0.1, color: PALETTE.cupcake.frame },
    knob: { radius: 0.11, side: 0.55, color: PALETTE.cupcake.knob },
    color: PALETTE.cupcake.door,
  },
  // The doors inside arched like the one on the case, and the windows as
  // round as its.
  interior: {
    door: { curve: 1 },
    front: { curve: 1 },
    window: { width: 1, height: 1, y: 2.3, topCurve: 1, bottomCurve: 1 },
  },
});

// What can be changed on the cupcake house, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const CUPCAKE_KNOBS = [
  { label: "cup radius", path: "cup.radius", step: 0.2, min: 1 },
  { label: "cup height", path: "cup.height", step: 0.2, min: 1 },
  { label: "flutes", path: "cup.flutes", step: 1, min: 3, max: 40 },
  { label: "cake", path: "cake.radius", step: 0.05, min: 0.5 },
  { label: "door width", path: "door.width", step: 0.1, min: 0.5 },
  { label: "door height", path: "door.height", step: 0.1, min: 1 },
];
