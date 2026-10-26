import { PALETTE } from "../../world/palette.js";
import { merge } from "../../world/merge.js";

// What every house has, whatever it looks like — the plain one below,
// the two-story, the mushroom, the trailer, the cupcake, each in its own
// folder here and each `merge`d over this — so they all open the same
// way and onto the same kind of inside. A variant overrides what it
// must (the mushroom's door is arched) and inherits the rest.
//
//   door     the one on the front, in the middle: `width`, `height` and
//            `depth` as a window's, `knob` the ball on it — `radius`,
//            `side` which way from the door's middle it sits (-1 left, 1
//            right) as a share of the door's half width, `color` its own
//            — `detail`, `clay` and `color` as a window's
//   interior what is inside, behind the door (see interior/): `rooms` is
//            how many — 1 is the one plain room, more are built onto the
//            sides of the first in turn, each through an archway — or a
//            list of them, the first the one the door opens on and each
//            after it on a `side` of the first, every field as ROOM.room
//            has it (see interior/objects.js), so `{}` is a room of the
//            usual size, each with its `objects`, stood in it the way a
//            station's are (`type`, `position` as fractions of that
//            room, `rotation`, `config`). A house's own and no other's.
//            `arch` and `door` are the ways between its rooms, the same
//            throughout the house — each room past the first lists the
//            ones through the wall it was built onto, its `ways` (see
//            interior/objects.js) — an archway `width` across and `height`
//            to the top of its curve, `curve` how round that is (1 a
//            half-round, 0 flat); a doorway `width` across and `height`
//            tall, `curve` the same, the house's own door hung in it,
//            made that shape (see interior/Opening.jsx) — and so is a
//            door out a room lists among its `openings`. `front` is the
//            front door, on its own: the house's own door drawn again
//            at THIS size and shape, not the outside's — `width`,
//            `height` and `curve` as a doorway's, and `color` its own,
//            or null for the door's. `window` is the one on each
//            outside wall, the house's own drawn again: `width` and
//            `height` the pane, `y` how high its middle is off the
//            floor, `topCurve` and `bottomCurve` how its top and bottom
//            edges bow (1 a half-round, 0 flat — both 1 on a square one
//            is a round window), `style` "plain" for one clear pane or
//            "pane" for `panes` of them, divided by bars (see Opening).
//            `frame` is the moulding round every one of them indoors —
//            doorways, archways and windows alike — a band `thickness`
//            wide following the opening's edge, standing `depth` off
//            the wall, in its own `color`; or null for none (see
//            interior/Molding.jsx). Together, the house's architecture,
//            as the edit mode indoors calls it (see
//            interior/DwellingPanel.jsx)
// How tall the black cat stands (the library's reference size): each house
// is scaled by `scale` so its front door is this tall, the door the
// character walks past at its own height.
export const CAT_HEIGHT = 1.31;

export const DWELLING = {
  door: {
    width: 1.4,
    height: 2.4,
    depth: 0.16,
    detail: 1,
    clay: null,
    knob: { radius: 0.11, side: 0.6, color: PALETTE.house.knob },
    color: PALETTE.house.door,
  },
  interior: {
    rooms: 1,
    arch: { width: 5, height: 4, curve: 1 },
    door: { width: 3.2, height: 5, curve: 0 },
    front: { width: 3.2, height: 5, curve: 0, color: null },
    window: {
      width: 1.3,
      height: 1.3,
      y: 2.5,
      topCurve: 0,
      bottomCurve: 0,
      style: "pane",
      panes: 4,
    },
    frame: { thickness: 0.28, depth: 0.08, color: PALETTE.house.molding },
  },
};

// A house: the one a child draws — a pentagon, a square with a gable on
// top, pulled out into a solid — with two slabs laid on the gable's slopes
// for a roof, a beam along the ridge where they meet, and two windows and
// a door on the front. It stands on the ground with its front facing +z,
// like a bench. Colors come from PALETTE (src/world/palette.js).
//
//   body     the pentagon, extruded: `width` across the front, `depth`
//            front to back, `wallHeight` the square part from the ground
//            to the eaves and `gableHeight` the triangle from the eaves to
//            the ridge, all in world units, `sink` how far it settles into
//            the ground rather than balancing on it, `color` its own
//   roof     the two slabs on the slopes: `thickness` through them,
//            `overhang` how far past the eaves they hang down the slope,
//            `eaves` how far past the front and back faces they stick out,
//            `color` theirs; `ridge` the beam where they meet — `radius`
//            its girth, `color` its own — or null for none
//   windows  the two on the front, one each side of the door: `type`
//            "square", "arched" or "round" (see Panes.jsx), `columns` and
//            `rows` of panes the glass is barred into (1 and 1 for none),
//            `bar` how thick the bars are (default 0.06), `width` and
//            `height` the pane, `depth` how far it stands off the wall,
//            `y` how high its middle is off the ground, `apart` how far
//            each stands from the house's middle, across; `frame` the
//            bezel round the pane — `thickness` how wide its bars are,
//            `depth` how far IT stands off the wall, `color` its own —
//            `detail` and `clay` as any primitive's (see FORM, CLAY),
//            `light` how the pane is lit (see LIGHT) — lit, and the house
//            has someone home at night — `color` the pane's
//   door, interior  as DWELLING's
export const HOUSE = merge(DWELLING, {
  scale: CAT_HEIGHT / 2.4,
  body: {
    width: 6,
    depth: 6,
    wallHeight: 4,
    gableHeight: 2.4,
    sink: 0.1,
    color: PALETTE.house.walls,
  },
  roof: {
    thickness: 0.35,
    overhang: 0.6,
    eaves: 0.5,
    color: PALETTE.house.roof,
    ridge: { radius: 0.3, color: PALETTE.house.ridge },
  },
  windows: {
    type: "square",
    columns: 2,
    rows: 2,
    width: 1.3,
    height: 1.3,
    depth: 0.12,
    y: 2.5,
    apart: 1.9,
    detail: 1,
    clay: null,
    frame: { thickness: 0.18, depth: 0.2, color: PALETTE.house.frame },
    light: { type: "lit", brightness: 0.35 },
    color: PALETTE.house.pane,
  },
});

// The shapes a window comes in (see Panes.jsx), and how each is indoors:
// the curve of its top and bottom edges (see INDOOR_WINDOW below).
export const WINDOW_TYPES = ["square", "arched", "round"];
const WINDOW_CURVES = {
  square: { topCurve: 0, bottomCurve: 0 },
  arched: { topCurve: 1, bottomCurve: 0 },
  round: { topCurve: 1, bottomCurve: 1 },
};

// The window as it is indoors: the house's own `interior.window`, shaped
// by the `type` of the one outside.
export const indoorWindowOf = (indoor, W) => ({
  ...indoor,
  ...WINDOW_CURVES[W.type ?? "square"],
});

// The knobs for a house's windows' shape, where they are at `path`
// ("windows" on most, "window" on the trailer).
export const windowShapeKnobs = (path = "windows") => [
  { label: "window type", path: `${path}.type`, options: WINDOW_TYPES },
  { label: "window width", path: `${path}.width`, step: 0.1, min: 0.4 },
  { label: "window height", path: `${path}.height`, step: 0.1, min: 0.4 },
  {
    label: "window panes across",
    path: `${path}.columns`,
    step: 1,
    min: 1,
    max: 6,
  },
  { label: "window panes down", path: `${path}.rows`, step: 1, min: 1, max: 6 },
];

// What can be changed on a house, from the panel: the editor's fields, the door, and its colors.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const HOUSE_KNOBS = [
  { label: "width", path: "body.width", step: 0.5, min: 2 },
  { label: "depth", path: "body.depth", step: 0.5, min: 2 },
  { label: "wall height", path: "body.wallHeight", step: 0.5, min: 1 },
  { label: "gable (roof pitch)", path: "body.gableHeight", step: 0.5, min: 0 },
  { label: "roof overhang", path: "roof.overhang", step: 0.1, min: 0 },
  { label: "door width", path: "door.width", step: 0.1, min: 0.5 },
  ...windowShapeKnobs(),
  { label: "windows apart", path: "windows.apart", step: 0.1, min: 0.5 },
  { label: "walls", path: "body.color.hex", color: true },
  { label: "roof", path: "roof.color.hex", color: true },
  { label: "ridge", path: "roof.ridge.color.hex", color: true },
  { label: "door", path: "door.color.hex", color: true },
  { label: "window frames", path: "windows.frame.color.hex", color: true },
];

// What can be changed on one of the house's windows (HOUSE.windows) on its
// own, for the catalog's window entry (stories/helpers/knobs.js)
export const WINDOW_KNOBS = {
  width: { path: "width", range: [0.5, 3, 0.1] },
  height: { path: "height", range: [0.5, 3, 0.1] },
  frameThickness: {
    path: "frame.thickness",
    range: [0.05, 0.5, 0.01],
    name: "frame",
  },
  lit: { path: "light.type", boolean: true, on: "lit", off: "unlit" },
  brightness: { path: "light.brightness", range: [0, 1, 0.05] },
  paneColor: { path: "color", color: true, name: "pane color" },
  frameColor: { path: "frame.color", color: true, name: "frame color" },
};

// The window as it is indoors (see src/interior/Opening.jsx): the house's
// own window — its colour, light, depth and bezel (HOUSE.windows) — at
// the size and shape the house's architecture gives it
// (DWELLING.interior.window): `width` and `height` the pane, `y` how
// high its middle is off the floor, `topCurve` and `bottomCurve` how
// its top and bottom bow (1 a half-round, 0 flat — both 1 on a square
// one is a round window), `style` "plain" for one clear pane or "pane"
// for `panes` of them, divided by bars. `trim` is the moulding ringing
// it (DWELLING.interior.frame, see src/interior/Molding.jsx); its own
// bezel takes the trim's colour, as it does indoors. This is what the
// game's Pane (interior/Interior.jsx, paneOf) draws on each face of a
// wall; here it stands on its own for the catalog's window entry.
export const INDOOR_WINDOW = {
  ...HOUSE.windows,
  width: DWELLING.interior.window.width,
  height: DWELLING.interior.window.height,
  y: DWELLING.interior.window.y,
  topCurve: DWELLING.interior.window.topCurve,
  bottomCurve: DWELLING.interior.window.bottomCurve,
  style: DWELLING.interior.window.style,
  panes: DWELLING.interior.window.panes,
  knob: null,
  trim: DWELLING.interior.frame,
};

// What can be changed on it: the edit mode indoors' window fields
// (interior/DwellingPanel.jsx, WAY_PARAMS.window) and its trim's, then
// the pane's own light and colour (stories/helpers/knobs.js)
export const WINDOW_STYLES = ["plain", "pane"];
export const INDOOR_WINDOW_KNOBS = {
  width: { path: "width", range: [0.4, 4, 0.1] },
  height: { path: "height", range: [0.4, 4, 0.1] },
  topCurve: { path: "topCurve", range: [0, 1, 0.1], name: "top curve" },
  bottomCurve: {
    path: "bottomCurve",
    range: [0, 1, 0.1],
    name: "bottom curve",
  },
  style: { path: "style", options: WINDOW_STYLES },
  panes: { path: "panes", range: [1, 12, 1] },
  frameThickness: {
    path: "frame.thickness",
    range: [0, 0.5, 0.01],
    name: "bezel",
  },
  trimThickness: {
    path: "trim.thickness",
    range: [0, 0.8, 0.02],
    name: "trim",
  },
  trimDepth: { path: "trim.depth", range: [0, 0.3, 0.01], name: "trim depth" },
  lit: { path: "light.type", boolean: true, on: "lit", off: "unlit" },
  brightness: { path: "light.brightness", range: [0, 1, 0.05] },
  paneColor: { path: "color", color: true, name: "pane color" },
  trimColor: { path: "trim.color", color: true, name: "trim color" },
};
