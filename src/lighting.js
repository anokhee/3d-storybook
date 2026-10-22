import * as THREE from "three";

import { PALETTE } from "./world/palette.js";

// Every light in the world, and every knob on how things take it, in one
// place. Colors come from PALETTE (src/world/palette.js); this file says
// where the light comes from, how strong it is, and how a surface steps
// it. Per-prop bulbs — a vending machine's, the jetpack's nozzles, a post
// cap's — dial their own brightness in their own configs off GLOW below.
//
// ---- The world's light (see nouns/moon/Moonlight.jsx) ------------------
//
// KEY is the one source that shapes anything: the moon's light, the sun's
// thrown back off its lit face, cast as a directional light. The
// terminator on the planet and on every prop is where it grazes.
//   elevation  degrees above the planet's equator
//   azimuth    degrees round its axis from +x toward +z; the two together
//              are a bearing from the planet's center toward the light,
//              tilted off the moon's own bearing (straight up) so the
//              terminator runs across the planet at a diagonal — if it
//              still lands level on screen, turn `azimuth`
//   intensity  toon materials divide the light by pi, so 3.1 lands the lit
//              band at the color's full strength
//   color      the moon's light
//   distance   only how far out the light is put
//
// AMBIENT is the sky's own: what a night has of light with no moon in it.
// It is everywhere, from no direction, and is all a shaded side gets.
//
// SHADOW tints the shaded side toward the night rather than only leaving
// it dark, so it reads blue whatever color the thing is: where a thing's
// ramp is dark its color is mixed toward `tint` — tinted, not multiplied
// — by the `amount` in RAMP's `world` or `character`, whichever it is.
//
// RAMP is how everything unlit steps the key (see adjectives/unlit/toon.js)
// rather than shading smoothly — one set of bands for the world and the
// dolls alike, so the terminator falls in the same place on a doll as on
// the ground it stands on. Each band starts at `from` — the lit fraction,
// 0 facing dead away from the key, 0.5 grazing it (the terminator
// proper), 1 facing it square — and is `tone` of the lit color, 0 for
// none of the key at all, so only the ambient and the tint show there.
// Two bands is a hard cel split; for a midtone in the foliage, add a band
// between, e.g. { from: 0.5, tone: 0.55 } with the lit band moved out to
// { from: 0.7, tone: 1 }.
//
// What the two are allowed to differ in is `world` and `character`, each
// with its own:
//   soften   how much of that 0..1 each step is eased over, so a
//            terminator over lumpy ground is a soft line rather than a
//            jagged one, and a face is not cut in two by a hard one
//   shadow   { amount } — how far the shaded side is mixed toward
//            SHADOW's tint, so a doll can keep
//            more of its own color in the shade than the ground does
// Worn things (the helmet, the jetpack) shade as the doll does.
export const LIGHTING = {
  key: {
    elevation: 52,
    azimuth: 20,
    intensity: 1.25,
    color: PALETTE.moon.light,
    distance: 70,
  },
  ambient: {
    intensity: 0.75,
    color: PALETTE.sky.ambient,
  },
  shadow: {
    tint: PALETTE.sky.shadow,
  },
  ramp: {
    bands: [
      { from: 0, tone: 0.15 },
      { from: 0.14, tone: 0.24 },
      { from: 0.34, tone: 0.55 },
      { from: 0.56, tone: 1 },
    ],
    world: {
      soften: 0.02,
      shadow: { amount: 0.6 },
    },
    character: {
      soften: 0.02,
      shadow: { amount: 0.3 },
    },
  },
};

const rad = (deg) => (deg * Math.PI) / 180;

// A bearing as a unit vector: `elevation` degrees up from level and
// `azimuth` round, in the frame whose up is `up` — the ground's under the
// doll, so the light stands at the same height over wherever it is (see
// nouns/moon/Moonlight.jsx). Round is measured from east: the world's y
// carried onto the ground's plane, or its x where that fails at the
// poles. Into `target`.
const _east = new THREE.Vector3();
const _north = new THREE.Vector3();
export function bearingOn(up, { elevation, azimuth }, target) {
  _east.set(0, 1, 0).cross(up);
  if (_east.lengthSq() < 1e-6) _east.set(1, 0, 0).cross(up);
  _east.normalize();
  _north.crossVectors(up, _east);
  const flat = Math.cos(rad(elevation));
  return target
    .copy(up)
    .multiplyScalar(Math.sin(rad(elevation)))
    .addScaledVector(_east, flat * Math.cos(rad(azimuth)))
    .addScaledVector(_north, flat * Math.sin(rad(azimuth)))
    .normalize();
}

// The key's bearing over the world's own up, for anything that hangs off
// it as a fixed direction.
export const KEY_DIR = bearingOn(
  new THREE.Vector3(0, 1, 0),
  LIGHTING.key,
  new THREE.Vector3(),
);

// ---- The day (see nouns/moon/Moonlight.jsx) ---------------------------
//
// SUN is the world's light by day: as the game's `daylight` is turned up
// (see game/store.js) it comes up from SUN_DIR — the same sun the moon
// shows a phase to — and the moon's key goes down with it, so the
// terminator swings from the moon's bearing to the sun's; the ambient
// goes over from the night's to `ambient`, the sky's fill, and the shade
// from SHADOW's tint to `shadow`, a sunlit shadow's blue.
//   intensity  the sun's at full day, on the same footing as the key's
//   color      its light
//   elevation, azimuth  where it stands over the ground under the doll, as
//              the key's (see bearingOn) — the sun you can see hangs at
//              SUN_DIR regardless
//   distance   only how far out the light is put
export const SUN = {
  intensity: 1.9,
  color: PALETTE.sun.light,
  elevation: 62,
  azimuth: -35,
  distance: 30,
  ambient: { intensity: 1, color: PALETTE.sky.dayAmbient },
  shadow: { tint: PALETTE.sky.dayShadow },
};

// ---- Cast shadows (see nouns/moon/Moonlight.jsx) ------------------------
//
// The key and the sun each cast, whichever is up. A cast shadow is not a
// darkening of its own: in the toon shader (adjectives/unlit/toon.js) a
// shadowed fragment is dropped to the ramp's darkest band — the same
// step the terminator falls to — with the shadow factor cut hard over
// the ramp's own `soften`, so a shadow reads as more of the dark side
// and nothing else. Each light's shadow camera is fitted to the whole
// ball, aimed at its center: `reach` is the half-size of that box in
// world units, the planet's radius plus room for what stands on it, and
// `near` and `far` its depth either side, from the light `distance` out.
// `mapSize` is the depth texture's side; `bias` and `normalBias` keep the
// shadow off the caster's own lit face without it lifting away. Casters
// are the dolls, the trees and every prop; the grass and the flowers —
// fields of thousands, drawn again into the map — only receive (see
// GroundCover.jsx).
export const SHADOWS = {
  mapSize: 2048,
  bias: -0.0003,
  normalBias: 0.05,
  camera: { reach: 28, near: 1, far: 60 },
};

// ---- The moon's own light (see nouns/moon/Moon.jsx) --------------------
//
// The sun, which is never drawn: `from` is a bearing, in world axes, from
// the moon toward it. It lights the moon and nothing else — the planet is
// on its night side — so the moon shows a phase: lit toward the sun,
// stepped through RAMP, and on the far side only `night` of its white,
// the little the planet throws back. That shading is baked into the
// moon's mesh, not cast by a light in the scene.
export const MOON_SUN = {
  from: [-0.5, -0.35, -1],
  night: 0.16,
};
export const SUN_DIR = new THREE.Vector3(...MOON_SUN.from).normalize();

// ---- What glows (see adjectives/lit/Glow.jsx) --------------------------
//
// The glow round anything lit at full `brightness` (see LIGHT in
// adjectives/lit/objects.js): a halo smeared over it, and — for the few
// that ask — a real point light. A thing's own `light.brightness` scales
// all four; its config may also state its own `cast` in place of `light`
// (a vending machine's bulb, the jetpack's nozzles).
//   halo.reach      halo width as a multiple of the thing's radius
//   halo.alpha      halo strength
//   light.intensity the point light's, at full brightness
//   light.distance  how far it reaches — bounded, since an unbounded point
//                   light lifts the whole ball
export const GLOW = {
  halo: {
    reach: 4.5,
    alpha: 0.25,
  },
  light: {
    intensity: 1,
    distance: 16,
  },
};

// ---- Superspace (see superspace/SuperSpace.jsx) ------------------------
//
// Past the sky there is no moon: the star in the middle is the light, a
// point light of `star` intensity in the star's color, unbounded, and an
// `ambient` of white so the heads' far sides are not lost.
export const SUPERSPACE_LIGHT = {
  star: 2,
  ambient: 0.25,
};
