import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { CUTTING_BOARD } from "./objects.js";

// How tall it stands: the board, and the slices on it.
export function cuttingBoardHeightOf(C) {
  return C.board.thickness + (C.slices.count > 0 ? C.slices.thickness : 0);
}

// A rounded rectangle `w` by `d` round (0, 0), corners `r`.
const roundRect = (path, w, d, r) => {
  const x = w / 2, y = d / 2;
  r = Math.min(r, x, y);
  path.moveTo(-x + r, -y);
  path.lineTo(x - r, -y); path.quadraticCurveTo(x, -y, x, -y + r);
  path.lineTo(x, y - r); path.quadraticCurveTo(x, y, x - r, y);
  path.lineTo(-x + r, y); path.quadraticCurveTo(-x, y, -x, y - r);
  path.lineTo(-x, -y + r); path.quadraticCurveTo(-x, -y, -x + r, -y);
  return path;
};

// One cutting board (see CUTTING_BOARD), lying on y = 0. `config`
// overrides any of CUTTING_BOARD's fields.
export default function CuttingBoard({ config }) {
  const C = useMemo(() => merge(CUTTING_BOARD, config), [config]);
  const B = C.board, T = B.thickness;

  // the slab: its outline extruded up through its thickness (drawn in x/y,
  // then laid down so y becomes -z)
  const geometry = useMemo(() => {
    const shape = roundRect(new THREE.Shape(), B.width, B.depth, B.cornerRadius);
    if (B.hole > 0) shape.holes.push(new THREE.Path().absarc(B.width / 2 - B.holeIn, 0, B.hole, 0, Math.PI * 2, true));
    const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 10 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [B.width, B.depth, B.cornerRadius, B.hole, B.holeIn, T]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // the rounds, in a row slanting back from the left end, each lying a
  // little up on the one before
  const S = C.slices, n = Math.max(0, Math.round(S.count));
  const step = 2 * S.radius * (1 - S.overlap);
  const x0 = -B.width / 2 + B.width * 0.18;
  const slices = Array.from({ length: n }, (_, i) => ({ x: x0 + i * step, z: 0.12 - i * step * 0.25, y: T + S.thickness / 2 + i * 0.004 }));

  const K = C.knife;
  const kx = B.width * 0.22, ky = T + 0.015;
  return (
    <group>
      <mesh geometry={geometry} material={unlitMat(C.colors.board)} castShadow receiveShadow />
      {slices.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]}>
          <mesh material={unlitMat(C.colors.slice)} castShadow>
            <cylinderGeometry args={[S.radius, S.radius, S.thickness, 16]} />
          </mesh>
          <mesh position-y={S.thickness / 2 + 0.002} material={unlitMat(C.colors.core)}>
            <cylinderGeometry args={[S.radius * 0.55, S.radius * 0.55, 0.004, 16]} />
          </mesh>
        </group>
      ))}
      {K.on && (
        // the knife, turned a little off square: its handle toward the
        // front, its blade back across the board
        <group position={[kx, ky, 0.05]} rotation-y={0.35}>
          <mesh position-z={K.handle / 2} material={unlitMat(C.colors.handle)} castShadow>
            <boxGeometry args={[0.07, 0.05, K.handle]} />
          </mesh>
          <mesh position={[0.01, -0.01, -K.blade / 2]} material={unlitMat(C.colors.blade)} castShadow>
            <boxGeometry args={[K.width, 0.01, K.blade]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
