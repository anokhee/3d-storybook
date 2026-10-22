import { useEffect, useMemo } from "react";

import { unlitMat } from "../../adjectives/unlit/material.js";
import { kiddieGeometry } from "./basin.js";

// A kiddie pool, in the pool's frame — see KIDDIE in objects.js and
// kiddieGeometry in basin.js for its shape: a vinyl floor with a thin
// wall up from it at the water's edge, and the inflated rings stacked
// round that, each in its own color, dealt bottom to top. It stands on
// the ground, so no hole is cut for it. Rebuilt only when the pool's
// shape changes (its `key`), like the sheet.
export default function Kiddie({ pool }) {
  const K = pool.W.kiddie;
  const { floor, rings } = useMemo(
    () => kiddieGeometry(pool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool.key, K],
  );
  useEffect(
    () => () => (floor.dispose(), rings.forEach((g) => g.dispose())),
    [floor, rings],
  );
  const colors = K.rings.colors;
  return (
    <group>
      <mesh geometry={floor} material={unlitMat(K.colors.floor)} />
      {rings.map((g, i) => (
        <mesh
          key={i}
          geometry={g}
          material={unlitMat(colors[i % colors.length])}
          castShadow
        />
      ))}
    </group>
  );
}
