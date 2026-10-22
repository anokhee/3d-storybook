import * as THREE from "three";

import { hue } from "../../world/palette.js";
import { LIGHTING } from "../../lighting.js";

// The world's cel look: light on anything unlit is stepped into flat bands
// rather than shaded smoothly, so a thing reads as lit clay rather than
// lit plastic, and the shade is tinted toward the night. The bands and the
// tint are dialled with the lights, in LIGHTING (refactored/lighting.js),
// since where the terminator falls is as much the key's as the ramp's.
// The dolls step the same bands, with their own `soften` and `shadow` —
// see LIGHTING.ramp.character. The portrait's cel shot uses its own,
// softer setting — see portrait/snapshot.js.
export const TOON = LIGHTING.ramp;

// The toon gradient, as MeshToonMaterial reads it: `width` texels across
// the lit fraction (dotNL, squeezed to 0..1), each the `tone` of the band
// its `from` puts it in, every step eased over `soften` of the range —
// unfiltered when there is none, so the light snaps between them. Also
// takes the older `{ bands: n, shade }` — n even steps from `shade` up to
// white — which the portrait still uses.
export function toonRamp({ bands, shade, soften = 0, width = 256 } = TOON) {
  if (typeof bands === "number") bands = evenBands(bands, shade);
  const data = new Uint8Array(width);
  for (let i = 0; i < width; i++) {
    const at = (i + 0.5) / width;
    let tone = bands[0].tone;
    for (let k = 1; k < bands.length; k++) {
      const edge = ease(bands[k].from, soften, at);
      tone += (bands[k].tone - bands[k - 1].tone) * edge;
    }
    data[i] = Math.round(255 * tone);
  }
  const tex = new THREE.DataTexture(data, width, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter =
    soften > 0 ? THREE.LinearFilter : THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

// 0 below a step at `from`, 1 above, smoothed over `soften` about it.
function ease(from, soften, at) {
  if (!(soften > 0)) return at >= from ? 1 : 0;
  const t = Math.min(1, Math.max(0, (at - from) / soften + 0.5));
  return t * t * (3 - 2 * t);
}

const evenBands = (n, shade) =>
  Array.from({ length: n }, (_, i) => ({
    from: i / n,
    tone: shade + (1 - shade) * (i / (n - 1)),
  }));

// The same bands, eased the world's way and the dolls' — see
// LIGHTING.ramp — so every unlit thing steps the same way, and every doll
// the same as every other.
const rampFor = (who) =>
  toonRamp({ bands: TOON.bands, soften: TOON[who].soften });
export const RAMP = rampFor("world");
export const CHARACTER_RAMP = rampFor("character");

// The night in the shade, on top of three's toon: where the key's band is
// dark the lit color is mixed toward LIGHTING.shadow's tint — a tint, not
// a darkening, so shade is blue on a tan ground and on green grass alike.
// `celLit` is the key's band where it fell (any lamp's, too, which lifts
// the tint where a lamp reaches), and `floor` is the ramp's darkest tone,
// so the tint is at full only in the darkest band.
//
// A cast shadow is the same darkest band, not a darkening of its own:
// three would multiply the light's color by the shadow factor before
// the band is looked up, which only dims; instead the factor is caught
// off that line into `celShadow` — cut hard, over the ramp's own
// `soften` and no wider, so the edge steps the way the terminator does
// — and the band is dropped to the floor by it. So a shadowed fragment
// is lit exactly as the unlit side of anything, tint and all, and a
// shadow is just more of the dark side. The uniforms are the material's
// own; the source is the same for every one, so they share a program.
// The tint is ONE color shared by every toon material, so the day can
// turn it (see nouns/moon/Moonlight.jsx) and every shade in the world
// follows.
export const SHADOW_TINT = hue(LIGHTING.shadow.tint);
const shadeOf =
  ({ shadow, soften }) =>
  (shader) => {
    shader.uniforms.celTint = { value: SHADOW_TINT };
    shader.uniforms.celAmount = { value: shadow.amount };
    shader.uniforms.celFloor = { value: TOON.bands[0].tone };
    shader.uniforms.celEdge = { value: Math.max(soften, 1e-3) };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <gradientmap_pars_fragment>",
        `uniform vec3 celTint;
       uniform float celAmount;
       uniform float celFloor;
       uniform float celEdge;
       float celLit = 0.0;
       float celShadow = 1.0;
       ${THREE.ShaderChunk.gradientmap_pars_fragment.replace(
         "return vec3( texture2D( gradientMap, coord ).r );",
         `float band = texture2D( gradientMap, coord ).r;
          band = mix( celFloor, band, celShadow );
          celLit = max( celLit, band );
          return vec3( band );`,
       )}`,
      )
      .replace(
        "#include <lights_fragment_begin>",
        THREE.ShaderChunk.lights_fragment_begin.replace(
          /directLight\.color \*= (\( directLight\.visible && receiveShadow \) \? getShadow\( directionalShadowMap\[ i \][^;]*);/,
          "celShadow = smoothstep( 0.5 - celEdge * 0.5, 0.5 + celEdge * 0.5, $1 );",
        ),
      )
      .replace(
        "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
        `float celShade = clamp( ( 1.0 - celLit ) / max( 1.0 - celFloor, 1e-4 ), 0.0, 1.0 );
       vec3 outgoingLight = mix( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse, celTint, celAmount * celShade ) + totalEmissiveRadiance;`,
      );
  };

// What makes a MeshToonMaterial the world's: its ramp and its shade. Spread
// over a JSX <meshToonMaterial>, or given to `toon` below.
export const CEL = {
  gradientMap: RAMP,
  onBeforeCompile: shadeOf(TOON.world),
};
export const CHARACTER_CEL = {
  gradientMap: CHARACTER_RAMP,
  onBeforeCompile: shadeOf(TOON.character),
};

// A fresh toon material in the world's ramp. `color` is anything
// THREE.Color takes; `extra` is the odd per-use flag (a double-sided lip,
// an emissive to raise). Fresh rather than cached, so a caller that
// disposes what it made disposes only its own. `characterToon` is the
// same eased and shaded the dolls' way, for a doll and what it wears.
export const toon = (color, extra = {}) =>
  new THREE.MeshToonMaterial({ color, ...CEL, ...extra });
export const characterToon = (color, extra = {}) =>
  new THREE.MeshToonMaterial({ color, ...CHARACTER_CEL, ...extra });
