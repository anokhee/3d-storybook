import { PALETTE } from "../../../world/palette.js";
import { merge } from "../../../world/merge.js";
import { DWELLING } from "../objects.js";

// A mushroom house: a fat clay stem standing on the ground, a domed cap
// squashed down on top of it with gills under the rim and spots dotted
// over it, and an arched door and two round windows set into the stem's
// front. It stands with its front facing +z, like a bench. Colors come
// from PALETTE (src/world/palette.js).
//
//   stem     the cylinder: `radius` its foot, `height` how tall it stands
//            from the ground to the cap, `detail` its facet count as a
//            multiple of a cylinder's, `form` how it is pushed about (see
//            FORM) — pinched in at the top by default, so it reads as a
//            stalk — `clay` thrown in lumpy clay like a doll (see CLAY) or
//            null for smooth, `sink` how far its foot settles into the
//            ground, `color` its own
//   cap      the dome: the top half of a sphere of `radius`, pressed down
//            to `squash` of its height, `detail` and `clay` as the stem's,
//            `sink` how far its rim sits down over the stem's top, `color`
//            its own;
//              gills   the disc closing its underside — `thickness`
//                      through it, `color` its own — or null for none
//              spots   the dots on it: each of `radius`, set `sink` of
//                      that into the cap, `detail` as a sphere's, `color`
//                      theirs; `at` where each lies, `{ lat, lon }` in
//                      degrees on the dome — lat 90 is the crown, 0 the
//                      rim; lon 0 is the front, 90 the right
//   windows  the two round panes, one each side of the door: `radius`
//            the pane, `depth` how far it stands off the stem, `y` how
//            high its middle is off the ground, `apart` how far round the
//            stem each stands from the front, in degrees; `frame` the ring
//            round it — `thickness` how far past the pane it reaches,
//            `depth` how far IT stands off the stem, `color` its own —
//            `detail` and `clay` as any primitive's (see FORM, CLAY),
//            `light` how the pane is lit (see LIGHT) — lit, and someone
//            is home at night — `color` the pane's
//   door     the arched one on the front, its foot on the ground: `width`
//            across and `height` from its foot to the crown of the arch —
//            a half-round as wide as the door over a straight part —
//            `depth` as a window's, `frame` as a window's or null, `knob`
//            the ball on it — `radius`, `side` which way from its middle it
//            sits (-1 left, 1 right) as a share of the door's half width,
//            `color` its own — `detail`, `clay` and `color` as a window's
//   interior as DWELLING's (see ../objects.js)
export const MUSHROOM_HOUSE = merge(DWELLING, {
  stem: {
    radius: 4.4,
    height: 8.4,
    detail: 2,
    form: { top: { inflate: 0.5 }, feather: 1 },
    clay: { amount: 0.25, seed: 5 },
    sink: 0.1,
    color: PALETTE.mushroomHouse.stem,
  },
  cap: {
    radius: 5.4,
    squash: 0.6,
    detail: 2,
    clay: { amount: 0.3, seed: 9 },
    sink: 0.5,
    color: PALETTE.mushroomHouse.cap,
    gills: { thickness: 0.4, color: PALETTE.mushroomHouse.gills },
    spots: {
      radius: 0.6,
      sink: 0.45,
      detail: 1.5,
      color: PALETTE.mushroomHouse.spots,
      at: [
        { lat: 75, lon: 20 },
        { lat: 40, lon: -50 },
        { lat: 35, lon: 60 },
        { lat: 50, lon: 150 },
        { lat: 25, lon: 210 },
        { lat: 45, lon: 280 },
      ],
    },
  },
  windows: {
    radius: 0.85,
    depth: 0.12,
    y: 4,
    apart: 30,
    detail: 1.5,
    clay: null,
    frame: { thickness: 0.16, depth: 0.2, color: PALETTE.mushroomHouse.frame },
    light: { type: "lit", brightness: 0.35 },
    color: PALETTE.mushroomHouse.pane,
  },
  door: {
    width: 2,
    height: 3.2,
    depth: 0.16,
    detail: 1.5,
    clay: null,
    frame: { thickness: 0.16, depth: 0.1, color: PALETTE.mushroomHouse.frame },
    knob: { radius: 0.12, side: 0.55, color: PALETTE.mushroomHouse.knob },
    color: PALETTE.mushroomHouse.door,
  },
  // Four rooms: the main one, one each side of it and one behind, through
  // archways; the doors inside arched like the one on the stem, and the
  // windows as round as its.
  interior: {
    rooms: 4,
    door: { curve: 1 },
    front: { curve: 1 },
    window: { width: 1.7, height: 1.7, y: 4, topCurve: 1, bottomCurve: 1 },
  },
});

// What can be changed on the mushroom house, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const MUSHROOM_HOUSE_KNOBS = [
  { label: "stem radius", path: "stem.radius", step: 0.2, min: 0.5 },
  { label: "stem height", path: "stem.height", step: 0.5, min: 1 },
  { label: "cap radius", path: "cap.radius", step: 0.2, min: 1 },
  { label: "cap squash", path: "cap.squash", step: 0.05, min: 0.1, max: 1.5 },
  { label: "door width", path: "door.width", step: 0.1, min: 0.5 },
  { label: "door height", path: "door.height", step: 0.1, min: 1 },
];
