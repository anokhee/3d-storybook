import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import { clock } from "../../adjectives/glowing/material.js";
import { air } from "./air.js";
import { PLANET } from "./objects.js";

// The glints in the air: one Points mesh, a thousand or so soft points
// of light strewn over the atmosphere's shell, swung slowly round the
// planet's axis and twinkling each to its own beat, all in
// the vertex shader off the same clock — nothing is touched from
// JavaScript after they are strewn. Each is drawn as a round falloff,
// additive so it can only ever add light to the sky, faded by the same
// limb term the haze uses so they gather at the bubble's edge and thin
// out overhead. In free flight the whole strewing draws in about the
// center to `flight.shell`, just above the haze's bubble (see air.js),
// and each is blown up to `flight` times its size and brightness, so from
// the jetpack they read as big sparkles floating on the atmosphere; it
// all settles back to the shell as the doll comes home.
const vert = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  attribute float aRate;
  uniform float time;
  uniform float swirl;
  uniform float twinkle;
  uniform float rim;
  uniform float pixelScale;
  uniform float size;
  uniform float scale;
  varying float vFade;

  void main() {
    float r = length(position) * scale;
    vec3 d = position / r;
    float a = time * aRate * swirl * 6.2831853;
    d = vec3(d.x * cos(a) - d.z * sin(a), d.y, d.x * sin(a) + d.z * cos(a));
    vec3 world = d * r;
    vec3 view = normalize(cameraPosition - world);
    float limb = pow(1.0 - abs(dot(d, view)), rim);
    float blink = 0.55 + 0.45 * sin(time * twinkle * (0.6 + aSeed) + aSeed * 40.0);
    vFade = limb * blink;
    vec4 mv = viewMatrix * vec4(world, 1.0);
    gl_PointSize = aSize * size * pixelScale / max(1.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  uniform vec3 color;
  uniform float alpha;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    // A soft glint: bright only at the very middle, most of the disc a
    // faint halo, so one never reads as a solid dot.
    float k = pow(1.0 - d, 4.0) * vFade * alpha;
    gl_FragColor = vec4(color * k, k);
  }
`;

function strew(P, shell) {
  const n = P.count;
  const position = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const size = new Float32Array(n);
  const rate = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const z = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    const r = shell + (Math.random() * 2 - 1) * P.band;
    position[i * 3] = s * Math.cos(t) * r;
    position[i * 3 + 1] = z * r;
    position[i * 3 + 2] = s * Math.sin(t) * r;
    seed[i] = Math.random();
    size[i] = P.size[0] + (P.size[1] - P.size[0]) * Math.random();
    rate[i] = 0.4 + 0.6 * Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(position, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aRate", new THREE.BufferAttribute(rate, 1));
  return g;
}

export default function Sparkles() {
  const A = PLANET.atmosphere;
  const P = A.sparkles;
  const geometry = useMemo(() => strew(P, PLANET.shell), [P]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: hue(A.color) },
          alpha: { value: P.alpha },
          rim: { value: A.rim },
          swirl: { value: P.swirl },
          twinkle: { value: P.twinkle },
          // Point size is in pixels and knows nothing of the viewport: one
          // number stands in for the fov and height. A look, not a measure.
          pixelScale: { value: 900 },
          size: { value: 1 },
          scale: { value: 1 },
          time: clock,
        },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [A, P],
  );
  useFrame(() => {
    const out = 1 - air.inside;
    const u = material.uniforms;
    u.size.value = 1 + (P.flight.size - 1) * out;
    u.alpha.value = P.alpha * (1 + (P.flight.alpha - 1) * out);
    u.scale.value = 1 + (P.flight.shell / PLANET.shell - 1) * out;
  });
  // Never culled: they are all over the shell and the camera is usually
  // inside it.
  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={4}
    />
  );
}
