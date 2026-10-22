import { solid } from "../../world/palette.js";

// The campfire's own swatches: stone in three greys so the ring is not
// one flat band, bark for the logs, and the fire in three tiers from a
// yellow core out through orange to a red skirt, with embers hotter
// still.
const paint = {
  stone: solid("#9A98A8"),
  stoneDark: solid("#7E7C8C"),
  stoneLight: solid("#B8B5C0"),
  log: solid("#8B5A3C"),
  flame: solid("#F4D46A"),
  flameMid: solid("#F08A3C"),
  flameTip: solid("#E5534B"),
  ember: solid("#FF8C3A"),
  glow: solid("#FFB060"),
};

// A campfire: a ring of stones on the ground, logs leant together in a
// teepee inside it, and the fire itself standing up out of the logs, lit
// so it shows at night, with a warm point of light over it for the
// ground round about. The flames flicker on their own; `flicker` 0 holds
// them still. It sits on the ground with the ring's middle at the origin.
//
//   ring    the stones: `radius` out to their middles, `stones` how many,
//           `size` the radius of one — each is a lumpy dodecahedron,
//           pressed a little flat, turned and sized a hair differently
//           by its place in the ring
//   logs    the wood: `count` leant together, `length` of one, `radius`
//           of its round, `lean` degrees up from the ground, `foot` how
//           far out from the middle each one's bottom end rests
//   flames  the fire: `height` of the tallest, the core; the others are
//           shares of it, set in `tiers` below (`height` and `width` as
//           shares of the core's height, `at` where it leans off centre,
//           `tier` which colour it burns). `flicker` 0..1 how much they
//           wobble and the light with them, `rate` beats a second
//   embers  the coals at the foot: `count`, `radius` of one, `spread` how
//           far out from the middle they lie
//   glow    the point light over the logs: `intensity` in candela,
//           `distance` how far it reaches, `color`
//   colors  `stone` (`stoneDark` and `stoneLight` follow it round the
//           ring), `log`, the three fire tiers `flame`, `flameMid`,
//           `flameTip`, and `ember`
export const CAMPFIRE = {
  ring: { radius: 1.5, stones: 8, size: 0.34 },
  logs: { count: 4, length: 1.9, radius: 0.15, lean: 58, foot: 0.75 },
  flames: {
    height: 1.7,
    flicker: 1,
    rate: 9,
    tiers: [
      { height: 1, width: 0.26, at: [0, 0], tier: "flame" },
      { height: 0.8, width: 0.3, at: [0.22, 0.1], tier: "flameMid" },
      { height: 0.72, width: 0.3, at: [-0.2, -0.14], tier: "flameMid" },
      { height: 0.55, width: 0.42, at: [0.04, 0.16], tier: "flameTip" },
    ],
  },
  embers: { count: 6, radius: 0.08, spread: 0.45 },
  glow: { intensity: 22, distance: 14, color: paint.glow },
  colors: {
    stone: paint.stone,
    stoneDark: paint.stoneDark,
    stoneLight: paint.stoneLight,
    log: paint.log,
    flame: paint.flame,
    flameMid: paint.flameMid,
    flameTip: paint.flameTip,
    ember: paint.ember,
  },
};

// What can be changed on a campfire, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const CAMPFIRE_KNOBS = [
  { label: "radius", path: "ring.radius", step: 0.1, min: 0.8, max: 3 },
  { label: "flame height", path: "flames.height", step: 0.1, min: 0.1, max: 4 },
  { label: "flicker", path: "flames.flicker", step: 0.05, min: 0, max: 1 },
  { label: "stones", path: "ring.stones", step: 1, min: 4, max: 16 },
  { label: "flame colour", path: "colors.flame.hex", color: true },
  { label: "log colour", path: "colors.log.hex", color: true },
  { label: "stone colour", path: "colors.stone.hex", color: true },
];
