import { solid } from "../../world/palette.js";

// The bird's and perch's own colours: a candy-red songbird with a cream
// belly and a yellow beak, on a warm wooden perch, with bead eyes and
// thin legs in dark plum.
const paint = {
  body: solid("#E5534B"),
  belly: solid("#F2E9DC"),
  beak: solid("#F4D46A"),
  perch: solid("#C9956B"),
  eye: solid("#2B2230"),
  leg: solid("#3B2A4E"),
};

// What the bird can stand on: a parrot stand (a round base, a post and a
// crossbar), or a stub of branch angled up off a little mound.
export const PERCHES = ["stand", "branch"];

// A bird on a perch: a small songbird gripping the bar of a stand, the
// whole standing on the ground facing +z. The perch is `height` tall at
// the bar; the bird is about 0.6 tall at `bird.size` 1.
//
//   height  of the perch: where the bird's feet are
//   perch   one of PERCHES, see above
//   tilt    the head cocked to one side, -1 to 1, 0 straight
//   look    how much it looks about: now and then the head turns to one
//           side and back, 0 holds still
//   stand   the parrot stand: `base` the round foot's radius and `plinth`
//           its thickness, `post` the upright's radius, `bar` the
//           crossbar's radius and `reach` its length across
//   branch  the branch: `mound` the little hill's radius and `rise` how
//           tall it is, `radius` the branch's at its root, `lean` how far
//           off upright it leans (radians), `twig` a side shoot's length
//   bird    `size` scales the bird alone; `body` the plump ball's radius,
//           `pitch` how far it leans forward; `head` its radius; `beak`
//           the cone's radius and `length`; `eye` the beads' radius;
//           `wing` the flattened ellipsoids' radius; `tail` its `length`
//           and `width` at the tip, angled `droop` down; `leg` the thin
//           legs' radius and `length`
//   colors  `body`, `belly`, `beak`, `perch`, `eye`, `leg`
export const PERCHED_BIRD = {
  height: 2.5,
  perch: "stand",
  tilt: 0,
  look: 1,
  stand: { base: 0.55, plinth: 0.1, post: 0.06, bar: 0.05, reach: 1.2 },
  branch: { mound: 0.5, rise: 0.22, radius: 0.08, lean: 0.45, twig: 0.45 },
  bird: {
    size: 1,
    body: 0.2,
    pitch: 0.35,
    head: 0.16,
    beak: { radius: 0.045, length: 0.13 },
    eye: 0.03,
    wing: 0.15,
    tail: { length: 0.3, width: 0.18, droop: 0.6 },
    leg: { radius: 0.016, length: 0.13 },
  },
  colors: {
    body: paint.body,
    belly: paint.belly,
    beak: paint.beak,
    perch: paint.perch,
    eye: paint.eye,
    leg: paint.leg,
  },
};

// What can be changed on a bird on a perch, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const PERCHED_BIRD_KNOBS = [
  { label: "height", path: "height", step: 0.1, min: 0.5, max: 5 },
  { label: "perch", path: "perch", options: PERCHES },
  { label: "bird size", path: "bird.size", step: 0.1, min: 0.4, max: 3 },
  { label: "tilt", path: "tilt", step: 0.1, min: -1, max: 1 },
  { label: "look", path: "look", step: 0.1, min: 0, max: 1 },
  { label: "body", path: "colors.body.hex", color: true },
  { label: "belly", path: "colors.belly.hex", color: true },
  { label: "beak", path: "colors.beak.hex", color: true },
  { label: "perch color", path: "colors.perch.hex", color: true },
];
