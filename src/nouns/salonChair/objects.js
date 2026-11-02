import { solid } from "../../world/palette.js";

// A SALON CHAIR: the hairdresser's chair that pumps up and turns — a
// round chrome foot on the floor, a column up out of it to a padded seat,
// a tall padded back with a headrest on a bar over it, padded arms on
// chrome struts, and a chrome footrest out in front. It stands on the
// ground facing +z, in the library's furniture units (a room shrinks it by
// its `scale`, as the café's chairs are).
//   base     the foot: `radius`, `height`; `column` the post up from it to
//            the seat, its `radius`
//   seat     the cushion: `width`, `depth`, `thickness`, its top `height`
//            off the floor, `round` its corners
//   back     the backrest: `height` over the seat, `thickness`, leaning
//            back `lean` degrees
//   head     the headrest: `on`, `width`, `height`, up `gap` over the back
//            (none under a dryer)
//   arms     the armrests: `width`, `height` over the seat, `length`
//   foot     the footrest: `width`, `out` ahead of the seat's front, `up`
//            off the floor
//   dryer    a hood dryer over it, `on` or not: a dome `radius` across,
//            open underneath, its crown tipped back `tilt` degrees (its
//            mouth to the face), its middle
//            `up` over the seat's top and `back` behind its middle, in
//            `color` with a chrome rim; hung on an arm from a pole down
//            from the `ceiling` (`mount` "ceiling", the pole's foot that
//            high off the floor) or up from a round foot on the floor
//            beside the chair (`mount` "stand")
//   colors   `cushion` (the upholstery), `chrome`, `piping` (the seams)
export const SALON_CHAIR = {
  base: { radius: 0.95, height: 0.14, column: 0.16 },
  seat: { width: 2.0, depth: 1.8, thickness: 0.5, height: 1.9, round: 0.18 },
  back: { height: 2.3, thickness: 0.4, lean: 8 },
  head: { on: true, width: 1.0, height: 0.45, gap: 0.35 },
  arms: { width: 0.32, height: 0.75, length: 1.5 },
  foot: { width: 1.3, out: 0.75, up: 0.6 },
  dryer: { on: false, mount: "ceiling", ceiling: 10, radius: 0.95, up: 2.75, back: 0.25, tilt: 25, color: solid("#F2C9D3") },
  colors: {
    cushion: solid("#2F2A36"),
    chrome: solid("#C9CED6"),
    piping: solid("#1E1A24"),
  },
};

export const SALON_CHAIR_KNOBS = {
  cushion: { path: "colors.cushion.hex", color: true, name: "cushion colour" },
  chrome: { path: "colors.chrome.hex", color: true, name: "chrome colour" },
  seatHeight: { path: "seat.height", range: [1.2, 3, 0.05], name: "seat height (pumped up)" },
  seatWidth: { path: "seat.width", range: [1.2, 3, 0.05], name: "seat width" },
  backHeight: { path: "back.height", range: [1, 3.5, 0.05], name: "back height" },
  lean: { path: "back.lean", range: [0, 30, 1], name: "back lean (degrees)" },
  head: { path: "head.on", bool: true, name: "headrest" },
  armHeight: { path: "arms.height", range: [0.3, 1.2, 0.05], name: "arm height" },
  dryer: { path: "dryer.on", bool: true, name: "hood dryer" },
  dryerMount: { path: "dryer.mount", options: ["ceiling", "stand"], name: "hood dryer hung from" },
  dryerColor: { path: "dryer.color.hex", color: true, name: "hood dryer colour" },
  dryerTilt: { path: "dryer.tilt", range: [0, 60, 1], name: "hood dryer tilt (degrees)" },
};

// Where someone sits: the top of the cushion, off the floor
export const salonSeatTop = (C = SALON_CHAIR) => C.seat.height;
