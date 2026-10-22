import { solid } from "../../world/palette.js";

// The clock's own paints: a wooden case, a cream face, plum hands and
// ticks so they read against it from across a room.
const paint = {
  case: solid("#E8C39E"),
  face: solid("#F2E9DC"),
  hands: solid("#3B2A4E"),
};

// A wall clock: a round case hung flat against a wall, the way a wall
// hanging is (see ../wallHanging/objects.js), its face turned out to +z
// and its foot at y = 0, lifted `hang` up. `radius` is the case's, half
// of how far across it is; `depth` how far it stands off the wall. The
// case is one turned piece: a back, and a bezel `rim` wide standing
// `inset` proud of the face, so the face sits down in it. Twelve ticks
// ring the face, `tick.length` long and a third again longer at
// 12, 3, 6 and 9, `tick.width` wide. The hands pivot at the middle,
// each `reach` out as a share of the face's radius and `width` wide, the
// hour hand under the minute hand and a round `cap` over both. `time`
// is the hour shown, 0 to 12 with the minutes as its fraction (10.25 is
// quarter past ten); with `run` on the hands turn, `speed` clock minutes
// to the real second (1 keeps real time, which is too slow to see).
// `sides` is how many facets the round parts have: few, under toon.
export const WALL_CLOCK = {
  radius: 0.55,
  depth: 0.14,
  rim: 0.06,
  inset: 0.025,
  hang: 2.5,
  sides: 16,
  time: 10.25,
  run: false,
  speed: 60,
  tick: { length: 0.09, width: 0.035 },
  hands: {
    hour: { reach: 0.55, width: 0.06 },
    minute: { reach: 0.82, width: 0.045 },
    thickness: 0.015,
    cap: 0.04,
  },
  colors: {
    case: paint.case,
    face: paint.face,
    hands: paint.hands,
  },
};

// What can be changed on a wall clock, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const WALL_CLOCK_KNOBS = [
  { label: "radius", path: "radius", step: 0.05, min: 0.2, max: 1.5 },
  { label: "hang", path: "hang", step: 0.2, min: 0 },
  { label: "hour", path: "time", step: 0.25, min: 0, max: 12 },
  { label: "run", path: "run", bool: true },
  { label: "case", path: "colors.case.hex", color: true },
  { label: "face", path: "colors.face.hex", color: true },
  { label: "hands", path: "colors.hands.hex", color: true },
];
