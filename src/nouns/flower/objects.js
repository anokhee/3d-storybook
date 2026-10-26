import { PALETTE } from "../../world/palette.js";

export const FLOWER = {
  radius: 0.34,
  petalThickness: 0.06, // card thickness, as a multiple of the radius
  faceOut: true, // hung or capping, turned to look away from the middle
  // How the head is turned about its middle when hung or capping, degrees
  // round each axis (see ROTATION) — a planted flower is always laid flat,
  // face up. A type's own `rotation` overrides this, field by field.
  rotation: { x: 0, y: 0, z: 0 },
  // The middle, where a type has one: one warm yellow for every flower.
  pistilColor: PALETTE.flower.pistil,
};

// One flower per entry, every dimension a multiple of the radius so the parts
// cannot disagree. Add one here and it can be planted, hung or capped by
// name.
//
//   petals        how many
//   petalWidth    base width, as a multiple of the radius
//   petalTaper    tip width as a fraction of the base's; under 1 points it
//   petalPitch    degrees lifted out of the flat — 90 stands straight up
//   pistilRadius  the middle's radius as a multiple of the radius; 0 for none
//   hangsBy       "top": the flower reaches a radius above its origin, so it
//                 hangs that far under its string. "origin": nothing reaches
//                 above the origin, so it hangs right at it.
//   rotation      degrees round each axis, over FLOWER's, only when hung
//                 or capping — a planted flower is always laid flat, face
//                 up. Any axis left out keeps FLOWER's.
export const FLOWER_TYPES = {
  // Rounded petals opening off a visible middle.
  daisy: {
    petals: 5,
    petalWidth: 0.28,
    petalTaper: 2.4,
    petalPitch: 12,
    pistilRadius: 0.25,
    hangsBy: "top",
  },
  // Long petals gathered into a cup. The rotation turns that cup mouth-DOWN
  // when hung, so every petal falls away from the point where they meet and
  // nothing reaches above it: the origin IS the top of the flower.
  tulip: {
    petals: 6,
    petalWidth: 0.15,
    petalTaper: 4,
    petalPitch: 55,
    pistilRadius: 0,
    hangsBy: "origin",
    rotation: { x: 0, y: 90, z: 90 },
  },
  // Four broad, blunt petals cupped a little round a dark middle.
  poppy: {
    petals: 4,
    petalWidth: 0.42,
    petalTaper: 1.6,
    petalPitch: 20,
    pistilRadius: 0.2,
    hangsBy: "top",
  },
};
