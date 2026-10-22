import { solid } from "../../world/palette.js";

// The teapot's own paints: a red pot with a cream lid, the knob in the
// pot's red again so the lid reads as a lid.
const paint = {
  body: solid("#E5534B"),
  lid: solid("#F2E9DC"),
};

// A teapot: a round-bellied pot standing on the ground, its spout out to
// the right (+x) and its handle to the left, so seen from the front (+z)
// it pours sideways, the way one sits on a shelf. Every length below is
// a share of `size`, which is how tall the pot stands to the lid's rim;
// the lid and knob stand on top of that.
//
//   body   turned on a lathe: `foot` the radius it stands on, `belly`
//          its widest radius (a bigger belly, a rounder pot), `neck` the
//          radius of the opening the lid sits in, `tall` stretching the
//          body's height (1 as made; a tall pot is narrow for its height)
//   lid    a shallow dome `height` high, its brim `lip` wider than the
//          neck so it rests on the rim, and a round `knob` on top
//   spout  a tube `radius` thick, leaving the belly on the right and
//          rising to pour, `length` how far it reaches (1 as made)
//   handle a loop of tube `radius` thick on the left, out `reach` from
//          the body
//   colors `body` (the pot, spout and handle, and the lid's knob), `lid`
export const TEAPOT = {
  size: 0.65,
  sides: 20,
  body: { foot: 0.3, belly: 0.5, neck: 0.26, tall: 1 },
  lid: { height: 0.14, lip: 0.06, knob: 0.07 },
  spout: { radius: 0.055, length: 1 },
  handle: { radius: 0.055, reach: 0.24 },
  colors: {
    body: paint.body,
    lid: paint.lid,
  },
};

// What can be changed on a teapot, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const TEAPOT_KNOBS = [
  { label: "size", path: "size", step: 0.05, min: 0.2, max: 2 },
  { label: "belly", path: "body.belly", step: 0.05, min: 0.3, max: 0.8 },
  { label: "tall", path: "body.tall", step: 0.1, min: 0.6, max: 2 },
  { label: "spout", path: "spout.length", step: 0.1, min: 0.4, max: 2 },
  { label: "body", path: "colors.body.hex", color: true },
  { label: "lid", path: "colors.lid.hex", color: true },
];
