import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { BIKE_RACK } from "./objects.js";

// One bike rack — see BIKE_RACK: `count` hoops in a row, each two legs and
// a half-round of the same tube over them.
export default function BikeRack({ config }) {
  const B = useMemo(() => merge(BIKE_RACK, config), [config]);
  const r = B.width / 2, legs = Math.max(0.05, B.height - r);
  const n = Math.max(1, Math.round(B.count));
  const m = unlitMat(B.color);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position-x={(i - (n - 1) / 2) * B.spacing} rotation-y={Math.PI / 2}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * r, legs / 2, 0]} material={m} castShadow>
              <cylinderGeometry args={[B.tube, B.tube, legs, 8]} />
            </mesh>
          ))}
          <mesh position-y={legs} material={m} castShadow>
            <torusGeometry args={[r, B.tube, 8, 20, Math.PI]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
