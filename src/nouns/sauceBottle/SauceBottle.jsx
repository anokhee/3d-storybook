import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { SAUCE_BOTTLE, SAUCE_BOTTLE_KINDS } from "./objects.js";

// How tall it stands: the nozzle's tip.
export function sauceBottleHeightOf(C) {
  return C.height + C.cap.height + C.nozzle.height;
}

// The whole of one, laid over its defaults and its sauce's colours
export const sauceBottleOf = (config = {}) => merge(merge(SAUCE_BOTTLE, SAUCE_BOTTLE_KINDS[config.sauce] ?? {}), config);

// ONE SAUCE BOTTLE (see SAUCE_BOTTLE), standing on the ground at y = 0.
// `config` overrides any of its fields; its `sauce` ("ketchup",
// "mustard", "mayo") picks the colours first.
export default function SauceBottle({ config }) {
  const C = useMemo(() => sauceBottleOf(config), [config]);
  const { height: H, radius: R } = C;
  const capR = R * C.cap.radius;
  const body = useMemo(() => {
    // up from the foot, a soft bulge, round the shoulder in to the neck
    const pts = [
      [0, 0], [R * 0.9, 0], [R, H * 0.05], [R * 1.02, H * 0.4], [R, H * 0.72],
      [R * 0.88, H * 0.86], [R * 0.66, H * 0.95], [capR * 0.9, H],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, C.sides);
  }, [R, H, capR, C.sides]);
  useEffect(() => () => body.dispose(), [body]);
  const L = C.label, nz = C.nozzle;
  return (
    <group>
      <mesh geometry={body} material={unlitMat(C.colors.body)} castShadow receiveShadow />
      {L && L.height > 0 && (
        <mesh position-y={H * L.at} material={unlitMat(C.colors.label)}>
          <cylinderGeometry args={[R * 1.03, R * 1.03, L.height * H, C.sides, 1, true]} />
        </mesh>
      )}
      <mesh position-y={H + C.cap.height / 2} material={unlitMat(C.colors.cap)} castShadow>
        <cylinderGeometry args={[capR, capR, C.cap.height, C.sides]} />
      </mesh>
      <mesh position-y={H + C.cap.height + nz.height / 2} material={unlitMat(C.colors.cap)} castShadow>
        <cylinderGeometry args={[capR * 0.12, capR * nz.radius, nz.height, 12]} />
      </mesh>
    </group>
  );
}
