import { PALETTE } from "../../world/palette.js";

// A stick lamp: a pole standing on a flat base with a shade on top, lit.
// The pole is as tall as it is set — a tall one for a corner, a short
// one for a table (see `surface` in ../station/Station.jsx: stood on a
// table, it stands on its top). It stands on the ground with its base's
// middle at the origin. Colors come from PALETTE (src/world/palette.js).
//
//   base   the disc it stands on: `radius`, `thickness`, `detail`, `clay`,
//          `color`
//   pole   the stick: `radius`, `height` from the base's top to the
//          shade's underside, `detail`, `clay`, `color`
//   shade  the shade on top: `radius` at its top, `flare` how much wider
//          its foot is (1 straight, 1.5 half again as wide), `height`,
//          `sink` how far the pole runs up into it, `detail`, `clay`,
//          `light` how it is lit (see LIGHT) — lit, it is its own color
//          from any angle and glows — `color`
//   glow   the light it throws on the room, a point of light in the
//          shade: `intensity` in candela — it falls off with the square
//          of the distance, so a pool a few units wide wants tens —
//          `distance` how far it reaches at all, `color`; or null for
//          none. The room is kept dark otherwise (see ROOM.light in
//          interior/objects.js), so this is most of what lights it
export const STICK_LAMP = {
  base: {
    radius: 0.5,
    thickness: 0.12,
    detail: 1,
    clay: null,
    color: PALETTE.stickLamp.base,
  },
  pole: {
    radius: 0.06,
    height: 3.6,
    detail: 1,
    clay: null,
    color: PALETTE.stickLamp.pole,
  },
  shade: {
    radius: 0.45,
    flare: 1.5,
    height: 0.7,
    sink: 0.1,
    detail: 1,
    clay: { amount: 0.2, seed: 51 },
    light: { type: "lit", brightness: 0.5 },
    color: PALETTE.stickLamp.shade,
  },
  glow: { intensity: 28, distance: 18, color: PALETTE.stickLamp.shade },
};

// What can be changed on the stick lamp, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const STICK_LAMP_KNOBS = [
  { label: "height", path: "pole.height", step: 0.2, min: 0.2 },
  { label: "base", path: "base.radius", step: 0.05, min: 0.1 },
  { label: "shade", path: "shade.radius", step: 0.05, min: 0.1 },
  { label: "shade height", path: "shade.height", step: 0.05, min: 0.1 },
  { label: "flare", path: "shade.flare", step: 0.1, min: 1, max: 4 },
  { label: "glow", path: "glow.intensity", step: 1, min: 0, max: 40 },
  { label: "shade color", path: "shade.color.hex", color: true },
  { label: "pole color", path: "pole.color.hex", color: true },
  { label: "base color", path: "base.color.hex", color: true },
];
