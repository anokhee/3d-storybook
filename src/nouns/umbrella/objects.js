import { solid } from "../../world/palette.js";

// The umbrella's own paints: a red and a cream for the alternating gores,
// a dark wood for the crook of the handle, and a near-black for the shaft,
// the rib tips and the strap.
const paint = {
  canopyA: solid("#E5534B"),
  canopyB: solid("#F2E9DC"),
  handle: solid("#CF8F5E"),
  shaft: solid("#3B2A4E"),
};

// An umbrella, standing the way one is held: the crook of its handle on
// the ground, the shaft straight up, and the canopy spread at the top with
// the ferrule poking out above it. It faces +z (the handle's hook turns
// toward +x). `open` folds it: at 1 the canopy is spread, at 0 the ribs lie
// along the shaft and the cloth hangs furled round it, a thin strap ring
// holding it shut.
//
//   radius   how far the canopy reaches from the shaft when open
//   height   where the canopy's apex is, off the ground
//   open     0 furled to 1 spread; in between the ribs swing down
//   panels   how many gores the canopy is sewn from, alternating the two
//            canopy colors; a rib tip sits at every seam
//   canopy   `sag` how deep the dome is, as a share of the radius; `scallop`
//            how far the cloth curves in between rib tips, as a share of
//            the reach
//   shaft    `radius` of the pole, `ferrule` how far it pokes above the apex
//   handle   `hook` the crook's radius and `radius` how thick its tube is
//   colors   `canopyA` and `canopyB` the gores, `handle` the crook, `shaft`
//            the pole, ferrule, rib tips and strap
export const UMBRELLA = {
  radius: 1.6,
  height: 2.2,
  open: 1,
  panels: 8,
  canopy: { sag: 0.42, scallop: 0.07 },
  shaft: { radius: 0.035, ferrule: 0.18 },
  handle: { hook: 0.22, radius: 0.05 },
  colors: {
    canopyA: paint.canopyA,
    canopyB: paint.canopyB,
    handle: paint.handle,
    shaft: paint.shaft,
  },
};

// What can be changed on an umbrella, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const UMBRELLA_KNOBS = [
  { label: "radius", path: "radius", step: 0.1, min: 0.5, max: 3 },
  { label: "open", path: "open", step: 0.05, min: 0, max: 1 },
  { label: "panels", path: "panels", step: 1, min: 4, max: 16 },
  { label: "canopy", path: "colors.canopyA.hex", color: true },
  { label: "canopy alt", path: "colors.canopyB.hex", color: true },
  { label: "handle", path: "colors.handle.hex", color: true },
];
