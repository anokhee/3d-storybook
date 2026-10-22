import { PALETTE } from "../../world/palette.js";

// The garland strung between a station's posts: a sagging run between each
// neighboring pair, festoons hung along it. Colors come from PALETTE (src/world/palette.js).
export const GARLAND = {
  sag: 0.15, // dip at each run's middle, as a fraction of its span
  // Where it is tied on a fence that has panels (see Enclosure): `stand`
  // how far out the wire hangs past the fence's outer face and the widest
  // festoon's radius, in world units, so it and its festoons hang down
  // the OUTSIDE of the panels, clear of them, rather than sag through
  // them; `drop` how far below the post tops it
  // is tied, to hang it lower down the fence. Bare posts carry it through
  // their tops, cap and all, as ever, and a garland strung anywhere else
  // hangs where it is handed its tops.
  stand: 0.15,
  drop: 0,
  wire: {
    radius: 0.014,
    segments: 20,
    sides: 5,
    color: PALETTE.garland.cord,
  },
  // How many festoons per span are REAL point lights rather than just a lit
  // shape and a halo — the lowest lit ones. Real lights are dear; see
  // GLOW.light. None for now: every bulb glows, and none of them casts.
  lights: 0,
  festoon: {
    // How many hang on each run: `spacing` world units apart along it,
    // so a short run between a gatepost and its neighbor carries fewer
    // than a long side does — or, `count` set, that many on every run
    // whatever its length.
    spacing: 1.6,
    count: null,
    // Dealt round the run in this order. Each is an ornament spec —
    // `{ shape, radius, sides?, light? }` (see LIGHT) — and lights up on its
    // own say-so: a string can carry bulbs and plain shapes side by side.
    type: [
      { shape: "sphere", radius: 0.15, light: { type: "lit" } },
      { shape: "tulip", radius: 0.25, light: { type: "lit" } },
      { shape: "daisy", radius: 0.25, light: { type: "lit" } },
      { shape: "pentagram", radius: 0.5, light: { type: "lit" } },
    ],
    // Dealt round the run the way `type` is, and INDEPENDENTLY of it: three
    // colors against two shapes walk past each other, so the string takes
    // six festoons to repeat rather than two. One color paints the lot.
    //
    // A color is a bare "#rrggbb" for an exact one, or a swatch — a PALETTE
    // entry, or `{ hex, vary }` written inline — where it should drift.
    colors: Object.values(PALETTE.garlandLights),
    // How far each festoon hangs below the wire: one length for all, or
    // a list dealt round the run the way `type` is — and independently of
    // it — so the festoons zigzag, or every third hangs low.
    stringLength: 0.45,
  },
  // How a festoon gives way to the doll: solid, so the doll pushes it aside
  // rather than passing through, and hung, so it swings about its knot on
  // the wire and pendulums back. `stiffness` is how hard it is shoved clear
  // and pulled back, `damping` how quickly the swinging dies, `tilt` the
  // furthest it will swing in degrees.
  swing: { stiffness: 60, damping: 4, tilt: 80 },
};
