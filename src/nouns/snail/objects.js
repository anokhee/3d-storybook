import { solid } from "../../world/palette.js";

// The snail's own colours, the snail car's (src/car/snailcar.js): a
// caramel shell with a cream spiral, a sage foot and head with rosy
// cheeks, cream eyeballs with dark pupils, and a pale slime.
const paint = {
  shell: solid("#B8743A"),
  stripe: solid("#F3D9A8"),
  body: solid("#A8C49C"),
  cheek: solid("#F2A39B"),
  slime: solid("#D9F2E4"),
  eye: solid("#FFF8E6"),
  pupil: solid("#3A3330"),
};

// A snail: the snail car (src/car/snailcar.js) without the car, its
// cockpit, seats, wheels and lights left off, so the shell is whole. A
// big round coiled shell with a raised spiral winding in on each flank,
// over a soft foot that rises at the front into a smiling head with
// rosy cheeks, two long eyestalks and two short tentacles. Crawling
// along the ground facing +z, about a unit long. Everything is scaled
// by `size`.
//
//   size      the whole snail, 1 is about a unit long
//   pace      how much it moves: the eyestalks sway, 0 holds still
//   hasSlime  the glossy streak on the ground under it and behind
//   colors    `shell`, `stripe` (the spiral), `body` (foot, head,
//             stalks), `cheek`, `slime`, `eye`, `pupil` (and the smile)
export const SNAIL = {
  size: 1,
  pace: 1,
  hasSlime: true,
  colors: {
    shell: paint.shell,
    stripe: paint.stripe,
    body: paint.body,
    cheek: paint.cheek,
    slime: paint.slime,
    eye: paint.eye,
    pupil: paint.pupil,
  },
};

// What can be changed on a snail, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const SNAIL_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "pace", path: "pace", step: 0.1, min: 0, max: 1 },
  { label: "slime trail", path: "hasSlime", bool: true },
  { label: "shell", path: "colors.shell.hex", color: true },
  { label: "spiral", path: "colors.stripe.hex", color: true },
  { label: "body", path: "colors.body.hex", color: true },
  { label: "cheeks", path: "colors.cheek.hex", color: true },
];
