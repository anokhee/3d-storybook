import { solid } from "../../world/palette.js";

// The toilet's own swatches: cream porcelain, a plum seat and lid, blue
// water, and a pale grey flush button.
const paint = {
  porcelain: solid("#F2E9DC"),
  seat: solid("#3B2A4E"),
  water: solid("#7FB7D6"),
  lever: solid("#C3C7CF"),
};

// A toilet: a pedestal flaring at the foot, an oval bowl on it with its
// rim and the water inside, a seat ring and a lid hinged at the back, and
// a tank behind with a lid slab and a flush button on top. It stands on
// the ground facing +z (the front of the bowl toward +z) and is drawn at
// `size` 1, every length below scaled by `size`.
//
//   lid        0 lying flat on the seat, 1 raised up against the tank
//   pedestal   `height` to the bowl's underside, `foot` its radius at the
//              ground, `waist` its narrowest, set `forward` of the tank
//   bowl       `height` of the bowl above the pedestal, `radius` across (x)
//              and `stretch` times that along (z), making it oval; `water`
//              how far below the rim the water lies
//   seat       the ring on the rim, `thickness` tall
//   lidDisc    the disc over it, `thickness` tall
//   tank       `width`, `height` and `depth` of the box behind, `corner`
//              its rounding, its bottom `drop` below the bowl's top, with a
//              `slab` thick lid on it and a `button` of that radius on top
//   colors     `porcelain` (pedestal, bowl, tank), `seat` (ring and lid),
//              `water`, `lever` (the flush button)
export const TOILET = {
  size: 1,
  lid: 0,
  pedestal: { height: 0.9, foot: 0.55, waist: 0.36, forward: 0.15 },
  bowl: { height: 0.45, radius: 0.6, stretch: 1.25, water: 0.2 },
  seat: { thickness: 0.13 },
  lidDisc: { thickness: 0.07 },
  tank: { width: 1.3, height: 1.4, depth: 0.5, corner: 0.1, drop: 0.25, slab: 0.1, button: 0.08 },
  colors: {
    porcelain: paint.porcelain,
    seat: paint.seat,
    water: paint.water,
    lever: paint.lever,
  },
};

// What can be changed on a toilet, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const TOILET_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.4, max: 2.5 },
  { label: "lid", path: "lid", step: 0.05, min: 0, max: 1 },
  { label: "porcelain", path: "colors.porcelain.hex", color: true },
  { label: "seat", path: "colors.seat.hex", color: true },
  { label: "water", path: "colors.water.hex", color: true },
];
