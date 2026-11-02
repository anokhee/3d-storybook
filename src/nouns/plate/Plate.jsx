import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { PLATE } from "./objects.js";
import { designMat, disposeDesign, designGround, topSkin } from "../bowl/designs.js";

// How tall it stands: the rim, or the heap of food on it.
export const plateHeightOf = (P) =>
  Math.max(P.height * 1.9, P.food?.on ? P.height * 0.9 + P.food.radius * 0.45 : 0);

// ONE PLATE (see PLATE), lying on y = 0. `config` overrides its fields.
export default function Plate({ config }) {
  const P = useMemo(() => merge(PLATE, config), [config]);
  const F = P.food;
  // turned: a flat well and a rim rising round it
  const plate = useMemo(() => {
    const r = P.radius, h = P.height, w = r - P.rim;
    const pts = [[0, 0], [w * 0.9, 0], [r, h * 1.6], [r * 0.97, h * 1.9], [w, h * 0.9], [0, h * 0.9]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 28);
  }, [P.radius, P.height, P.rim]);
  useEffect(() => () => plate.dispose(), [plate]);
  // the design, painted on a skin over its top: from the middle (the
  // design's foot) out to the rim
  const design = P.design && P.design !== "basic" ? P.design : null;
  const skin = useMemo(() => {
    if (!design) return null;
    const r = P.radius, h = P.height, w = r - P.rim, e = h * 0.04;
    return topSkin([[0, h * 0.9 + e], [w, h * 0.9 + e], [r * 0.97, h * 1.9 + e]]);
  }, [design, P.radius, P.height, P.rim]);
  const painted = useMemo(() => design && designMat(design, P.colors), [design, P.colors]);
  useEffect(() => () => { skin?.dispose(); disposeDesign(painted); }, [skin, painted]);
  return (
    <group>
      <mesh geometry={plate} material={unlitMat(designGround(P.design, P.colors, P.color))} receiveShadow />
      {skin && painted && <mesh geometry={skin} material={painted} receiveShadow />}
      {F?.on && (
        <mesh position-y={P.height * 0.9} scale={[1, 0.45, 1]} material={unlitMat(F.color)} castShadow>
          <sphereGeometry args={[F.radius, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}
    </group>
  );
}
