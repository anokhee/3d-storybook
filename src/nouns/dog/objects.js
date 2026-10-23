import { solid } from "../../world/palette.js";

// The dog's own colours: a tan coat with brown ears and spots, a red
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

// The poses a dog holds: standing on all fours, sitting up on its
// haunches with the front legs straight, or loafed with every leg
// tucked under and the tail laid along its side.
export const DOG_POSES = ["standing", "sitting", "loaf"];

// A toy dog on the cat's frame (see cat/objects.js): one lump of clay
// (see world/lump.js) — ONE rounded block for the head and body
// together, the face drawn on its front with a smaller block of a snout
// out of it ending in a dark bead nose, two floppy ears hanging down
// the sides of the head, bead eyes, the legs slimmer blocks pulled
// straight down out of the block to the ground, and the tail out of its
// rear the same way, curling up at the tip — with round spots painted
// over the back and flanks and, if it wears one, a collar painted across the front
// under the snout, a brass tag hung off it. It stands on the ground facing +z, about 1 tall.
//
//   size    the whole dog scaled; 1 is a small dog beside the furniture
//   pose    one of DOG_POSES, see above
//   wag     how much the tail wags, 0 still to 1 a full wag
//   spots   whether the spots are painted on (the ears always are)
//   collar  whether it wears its collar and tag
//   body    the block: `width` across, `height` (standing), `length` nose
//           to rump, `round` how far its edges are rounded off
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly
//   sitting the sitting pose's chest and legs: `chestDepth` how far the
//           chest block stands out from the body (how deep the notch
//           under it the front legs sit in), `legForward` how far the
//           front legs' faces stand proud of the chest's (0 flush, a
//           little back of it below), `legSpacing` between the two front
//           legs, middle to middle, `footYaw` how far each hind foot
//           turns out, in degrees, `footBack` how far back from the
//           front of the base each hind foot's front sits
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   colors  `coat`; `patch` the ears and spots; `collar` and its `tag`;
//           `nose` and `eyes`
export const DOG = {
  size: 1,
  pose: "standing",
  wag: 0.6,
  spots: true,
  collar: true,
  body: { width: 0.56, height: 0.62, length: 1.1, round: 0.14 },
  legs: { thickness: 0.16, round: 0.045, blend: 0.02 },
  sitting: { chestDepth: 0.16, legForward: 0.01, legSpacing: 0.32, footYaw: 35, footBack: 0.28 },
  resolution: 56,
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
  { label: "spots", path: "spots", bool: true, on: true, off: false },
  { label: "collar", path: "collar", bool: true, on: true, off: false },
  { label: "collar colour", path: "colors.collar.hex", color: true },
  { label: "sit: chest depth", path: "sitting.chestDepth", step: 0.01, min: 0.04, max: 0.3 },
  { label: "sit: legs forward", path: "sitting.legForward", step: 0.01, min: -0.05, max: 0.1 },
  { label: "sit: legs apart", path: "sitting.legSpacing", step: 0.02, min: 0.16, max: 0.5 },
  { label: "sit: hind feet turn", path: "sitting.footYaw", step: 5, min: 0, max: 60 },
  { label: "sit: hind feet back", path: "sitting.footBack", step: 0.02, min: -0.1, max: 0.5 },
];
