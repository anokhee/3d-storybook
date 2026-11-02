import { solid } from "../../world/palette.js";

// BROCCOLI: a head of broccoli standing on its stalk — the crown a rounded
// core packed all over with small knobbly florets, so close that none of
// the core shows, lighter on top and darker down its flanks; under it the
// thick pale stalk, short branch stems forking up out of it into the
// crown, its cut end a lighter disc on the ground. The Broccoli Car's
// (src/car/broccolicar.js), stood up and not a car. The one that peeks
// out of a shopping bag (see ../shoppingBag/build.js, which builds it
// here). In the world's units, at the character's scale (they are 1.31
// high), like ../orange/.
//   size     the crown's radius; everything else is in shares of it
//   stalk    `height` from the ground to the crown's underside, `radius`
//   florets  how many (0 a bare core)
//   seed     which way the florets are nudged
//   colors   `floret` (the crown), `tip` (lighter, on top), `dark` (down
//            its flanks), `stalk`, `cut`
export const BROCCOLI = {
  size: 0.05,
  stalk: { height: 1.1, radius: 0.26 },
  florets: 90,
  seed: 7,
  colors: {
    floret: solid("#4A9440"),
    tip: solid("#86C455"),
    dark: solid("#2E6A2F"),
    stalk: solid("#C3DC8E"),
    cut: solid("#E6F0C6"),
  },
};

export const BROCCOLI_KNOBS = [
  { label: "size", path: "size", step: 0.01, min: 0.02, max: 0.5 },
  { label: "stalk", path: "stalk.height", step: 0.05, min: 0.2, max: 2 },
  { label: "florets", path: "florets", step: 5, min: 0, max: 200 },
  { label: "seed", path: "seed", step: 1, min: 1, max: 50 },
  { label: "crown", path: "colors.floret.hex", color: true },
  { label: "tips", path: "colors.tip.hex", color: true },
  { label: "flanks", path: "colors.dark.hex", color: true },
  { label: "stalk colour", path: "colors.stalk.hex", color: true },
];
