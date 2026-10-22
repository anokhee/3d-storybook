import { solid } from "../../world/palette.js";

// The kite's own swatches: the sail in a violet and a yellow, one each
// side of its spine, wooden spars, a red tail, a plum line and a wooden
// peg to tie it to.
const paint = {
  sailA: solid("#7c56be"),
  sailB: solid("#F4D46A"),
  spar: solid("#E8C39E"),
  tail: solid("#E5534B"),
  line: solid("#3B2A4E"),
  peg: solid("#A8693D"),
};

// A kite, flying: a diamond sail up and back (-z) at the end of its line,
// facing the peg (+z) and leant back into the wind, the spine and the
// cross spar behind it, a bow tail hanging off its bottom corner and
// trailing downwind (further -z), and the line running from its bridle
// down to a peg in the ground at the origin, which is what stands on the
// ground. It bobs and the tail ripples on its
// own; `wind` 0 holds it still.
//
//   height   how high the sail's middle flies off the ground
//   forward  how far back (-z) of the peg it flies, as a share of its
//            height
//   sail     `size` across the diamond at its spar, `tilt` degrees leant
//            back from upright, `above` and `below` the spar as shares of
//            the size (the diamond is taller than it is wide), `depth`
//            the cloth's thickness
//   spars    the rods behind the sail: `radius`; `bridle` how far forward
//            of the sail the line ties on
//   tail     `length` of the string, `segments` it hangs in, `radius`,
//            `bows` how many bow ties along it, `bow` the width of one,
//            `sag` how far it hangs down for every unit it trails back,
//            in the sail's own leant-back frame, so it drops more than
//            this in the world
//   line     `radius`
//   peg      the stake in the ground: `radius`, `height`
//   wind     0..1 how much it bobs, leans and ripples; `rate` how fast
//   colors   `sailA` and `sailB` either side of the spine, `spar`,
//            `tail`, `line`, `peg`
export const KITE = {
  height: 7,
  forward: 0.55,
  sail: { size: 2.4, tilt: 30, above: 0.42, below: 0.72, depth: 0.03 },
  spars: { radius: 0.035, bridle: 0.5 },
  tail: { length: 3.2, segments: 14, radius: 0.02, bows: 5, bow: 0.42, sag: 0.35 },
  line: { radius: 0.02 },
  peg: { radius: 0.1, height: 0.5 },
  wind: 0.6,
  rate: 1,
  colors: {
    sailA: paint.sailA,
    sailB: paint.sailB,
    spar: paint.spar,
    tail: paint.tail,
    line: paint.line,
    peg: paint.peg,
  },
};

// What can be changed on a kite, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const KITE_KNOBS = [
  { label: "height", path: "height", step: 0.5, min: 2, max: 14 },
  { label: "size", path: "sail.size", step: 0.1, min: 0.8, max: 5 },
  { label: "wind", path: "wind", step: 0.05, min: 0, max: 1 },
  { label: "sail a", path: "colors.sailA.hex", color: true },
  { label: "sail b", path: "colors.sailB.hex", color: true },
  { label: "tail", path: "colors.tail.hex", color: true },
];
