import { GLOWING } from "../glowing/objects.js";

// How a thing is lit, as `light` in its config. `type` names which
// adjective it wears, and the rest of the fields are that type's own:
//
//   "unlit"    just an object in the world: it shades, and that is all.
//              Takes nothing else
//   "lit"      its own color at any hour and from any angle, with a glow
//              round it — `brightness` how much (1 is full, 0 is out, and
//              in between scales every one of GLOW's numbers below: the
//              halo's reach and strength, the light's intensity and reach),
//              `color` what color that glow is: a swatch or "#rrggbb", or
//              null for the thing's own, so a white bulb can throw a pink
//              glow
//   "glowing"  a translucent shell lit from INSIDE — a lantern, a jelly.
//              Takes GLOWING's fields: `alpha`, `frost`, `brightness`, `color`,
//              `pulse`, `rate`, `showBulb`, `bulb`
//
// A config says only what it changes; `lightOf` fills the rest in from the
// type's defaults, so `{ type: "lit" }` is lit at full in its own color.
export const LIGHT_TYPES = ["unlit", "lit", "glowing"];
export const LIGHT = { type: "unlit", brightness: 1, color: null };

// The defaults a `type` fills in under an authored `light`.
const DEFAULTS = {
  unlit: LIGHT,
  lit: LIGHT,
  glowing: { ...LIGHT, ...GLOWING },
};

export function lightOf(light) {
  const type = light?.type ?? LIGHT.type;
  return { ...(DEFAULTS[type] ?? LIGHT), ...light, type };
}

// The glow round anything lit at full `brightness` — the halo and the
// point light — is GLOW in refactored/lighting.js, with the rest of the
// world's light.
