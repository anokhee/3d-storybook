import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { petalRing } from "../../cutout.js";
import Glow from "../../adjectives/lit/Glow.jsx";
import { LIGHT, lightOf } from "../../adjectives/lit/objects.js";
import { paintOf } from "../primitive/Primitive.jsx";
import { eulerOf } from "../primitive/geometry.js";
import { Bulb } from "../../adjectives/glowing/Glowing.jsx";
import { FLOWER, FLOWER_TYPES } from "./objects.js";

// One flower head of a type, sized off `radius`: every dimension comes out of
// it, so the parts cannot disagree — a petal tip lands exactly ON the radius,
// and the middle can never crowd out the petals because the petals are
// whatever radius the middle leaves. Shared by the planted field (which
// instances it) and Flower below (which draws one).
// `shape` overrides the type's own fields — a flowering tree's blossoms
// are daisies pitched up into bells (see TREE.blooms).
export function flowerHead(type, radius = FLOWER.radius, shape = {}) {
  const T = { ...FLOWER_TYPES[type], ...shape };
  const pistilRadius = radius * T.pistilRadius;
  return {
    pistilRadius,
    petals: petalRing({
      count: T.petals,
      inner: pistilRadius,
      outer: radius,
      width: radius * T.petalWidth,
      taper: T.petalTaper,
      thickness: radius * FLOWER.petalThickness,
      pitch: T.petalPitch,
    }),
  };
}

// One flower, hung or capping: the head turned by its type's rotation over
// FLOWER's (the tulip's cup mouth-down), and then by its own `rotation` —
// { x, y, z } in degrees, see ROTATION — on top of that, so a spec's turn
// is from the flower's natural pose, not from flat. Petals painted `swatch`
// and the middle its own color. `light` is { type, ...params } (see
// LIGHT): "lit", it is its own color from any angle, all over, and glows
// as much as `brightness` says, in `color` or its own; "glowing", a
// translucent shell lit from inside. `casts` adds a real point light,
// which the garland rations.
export default function Flower({
  type,
  radius = FLOWER.radius,
  rotation,
  swatch,
  light = LIGHT,
  casts = false,
}) {
  const L = lightOf(light);
  const isLit = L.type === "lit";
  const T = FLOWER_TYPES[type];
  const { petals, pistilRadius } = useMemo(
    () => flowerHead(type, radius),
    [type, radius],
  );
  const pose = eulerOf(merge(FLOWER.rotation, T.rotation));
  const paint = (s) => paintOf(s, L);

  return (
    <group>
      <group rotation={eulerOf(rotation)}>
        <group rotation={pose}>
          <mesh geometry={petals} material={paint(swatch)} />
          {/* A sphere of radius 0 is a wasted draw. */}
          {pistilRadius > 0 && (
            <mesh material={paint(FLOWER.pistilColor)}>
              <sphereGeometry args={[pistilRadius, 8, 6]} />
            </mesh>
          )}
        </group>
      </group>
      {isLit && (
        <Glow swatch={swatch} radius={radius} light={L} casts={casts} />
      )}
      {L.type === "glowing" && (
        <Bulb swatch={swatch} radius={radius} light={L} />
      )}
    </group>
  );
}
