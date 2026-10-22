import { solid } from "../../world/palette.js";

// The snail's own colours: a warm beige foot, a plum-brown shell with a
// cream stripe wound along it, and bead eyes in dark plum.
const paint = {
  foot: solid("#E8C39E"),
  shell: solid("#7c56be"),
  stripe: solid("#F2E9DC"),
  eye: solid("#2B2230"),
};

// A snail: a toy of one, crawling along the ground facing +z, about 0.9
// long with the shell about 0.5 across. Everything is scaled by `size`.
//
//   size    the whole snail, 1 is 0.9 long
//   pace    how much it moves: the eye stalks wave slowly, 0 holds still
//   foot    the soft body it crawls on: a teardrop `length` along z,
//           `radius` at its fattest, pressed to `flat` of that tall,
//           tapering to a point at the back; `head` the ball raised at
//           its front end, of that radius, `lift` above the foot
//   stalks  the two eye stalks up from the head: thin cylinders of
//           `radius`, `length` long, leaning `lean` radians forward, set
//           `apart`, each with an eye of `eye` radius on top; `feelers`
//           the two shorter ones below, of `feelers.length`
//   shell   the spiral on its back, a tube wound along a logarithmic
//           spiral: `across` is how wide the whole shell is, `turns` how
//           many times it goes round (each turn twice the one before);
//           the spiral stands upright along the snail with its spire out
//           to the left and its flat side to the right, swung `turn`
//           radians toward the back and leaned `tilt` off upright
//           (positive leans its top to the left); `stripe`
//           whether a thin band of the stripe colour runs round its
//           outside, `sink` how far it sits down into the foot
//   colors  `foot`, `shell`, `stripe`, `eye`
export const SNAIL = {
  size: 1,
  pace: 1,
  foot: { length: 0.95, radius: 0.15, flat: 0.6, head: { radius: 0.11, lift: 0.1 } },
  stalks: { radius: 0.016, length: 0.2, lean: 0.45, apart: 0.13, eye: 0.035, feelers: { length: 0.09 } },
  shell: { across: 0.6, turns: 2.5, turn: 0, tilt: 0.15, stripe: true, sink: 0.08 },
  colors: {
    foot: paint.foot,
    shell: paint.shell,
    stripe: paint.stripe,
    eye: paint.eye,
  },
};

// What can be changed on a snail, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const SNAIL_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "shell turns", path: "shell.turns", step: 0.25, min: 1, max: 4 },
  { label: "pace", path: "pace", step: 0.1, min: 0, max: 1 },
  { label: "foot", path: "colors.foot.hex", color: true },
  { label: "shell", path: "colors.shell.hex", color: true },
  { label: "eyes", path: "colors.eye.hex", color: true },
];
