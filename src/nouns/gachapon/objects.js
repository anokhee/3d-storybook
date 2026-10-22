import { PALETTE } from "../../world/palette.js";

// A gachapon machine: a lit globe of capsules on a clay drum of a base,
// with the dial, door, coin slot and sticker seated on the drum's front.
// Colors come from PALETTE (src/world/palette.js).
//
//   globe   the solid on top — `shape` any of PRIMITIVES, `radius` its
//           size, `detail` its facet count as a multiple of the shape's
//           (see PRIMITIVES), `form` how it is pushed about (see FORM),
//           `light` how it is lit (see LIGHT)
//   lid     the clay cap on the globe: its top face again, thickened —
//           `depth` how thick, `overhang` how far past the face's edges it
//           reaches all round, `sink` how far down into the globe it sits,
//           `clay` its lumps (see CLAY), `color` its own
//   base    the solid under it — `shape` any of PRIMITIVES again, and the
//           rest as the globe's. A cylinder's `radius` sets its height
//           too, since a primitive cylinder stands PRIMITIVES.cylinder.height
//           radii tall before its `form` pulls it longer or shorter.
//           `sink` how far the base settles onto its feet — the globe
//           rides down with it
//   dial    the coin dial, seated on the base's front — `translation`
//           where it sits: { x, y, z } in world units from the middle of
//           the base's front, x across, y DOWN the way a screen's does
//           (-1 lifts it, 1 lowers it) and z out from the face. Anything
//           else here overrides DIAL for this one, and what is unsaid
//           falls through to it
//   door    the dome the capsule drops out of — `translation` the same
//           way the dial's is; anything else overrides DOOR
//   slot    the coin slot — `translation` the same way; anything else
//           overrides SLOT
//   sticker a sticker beside the slot, a small thin SIGN — `translation`
//           the same way; anything else overrides SIGN
//   label   a sticker on the front of the globe — `translation` the same
//           way, from the middle of the globe's front; anything else
//           overrides SIGN
//   feet    the legs it stands on, spaced round under the base — anything
//           here overrides FEET; `count: 0` sets it flat on the ground
//   bunting the little fence on the lid: `count` short posts stood round
//           its top, a garland strung between them. `turn` degrees round
//           from +x to the first post (45 puts four on the corners), `in`
//           how far in from the lid's edges they stand as a share of its
//           half sizes, `height` how tall they stand off the lid, `sink`
//           how far their feet go into it. `posts` overrides POSTS.post
//           (the look), `cap` POSTS.cap and `capColor` its color, as
//           Posts takes them; `strung` what hangs between them — "garland"
//           or "sign" (see STRUNG_TYPES) — with `garland` overriding
//           GARLAND and `sign` SIGN. `count: 0` for a bare lid. `spire` is the one post in the middle of them with
//           the star on top — `height` how tall it stands off the lid,
//           `posts`, `cap` and `capColor` as the others', the cap any
//           ornament (a star, here, lifted by its own radius to clear the
//           post) — or false for none (false, not null: a null override
//           falls through to this)
export const GACHAPON = {
  globe: {
    shape: "cube",
    radius: 2,
    detail: 1,
    form: {
      center: 0.5,
      feather: 0.4,
      top: { extrude: 0.25, inflate: 1 },
      bottom: { extrude: 0, inflate: 1 },
      widen: 1.2,
    },
    // Clear glass: smooth, and frost 0 keeps the middle empty and the rim
    // sharp — see GLOWING.
    light: {
      type: "glowing",
      showBulb: false,
      alpha: 0.1,
      frost: 0,
      brightness: 0.9,
    },
    color: PALETTE.gachapon.globe,
  },
  lid: {
    depth: 0.4,
    overhang: 0.1,
    sink: 0.05,
    // The same clay as the base, so the two read as one stock.
    clay: { amount: 0.5, seed: 4 },
    color: PALETTE.gachapon.lid,
  },
  base: {
    shape: "cube",
    radius: 2,
    detail: 1,
    sink: 0.15, // onto the feet, so their tops are lost in it
    form: {
      center: 0.3,
      feather: 0.3,
      top: { extrude: 1, inflate: 1 },
      bottom: { extrude: 0, inflate: 1 },
      widen: 1.2,
    },
    clay: { amount: 0.5, seed: 4 },
    color: PALETTE.gachapon.base,
  },
  label: {
    translation: { x: 0, y: 0, z: 0 },
    width: 3,
    height: 3.6,
    depth: 0.12,
    stand: 0.02, // glass is smooth, so it needs hardly any
    color: PALETTE.gachapon.label,
  },
  feet: {
    color: PALETTE.gachapon.feet,
  },
  bunting: {
    count: 4,
    turn: 45,
    in: 0.85,
    height: 0.7,
    sink: 0.05,
    posts: {
      baseRadius: 0.07,
      taper: 0.75,
      sides: 6,
      color: PALETTE.gachapon.buntingPosts,
    },
    cap: { radius: 0.09 },
    capColor: PALETTE.gachapon.buntingCaps,
    strung: "garland",
    sign: {},
    spire: {
      height: 1.6,
      posts: {
        baseRadius: 0.09,
        taper: 0.7,
        sides: 6,
        color: PALETTE.gachapon.buntingPosts,
      },
      cap: {
        shape: "pentagram",
        radius: 0.65,
        translation: { x: 0, y: -0.1, z: 0 },
        rotation: { x: 0, y: 15, z: 0 },
        light: { type: "lit", brightness: 1 },
      },
      capColor: PALETTE.gachapon.star,
    },
    // Scaled down to the lid: a shallow sag, a fine wire, a few small
    // festoons, and no real point lights — see GARLAND.
    garland: {
      sag: 0.12,
      lights: 0,
      wire: { radius: 0.008, segments: 12 },
      festoon: {
        count: 6,
        type: [{ shape: "sphere", radius: 0.1, light: { type: "lit" } }],
        stringLength: 0.05,
      },
    },
  },
  dial: {
    translation: { x: -1.25, y: -1, z: 0 },
  },
  door: {
    translation: { x: 0, y: 0.8, z: 0 },
  },
  slot: {
    translation: { x: -0.25, y: -1, z: 0 },
  },
  sticker: {
    translation: { x: 1.25, y: -1, z: 0 },
    width: 1.15,
    height: 1.6,
    depth: 0.12,
    color: PALETTE.gachapon.sticker,
  },
};
