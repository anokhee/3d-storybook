import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import { SUN_DIR } from "../../lighting.js";
import { RAMP, TOON } from "../../adjectives/unlit/toon.js";
import { primitiveGeometry } from "../primitive/geometry.js";
import { useGameStore } from "../../game/store.js";
import { SUN_BALL } from "./objects.js";

// Toon, by hand, the way the moon is (see ../moon/Moon.jsx) — only the
// sun has no sun to be lit by, so its lit bearing is the viewer's own,
// tipped up by `tilt`: the ball is bright toward whoever looks at it and
// darker round the rim, stepped through the world's RAMP so its bands cut
// where every other clay thing's do. Its color goes from `shade` in the
// darkest band to `color` in the lightest, and the whole thing is only as
// solid as the day is.
const vert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const frag = /* glsl */ `
  uniform sampler2D ramp;
  uniform float rampFloor;
  uniform vec3 color;
  uniform vec3 shade;
  uniform float tilt;
  uniform float alpha;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 L = normalize(vView + vec3(0.0, tilt, 0.0));
    float dotNL = dot(normalize(vNormal), L) * 0.5 + 0.5;
    float band = texture2D(ramp, vec2(dotNL, 0.5)).r;
    float lit = (band - rampFloor) / (1.0 - rampFloor);
    gl_FragColor = vec4(mix(shade, color, lit), alpha);
  }
`;

export default function Sun() {
  const S = SUN_BALL;
  const geometry = useMemo(
    () =>
      primitiveGeometry(
        "sphere",
        S.radius,
        undefined,
        S.detail,
        undefined,
        undefined,
        S.clay,
      ),
    [S],
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          ramp: { value: RAMP },
          rampFloor: { value: TOON.bands[0].tone },
          color: { value: hue(S.color) },
          shade: { value: hue(S.shade) },
          tilt: { value: S.tilt },
          alpha: { value: 0 },
        },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
      }),
    [S],
  );
  const position = useMemo(
    () => SUN_DIR.clone().multiplyScalar(S.distance).toArray(),
    [S.distance],
  );

  // Only as solid as the day is: up over 0..dawn, and gone at night.
  const mesh = useRef();
  useFrame(() => {
    const d = useGameStore.getState().daylight;
    const t = Math.min(1, Math.max(0, d / S.dawn));
    const alpha = t * t * (3 - 2 * t);
    material.uniforms.alpha.value = alpha;
    mesh.current.visible = alpha > 0.001;
  });

  // Drawn after the sky's shell, which never writes depth, so by day the
  // sun shows through the sky it hangs behind — and before the clouds, so
  // a cloud passing over it covers it. The planet's ground still hides it
  // below the horizon.
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      position={position}
      renderOrder={1.5}
    />
  );
}
