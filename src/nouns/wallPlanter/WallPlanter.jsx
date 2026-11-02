import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import WindowBox from "../windowBox/WindowBox.jsx";
import { WALL_PLANTER } from "./objects.js";

// One wall planter (see WALL_PLANTER), facing +z, its back on the wall at
// z = 0: the board on the wall, the two brackets standing out from it,
// and the Window Box sat on them, its back against the board, `hang` up.
// `config` overrides any of WALL_PLANTER's fields.
export default function WallPlanter({ config }) {
  const P = useMemo(() => merge(WALL_PLANTER, config), [config]);
  const B = P.box, K = P.brackets, L = P.plate;
  const back = L.on ? L.thick : 0; // the trough's back, off the wall
  // a bracket: a right triangle in the wall's plane out from it (z) and
  // down it (y), its right angle at the wall under the trough
  const arm = Math.max(0.05, (B.depth + back) * K.reach);
  const bracket = useMemo(() => {
    const s = new THREE.Shape().moveTo(0, 0).lineTo(arm, 0).lineTo(0, -arm).closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: K.thick, bevelEnabled: false });
    g.translate(0, 0, -K.thick / 2);
    g.rotateY(-Math.PI / 2); // its x (out) now along +z, its thickness along x
    return g;
  }, [arm, K.thick]);
  useEffect(() => () => bracket.dispose(), [bracket]);
  const bx = Math.max(0, B.width / 2 - K.inset);
  const plateH = B.height + L.above + arm * 0.6;
  return (
    <group position-y={P.hang}>
      {L.on && (
        <mesh position={[0, plateH / 2 - arm * 0.6, L.thick / 2]} material={unlitMat(L.color)} castShadow receiveShadow>
          <boxGeometry args={[B.width + 2 * L.over, plateH, L.thick]} />
        </mesh>
      )}
      {[-1, 1].map((e) => (
        <mesh key={e} geometry={bracket} position={[e * bx, 0, back]} material={unlitMat(K.color)} castShadow />
      ))}
      <group position-z={back + B.depth / 2 + 0.04}>
        <WindowBox config={B} />
      </group>
    </group>
  );
}
