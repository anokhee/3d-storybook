import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { STRAWBERRY } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// How tall it stands, in its own units.
export const strawberryHeightOf = (C) => C.radius * C.height;

// How wide the berry is at a share `t` of the way up it (0 at its foot, 1
// at its tip): fullest low down, drawing in to a point.
const widthAt = (C, t) =>
  C.radius * Math.sin(Math.PI * t ** 0.75) * (1 - 0.35 * t);

// One strawberry (see STRAWBERRY), sitting on its leaves at y = 0.
// `config` overrides any of STRAWBERRY's fields.
export default function Strawberry({ config }) {
  const C = useMemo(() => merge(STRAWBERRY, config), [config]);
  const H = strawberryHeightOf(C);

  const berry = useMemo(() => {
    const steps = 20;
    const profile = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      return new THREE.Vector2(Math.max(0.001, widthAt(C, t)), H * t);
    });
    return new THREE.LatheGeometry(profile, C.sides);
  }, [C, H]);
  useEffect(() => () => berry.dispose(), [berry]);

  // Seeds on the berry's skin, dealt round it by the golden angle and up
  // it evenly, a little sunk in.
  const seeds = useMemo(() => {
    const S = C.seeds;
    if (!S) return [];
    return Array.from({ length: S.count }, (_, i) => {
      const t = 0.12 + (0.78 * (i + 0.5)) / S.count;
      const a = i * 2.399963;
      const w = widthAt(C, t) + S.radius * 0.2;
      return [Math.sin(a) * w, H * t, Math.cos(a) * w];
    });
  }, [C, H]);

  const Y = C.calyx;
  return (
    <group scale={C.scale}>
      <mesh geometry={berry} material={unlitMat(C.color)} />
      {seeds.map((p, i) => (
        <mesh key={i} position={p} material={unlitMat(C.seeds.color)}>
          <sphereGeometry args={[C.seeds.radius, 6, 4]} />
        </mesh>
      ))}
      {Y &&
        Array.from({ length: Y.leaves }, (_, i) => {
          const a = (i / Y.leaves) * Math.PI * 2;
          const out = C.radius * 0.45 + Y.length * 0.4;
          return (
            <group key={i} rotation-y={a} position-y={Y.width * 0.12}>
              <group position-z={out} rotation-x={rad(Y.droop)}>
                <mesh
                  scale={[Y.width / 2, Y.width * 0.1, Y.length / 2]}
                  material={unlitMat(Y.color)}
                >
                  <sphereGeometry args={[1, 10, 6]} />
                </mesh>
              </group>
            </group>
          );
        })}
    </group>
  );
}
