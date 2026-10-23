import { solid } from "../../world/palette.js";

// The cow's own colours: a white coat with black patches, a pink muzzle
// and udder, pale horns, dark hooves, a leather strap with a brass bell
// on it, and dark nostrils and eyes. The story's knobs write over these.
const paint = {
  coat: solid("#F6F2EA"),
  patch: solid("#2B2626"),
  pink: solid("#F2A6AE"),
  horn: solid("#EFE3C8"),
  hoof: solid("#4A3F3B"),
  strap: solid("#7A4A2A"),
  bell: solid("#F4D46A"),
  nostrils: solid("#3B2A2A"),
  eyes: solid("#2A2230"),
};

// A toy cow on the dog's standing frame (see dog/objects.js): one lump
// of clay (see world/lump.js) — a big rounded block for the body, four
// sturdy legs pulled straight down out of its corners to the ground, a
// smaller block of a HEAD grown out of the body's front a little below
// its back, run back into it so there is no seam, with a broad MUZZLE
// block out of its front painted pink and two dark bead nostrils on it,
// and a thin tail out of the top of the rump hanging down with a tuft
// at its tip — with two short pale horns on top of the head pointing up
// and out, two flat ears out to its sides, bead eyes, dark hooves
// painted round the feet, a pink udder under the belly towards the
// rear, big irregular patches painted over the back, flanks and head
// (each two or three discs overlapping, so none is a plain spot) and,
// if it wears one, a strap round the neck with a brass bell hung off
// it. It stands on the ground facing +z, about 1.1 tall to the tips of
// its horns and 1.5 long nose to tail.
//
//   size     the whole cow scaled; 1 is a small cow beside the furniture
//   wag      how much the tail swings, 0 still to 1 a full swing
//   patches  whether the patches are painted on (the tuft always is)
//   bell     whether it wears its strap and bell
//   body     the block: `width` across, `height`, `length` chest to rump,
//            `round` how far its edges are rounded off
//   legs     `thickness` of each, `round` of its edges, `blend` how wide
//            a fillet it makes with the belly
//   resolution  the lumps' grid, cells a side: more is smoother, slower
//   colors   `coat`; `patch` the patches and the tail's tuft; `pink` the
//            muzzle and the udder; `horn`; `hoof`; `strap` and its `bell`;
//            `nostrils` and `eyes`
export const COW = {
  size: 1,
  wag: 0.5,
  patches: true,
  bell: true,
  body: { width: 0.6, height: 0.62, length: 1.0, round: 0.16 },
  legs: { thickness: 0.18, round: 0.05, blend: 0.03 },
  resolution: 56,
  colors: {
    coat: paint.coat,
    patch: paint.patch,
    pink: paint.pink,
    horn: paint.horn,
    hoof: paint.hoof,
    strap: paint.strap,
    bell: paint.bell,
    nostrils: paint.nostrils,
    eyes: paint.eyes,
  },
};

// What can be changed on a cow, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const COW_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "patch", path: "colors.patch.hex", color: true },
  { label: "patches", path: "patches", bool: true, on: true, off: false },
  { label: "bell", path: "bell", bool: true, on: true, off: false },
];
