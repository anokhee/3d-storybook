import { PALETTE } from "../../world/palette.js";

// A vending machine: one tall unlit body with a glass case let into its
// front — a recess cut back into the body, lit from inside, with shelves
// across it and a label on the lip of each — the door under the case, and
// the sticker, coin slot and dial in a column beside it, the same parts
// the gachapon wears, and a sign across the top. Colors come from PALETTE
// (src/world/palette.js).
//
//   body     the solid — `shape` any of PRIMITIVES, `radius` its size,
//            `detail` its facet count as a multiple of the shape's, `form`
//            how it is pushed about (see FORM), `sink` how far it settles
//            into the ground rather than balancing on it, `color` its own
//   window   the case, cut into the body's front: `translation` { x, y, z }
//            in world units from the middle of the body's front, x across,
//            y DOWN the way a screen's does (-1 lifts it, 1 lowers it) and
//            z out from the face, at the middle of the opening; `width`
//            and `height` the opening, `depth` how far back into the body
//            it goes. The body is not drawn where the opening is — the
//            cut is a stencil, not a hole in the clay — so the parts
//            inside are what shows through it:
//              frame   the bezel round the opening, standing proud of the
//                      face: `thickness` how wide its bars are, `stand`
//                      how far they stand off the face, `sink` how far in
//                      past it they go, `lip` how far they overlap the
//                      opening to hide its seam; `clay` and `color` theirs
//              walls   the inside of the recess — `color` its own
//              panel   the lit sheet at the back, set `in` from the
//                      walls all round, its own color and full bright at
//                      any hour: what makes the case read as lit
//              lamp    the tube under the top, `radius` thick, `in` short
//                      of the walls each side, `drop` below the top and
//                      `back` behind the opening; `light` how the tube is
//                      lit (see LIGHT) and `cast` { intensity, distance }
//                      the real light it throws on the shelves and out of
//                      the front, or null for none
//              shelves `count` of them, evenly up the recess between
//                      `margin.bottom` off its floor and `margin.top`
//                      under its top; each `thickness` thick, `in` short
//                      of the walls each side and `setback` behind the
//                      opening; `clay` and `color` theirs. `count: 0` for
//                      none
//              labels  on the front lip of every shelf, `count` across
//                      it, spread evenly, each `width` by `height`, its
//                      top `drop` below the shelf's; anything else here
//                      overrides SIGN (a `clay` of false is flat paper)
//              stacks  the stacks of stickers on every shelf, `count` across
//                      it, spread evenly the way the labels are, each
//                      stood on edge facing the glass and stacked BACK
//                      from `back` behind the shelf's front lip, one
//                      sheet's thickness behind the last; `many` is how
//                      many a stack holds, { min, max }, each stack dealt
//                      its own count in turn so they are not all one
//                      depth; `lean` how many degrees they tip back off
//                      upright, `scatter` how far each may stand off the
//                      one in front, `twist` how many degrees it may be
//                      turned; `colors` the swatches dealt round the
//                      stacks in turn, and `sticker` the sheet itself —
//                      `width` across the shelf, `height` up and `depth`
//                      how thick, anything else overriding SIGN.
//                      `count: 0` for none
//              glass   the pane over the opening, seated in the frame —
//                      anything here overrides SIGN; its `light` should
//                      stay "glowing", which is what makes it glass
//   door     the flap the can drops out of — a flat plate, the front half
//            of a cube squashed nearly flat, a shade darker than the body —
//            seated on the body's front:
//            `translation` { x, y, z } from the middle of the body's front
//            the same way the window's is; anything else here overrides
//            DOOR for this one, and what is unsaid falls through to it
//   sticker  a sticker on the front, a small thin SIGN — `translation` the
//            same way; anything else overrides SIGN
//   slot     the coin slot — `translation` the same way; anything else
//            overrides SLOT
//   dial     the coin dial — `translation` the same way; anything else
//            overrides DIAL
//   marquee  the sign over the top: two posts stood on the body's crown
//            with the sign strung between them. `in` how far in from the
//            crown's sides they stand as a share of its half width,
//            `back` how far back from its front edge as a share of its
//            half depth, `height` how tall they stand off the crown,
//            `sink` how far their feet go into it; `posts`, `cap` and
//            `capColor` as Posts takes them; `strung` what hangs between
//            them — "sign" or "garland" (see STRUNG_TYPES) — with `sign`
//            overriding SIGN and `garland` GARLAND. `count: 0` for none
//   feet     the legs it stands on, spaced round under the body — anything
//            here overrides FEET; `count: 0` sets it flat on the ground
export const VENDING_MACHINE = {
  body: {
    shape: "cube",
    radius: 1.8,
    detail: 1,
    sink: 0.15, // onto the feet, so their tops are lost in it
    form: {
      center: 0.3,
      feather: 0.3,
      top: { extrude: 3.5, inflate: 1 },
      bottom: { extrude: 0, inflate: 1 },
      widen: 2.2,
    },
    // Thrown in clay like a doll — see CLAY in ../primitive/objects.js.
    clay: { amount: 0.4, seed: 6 },
    color: PALETTE.vendingMachine.body,
  },
  feet: {
    color: PALETTE.vendingMachine.feet,
  },
  window: {
    translation: { x: -0.75, y: -0.9, z: 0 },
    width: 4.2,
    height: 5.2,
    depth: 1.3,
    frame: {
      thickness: 0.28,
      stand: 0.2,
      sink: 0.06,
      lip: 0.06,
      clay: { amount: 0.3, seed: 21 },
      color: PALETTE.vendingMachine.frame,
    },
    walls: {
      color: PALETTE.vendingMachine.walls,
    },
    panel: {
      in: 0.14,
      color: PALETTE.vendingMachine.panel,
    },
    lamp: {
      radius: 0.09,
      in: 0.2,
      drop: 0.22,
      back: 0.3,
      light: { type: "lit", brightness: 0.6 },
      cast: { intensity: 3, distance: 9 },
      color: PALETTE.vendingMachine.lamp,
    },
    shelves: {
      count: 3,
      margin: { top: 1.4, bottom: 0.55 },
      thickness: 0.18,
      in: 0.08,
      setback: 0.16,
      clay: false,
      color: PALETTE.vendingMachine.shelves,
    },
    labels: {
      count: 3,
      width: 0.62,
      height: 0.4,
      depth: 0.06,
      stand: 0.02,
      drop: 0.02,
      clay: { amount: 0.2, seed: 22 },
      color: PALETTE.vendingMachine.labels,
    },
    stacks: {
      count: 3,
      back: 0.12,
      many: { min: 3, max: 7 },
      lean: 8,
      scatter: 0.03,
      twist: 5,
      colors: PALETTE.vendingMachine.stickers,
      sticker: {
        width: 0.7,
        height: 0.55,
        depth: 0.075,
        stand: 0,
        clay: false,
      },
    },
    glass: {
      depth: 0.08,
      stand: 0.04,
      clay: false,
      light: {
        type: "glowing",
        showBulb: false,
        alpha: 0.14,
        frost: 0.3,
        brightness: 0.5,
        pulse: 0,
      },
      color: PALETTE.vendingMachine.glass,
    },
  },
  door: {
    translation: { x: -0.75, y: 3.4, z: 0 },
    shape: "cube",
    radius: 0.8,
    form: { widen: 3, deepen: 0.15 },
    color: PALETTE.vendingMachine.door,
  },
  sticker: {
    translation: { x: 2.8, y: -2, z: 0 },
    width: 1.15,
    height: 3,
    depth: 0.12,
  },
  slot: {
    translation: { x: 2.8, y: 0.5, z: 0 },
  },
  dial: {
    translation: { x: 2.8, y: 2, z: 0 },
  },
  marquee: {
    count: 2,
    in: 0.9,
    back: 0.4,
    height: 2.3,
    sink: 0.1,
    posts: {
      baseRadius: 0.12,
      taper: 0.75,
      sides: 6,
      color: PALETTE.vendingMachine.marqueePosts,
    },
    cap: { radius: 0.16, light: "unlit" },
    capColor: PALETTE.vendingMachine.marqueeCaps,
    strung: "sign",
    sign: { width: "span", height: 1.8 },
    garland: {},
  },
};

// The knobs the catalog shows for a vending machine (stories/helpers/knobs.js)
export const VENDING_MACHINE_KNOBS = {
  bodyColor: { path: ["body.color", "feet.color"], color: true, name: "body color" },
  doorColor: { path: "door.color", color: true, name: "door color" },
  panelColor: { path: "window.panel.color", color: true, name: "lit panel color" },
  width: { path: "body.width", range: [2, 8, 0.1] },
  height: { path: "body.height", range: [3, 9, 0.1] },
  shelves: { path: "window.shelves.count", range: [1, 6, 1] },
};
