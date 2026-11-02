import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { FRYING_PAN } from "./objects.js";
import { buildFriedEgg } from "./egg.js";

// How far out it reaches along x, to the handle's end.
export function fryingPanReachOf(C) {
  return C.radius + C.handle.length * Math.cos(C.handle.rise);
}

// One frying pan (see FRYING_PAN), standing on y = 0. `config` overrides
// any of FRYING_PAN's fields.
export default function FryingPan({ config }) {
  const C = useMemo(() => merge(FRYING_PAN, config), [config]);
  const r = C.radius, b = r * C.base, h = C.height, w = C.wall, Hd = C.handle, E = C.egg;

  // the pan, on a lathe: across the bottom, out and up the sloping side,
  // over the rim; its cooking face a disc of its own, a shade lighter
  const pan = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0, 0), new THREE.Vector2(b, 0), new THREE.Vector2(r, h),
    new THREE.Vector2(r - w, h), new THREE.Vector2(b - w, w), new THREE.Vector2(0, w),
  ], C.sides), [r, b, h, w, C.sides]);
  useEffect(() => () => pan.dispose(), [pan]);
  // the eggs (./egg.js, shared with a bowl of noodles)
  const eggs = useMemo(() => [0, 1].map(() => buildFriedEgg({ radius: E.radius, yolk: E.yolk, white: C.colors.white, yolkColor: C.colors.yolk })), [E.radius, E.yolk, C.colors.white, C.colors.yolk]);
  useEffect(() => () => eggs.forEach((e) => e.traverse((o) => o.isMesh && o.geometry.dispose())), [eggs]);

  return (
    <group>
      <mesh geometry={pan} material={unlitMat(C.colors.pan)} castShadow receiveShadow />
      <mesh position-y={w + 0.002} material={unlitMat(C.colors.inside)}>
        <cylinderGeometry args={[b - w, b - w, 0.004, C.sides]} />
      </mesh>
      {/* the handle, from just under the rim, rising out along +x */}
      <group position={[r - 0.01, h * 0.75, 0]} rotation-z={Hd.rise}>
        <mesh position-x={(Hd.length - Hd.width / 2) / 2} material={unlitMat(C.colors.handle)} castShadow>
          <boxGeometry args={[Hd.length - Hd.width / 2, Hd.thick, Hd.width]} />
        </mesh>
        {/* its far end rounded: a disc as wide as the handle */}
        <mesh position-x={Hd.length - Hd.width / 2} material={unlitMat(C.colors.handle)} castShadow>
          <cylinderGeometry args={[Hd.width / 2, Hd.width / 2, Hd.thick, 16]} />
        </mesh>
      </group>
      {/* the eggs: one in the middle, or two side by side, a little
          askew, filling the pan */}
      {E.on && (E.count === 1 ? [[-0.03, 0.02, 0]] : [[-(b - w) * 0.42, 0.03, 0.4], [(b - w) * 0.42, -0.03, -0.9]]).map(([x, z, turn], i) => (
        <group key={i} position={[x, w + 0.002 + i * 0.001, z]} rotation-y={turn}>
          <primitive object={eggs[i]} />
        </group>
      ))}
    </group>
  );
}
