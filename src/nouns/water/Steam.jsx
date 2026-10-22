import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import { mulberry32, between } from "../../world/random.js";
import { groundRadiusAt } from "../planet/ground.js";
import { poolBounds, poolDistance } from "./pools.js";

// The steam off a hot spring — see SPRING.steam in objects.js: one Points
// mesh, a puff for every so much of the water's area, each born at its
// own spot on the water and climbing `rise` straight up off it — up being
// the ground's own up there, on the ball's curve — swaying a little as it
// goes, swelling from `born` of its size to all of it and thinning to
// nothing by the top, then born again at the bottom, on its own loop out
// of step with the rest. All of it is in the vertex shader off one clock,
// the way the sparkles are; nothing is touched from JavaScript after the
// puffs are strewn. A puff is a soft round falloff, blended over what is
// behind it rather than added to it, so it reads as vapour and not light.
const vert = /* glsl */ `
  attribute vec3 aUp;
  attribute float aPhase;
  attribute float aLife;
  attribute float aSize;
  attribute float aSeed;
  uniform float time;
  uniform float rise;
  uniform float sway;
  uniform float born;
  uniform float pixelScale;
  varying float vFade;

  void main() {
    // Where in its climb this puff is, 0 born to 1 gone.
    float age = fract( time / aLife + aPhase );
    // Sideways, in the plane of the water: any two directions across aUp.
    vec3 across = normalize( cross( aUp, abs( aUp.y ) < 0.9 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 ) ) );
    vec3 along = cross( aUp, across );
    float wobble = age * 6.2831853;
    vec3 drift = across * sin( wobble * 0.7 + aSeed * 40.0 ) + along * cos( wobble * 0.5 + aSeed * 23.0 );
    // Eased off the water rather than shot off it.
    float climb = age * ( 2.0 - age );
    vec3 p = position + aUp * ( rise * climb ) + drift * ( sway * age );
    // In, then thinner and thinner as it climbs.
    vFade = smoothstep( 0.0, 0.15, age ) * pow( 1.0 - age, 1.6 );
    float size = aSize * mix( born, 1.0, age );
    vec4 mv = modelViewMatrix * vec4( p, 1.0 );
    gl_PointSize = size * pixelScale / max( 1.0, -mv.z );
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  uniform vec3 color;
  uniform float alpha;
  varying float vFade;
  void main() {
    float d = length( gl_PointCoord - 0.5 ) * 2.0;
    if ( d > 1.0 ) discard;
    // Soft all the way out, thickest in the middle.
    float k = pow( 1.0 - d * d, 2.0 ) * vFade * alpha;
    gl_FragColor = vec4( color, k );
    #include <colorspace_fragment>
  }
`;

// The puffs, strewn over the water: spots thrown over the pool's bounds
// and kept where they land in the water, each on the water's sheet —
// dropped onto the ground there, hollows and all, `lift` above it — with
// the ground's up, and its own phase, life and size.
function strew(pool, S) {
  const W = pool.W;
  const R = pool.body.radius;
  const rand = mulberry32(7);
  const groundAt =
    pool.body.name === "planet" ? groundRadiusAt : () => pool.body.radius;
  const { x: bx, z: bz } = poolBounds(pool);
  const want = Math.ceil(S.density * 4 * bx * bz);
  const position = [];
  const up = [];
  const phase = [];
  const life = [];
  const size = [];
  const seed = [];
  const dir = new THREE.Vector3();
  for (let i = 0; i < want; i++) {
    const x = (rand() * 2 - 1) * bx;
    const z = (rand() * 2 - 1) * bz;
    if (poolDistance(pool, x, z) > -0.3) continue;
    const y = Math.sqrt(Math.max(0, R * R - x * x - z * z));
    dir.set(x / R, y / R, z / R);
    up.push(dir.x, dir.y, dir.z);
    const k =
      groundAt(dir.clone().applyQuaternion(pool.frame)) + W.lift + S.lift;
    position.push((x * k) / R, (y * k) / R - R, (z * k) / R);
    phase.push(rand());
    life.push(between(S.life, rand));
    size.push(between(S.size, rand));
    seed.push(rand());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("aUp", new THREE.Float32BufferAttribute(up, 3));
  g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
  g.setAttribute("aLife", new THREE.Float32BufferAttribute(life, 1));
  g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
  g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
  return g;
}

export default function Steam({ pool }) {
  const S = pool.W.spring.steam;
  // Restrewn only when the pool's shape changes (its `key`), like the
  // sheet.
  const geometry = useMemo(
    () => strew(pool, S),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool.key, S],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: hue(S.color) },
          alpha: { value: S.alpha },
          rise: { value: S.rise },
          sway: { value: S.sway },
          born: { value: S.born },
          // Point size is in pixels and knows nothing of the viewport: one
          // number stands in for the fov and height, as for the sparkles.
          pixelScale: { value: 900 },
          time: { value: 0 },
        },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
      }),
    [S],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, dt) => {
    material.uniforms.time.value += dt;
  });
  // Drawn after the water and its foam, since it hangs over both.
  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={2}
    />
  );
}
