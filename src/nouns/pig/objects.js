import { solid } from "../../world/palette.js";

// The pig's own colours: a pink coat with a darker pink snout and ears,
// a couple of dusky patches, and dark nostrils and eyes. The story's
// knobs write over these.
const paint = {
  coat: solid("#F2B8C6"),
  snout: solid("#E08AA0"),
  patch: solid("#8C5A6A"),
  nostrils: solid("#5A3344"),
  eyes: solid("#2A2230"),
};

// A toy pig on the dog's frame (see dog/objects.js): one lump of clay
// (see world/lump.js) — a fat rounded block of a body on four short
// stubby legs pulled straight down out of its corners, a smaller block
// of a head grown out of its front and run back into it so there is no
// seam, and a thin tail out of its rump curled into a tight spiral —
// with a flat round disc of a snout on the head's front, two nostrils
// dotted on it, two floppy triangular ears on top of the head tipped
// forward, white eyeballs with a dark pupil, and, if it has them, a couple of darker patches
// painted over the back and a flank. It stands on the ground facing
// +z, about 0.7 tall and 1.1 long: round and low.
//
//   size     the whole pig scaled; 1 is a small pig beside the furniture
//   wag      how much the tail wags, 0 still to 1 a full wag
//   patches  whether the patches are painted on
//   body     the block: `width` across, `height` belly to back, `length`
//            chest to rump, `round` how far its edges are rounded off
//   head     the head block: `width` across, `height`, `length` out of
//            the body's front, `round` of its edges, `blend` how wide a
//            fillet it makes with the body
//   legs     `thickness` of each, `round` of its edges, `blend` how wide
//            a fillet it makes with the belly
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   colors   `coat`; `snout` the disc and the ears; `patch` the patches;
//            `nostrils` and `eyes`
export const PIG = {
  size: 1,
  wag: 0.6,
  patches: true,
  body: { width: 0.6, height: 0.52, length: 0.84, round: 0.2 },
  head: { width: 0.44, height: 0.38, length: 0.44, round: 0.14, blend: 0.06 },
  legs: { thickness: 0.16, round: 0.05, blend: 0.03 },
  resolution: 64,
  colors: {
    coat: paint.coat,
    snout: paint.snout,
    patch: paint.patch,
    nostrils: paint.nostrils,
    eyes: paint.eyes,
  },
};

// What can be changed on a pig, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const PIG_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "patches", path: "patches", bool: true, on: true, off: false },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "snout", path: "colors.snout.hex", color: true },
];
