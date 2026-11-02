import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { STRAWBERRY } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// How tall it stands, in its own units: the berry, and the stalk over it
// when it's upright.
export const strawberryHeightOf = (C) =>
  C.radius * C.height + (C.upright && C.stalk ? C.stalk.length : 0);

// How wide the berry is at a share `t` of the way from its tip (0) to its
// crown (1): drawing out from the point to its fullest, then round over
// the shoulder (a quarter ellipse, `shoulder` of the height) to the crown.
const widthAt = (C, t) => {
  const s = 1 - t, sh = C.shoulder;
  if (s < sh) return C.radius * Math.sqrt(Math.max(0, 1 - ((sh - s) / sh) ** 2)) ** 0.8;
  const u = (s - sh) / (1 - sh); // 0 at the fullest, 1 at the tip
  return C.radius * Math.cos((Math.PI / 2) * u) ** 0.85;
};

// One strawberry (see STRAWBERRY), sitting on its leaves at y = 0.
// `config` overrides any of STRAWBERRY's fields.
export default function Strawberry({ config }) {
  const C = useMemo(() => merge(STRAWBERRY, config), [config]);
  const H = C.radius * C.height; // the berry's own height

  const berry = useMemo(() => {
    const steps = 20;
    const profile = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      return new THREE.Vector2(Math.max(0.001, widthAt(C, t)), H * t);
    });
    return new THREE.LatheGeometry(profile, C.sides);
  }, [C, H]);
  useEffect(() => () => berry.dispose(), [berry]);

  // The seeds, painted on: flat ovals lying on the berry's facets, the
  // long way up it, on every other facet in each row and the others in the
  // next, so they sit staggered the way a strawberry's do. One geometry.
  const seeds = useMemo(() => {
    const S = C.seeds;
    if (!S || S.rows < 1) return null;
    const n = C.sides, half = Math.PI / n, d = 0.01;
    const ball = new THREE.SphereGeometry(1, 8, 6);
    const parts = [], m4 = new THREE.Matrix4();
    for (let row = 0; row < S.rows; row++) {
      const t = 0.1 + (0.72 * (row + 0.5)) / S.rows; // up from near the tip, short of the shoulder's top
      const w = widthAt(C, t), slope = (widthAt(C, t + d) - widthAt(C, t - d)) / (2 * d * H);
      const out = w * Math.cos(half) + S.radius * 0.05; // on the facet's face, not its corners
      for (let j = row % 2; j < n; j += 2) {
        const a = (j + 0.5) * (2 * Math.PI / n);
        const normal = new THREE.Vector3(Math.sin(a), -slope, Math.cos(a)).normalize();
        const up = new THREE.Vector3(slope * Math.sin(a), 1, slope * Math.cos(a)).normalize();
        const across = new THREE.Vector3().crossVectors(up, normal);
        m4.makeBasis(across, up, normal)
          .scale(new THREE.Vector3(S.radius * 0.7, S.radius * 1.2, S.radius * 0.15))
          .setPosition(Math.sin(a) * out, H * t, Math.cos(a) * out);
        parts.push(ball.clone().applyMatrix4(m4));
      }
    }
    ball.dispose();
    const g = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return g;
  }, [C, H]);
  useEffect(() => () => seeds?.dispose(), [seeds]);

  const Y = C.calyx, K = C.stalk;
  // built tip down, crown up; turned over onto its leaves if not upright
  return (
    <group scale={C.scale}>
      <group rotation-x={C.upright ? 0 : Math.PI} position-y={C.upright ? 0 : H}>
        <mesh geometry={berry} material={unlitMat(C.color)} />
        {seeds && <mesh geometry={seeds} material={unlitMat(C.seeds.color)} />}
        {/* the leaves, out from the crown and drooping over the shoulder */}
        {Y &&
          Array.from({ length: Y.leaves }, (_, i) => {
            const a = (i / Y.leaves) * Math.PI * 2;
            return (
              <group key={i} rotation-y={a} position-y={H + Y.width * 0.04}>
                <group rotation-x={rad(Y.droop)}>
                  <mesh
                    position-z={Y.length * 0.45}
                    scale={[Y.width / 2, Y.width * 0.1, Y.length / 2]}
                    material={unlitMat(Y.color)}
                  >
                    <sphereGeometry args={[1, 10, 6]} />
                  </mesh>
                </group>
              </group>
            );
          })}
        {K && (
          <mesh position-y={H + K.length / 2} material={unlitMat(Y?.color ?? C.color)}>
            <cylinderGeometry args={[K.radius * 0.8, K.radius, K.length, 6]} />
          </mesh>
        )}
      </group>
    </group>
  );
}
