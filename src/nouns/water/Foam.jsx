import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import { merge } from "../../world/merge.js";
import { FOAM } from "./objects.js";
import { sheetGeometry } from "./sheet.js";

// One layer of foam on a pool: a sheet knitted the same way as the water,
// `lift` above it, with patches of white cut out of it by a shader.
// The patches are value noise thresholded with a hard edge — clay, not
// mist — the threshold lowered toward the bank so the lace thickens into a
// rind there, with a solid line right at the edge where the water meets
// the ground, and the whole thing drifts slowly across the pool. Unlit:
// foam is white from any angle, so it reads over the mirror.
//
// The sheet's local x/z are the pool's own frame, and each point of it
// carries how far in from the bank it lies (see poolGeometry) — the
// pool's own field, which may be several lobes run together, so it is
// read off the sheet rather than worked out here.
const vertexShader = /* glsl */ `
  attribute float inset;
  varying vec2 vPool;
  varying float vInset;
  void main() {
    vPool = position.xz;
    vInset = inset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 color;
  uniform float alpha;
  uniform float rim;
  uniform float cover;
  uniform float scale;
  uniform float soft;     // how far the lace's edge is feathered
  uniform float edge;     // how solid the line along the bank is
  uniform vec2 drift;     // how far the lace has wandered so far
  varying vec2 vPool;
  varying float vInset;

  float hash( vec2 p ) {
    return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
  }
  // Smooth value noise, 0..1.
  float noise( vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
    f = f * f * ( 3.0 - 2.0 * f );
    float a = hash( i );
    float b = hash( i + vec2( 1.0, 0.0 ) );
    float c = hash( i + vec2( 0.0, 1.0 ) );
    float d = hash( i + vec2( 1.0, 1.0 ) );
    return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
  }
  // A hard step, one pixel soft so it does not shimmer — or as soft as
  // width says, for mist.
  float cut( float at, float x, float width ) {
    float w = max( fwidth( x ), width );
    return smoothstep( at - w, at + w, x );
  }

  void main() {
    // How far in from the bank we are, off the sheet.
    float inset = vInset;

    // Two octaves of lace, wandering; the second crawls the other way so
    // the patches change shape as they go rather than sliding whole.
    vec2 p = vPool / scale;
    float n = 0.65 * noise( p + drift ) + 0.35 * noise( p * 2.3 - drift * 0.7 + 17.0 );

    // Thick at the bank, sparse out in the open.
    float bank = 1.0 - smoothstep( 0.0, rim, inset );
    float open = 1.0 - 0.55 * cover;
    float threshold = mix( open, 0.42, bank );
    float lace = cut( threshold, n, soft );

    // The line of foam right along the edge itself.
    float line = edge * ( 1.0 - cut( 0.14 + 0.06 * noise( p * 3.0 + drift ), inset, 0.0 ) );

    float foam = max( lace, line );
    if ( foam <= 0.0 ) discard;
    gl_FragColor = vec4( color, alpha * foam );
    #include <colorspace_fragment>
  }
`;

// `color`, where the level hands one down, is the foam's over the layer's
// own — the water's colors follow the grass (see Water.jsx).
export default function Foam({ pool, layer, color = null }) {
  const F = useMemo(
    () => merge(FOAM, color ? { ...layer, color } : layer),
    [layer, color],
  );
  // Rebuilt only when the pool's shape changes (its `key`), not on every
  // nudge of it about the ball.
  const geometry = useMemo(
    () => sheetGeometry(pool, F.lift),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool.key, F.lift],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        color: { value: hue(F.color) },
        alpha: { value: F.alpha },
        rim: { value: F.rim },
        cover: { value: F.cover },
        scale: { value: F.scale },
        soft: { value: F.soft },
        edge: { value: F.edge },
        drift: { value: new THREE.Vector2() },
      },
    });
  }, [F]);

  // The lace wanders a little across and a little along, in world units,
  // scaled into noise space by the patch size.
  useFrame((_, dt) => {
    const d = material.uniforms.drift.value;
    d.x += (F.drift * 0.8 * dt) / F.scale;
    d.y += (F.drift * 0.6 * dt) / F.scale;
  });

  return <mesh geometry={geometry} material={material} renderOrder={1} />;
}
