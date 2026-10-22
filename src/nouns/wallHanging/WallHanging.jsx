import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { unlitMat } from "../../adjectives/unlit/material.js";
import { polygonOf } from "../pattern/Pattern.jsx";

// One wall hanging (see WALL_HANGING), its foot at y = 0 and facing +z,
// hung `hang` up: the frame board at the back, the backing a hair proud
// of it inside the frame, and the art raised on the backing.
export default function WallHanging({ config: H }) {
  const F = H.frame;
  const A = H.art;
  const inner = {
    width: Math.max(0.1, H.width - 2 * F.thickness),
    height: Math.max(0.1, H.height - 2 * F.thickness),
  };
  const art = useMemo(() => {
    const r = (Math.min(inner.width, inner.height) / 2) * A.radius;
    const g = new THREE.ExtrudeGeometry(polygonOf({ ...A, radius: r }), {
      depth: A.raise,
      bevelEnabled: false,
    });
    return g;
  }, [inner.width, inner.height, A]);
  useEffect(() => () => art.dispose(), [art]);
  const proud = 0.02;
  return (
    <group position-y={H.hang + H.height / 2}>
      <mesh material={unlitMat(F.color)}>
        <boxGeometry args={[H.width, H.height, H.thickness]} />
      </mesh>
      <mesh position-z={proud / 2} material={unlitMat(H.backing.color)}>
        <boxGeometry args={[inner.width, inner.height, H.thickness + proud]} />
      </mesh>
      <mesh
        geometry={art}
        position-z={H.thickness / 2 + proud}
        material={unlitMat(A.color)}
      />
    </group>
  );
}
