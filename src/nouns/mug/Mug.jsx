import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { MUG } from "./objects.js";

// How tall it stands: the rim.
export function mugHeightOf(C) {
  return C.height;
}

// How far out from its middle it spreads: the cup, and the handle on +x.
export function mugFootprintOf(C) {
  return { x: C.radius + C.handle.radius + C.handle.tube, z: C.radius };
}

// One mug (see MUG), standing on the ground at y = 0 with its handle out
// to +x. `config` overrides any of MUG's fields for this one.
export default function Mug({ config }) {
  const C = useMemo(() => merge(MUG, config), [config]);
  const R = C.radius;
  const inner = Math.max(0.02, R - C.wall);
  const base = Math.min(C.base, C.height / 2);

  // The cup, turned in one piece: up the outside, over the rim and down
  // the inside to the floor, so there is a wall to see into.
  const cup = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(R * 0.92, 0),
      new THREE.Vector2(R, C.height * 0.08),
      new THREE.Vector2(R, C.height),
      new THREE.Vector2(inner, C.height),
      new THREE.Vector2(inner, base),
      new THREE.Vector2(0, base),
    ];
    return new THREE.LatheGeometry(pts, C.sides);
  }, [R, inner, base, C.height, C.sides]);
  useEffect(() => () => cup.dispose(), [cup]);

  // The drink, a disc filling the inside to its level, under the rim.
  const level = base + Math.max(0, Math.min(1, C.full)) * (C.height - base - 0.015);
  const H = C.handle;
  return (
    <group>
      <mesh castShadow receiveShadow geometry={cup} material={unlitMat(C.colors.mug)} />
      {C.full > 0 && (
        <mesh receiveShadow position-y={level} material={unlitMat(C.colors.drink)}>
          <cylinderGeometry args={[inner, inner, 0.01, C.sides]} />
        </mesh>
      )}
      <mesh
        castShadow
        receiveShadow
        position={[R - H.tube * 0.5, C.height / 2, 0]}
        rotation-z={-Math.PI / 2}
        material={unlitMat(C.colors.mug)}
      >
        <torusGeometry args={[H.radius, H.tube, 8, 12, Math.PI]} />
      </mesh>
    </group>
  );
}
