import { solid } from "../../world/palette.js";

// The mailbox's own paints: a plum for the box, pale wood for the post, a
// red for the flag, cream for the door and plate, and a near-black for the
// latch, the slot and a pillar box's base.
const paint = {
  box: solid("#3B2A4E"),
  post: solid("#E8C39E"),
  flag: solid("#E5534B"),
  door: solid("#F2E9DC"),
  dark: solid("#2B2530"),
};

// A mailbox, standing on the ground and facing +z. Two styles: "post", the
// roadside kind — a wooden post with a plank across its top and the box on
// that, a long box with a rounded roof, its door on the front with a latch
// at the top, and a flag on a pivot on its right side; and "pillar", the
// British pillar box — a round column on a black base, a lip and a dome on
// top, a slot and a plate on its front.
//
//   style   "post" or "pillar"
//   post    the wooden post: `height` to the plank's top, `width` its square
//           side; `plank` the board the box sits on — `length` along z,
//           `width` across, `thickness`
//   box     `width` across, `height` to the top of the rounded roof (the
//           roof's radius is half the width), `length` along z, and
//           `forward` how far its middle sits ahead of the post
//   door    `inset` in from the box's edges, `proud` of the front
//   flag    `up` true raised, false down along the side; `length` of the arm
//           from its pivot, `paddle` the blade at the end — `length` along
//           the arm, `width` across
//   pillar  `radius` of the column, `height` to the top of the dome, `base`
//           how tall the black foot is, `lip` the thickness of the rim under
//           the dome
//   colors  `box` the box or column, `post` the post and plank, `flag`,
//           `door` the door and a pillar's plate, `dark` latch, slot and base
export const MAILBOX = {
  style: "post",
  post: {
    height: 2.4,
    width: 0.22,
    plank: { length: 1, width: 0.6, thickness: 0.1 },
  },
  box: { width: 0.7, height: 0.76, length: 1.4, forward: 0.15 },
  door: { inset: 0.05, proud: 0.04 },
  flag: { up: false, length: 0.42, paddle: { length: 0.26, width: 0.15 } },
  pillar: { radius: 0.48, height: 2.7, base: 0.3, lip: 0.12 },
  colors: {
    box: paint.box,
    post: paint.post,
    flag: paint.flag,
    door: paint.door,
    dark: paint.dark,
  },
};
export const MAILBOX_STYLES = ["post", "pillar"];

// What can be changed on a mailbox, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const MAILBOX_KNOBS = [
  { label: "style", path: "style", options: MAILBOX_STYLES },
  { label: "post height", path: "post.height", step: 0.1, min: 0.6, max: 4 },
  { label: "box length", path: "box.length", step: 0.05, min: 0.6, max: 2.5 },
  { label: "flag up", path: "flag.up", bool: true, on: true, off: false },
  { label: "box", path: "colors.box.hex", color: true },
  { label: "post", path: "colors.post.hex", color: true },
  { label: "flag", path: "colors.flag.hex", color: true },
];
