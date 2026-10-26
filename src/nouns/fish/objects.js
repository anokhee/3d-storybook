import { solid } from "../../world/palette.js";

// The fish's own colours, the steel drums' fish (src/xylophone/palette.js):
// an orange body over a cream belly, coral fins, pink line lips, white
// eyeballs with big black pupils.
const paint = {
  body: solid("#F2A33A"),
  belly: solid("#FFF1D6"),
  fin: solid("#E86A4A"),
  lips: solid("#F26D8D"),
  eye: solid("#FFFFFF"),
  pupil: solid("#141418"),
};

// A fish: a toy of one, swimming in the air just off the ground, nose to
// +z. Everything is scaled by `size`.
//
//   size    the whole fish, 1 is a little over a unit long
//   hover   how far its belly floats off the ground, before `size`
//   swim    how much it moves: the tail beats, the body sways, the fins
//           paddle and it bobs; 0 holds still for the picture
//   speed   how fast it swims, 1 as made
//   body    the stretched egg it is mostly made of: `radius`, then
//           `length` along z, `height` and `width` of that radius
//   tail    two flat lobes forking up and down behind: `length`, `width`
//           (how tall each lobe is), `spread` (radians between them)
//   fin     the flat fin down its back (`dorsal`) and the paddles at
//           either side (`side`), each { length, height }
//   eye     white eyeballs of `radius` either side of the head, each with
//           a big round pupil (world/eye.jsx)
//   lips    the mouth, two lines `thick` round along the belly's top
//           edge, one `gap` (radians) above the other, running `across`
//           of a half turn round the nose
//   colors  `body`, `belly`, `fin`, `lips`, `eye`, `pupil`
export const FISH = {
  size: 1,
  hover: 0.25,
  swim: 1,
  speed: 1,
  body: { radius: 0.3, length: 1.7, height: 1.15, width: 0.75 },
  tail: { length: 0.3, width: 0.13, spread: 1.1 },
  fin: { dorsal: { length: 0.36, height: 0.17 }, side: { length: 0.2, height: 0.09 } },
  eye: { radius: 0.065 },
  lips: { thick: 0.016, gap: Math.PI * 0.028, across: 0.4 },
  colors: {
    body: paint.body,
    belly: paint.belly,
    fin: paint.fin,
    lips: paint.lips,
    eye: paint.eye,
    pupil: paint.pupil,
  },
};

// What can be changed on a fish, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const FISH_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "hover", path: "hover", step: 0.05, min: 0, max: 1.5 },
  { label: "swim", path: "swim", step: 0.1, min: 0, max: 1.5 },
  { label: "speed", path: "speed", step: 0.1, min: 0.2, max: 3 },
  { label: "body", path: "colors.body.hex", color: true },
  { label: "belly", path: "colors.belly.hex", color: true },
  { label: "fins", path: "colors.fin.hex", color: true },
];
