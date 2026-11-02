import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { DRAIN } from "./objects.js";

// One drain — see DRAIN: a grate (a dark frame, its slots dark between
// bars) or a manhole cover (a disc with a raised rim, a ring and cross bars
// cast into it). Thin: it lies on the ground, never sticking up.
export default function Drain({ config }) {
  const D = useMemo(() => merge(DRAIN, config), [config]);
  const m = unlitMat(D.color), dark = unlitMat(D.dark);
  if (D.style === "manhole") {
    const r = D.radius;
    return (
      <group position-y={0.004}>
        <mesh position-y={0.006} material={m} receiveShadow>
          <cylinderGeometry args={[r, r, 0.012, 32]} />
        </mesh>
        <mesh position-y={0.014} rotation-x={-Math.PI / 2} material={dark}>
          <ringGeometry args={[r * 0.9, r * 0.97, 32]} />
        </mesh>
        <mesh position-y={0.016} rotation-x={-Math.PI / 2} material={dark}>
          <ringGeometry args={[r * 0.42, r * 0.48, 28]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position-y={0.015} rotation-y={(i * Math.PI) / 4} material={dark}>
            <boxGeometry args={[r * 1.7, 0.004, 0.025]} />
          </mesh>
        ))}
      </group>
    );
  }
  const n = Math.max(2, Math.round(D.slots));
  const bar = D.width / (n * 2 + 1);
  return (
    <group position-y={0.004}>
      <mesh position-y={0.005} material={m} receiveShadow>
        <boxGeometry args={[D.width, 0.01, D.depth]} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-D.width / 2 + bar * (2 * i + 1.5), 0.011, 0]} material={dark}>
          <boxGeometry args={[bar, 0.004, D.depth - 2 * bar]} />
        </mesh>
      ))}
    </group>
  );
}
