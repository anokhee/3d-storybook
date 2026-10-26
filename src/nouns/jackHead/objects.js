import { solid } from "../../world/palette.js";
import { CAT_HEIGHT } from "../house/objects.js";

const paint = {
  spring: solid("#C9CFD8"),
  skin: solid("#FFE3C8"),
  cheek: solid("#F4B6A6"),
  feature: solid("#2B1D1A"),
  nose: solid("#E63946"),
  hat: solid("#4D96FF"),
  pompom: solid("#FFFFFF"),
  collar: solid("#FFFFFF"),
  hair: solid("#F28C28"),
};

// A jack-in-the-box's clown head on its spring, standing from y = 0 facing
// +z: a coiled spring, a ruffled collar, a round head with ears, tufts of
// hair, cheeks, eyes, a red nose and a smile, and a tipped pointed hat
// with a pompom. Sizes are in its own units and the whole is `scale`
// times that in the world.
//   spring  `height` out, `radius`, `turns` of coil, `wire` thickness, `color`
//   head    `radius`, `color`
//   hat     `height`, `radius` at its brim, `tilt` degrees off upright
//           (toward +x), `color`, `pompom` its ball's color
//   hair    the tufts either side — `radius` as a share of the head's, `color`
//   happy   true for open eyes, false for ones shut in a smile
export const JACK_HEAD = {
  scale: CAT_HEIGHT / 8,
  spring: {
    height: 1.2,
    radius: 0.26,
    turns: 5,
    wire: 0.04,
    color: paint.spring,
  },
  head: { radius: 0.5, color: paint.skin },
  hat: {
    height: 0.8,
    radius: 0.36,
    tilt: 14,
    color: paint.hat,
    pompom: paint.pompom,
  },
  hair: { radius: 0.2, color: paint.hair },
  happy: true,
  collar: paint.collar,
  cheek: paint.cheek,
  feature: paint.feature,
  nose: paint.nose,
};

// What can be changed on the head, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const JACK_HEAD_KNOBS = [
  {
    label: "spring height",
    path: "spring.height",
    step: 0.1,
    min: 0.2,
    max: 3,
  },
  { label: "coils", path: "spring.turns", step: 1, min: 2, max: 12 },
  { label: "head", path: "head.radius", step: 0.05, min: 0.25, max: 0.9 },
  { label: "hat height", path: "hat.height", step: 0.05, min: 0.2, max: 1.6 },
  { label: "hat tilt", path: "hat.tilt", step: 1, min: -40, max: 40 },
  { label: "open eyes", path: "happy", bool: true, on: true, off: false },
  { label: "skin", path: "head.color.hex", color: true },
  { label: "hat", path: "hat.color.hex", color: true },
  { label: "hair", path: "hair.color.hex", color: true },
];
