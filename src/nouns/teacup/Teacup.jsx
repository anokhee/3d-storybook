import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { TEACUP } from "./objects.js";
import { designMat, disposeDesign, designGround, topSkin } from "../bowl/designs.js";

// ONE TEACUP (see TEACUP), on its saucer on y = 0, its handle to +x.
// `config` overrides its fields.
export default function Teacup({ config }) {
  const C = useMemo(() => merge(TEACUP, config), [config]);
  const R = C.radius, r0 = R * C.foot, H = C.height, w = C.wall, b = C.base;
  const S = C.saucer;
  const lift = S ? S.height * 0.7 : 0;
  // the cup, turned: out across the foot, flaring up to the rim, back
  // down its inside to the bottom
  const cup = useMemo(() => new THREE.LatheGeometry([
    [0, 0], [r0, 0], [r0 + (R - r0) * 0.55, H * 0.45], [R, H], [R - w, H],
    [r0 - w + (R - r0) * 0.55, H * 0.45], [r0 - w, b], [0, b],
  ].map(([x, y]) => new THREE.Vector2(x, y)), C.sides), [R, r0, H, w, b, C.sides]);
  // the saucer: a shallow dish with a dip the cup sits in
  const saucer = useMemo(() => S && new THREE.LatheGeometry([
    [0, 0], [S.radius * 0.6, 0], [S.radius, S.height * 1.4], [S.radius * 0.96, S.height * 1.6],
    [S.radius * 0.6, S.height * 0.8], [0, S.height * 0.7],
  ].map(([x, y]) => new THREE.Vector2(x, y)), C.sides), [S, C.sides]);
  useEffect(() => () => { cup.dispose(); saucer?.dispose(); }, [cup, saucer]);
  // the design: painted on a skin round the cup's outside (foot to rim)
  // and one over the saucer's top (middle out to its rim)
  const design = C.design && C.design !== "basic" ? C.design : null;
  const skins = useMemo(() => {
    if (!design) return null;
    const o = 1.01;
    const cupSkin = new THREE.LatheGeometry([[r0 * o, 0], [(r0 + (R - r0) * 0.55) * o, H * 0.45], [R * o, H]].map(([x, y]) => new THREE.Vector2(x, y)), 48);
    const e = S ? S.height * 0.05 : 0;
    const saucerSkin = S && topSkin([[0, S.height * 0.7 + e], [S.radius * 0.6, S.height * 0.8 + e], [S.radius * 0.96, S.height * 1.6 + e]]);
    return { cupSkin, saucerSkin };
  }, [design, R, r0, H, S]);
  const painted = useMemo(() => design && designMat(design, C.colors), [design, C.colors]);
  useEffect(() => () => { skins?.cupSkin.dispose(); skins?.saucerSkin?.dispose(); disposeDesign(painted); }, [skins, painted]);
  const cupColor = designGround(C.design, C.colors, C.colors.cup), saucerColor = designGround(C.design, C.colors, C.colors.saucer);

  // the tea: a disc at its level, as wide as the cup's inside is there
  const t = Math.max(0, Math.min(1, C.full));
  const level = b + t * (H - b - 0.012);
  const at = (y) => { // the inside's radius at height y
    const k = y < H * 0.45 ? y / (H * 0.45) : (y - H * 0.45) / (H * 0.55);
    return y < H * 0.45 ? r0 - w + (R - r0) * 0.55 * k : r0 - w + (R - r0) * 0.55 + (R - r0) * 0.45 * k;
  };
  const Hd = C.handle;
  return (
    <group>
      {saucer && <mesh geometry={saucer} material={unlitMat(saucerColor)} castShadow receiveShadow />}
      {skins?.saucerSkin && painted && <mesh geometry={skins.saucerSkin} material={painted} receiveShadow />}
      <group position-y={lift}>
        <mesh geometry={cup} material={unlitMat(cupColor)} castShadow receiveShadow />
        {skins && painted && <mesh geometry={skins.cupSkin} material={painted} />}
        {!design && C.band && (
          <mesh position-y={H - C.band.width * 1.6} material={unlitMat(C.colors.band)}>
            <cylinderGeometry args={[R * 0.985 + 0.003, R * 0.985 - (R - r0) * 0.55 * C.band.width / (H * 0.55) + 0.003, C.band.width, C.sides, 1, true]} />
          </mesh>
        )}
        {t > 0 && (
          <mesh position-y={level} material={unlitMat(C.colors.drink)}>
            <cylinderGeometry args={[at(level), at(level), 0.006, C.sides]} />
          </mesh>
        )}
        {/* the ear of a handle, standing off the side near the top */}
        <mesh position={[R * 0.9 - Hd.tube * 0.3, H * 0.6, 0]} rotation-z={-Math.PI / 2} material={unlitMat(cupColor)} castShadow>
          <torusGeometry args={[Hd.radius, Hd.tube, 8, 12, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
}
