import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { toon } from "../../adjectives/unlit/toon.js";
import { hue } from "../../world/palette.js";
import { OIL, VINEGAR } from "./objects.js";

// the see-through glass, one material per colour and clouding (as the Glass's)
const mats = new Map();
const glassMat = (swatch, opacity) => {
  const key = `${swatch.hex}|${opacity}`;
  if (!mats.has(key)) mats.set(key, toon(hue(swatch), { transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
  return mats.get(key);
};

// ONE CRUET (see ./objects.js), standing on y = 0: the glass turned from
// its profile, the liquid inside it a little narrower, up to `full`, and
// its stopper in the neck. `defaults` OIL or VINEGAR, `config` over them.
function Cruet({ defaults, config }) {
  const C = useMemo(() => merge(defaults, config), [defaults, config]);
  const R = C.radius, H = C.height;
  const prof = C.profile;
  // the radius at a height `y` (a share), read off the profile
  const radiusAt = (y) => {
    for (let i = 0; i < prof.length - 1; i++) {
      const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
      if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / Math.max(y1 - y0, 1e-6);
    }
    return prof[prof.length - 1][0];
  };
  const glass = useMemo(() => new THREE.LatheGeometry([[0, 0], ...prof].map(([r, y]) => new THREE.Vector2(r * R, y * H)), C.sides), [prof, R, H, C.sides]);
  const liquid = useMemo(() => {
    const top = Math.max(0, Math.min(0.95, C.full));
    if (top <= 0.02) return null;
    const pts = [[0, 0.02]];
    for (const [, y] of prof) if (y > 0.02 && y < top) pts.push([radiusAt(y) * 0.9, y]);
    pts.push([radiusAt(top) * 0.9, top], [0, top]);
    return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * R, y * H)), C.sides);
  }, [prof, R, H, C.full, C.sides]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { glass.dispose(); liquid?.dispose(); }, [glass, liquid]);
  const neck = prof[prof.length - 2][0] * R, S = C.stopper;
  return (
    <group>
      {liquid && <mesh geometry={liquid} material={unlitMat(C.colors.liquid)} renderOrder={0} />}
      <mesh geometry={glass} material={glassMat(C.colors.glass, C.opacity)} renderOrder={1} />
      {S.kind === "cork" ? (
        <mesh position-y={H * 0.98} material={unlitMat(C.colors.stopper)} castShadow>
          <cylinderGeometry args={[neck * 1.05 * S.size, neck * 0.9 * S.size, H * 0.12, 14]} />
        </mesh>
      ) : (
        <group position-y={H}>
          <mesh position-y={-H * 0.03} material={glassMat(C.colors.stopper, Math.min(1, C.opacity + 0.25))}>
            <cylinderGeometry args={[neck * 0.85, neck * 0.7, H * 0.08, 14]} />
          </mesh>
          <mesh position-y={neck * S.size * 0.9} material={glassMat(C.colors.stopper, Math.min(1, C.opacity + 0.25))} castShadow>
            <sphereGeometry args={[neck * S.size, 16, 12]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Oil: a tall slim cruet with a cork, golden.
export function Oil({ config }) {
  return <Cruet defaults={OIL} config={config} />;
}
// Vinegar: a round-bellied cruet with a glass stopper, dark.
export function Vinegar({ config }) {
  return <Cruet defaults={VINEGAR} config={config} />;
}
