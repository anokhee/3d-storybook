import * as THREE from "three";

import { hue, swatchOf } from "../../world/palette.js";

// One clock for every glowing thing, so the breathing is one uniform
// written once a frame rather than one per material — see useGlowing.
export const clock = { value: 0 };

// One material per color-and-look, shared by everything that glows that
// way, no matter where it stands.
const mats = new Map();

// The glass, with a bulb in the middle of it. What the eye sees at any
// point of the shell is the bulb BEHIND it: how far this pixel's line of
// sight passes from the center (`miss`, 0 dead on the bulb, 1 at the rim)
// says how much of the light comes through — scattered light falls off
// away from the bulb, and right over it there is the filament's hot spot.
// The glass itself does two things: it catches the bulb's light on the
// inside of its rim at grazing angles, the way a glass edge lights up,
// and it throws back one soft highlight from the room, which is what
// says "glass" rather than "fog". `frost` is what kind of glass: clear
// (0) keeps the middle empty, the rim and highlight sharp, and lets the
// bulb be seen; frosted (1) spreads the light through the whole skin as a
// soft pool and tints all of it. `brightness` scales the light; `alpha`
// is the skin's opacity in the middle, and the rim runs up to three times
// it. The light is added over whatever is behind, not blended — light
// through glass is additive — so a thin shell still glows at full.
const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vMiss;
  varying vec3 vTint;
  void main() {
    // On an instanced mesh the instance's own matrix sits under the mesh's,
    // and its color tints the skin and the light (see tintGlow); three
    // declares both attributes when the mesh is instanced.
    mat4 model = modelMatrix;
    vTint = vec3(1.0);
    #ifdef USE_INSTANCING
      model = modelMatrix * instanceMatrix;
    #endif
    #ifdef USE_INSTANCING_COLOR
      vTint = instanceColor;
    #endif
    mat4 mvm = viewMatrix * model;
    vec4 mv = mvm * vec4(position, 1.0);
    #ifdef USE_INSTANCING
      vNormal = normalize(mat3(mvm) * normal);
    #else
      vNormal = normalize(normalMatrix * normal);
    #endif
    vView = normalize(-mv.xyz);
    // How far this pixel's line of sight passes from the middle, as a share
    // of the thing's reach at this point — 0 straight through the bulb, 1
    // grazing the rim. The reach is read off the surface point itself, so
    // no radius has to be handed in and one material serves every size.
    vec3 centre = (mvm * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 ray = normalize(mv.xyz);
    vec3 off = centre - dot(centre, ray) * ray;
    float reach = length((model * vec4(position, 1.0)).xyz
                 - (model * vec4(0.0, 0.0, 0.0, 1.0)).xyz);
    vMiss = clamp(length(off) / max(reach, 1e-4), 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 color;
  uniform vec3 glow;
  uniform float alpha;
  uniform float frost;
  uniform float brightness;
  uniform float pulse;
  uniform float rate;
  uniform float time;
  uniform float tintGlow;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vMiss;
  varying vec3 vTint;
  void main() {
    // An instance's color is its skin's; it is its light's too when the
    // light is the thing's own color rather than a named one.
    vec3 skinTint = color * vTint;
    vec3 glowTint = glow * mix(vec3(1.0), vTint, tintGlow);
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float facing = abs(dot(N, V));
    // Clear glass has a thin sharp edge; frost a wide soft one.
    float rim = pow(1.0 - facing, mix(6.0, 3.0, frost));
    float breath = 1.0 + pulse * sin(time * rate * 6.2831853);
    float lum = brightness * breath;

    // The bulb through the glass: scattered light falling off from it,
    // and the filament's hot spot dead over it.
    float near = 1.0 - vMiss;
    // The pool of light through the skin is frost's; clear glass has none.
    float scatter = pow(near, 2.0) * 0.9 * frost;
    float spot = pow(near, 14.0) * 1.2 * frost;
    // Its light caught on the inside of the rim.
    float edge = rim * mix(0.9, 0.5, frost);
    vec3 lit = glowTint * lum * (scatter + spot + edge);

    // The glass: its own tint — barely any when clear — and one highlight
    // from the room, tight on clear glass, soft on frost.
    vec3 L = normalize(vec3(-0.4, 0.8, 0.6));
    float sheen = pow(max(dot(reflect(-L, N), V), 0.0), mix(200.0, 48.0, frost))
                * mix(0.6, 0.35, frost);
    vec3 skin = skinTint * (0.25 + 0.35 * facing) * lum * mix(0.15, 1.0, frost)
              + vec3(sheen);

    float a = clamp(alpha * (1.0 + 2.0 * rim), 0.0, 1.0);
    // Premultiplied: the skin blends by its alpha, the light adds outright.
    gl_FragColor = vec4(skin * a + lit, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// The color the light inside is: the light's own, or the thing's.
export const glowSwatch = (G, own) =>
  G.color ? swatchOf(G.color, "light.color") : own;

// `G` is a resolved `light` of type "glowing" — see lightOf. On an
// instanced mesh every instance's color multiplies `swatch` — pass white
// to let the instances carry the color — and the light's too, unless the
// light names its own.
export const glowingMat = (swatch, G) => {
  const light = glowSwatch(G, swatch);
  const key = `${swatch.hex}|${light.hex}|${G.alpha}|${G.frost}|${G.brightness}|${G.pulse}|${G.rate}`;
  if (!mats.has(key)) {
    mats.set(
      key,
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: hue(swatch) },
          glow: { value: hue(light) },
          alpha: { value: G.alpha },
          frost: { value: G.frost },
          brightness: { value: G.brightness },
          pulse: { value: G.pulse },
          rate: { value: G.rate },
          time: clock,
          tintGlow: { value: G.color ? 0 : 1 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    );
  }
  return mats.get(key);
};
