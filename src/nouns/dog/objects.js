import { solid } from "../../world/palette.js";

// The dog's own colours: a tan coat with brown ears and saddle, a red
// collar with a brass tag, and a dark nose and eyes. The story's knobs
// write over these.
const paint = {
  coat: solid("#E8C39E"),
  patch: solid("#8B5A3C"),
  collar: solid("#E5534B"),
  tag: solid("#F4D46A"),
  nose: solid("#3B2A4E"),
  eyes: solid("#2A2230"),
};

// The poses a dog holds: standing on all fours, or sitting up on its
// haunches with the front legs straight.
export const DOG_POSES = ["standing", "sitting"];

// A toy dog from the same kit as the cat: a longer rounded body, a round
// head with a snout out front ending in a dark bead nose, two floppy
// ears hanging each side, bead eyes, four short legs, a tail curving up
// and a collar with a tag. The ears and a saddle over the back take the
// patch colour. It stands on the ground facing +z, about 1.6 tall at
// the head.
//
//   size    the whole dog scaled; 1 is a small dog beside the furniture
//   pose    one of DOG_POSES, see above
//   wag     how much the tail wags, 0 still to 1 a full wag
//   saddle  whether the patch over the back is painted (the ears always are)
//   body    the capsule: `radius` through it, `length` of its straight middle
//   head    `radius` of the ball
//   snout   `radius` of the capsule out front and `length` of its middle
//   legs    `radius` of each capsule and `length` of its straight middle
//   tail    `radius` of the tube
//   colors  `coat`; `patch` the ears and saddle; `collar` and its `tag`;
//           `nose` and `eyes`
export const DOG = {
  size: 1,
  pose: "standing",
  wag: 0.6,
  saddle: true,
  body: { radius: 0.36, length: 0.7 },
  head: { radius: 0.32 },
  snout: { radius: 0.15, length: 0.16 },
  legs: { radius: 0.11, length: 0.32 },
  tail: { radius: 0.07 },
  colors: {
    coat: paint.coat,
    patch: paint.patch,
    collar: paint.collar,
    tag: paint.tag,
    nose: paint.nose,
    eyes: paint.eyes,
  },
};

// What can be changed on a dog, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const DOG_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "pose", path: "pose", options: DOG_POSES },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "patch", path: "colors.patch.hex", color: true },
  { label: "saddle", path: "saddle", bool: true, on: true, off: false },
  { label: "collar", path: "colors.collar.hex", color: true },
];
