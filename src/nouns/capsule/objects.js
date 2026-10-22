import { PALETTE } from "../../world/palette.js";

// The capsule the doll arrives in: a ball of clay sat on the ground, cut
// round its middle into a lid and a base. Shut, it is one ball; hatched,
// the lid swings up off the back of its rim and the doll is stood in the
// base. It is colored like the doll inside it — the lid its skin, the
// base its limbs (see game/store.js `hatchling`); the PALETTE colors here
// (src/world/palette.js) are what it wears until that doll is dealt.
//
//   radius  the ball's, across its middle
//   tall    how much taller than round it is — a sphere's `form.tall` (see
//           FORM), so 1 is a ball and 1.3 an egg
//   detail  its facet count as a multiple of a sphere's (see PRIMITIVES)
//   clay    thrown in lumpy clay like a doll (see CLAY), or null for smooth
//   sink    how far the base is set into the ground
//   lid     the top half: `color` until the doll is dealt, and how it
//           opens —
//             `lift`  how far straight up it rises, in world units
//             `tilt`  degrees it swings back, hinged at the back of its rim
//             `rate`  the e-folding rate it eases open at, per second
//   base    the bottom half: `color` until the doll is dealt
//   gone    how the egg goes once the doll is out —
//             `after`  how far open the lid is, 0 to 1, when it starts
//             `rate`   the e-folding rate it shrinks away at, per second
export const CAPSULE = {
  radius: 0.6,
  tall: 1,
  detail: 2,
  clay: { amount: 0.3, seed: 21 },
  sink: 0.25,
  lid: {
    color: PALETTE.capsule.lid,
    lift: 0.6,
    tilt: 75,
    rate: 4,
  },
  base: {
    color: PALETTE.capsule.base,
  },
  gone: {
    after: 1.2,
    rate: 3,
  },
  // The hop a knock gives it: how fast it leaves the ground, in world
  // units per second, by which knock of the run it is (the last is the
  // hatch, and the doll's jump is that one's); the gravity that brings
  // it back down, and how much of the fall it keeps as a second, smaller
  // hop. See Capsule.jsx.
  // The left-click prompt floating over it (see KnockHint.jsx): how far
  // above the ball's center, in world units; its size in px and color;
  // and how long after a knock, in ms, it comes back if nothing follows.
  hint: {
    above: 2.6,
    size: 30,
    color: "#fff4d6",
    after: 4000,
  },
  // Hovered, while it can still be knocked on, it glows a little in its
  // own colors: `glow` is how much, as emissive intensity, and `rate`
  // how fast it comes up and fades.
  hover: {
    glow: 0.35,
    rate: 8,
  },
  knock: {
    // How far from the ball's center a click still counts as a knock, in
    // world units — a hit area round it, wider than the ball itself.
    reach: 2.4,
    hop: [4.2, 8.4],
    gravity: 28,
    bounce: 0.3,
  },
};
