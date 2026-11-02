import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { toon } from "../../adjectives/unlit/toon.js";
import { hue } from "../../world/palette.js";
import { GLASS } from "./objects.js";

// The glass's own see-through paint, one per colour and clouding (the
// shared unlitMat is solid).
const mats = new Map();
const glassMat = (swatch, opacity) => {
  const key = `${swatch.hex}|${opacity}`;
  if (!mats.has(key)) mats.set(key, toon(hue(swatch), { transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
  return mats.get(key);
};

// ONE GLASS (see GLASS), standing on y = 0. `config` overrides its fields.
export default function Glass({ config }) {
  const C = useMemo(() => merge(GLASS, config), [config]);
  const R = C.radius, r0 = R * C.foot, H = C.height, w = C.wall, b = C.base;
  const shell = useMemo(() => new THREE.LatheGeometry([
    [0, 0], [r0, 0], [R, H], [R - w, H], [r0 - w, b], [0, b],
  ].map(([x, y]) => new THREE.Vector2(x, y)), C.sides), [R, r0, H, w, b, C.sides]);
  // the drink: a solid of the inside's shape, from the bottom to its level
  const t = Math.max(0, Math.min(1, C.full));
  const level = b + t * (H - b - 0.01);
  const inside = (y) => r0 - w + (R - r0) * (y / H);
  const drink = useMemo(() => t > 0 && new THREE.CylinderGeometry(inside(level) - 0.002, inside(b) - 0.002, level - b, C.sides),
    [t, level, b, R, r0, w, H, C.sides]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { shell.dispose(); drink && drink.dispose(); }, [shell, drink]);
  return (
    <group>
      {drink && <mesh geometry={drink} position-y={(level + b) / 2} material={unlitMat(C.colors.drink)} renderOrder={0} />}
      <mesh geometry={shell} material={glassMat(C.colors.glass, C.opacity)} renderOrder={1} />
    </group>
  );
}
