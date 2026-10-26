import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { NUMERAL } from "./objects.js";

export const numeralHeightOf = (C) => C.height;

// The "1", drawn 3 tall: a stem with a flag leaning off its top.
const ONE = [
  [0, 0],
  [0.6, 0],
  [0.6, 3],
  [0.15, 3],
  [-0.7, 2.3],
  [-0.45, 1.95],
  [0, 2.3],
];

export default function Numeral({ config }) {
  const C = useMemo(() => merge(NUMERAL, config), [config]);
  const geometry = useMemo(() => {
    const k = C.height / 3;
    const shape = new THREE.Shape(
      ONE.map(([x, y]) => new THREE.Vector2((x - 0.0) * k, y * k)),
    );
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: C.thick,
      bevelEnabled: C.bevel > 0,
      bevelSize: C.bevel,
      bevelThickness: C.bevel,
      bevelSegments: 2,
    });
    g.translate(-0.15 * k, 0, -C.thick / 2);
    return g;
  }, [C.height, C.thick, C.bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group scale={C.scale}>
      <mesh geometry={geometry} material={unlitMat(C.color)} />
    </group>
  );
}
