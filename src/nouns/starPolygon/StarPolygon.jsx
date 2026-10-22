import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { petalRing } from "../../cutout.js";
import Glow from "../../adjectives/lit/Glow.jsx";
import { LIGHT, lightOf } from "../../adjectives/lit/objects.js";
import { paintOf } from "../primitive/Primitive.jsx";
import { eulerOf } from "../primitive/geometry.js";
import { Bulb } from "../../adjectives/glowing/Glowing.jsx";
import { STAR, STAR_TYPES } from "./objects.js";

// One star polygon's geometry, sized off `radius`: points round a ring with
// no middle, tapered to a point and widest at the base, so the points meet
// in the center and there is nothing to cover the join.
export function starHead(type, radius = STAR.radius) {
  return petalRing({
    count: STAR_TYPES[type].points,
    inner: 0,
    outer: radius,
    width: radius * STAR.pointWidth,
    taper: STAR.pointTaper,
    thickness: radius * STAR.pointThickness,
    pitch: 0,
  });
}

// One star polygon, painted `swatch`, turned by its type's rotation over
// STAR's and then by its own `rotation` — { x, y, z } in degrees, see
// ROTATION — on top of that. `light` is { type, ...params } (see LIGHT):
// "lit", it is its own color from any angle and glows as much as
// `brightness` says; "glowing", a translucent shell lit from inside.
// `casts` adds a real point light, which the garland rations.
export default function StarPolygon({
  type,
  radius = STAR.radius,
  rotation,
  swatch,
  light = LIGHT,
  casts = false,
}) {
  const L = lightOf(light);
  const isLit = L.type === "lit";
  const geometry = useMemo(() => starHead(type, radius), [type, radius]);
  const pose = eulerOf(merge(STAR.rotation, STAR_TYPES[type].rotation));
  return (
    <group>
      <group rotation={eulerOf(rotation)}>
        <group rotation={pose}>
          <mesh geometry={geometry} material={paintOf(swatch, L)} />
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
