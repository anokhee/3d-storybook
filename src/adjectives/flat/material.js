// THE FLAT LOOK, from the albatross project: crisp, matte light with no
// shine, the key light wrapped a little round past side-on so nothing goes
// black, and the shadow's edge pushed to a hard line.
//
// Albatross patches three's shader chunks globally, once, at import. Here
// the same patch is applied PER MATERIAL (in onBeforeCompile), so it only
// touches the flat materials and leaves the toon ones exactly as they are.
// The stage swaps a mesh's toon material for one of these when the toolbar
// says "Flat", and swaps it back for "Toon" (see .storybook/stage.jsx).
//
// The numbers (see FLAT) are the albatross defaults:
//   wrap    0 = true falloff (dark exactly side-on), 1 = still half lit side-on
//   bands   the lit side cut into this many flat tones; under 2, smooth
//   edge    where the shade starts, as a share of the wrapped light
//   soft    how wide each band's edge is (0 = a hard line)
//   shadow  0 = the soft shadow map as it is, 1 = a hard edge
//   sky     0 = skylight blended at the horizon, 1 = split into sky/ground
import * as THREE from "three";
import { hue } from "../../world/palette.js";

export const FLAT = {
  wrap: 0.4,
  bands: 1,
  edge: 0.04,
  soft: 0,
  shadow: 1,
  sky: 0.07,
};
const KEYS = ["wrap", "bands", "edge", "soft", "shadow", "sky"];

// One uniform array every flat material shares by reference, so changing
// FLAT and calling setFlat() reaches them all on the next frame.
const u = new Float32Array(KEYS.length);
export function setFlat(partial = {}) {
  Object.assign(FLAT, partial);
  KEYS.forEach((k, i) => (u[i] = FLAT[k]));
}
setFlat();

const swap = (src, from, to, what) => {
  if (!src.includes(from))
    throw new Error(`flat/material.js: three's shader has changed; cannot find ${what}`);
  return src.replace(from, to);
};

const PRELUDE = `uniform float uFlat[${KEYS.length}];
#define FLAT_WRAP uFlat[0]
#define FLAT_BANDS uFlat[1]
#define FLAT_EDGE uFlat[2]
#define FLAT_SOFT max( uFlat[3], 0.001 )
#define FLAT_SHADOW uFlat[4]
#define FLAT_SKY uFlat[5]
float flatBands( float x ) {
	if ( FLAT_BANDS < 2.0 ) return x;
	float n = FLAT_BANDS - 1.0;
	float span = max( 1.0 - FLAT_EDGE, 0.001 );
	float t = ( x - FLAT_EDGE ) / span * n;
	float s = FLAT_SOFT / span * n;
	float q = 0.0;
	for ( int k = 0; k < 7; k ++ ) if ( float( k ) < n ) q += smoothstep( float( k ) - s, float( k ) + s, t );
	return q / n;
}
float flatShadow( float s ) {
	float w = mix( 0.5, 0.01, FLAT_SHADOW );
	return mix( s, smoothstep( 0.5 - w, 0.5 + w, s ), FLAT_SHADOW );
}
`;

// The chunks, patched. Done once and cached: the same text for every material.
let patched = null;
function chunks() {
  if (patched) return patched;
  const C = THREE.ShaderChunk;
  let pars = PRELUDE + C.lights_pars_begin;
  pars = swap(pars,
    "float hemiDiffuseWeight = 0.5 * dotNL + 0.5;",
    "float hemiDiffuseWeight = 0.5 * dotNL + 0.5;\n\t\themiDiffuseWeight = mix( hemiDiffuseWeight, smoothstep( 0.5 - FLAT_SOFT, 0.5 + FLAT_SOFT, hemiDiffuseWeight ), FLAT_SKY );",
    "the skylight's horizon");
  // The key light's shadow, crisped. Matched loosely: the getShadow
  // argument list differs between three versions.
  const shadowLine = /directLight\.color \*= \( directLight\.visible && receiveShadow \) \? (getShadow\( directionalShadowMap\[ i \][^;]*?\)) : 1\.0;/;
  if (!shadowLine.test(C.lights_fragment_begin))
    throw new Error("flat/material.js: three's shader has changed; cannot find the directional shadow line");
  const begin = C.lights_fragment_begin.replace(shadowLine,
    "directLight.color *= ( directLight.visible && receiveShadow ) ? flatShadow( $1 ) : 1.0;");
  let phys = C.lights_physical_pars_fragment;
  phys = swap(phys,
    "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );",
    "float dotNL = flatBands( saturate( ( dot( geometryNormal, directLight.direction ) + FLAT_WRAP ) / ( 1.0 + FLAT_WRAP ) ) );",
    "the key light's falloff");
  // No shine, from the key or the sky.
  phys = swap(phys, "reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );", "", "direct specular");
  phys = swap(phys, "reflectedLight.indirectSpecular += radiance * singleScattering;", "", "indirect specular");
  phys = swap(phys, "reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;", "", "multi-scatter specular");
  phys = swap(phys,
    "vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );",
    "vec3 diffuse = material.diffuseColor;", "the skylight's diffuse");
  patched = { pars, begin, phys };
  return patched;
}

const onBeforeCompile = (shader) => {
  const { pars, begin, phys } = chunks();
  shader.uniforms.uFlat = { value: u };
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <lights_pars_begin>", pars)
    .replace("#include <lights_fragment_begin>", begin)
    .replace("#include <lights_physical_pars_fragment>", phys);
};

// A flat material in a color. `like` is the material it stands in for:
// its transparency, opacity and sidedness are copied so glass stays glass.
const mats = new Map();
export function flatMat(color, like = null) {
  const c = color.isColor ? color : hue(color);
  // Vertex colors and a map are the material's own painting (the planets'
  // bands, the shells' stripes), so they come along too.
  const key = `${c.getHexString()}|${like?.transparent ? 1 : 0}|${like?.opacity ?? 1}|${like?.side ?? 0}|${like?.depthWrite ?? true}|${like?.vertexColors ? 1 : 0}|${like?.map?.uuid ?? ""}`;
  if (!mats.has(key)) {
    const m = new THREE.MeshStandardMaterial({
      color: c,
      roughness: 1,
      metalness: 0,
      transparent: like?.transparent ?? false,
      opacity: like?.opacity ?? 1,
      side: like?.side ?? THREE.FrontSide,
      depthWrite: like?.depthWrite ?? true,
      vertexColors: like?.vertexColors ?? false,
      map: like?.map ?? null,
    });
    m.onBeforeCompile = onBeforeCompile;
    // Different onBeforeCompile text must not share a compiled program.
    m.customProgramCacheKey = () => "flat";
    mats.set(key, m);
  }
  return mats.get(key);
}
