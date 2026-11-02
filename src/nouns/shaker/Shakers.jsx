import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { SHAKERS } from "./objects.js";

// One shaker: the body turned on a lathe, a little waisted, its shoulder
// rounded; the steel dome on it; `holes` dark dots in a ring on the dome
// (one in the middle, the rest round it).
function Shaker({ C, body, holes }) {
  const H = C.height, R = C.radius, ch = H * C.cap.height;
  const geo = useMemo(() => new THREE.LatheGeometry([
    [0, 0], [R * 0.95, 0], [R, H * 0.08], [R * 0.9, H * 0.45], [R, H * 0.85], [R * 0.95, H],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 20), [R, H]);
  useEffect(() => () => geo.dispose(), [geo]);
  const dots = useMemo(() => {
    const ring = holes - 1;
    return [[0, 0], ...Array.from({ length: ring }, (_, i) => {
      const a = (i / ring) * Math.PI * 2;
      return [Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45];
    })];
  }, [holes, R]);
  return (
    <group>
      <mesh geometry={geo} material={unlitMat(body)} castShadow receiveShadow />
      <mesh position-y={H} scale={[R * 0.97, ch, R * 0.97]} material={unlitMat(C.colors.cap)} castShadow>
        <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {dots.map(([x, z], i) => {
        // on the dome's surface there, facing out of it
        const d = Math.hypot(x, z) / (R * 0.97), y = H + ch * Math.sqrt(Math.max(0, 1 - d * d));
        return (
          <mesh key={i} position={[x, y, z]} rotation={[Math.atan2(z, ch) * d * 1.2, 0, -Math.atan2(x, ch) * d * 1.2]} material={unlitMat(C.colors.holes)}>
            <cylinderGeometry args={[R * 0.08, R * 0.08, R * 0.04, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

// SALT AND PEPPER SHAKERS (see SHAKERS), standing on y = 0: the pair side
// by side along x, salt on the left (-x), or just the one.
export default function Shakers({ config }) {
  const C = useMemo(() => merge(SHAKERS, config), [config]);
  const off = C.which === "pair" ? C.radius + C.gap / 2 : 0;
  return (
    <group>
      {C.which !== "pepper" && <group position-x={-off}><Shaker C={C} body={C.colors.salt} holes={5} /></group>}
      {C.which !== "salt" && <group position-x={off}><Shaker C={C} body={C.colors.pepper} holes={3} /></group>}
    </group>
  );
}
