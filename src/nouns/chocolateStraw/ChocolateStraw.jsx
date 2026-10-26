import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { CHOCOLATE_STRAW } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// One hollow band of a straw, from `y0` to `y1`: up the outside, over the
// rim and down the inside.
function band(C, y0, y1) {
  const inner = Math.max(0.01, C.radius - C.wall);
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(inner, y0),
      new THREE.Vector2(C.radius, y0),
      new THREE.Vector2(C.radius, y1),
      new THREE.Vector2(inner, y1),
      new THREE.Vector2(inner, y0),
    ],
    12,
  );
}

// One straw, standing from its foot at the origin: `stripes` bands from
// the foot up, alternately `color` and `stripe`. `config` is
// CHOCOLATE_STRAW's, `scale` ignored — the caller places and scales it.
export function Straw({ config: C }) {
  const bands = useMemo(
    () =>
      Array.from({ length: C.stripes }, (_, i) =>
        band(C, (i / C.stripes) * C.length, ((i + 1) / C.stripes) * C.length),
      ),
    [C.radius, C.wall, C.length, C.stripes],
  );
  useEffect(() => () => bands.forEach((g) => g.dispose()), [bands]);
  return bands.map((geometry, i) => (
    <mesh
      key={i}
      geometry={geometry}
      material={unlitMat(i % 2 === 0 ? C.color : C.stripe)}
    />
  ));
}

// A straw's place in the ring of `count`: its bearing round the middle.
export const strawBearing = (i, count) => (i / count) * Math.PI * 2;

// How tall they stand, in their own units: a straw tipped out from upright.
export const chocolateStrawHeightOf = (C) =>
  C.length * Math.cos(rad(C.lean)) + C.radius;

// A ring of chocolate straws (see CHOCOLATE_STRAW), their feet on the
// ground at y = 0. `config` overrides any of CHOCOLATE_STRAW's fields.
export default function ChocolateStraw({ config }) {
  const C = useMemo(() => merge(CHOCOLATE_STRAW, config), [config]);
  return (
    <group scale={C.scale}>
      {Array.from({ length: C.count }, (_, i) => (
        <group
          key={i}
          rotation-y={strawBearing(i, C.count)}
          position={[
            Math.sin(strawBearing(i, C.count)) * C.ring,
            0,
            Math.cos(strawBearing(i, C.count)) * C.ring,
          ]}
        >
          <group rotation-x={rad(C.lean)}>
            <Straw config={C} />
          </group>
        </group>
      ))}
    </group>
  );
}
