import { PALETTE } from "../../../world/palette.js";
import { merge } from "../../../world/merge.js";
import { DWELLING, CAT_HEIGHT, windowShapeKnobs } from "../objects.js";

// A trailer: a little camper — a rounded clay shell standing off the
// ground on one wheel each side, a stripe round its middle and a slab of
// roof on top with a vent, a door and a window on the front, and a hitch
// bar poking out one end on a jockey wheel. Its length runs along x and
// its front — the side with the door — faces +z, like a bench. Colors
// come from PALETTE (src/world/palette.js).
//
//   body     the shell: `width` along, `height` from floor to roof and
//            `depth` through, in world units, `lift` how far its floor
//            stands off the ground (the wheels go under), `detail` and
//            `clay` as any primitive's (see FORM, CLAY) — lumpy clay, so
//            its edges come out soft — `color` its own
//   stripe   the band round the shell: `y` how high its middle is up the
//            shell, as a share of the height, `height` how tall it is,
//            `out` how far it stands off the shell, `color` its own; or
//            null for none
//   roof     the slab on top: `thickness`, `inset` how far in from the
//            shell's edges it stops, `color`; `vent` the little chimney on
//            it — `radius`, `height`, `x` where along the roof — or null
//   window   the one on the front, as a house's (see HOUSE.windows), plus
//            `x` where along the front its middle is; `y` is off the
//            trailer's FLOOR
//   door     the one on the front, as a house's (see HOUSE.door), plus
//            `x` where along the front its middle is
//   wheels   one each side, under the shell: `radius`, `width` across the
//            tread, `x` where along the trailer the axle is, `color`;
//            `hub` the cap on each — `radius`, `depth` how far it stands
//            off the wheel, `color`
//   hitch    the bar out the -x end: `length` past the shell, `radius`,
//            `y` how high off the ground it runs, `color`; `wheel` the
//            jockey wheel under its end — `radius`, `width`
//   interior as DWELLING's (see ../objects.js): three rooms — the second
//            off the right of the first through an archway, and the
//            bathroom off that one's north wall through a door, a
//            bathtub in it
export const TRAILER = merge(DWELLING, {
  scale: CAT_HEIGHT / 5,
  body: {
    width: 14,
    height: 6.8,
    depth: 6.8,
    lift: 1.4,
    detail: 1,
    clay: { amount: 0.35, seed: 31 },
    color: PALETTE.trailer.body,
  },
  stripe: {
    y: 0.42,
    height: 0.9,
    out: 0.1,
    color: PALETTE.trailer.stripe,
  },
  roof: {
    thickness: 0.6,
    inset: 0.5,
    color: PALETTE.trailer.roof,
    vent: { radius: 0.48, height: 0.8, x: -3.6, color: PALETTE.trailer.vent },
  },
  window: {
    type: "square",
    columns: 3,
    rows: 1,
    x: 3,
    width: 3.8,
    height: 2,
    depth: 0.24,
    y: 4.1,
    detail: 1,
    clay: null,
    frame: { thickness: 0.32, depth: 0.4, color: PALETTE.trailer.frame },
    // Dimmer than a house's: the halo grows with the pane, and this one
    // is three times as wide.
    light: { type: "lit", brightness: 0.12 },
    color: PALETTE.trailer.pane,
  },
  door: {
    x: -3.2,
    width: 2.4,
    height: 5,
    depth: 0.32,
    detail: 1,
    clay: null,
    knob: { radius: 0.2, side: 0.6, color: PALETTE.trailer.knob },
    color: PALETTE.trailer.door,
  },
  wheels: {
    radius: 1.2,
    width: 0.8,
    x: 1.2,
    color: PALETTE.trailer.wheels,
    hub: { radius: 0.48, depth: 0.16, color: PALETTE.trailer.hubs },
  },
  hitch: {
    length: 2.6,
    radius: 0.2,
    y: 1.5,
    color: PALETTE.trailer.hitch,
    wheel: { radius: 0.44, width: 0.32 },
  },
  interior: {
    rooms: [
      {},
      { side: "+x", width: 14, length: 16 },
      {
        off: 1,
        side: "-z",
        width: 14,
        length: 16,
        door: { width: 3.2, height: 5 },
        objects: [
          {
            type: "bathtub",
            position: { x: 0.3, y: 0.55 },
            rotation: { y: 90 },
          },
        ],
      },
    ],
  },
});

// What can be changed on the trailer, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const TRAILER_KNOBS = [
  { label: "width", path: "body.width", step: 0.5, min: 2 },
  { label: "height", path: "body.height", step: 0.2, min: 1 },
  { label: "depth", path: "body.depth", step: 0.2, min: 1 },
  { label: "lift", path: "body.lift", step: 0.1, min: 0 },
  { label: "door width", path: "door.width", step: 0.1, min: 0.5 },
  ...windowShapeKnobs("window"),
];
