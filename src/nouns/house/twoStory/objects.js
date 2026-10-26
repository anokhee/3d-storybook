import { PALETTE } from "../../../world/palette.js";
import { merge } from "../../../world/merge.js";
import { HOUSE, windowShapeKnobs } from "../objects.js";

// A two-story house: the house (see HOUSE) grown a floor — its walls
// stood taller, a second row of windows across the upper floor — with a
// garage built onto one side under a lean-to roof, a wide door on its
// front. It stands on the ground with its front facing +z, like the
// house, the pair of them centered together. Colors come from PALETTE
// (src/world/palette.js).
//
//   body, roof, windows, door
//            the house's own, as HOUSE reads them — `windows` the ground
//            floor's two, either side of the door
//   upstairs the upper floor's windows: overrides on `windows` — `y` how
//            high their middles are off the ground — plus `at`, where
//            each stands across from the house's middle, in world units,
//            one window per entry
//   garage   the lean-to on the side: `side` which side it is built on
//            (-1 left, 1 right, seen from the front), `width` how far it
//            reaches out from the house's wall, `depth` front to back —
//            its front flush with the house's — `height` its wall against
//            the house, `sink` how far it settles into the ground, `color`
//            its walls'; `roof` the slab over it, sloping down away from
//            the house: `drop` how far lower its outer edge is than its
//            inner, `thickness` through it, `overhang` how far past the
//            outer wall it hangs, `eaves` past the front and back, `color`
//            its own; `door` the wide one on its front: `width`, `height`,
//            `depth` and `detail` as the house's door, `seams` how many
//            horizontal panels it is rolled up in — `thickness` of the
//            lines between them, `color` theirs — or null for a plain
//            door, `color` the door's
export const TWO_STORY_HOUSE = merge(HOUSE, {
  body: { width: 7, depth: 6.5, wallHeight: 7 },
  upstairs: { y: 5.6, at: [-2, 0, 2] },
  garage: {
    side: 1,
    width: 4,
    depth: 5.5,
    height: 3.4,
    sink: 0.1,
    color: PALETTE.house.walls,
    roof: {
      drop: 0.7,
      thickness: 0.3,
      overhang: 0.5,
      eaves: 0.4,
      color: PALETTE.house.roof,
    },
    door: {
      width: 3.1,
      height: 2.3,
      depth: 0.12,
      detail: 1,
      seams: { count: 4, thickness: 0.05, color: PALETTE.house.garageSeam },
      color: PALETTE.house.garageDoor,
    },
  },
});

// What can be changed on the two-story house, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const TWO_STORY_HOUSE_KNOBS = [
  { label: "width", path: "body.width", step: 0.5, min: 2 },
  { label: "wall height", path: "body.wallHeight", step: 0.5, min: 2 },
  { label: "garage width", path: "garage.width", step: 0.5, min: 1 },
  { label: "garage height", path: "garage.height", step: 0.2, min: 1 },
  { label: "door width", path: "door.width", step: 0.1, min: 0.5 },
  ...windowShapeKnobs(),
  { label: "walls", path: "body.color.hex", color: true },
  { label: "roof", path: "roof.color.hex", color: true },
  { label: "door", path: "door.color.hex", color: true },
];
