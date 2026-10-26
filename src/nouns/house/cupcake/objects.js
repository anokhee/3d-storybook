import { PALETTE, solid } from "../../../world/palette.js";
import { merge } from "../../../world/merge.js";
import { TOPPER_KINDS } from "./toppers.js";
import { PRIMITIVES } from "../../primitive/objects.js";
import { FLOWER_TYPES } from "../../flower/objects.js";
import { STAR_TYPES } from "../../starPolygon/objects.js";
import { DWELLING, CAT_HEIGHT, windowShapeKnobs } from "../objects.js";

// A cupcake house: a pleated paper case standing on the ground, the cake
// swelling over its rim, frosting swirled up on top in tiers, a topper on
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
//            down into the one below — the first `stack` of them (1 to 3)
//            standing; `detail` and `clay` as the cake's;
//            `color`
//   syrup    a drizzle ringing each tier of frosting, winding up and down
//            round it in a rounded zigzag: `waves` how many crests go
//            round, `lat` degrees up the tier its middle runs (kept clear
//            of the tier above), `amp` degrees it swings either side of
//            that, `radius` how thick the ribbon is, `color`; or null for
//            none
//   topper   on the very top: `kind` one of TOPPERS (see toppers.js) — a
//            cherry, strawberry, peppermint, a number or a jack-in-the-box's head — or "none"; `size` how big it is,
//            as a multiple of the cupcake's units; `sink` how far its
//            foot goes down into the frosting (null for its kind's own); `tilt` degrees it leans toward the front, about its foot; `flip` stands it upside down, its foot up;
//            `config` overrides on the topper's own settings
//   straws   sticks stuck in the frosting in a ring round the topper:
//            `kind` "straws" (chocolate ones, see CHOCOLATE_STRAW), "candles"
//            (thin upright striped ones, each with a flickering flame and a point
//            light of its own, see CANDLE) or "none"; `ring`
//            how far from the middle they stand, `count` of them (at most MAX_STICKS), `size`
//            as a multiple of the cupcake's units, `config` overrides on
//            the straws' own settings
//   boxes    a window box on the ground under each window, against the
//            wall: `on` whether there are any, `height` and `depth`,
//            `overhang` how far it reaches past the window each side,
//            `color`, `soil`; `flowers` planted in it — `count`, `shape`
//            (any flower, see Ornament), `radius`, `stem` how long, its
//            `stemColor`, and `colors` taken in turn — or null
//   mat      a doormat on the ground at the door: `on`, `width`, `depth`,
//            `gap` how far it sits out from the wall, `thick`, `inset` the width of its border, `color` and `border`
//   sprinkles  over the frosting: `count` of them, each an ornament (see
//            Ornament) of `shape` — any primitive, flower or star — and
//            `radius`, a cylinder one a rod `length` long laid flat, any
//            other stood on the frosting, where a `seed`ed roll puts it, from `lat` degrees up the
//            tier at the lowest to 90 at its crown, in `colors` taken in
//            turn; or null for none
//   windows  the two arched ones, one each side of the door, each on a
//            flat of the case — the pleats it straddles pressed into one,
//            as the door's are — built as the door is (see
//            MUSHROOM_HOUSE.door) — `width`, `height` and `depth`, `y` how
//            high its middle is off the ground, `apart` how far each
//            stands from the middle, across, `columns` and `rows` of
//            panes — with no knob
//   door     the arched one on the front, its foot on the ground, as a
//            mushroom house's (see MUSHROOM_HOUSE.door)
export const CUPCAKE = merge(DWELLING, {
  scale: CAT_HEIGHT / 2,
  cup: {
    radius: 3.2,
    foot: 0.76,
    height: 3.6,
    flutes: 30,
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
    stack: 3,
    overlap: 0.45,
    detail: 2,
    clay: { amount: 0.35, seed: 43 },
    color: PALETTE.cupcake.frosting,
  },
  syrup: {
    waves: 9,
    lat: 30,
    amp: 10,
    radius: 0.06,
    color: solid("#7A4A2E"),
  },
  topper: { kind: "cherry", size: 1, sink: null, tilt: 0, flip: false, config: {} },
  straws: {
    kind: "none",
    ring: 1.3,
    count: 6,
    size: 1,
    config: { length: 1.8, lean: 16 },
  },
  boxes: {
    on: true,
    height: 0.55,
    depth: 0.5,
    overhang: 0.25,
    color: solid("#A8744F"),
    soil: solid("#4A3322"),
    flowers: {
      count: 4,
      shape: "daisy",
      radius: 0.17,
      stem: 0.3,
      stemColor: solid("#6B8E3D"),
      colors: PALETTE.cupcake.sprinkles,
    },
  },
  mat: {
    on: true,
    width: 2,
    depth: 1,
    gap: 0.2,
    thick: 0.07,
    inset: 0.14,
    color: solid("#B84A5A"),
    border: solid("#F3E3C8"),
  },
  sprinkles: {
    count: 28,
    shape: "cylinder",
    radius: 0.08,
    length: 0.45,
    seed: 7,
    lat: 15,
    colors: PALETTE.cupcake.sprinkles,
  },
  windows: {
    type: "arched",
    columns: 2,
    rows: 3,
    width: 0.9,
    height: 1.5,
    y: 2.3,
    apart: 1.7,
    depth: 0.12,
    detail: 1.5,
    clay: null,
    frame: { thickness: 0.12, depth: 0.2, color: PALETTE.cupcake.frame },
    knob: null,
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
    window: { width: 0.9, height: 1.5, y: 2.3 },
  },
});

// No cupcake carries more sticks than this, of any kind: each candle is a
// point light of its own.
export const MAX_STICKS = 6;

// What turns the straws into candles: thin and upright, striped in wax
// colors, a flame on each tip (`flame` is its radius, in the straw's units,
// drawn like the campfire's: a lit outer flame round a paler core, flickering),
// and over it a point light (`glow`: `intensity` in candela, `distance` how
// far it reaches, in the world's units, `color`).
export const CANDLE = {
  length: 1.5,
  lean: 0,
  radius: 0.09,
  wall: 0.09,
  stripes: 6,
  color: solid("#FFD166"),
  stripe: solid("#F26D8D"),
  flame: 0.16,
  flameColor: solid("#FF9A3C"),
  flameCore: solid("#FFE08A"),
  glow: { intensity: 2.5, distance: 7, color: solid("#FFB060") },
};

// Every shape an ornament can be, for the sprinkles' pick list.
const SPRINKLE_SHAPES = [
  ...Object.keys(PRIMITIVES),
  ...Object.keys(FLOWER_TYPES),
  ...Object.keys(STAR_TYPES),
];

// What can be changed on the cupcake house, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const CUPCAKE_KNOBS = [
  { label: "cup radius", path: "cup.radius", step: 0.2, min: 1 },
  { label: "cup height", path: "cup.height", step: 0.2, min: 1 },
  { label: "flutes", path: "cup.flutes", step: 1, min: 3, max: 40 },
  { label: "cake", path: "cake.radius", step: 0.05, min: 0.5 },
  { label: "topper", path: "topper.kind", options: TOPPER_KINDS },
  { label: "topper tilt", path: "topper.tilt", step: 1, min: -60, max: 60 },
  { label: "topper size", path: "topper.size", step: 0.1, min: 0.4, max: 2.5 },
  { label: "sticks", path: "straws.kind", options: ["none", "straws", "candles"] },
  {
    label: "stick ring radius",
    path: "straws.ring",
    step: 0.05,
    min: 0,
    max: 3,
  },
  { label: "stick count", path: "straws.count", step: 1, min: 1, max: MAX_STICKS },
  { label: "window boxes", path: "boxes.on", bool: true, on: true, off: false },
  { label: "box height", path: "boxes.height", step: 0.05, min: 0.2, max: 1.5 },
  {
    label: "box flowers",
    path: "boxes.flowers.count",
    step: 1,
    min: 0,
    max: 8,
  },
  { label: "doormat", path: "mat.on", bool: true, on: true, off: false },
  { label: "icing stack", path: "frosting.stack", step: 1, min: 1, max: 3 },
  { label: "syrup color", path: "syrup.color.hex", color: true },
  { label: "syrup waves", path: "syrup.waves", step: 1, min: 2, max: 24 },
  { label: "syrup swing", path: "syrup.amp", step: 1, min: 0, max: 25 },
  {
    label: "syrup thickness",
    path: "syrup.radius",
    step: 0.01,
    min: 0.02,
    max: 0.15,
  },
  {
    label: "sprinkle shape",
    path: "sprinkles.shape",
    options: SPRINKLE_SHAPES,
  },
  {
    label: "sprinkle size",
    path: "sprinkles.radius",
    step: 0.01,
    min: 0.02,
    max: 0.4,
  },
  {
    label: "sprinkle count",
    path: "sprinkles.count",
    step: 1,
    min: 0,
    max: 80,
  },
  { label: "door width", path: "door.width", step: 0.1, min: 0.5 },
  ...windowShapeKnobs(),
];
