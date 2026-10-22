import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { BOWL } from "./objects.js";

// How tall it stands: the rim (the fruit may peek over it).
export function bowlHeightOf(C) {
  return C.depth;
}

// How far out from its middle it spreads: the rim, flare and all.
export function bowlFootprintOf(C) {
  const r = C.radius * (1 + 0.15 * C.flare);
  return { x: r, z: r };
}

// The bowl's outside, as a radius at each height `t` up it (0 the foot,
// 1 the rim): a quarter curve swelling from the foot, with the flare
// kicking the rim out at the very top.
const outsideAt = (C, t) => {
  const foot = C.radius * C.foot.radius;
  const curve = Math.pow(Math.sin((t * Math.PI) / 2), 0.85);
  return foot + (C.radius - foot) * curve + C.radius * 0.15 * C.flare * Math.pow(t, 4);
};

// One bowl (see BOWL), standing on the ground at y = 0. `config` overrides
// any of BOWL's fields for this one.
export default function Bowl({ config }) {
  const C = useMemo(() => merge(BOWL, config), [config]);
  const floor = C.foot.height + C.wall; // the inside's floor, off the ground

  // The shell and the inside profile it leaves: up the outside from the
  // foot ring, over the rim and back down the inside, `wall` in from the
  // outside, to a flat floor.
  const { geometry, inside } = useMemo(() => {
    const n = 9;
    const pts = [];
    const footR = C.radius * C.foot.radius;
    pts.push(new THREE.Vector2(footR - C.wall, 0));
    pts.push(new THREE.Vector2(footR, 0));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(new THREE.Vector2(outsideAt(C, t), C.foot.height + t * (C.depth - C.foot.height)));
    }
    const inside = [];
    for (let i = n; i >= 1; i--) {
      const t = i / n;
      const p = new THREE.Vector2(outsideAt(C, t) - C.wall, C.foot.height + t * (C.depth - C.foot.height));
      pts.push(p);
      inside.push(p);
    }
    const bottom = new THREE.Vector2(0, floor);
    pts.push(bottom);
    inside.push(bottom);
    return { geometry: new THREE.LatheGeometry(pts, C.sides), inside };
  }, [C, floor]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Where each fruit rests: round a ring (or one in the middle), each
  // lowered until it just touches the inside.
  const fruit = useMemo(() => {
    const count = Math.max(0, Math.min(6, Math.round(C.fruit.count)));
    const fr = C.fruit.radius;
    const ring = count > 1 ? Math.min(C.radius * 0.5, (fr * count) / Math.PI) : 0;
    const restAt = (rho) => {
      const segs = inside.slice(0, -1).map((p, i) => [p, inside[i + 1]]);
      const dist = (y) => {
        let best = Infinity;
        const c = new THREE.Vector2(rho, y);
        for (const [a, b] of segs) {
          const ab = b.clone().sub(a);
          const k = Math.max(0, Math.min(1, c.clone().sub(a).dot(ab) / ab.lengthSq()));
          best = Math.min(best, c.distanceTo(a.clone().addScaledVector(ab, k)));
        }
        return best;
      };
      let y = floor + fr;
      for (let i = 0; i < 40 && dist(y) < fr * 0.98; i++) y += fr * 0.05;
      return y;
    };
    const y = restAt(ring);
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + 0.4;
      return { x: Math.sin(a) * ring, z: Math.cos(a) * ring, y, odd: i % 2 === 1 };
    });
  }, [C.fruit, C.radius, inside, floor]);

  return (
    <group>
      <mesh castShadow receiveShadow geometry={geometry} material={unlitMat(C.colors.bowl)} />
      {fruit.map((f, i) => (
        <mesh key={i} castShadow receiveShadow position={[f.x, f.y, f.z]} material={unlitMat(f.odd ? C.colors.fruitB : C.colors.fruitA)}>
          <sphereGeometry args={[C.fruit.radius, 16, 12]} />
        </mesh>
      ))}
    </group>
  );
}
