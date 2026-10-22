// A path: a strip of bare, pebbled earth worn between two places on the
// ball. There is nothing to draw — the ground IS the path; what makes it
// one is that the grass is kept off it and the pebbles lie in it, the way
// they do round a station (see GROUND_COVER and pathClearing).
//
//   width   how wide the bare strip is, in world units
//   wobble  how it wanders off the straight line between its ends, so it
//           reads as walked rather than ruled: `amount` is how far it
//           strays either side, in world units, and `turns` how many times
//           it crosses back over the line on the way. 0 is dead straight
//   ragged  how much the edge frays, as a share of the width — the strip
//           is widened and narrowed along its length by up to this much,
//           so the grass comes up to it unevenly. 0 is a clean edge
//   step    how far apart the strip is sampled along its length, in world
//           units — finer resolves the wobble better and costs more to
//           test each plant against
//   seed    which wander and fray this path gets
export const PATH = {
  width: 2.6,
  wobble: { amount: 1.4, turns: 1.5 },
  ragged: 0.25,
  step: 0.8,
  seed: 20260913,
};
