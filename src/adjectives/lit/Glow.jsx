import * as THREE from "three";

import { hue, swatchOf } from "../../world/palette.js";
import { haloTexture } from "./halo.js";
import { LIGHT } from "./objects.js";
import { GLOW } from "../../lighting.js";

// The color a `light` glows: its own `color`, or the `own` swatch of the
// thing it is on where it names none.
export const lightSwatch = (light, own) =>
  light?.color ? swatchOf(light.color, "light.color") : own;

// One halo material per color and strength — the same color at two alphas
// is two smears — shared by everything that glows that color.
const haloMats = new Map();
const haloMat = (swatch, alpha) => {
  const key = `${swatch.hex}@${alpha}`;
  if (!haloMats.has(key)) {
    haloMats.set(
      key,
      new THREE.SpriteMaterial({
        map: haloTexture(swatch, alpha),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
  }
  return haloMats.get(key);
};

// What makes something read as lit, dropped in beside it: a halo sized off
// `radius`, and — when `casts` — a real point light, bounded to
// GLOW.light.distance. Both are the color of `light.color`, or of `swatch`
// — the thing itself — where that is null; `light.brightness` scales all of
// it, 1 full and 0 out. Knows nothing about what it is glowing round, so it
// goes on a bulb, a cap, a window, whatever. Real lights are dear, which is
// why `casts` is a separate ask.
export default function Glow({ swatch, radius, light = LIGHT, casts = false }) {
  const brightness = light.brightness ?? LIGHT.brightness;
  if (!(brightness > 0)) return null;
  const color = lightSwatch(light, swatch);
  const { halo, light: cast } = GLOW;
  return (
    <>
      <sprite
        material={haloMat(color, halo.alpha * brightness)}
        scale={radius * halo.reach * brightness * 2}
      />
      {casts && (
        <pointLight
          color={hue(color)}
          intensity={cast.intensity * brightness}
          distance={cast.distance * brightness}
        />
      )}
    </>
  );
}
