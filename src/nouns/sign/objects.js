import { PALETTE } from "../../world/palette.js";

// A sign: a blank clay board stood flat against a face — the board over a
// vending machine's front, the sticker beside a gachapon's slot, the label
// on its globe — or strung between two posts, hung from their tops. Whoever
// seats or strings it says where; this is only what it looks like. The
// stock one is a board; a sticker is the same thing pulled small and thin
// by whoever sticks it.
//
//   width    across, in world units — or "span", for a strung sign, to run
//            the whole way between its posts less `gap` at each end
//   height   up, in world units
//   depth    how thick the board is
//   stand    seated on a face, how far off it the board floats, so the
//            clay lumps of what it is set against do not poke through
//   gap      strung, how far short of each post it stops
//   hang     strung, how far below the post tops its top edge hangs
//   clay     thrown in lumpy clay like the rest (see CLAY), or null for a
//            flat board
//   light    how it is lit (see LIGHT) — unlit is a board; a "glowing" one
//            is a pane of glass
//   color    its own, a swatch from PALETTE
export const SIGN = {
  width: 7.5,
  height: 2,
  depth: 0.25,
  stand: 0.15,
  gap: 0.1,
  hang: 0.05,
  clay: { amount: 0.4, seed: 14 },
  light: {},
  color: PALETTE.sign.board,
};
