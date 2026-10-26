import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Flower from "../flower/Flower.jsx";
import { TULIP } from "./objects.js";

// How tall the cup stands above where its petals meet, as a share of
// the bloom's radius.
const CUP = 0.85;

export const tulipHeightOf = (C) => C.stem.height + C.radius * CUP;

export default function Tulip({ config }) {
  const C = useMemo(() => merge(TULIP, config), [config]);
  const S = C.stem;
  const L = C.leaf;
  return (
    <group scale={C.scale} rotation-y={Math.PI}>
      <mesh position-y={S.height / 2} material={unlitMat(S.color)}>
        <cylinderGeometry args={[S.radius, S.radius * 1.2, S.height, 8]} />
      </mesh>
      {[0, 1].map((i) => (
        <group key={i} rotation-y={i * Math.PI} position-y={S.height * 0.1}>
          <group rotation-z={(-L.lean * Math.PI) / 180}>
            <mesh
              position-y={L.length / 2}
              scale={[L.width / 2, L.length / 2, 0.03]}
              material={unlitMat(L.color)}
            >
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          </group>
        </group>
      ))}
      <group position-y={S.height}>
        <Flower
          type="tulip"
          radius={C.radius}
          rotation={{ x: 180, y: 0, z: 0 }}
          swatch={C.color}
        />
      </group>
    </group>
  );
}
