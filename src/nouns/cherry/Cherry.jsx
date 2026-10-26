import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { CHERRY } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// How tall it stands, in its own units: the ball and the stalk above it.
export const cherryHeightOf = (C) =>
  2 * C.radius + C.stem.height * Math.cos(rad(C.stem.lean));

// One cherry (see CHERRY), the ball resting on the ground at y = 0, its
// stalk leaning toward +x. `config` overrides any of CHERRY's fields.
export default function Cherry({ config }) {
  const C = useMemo(() => merge(CHERRY, config), [config]);
  const S = C.stem;
  const lean = rad(S.lean);

  // The stalk: a bow from the ball's dimple to its tip, pulled the other
  // way from the lean by `bend`.
  const { stalk, tip } = useMemo(() => {
    const base = new THREE.Vector3(0, 2 * C.radius - C.radius * 0.12, 0);
    const end = new THREE.Vector3(
      Math.sin(lean) * S.height,
      base.y + Math.cos(lean) * S.height,
      0,
    );
    const pull = new THREE.Vector3(-S.bend * S.height, 0, 0);
    const mid = base.clone().lerp(end, 0.5).add(pull);
    const curve = new THREE.QuadraticBezierCurve3(base, mid, end);
    return {
      stalk: new THREE.TubeGeometry(curve, 14, S.radius, 6, false),
      tip: end,
    };
  }, [C.radius, S.height, S.radius, S.bend, lean]);
  useEffect(() => () => stalk.dispose(), [stalk]);

  const L = C.leaf;
  return (
    <group scale={C.scale}>
      <group position-y={C.radius}>
        <Primitive
          shape="sphere"
          radius={C.radius}
          detail={C.detail}
          swatch={C.color}
        />
      </group>
      <mesh geometry={stalk} material={unlitMat(S.color)} />
      {L && (
        <mesh
          position={[
            tip.x + Math.sin(lean) * L.length * 0.35,
            tip.y + Math.cos(lean) * L.length * 0.35,
            0,
          ]}
          rotation={[0.3, 0, Math.PI / 2 - lean]}
          scale={[L.length / 2, L.width * 0.08, L.width / 2]}
          material={unlitMat(L.color)}
        >
          <sphereGeometry args={[1, 10, 6]} />
        </mesh>
      )}
    </group>
  );
}
