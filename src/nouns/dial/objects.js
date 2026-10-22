import { PALETTE } from "../../world/palette.js";

// A coin dial: a squat clay cylinder stood face out on a disc of color,
// with a bar across its face to turn it by. Whoever seats it on a face says
// where; this is only what it looks like. Everything on it is sized off its
// radius. Colors come from PALETTE.
//
//   radius   the dial's own
//   depth    how far it stands out from its decal
//   detail   its facet count
//   stand    how far off the face the whole dial floats, so the clay lumps
//            of what it is stuck to do not poke through the decal
//   clay     the dial's and handle's lumps (see CLAY), or null for smooth.
//            The decal is paint, and stays flat
//   color    its own
//   decal    the thin plate under it, a flat disc laid on the face —
//            `padding` its radius as a multiple of the dial's (1 is the
//            same size, hidden under the dial), `depth` how thick it is,
//            `lift` how far it stands off the face so the two never fight
//            over the same pixels, `color` its own
//   handle   the slim cylinder lying across the dial's face through its
//            center — `size` its thickness and `length` its reach, both as
//            multiples of the dial's radius, `turn` radians it is turned in
//            the dial's face from level, `color` its own or null for the
//            dial's
export const DIAL = {
  radius: 0.5,
  depth: 0.14,
  detail: 24,
  stand: 0.15,
  clay: { amount: 0.4, seed: 11 },
  color: PALETTE.dial.face,
  decal: {
    padding: 1.2,
    depth: 0.14,
    lift: 0.01,
    color: PALETTE.dial.decal,
  },
  handle: {
    size: 0.25,
    length: 1.6,
    turn: Math.PI / 6,
    color: null,
  },
};
