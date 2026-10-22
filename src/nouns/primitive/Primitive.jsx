import { useMemo } from "react";

import { litMat } from "../../adjectives/lit/material.js";
import Glow from "../../adjectives/lit/Glow.jsx";
import { LIGHT, lightOf } from "../../adjectives/lit/objects.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { glowingMat } from "../../adjectives/glowing/material.js";
import { Bulb } from "../../adjectives/glowing/Glowing.jsx";
import { eulerOf, primitiveGeometry } from "./geometry.js";

// One primitive, painted `swatch`. `light` is { type, ...params } (see
// LIGHT): "lit", it is its own color from any angle and glows as much as
// `brightness` says; "glowing", it is a translucent shell lit from inside.
// `casts` adds a real point light, which the garland rations.
// `detail` scales the facet count — see PRIMITIVES — and `form` pushes the
// solid about — see FORM. `half` keeps only one half of it, named by the
// side that stays — see primitiveGeometry — for a thing seated flat on a
// face: a dome, a button. `rotation` turns the solid about its own middle,
// { x, y, z } in degrees — see ROTATION — the way a tulip's type does; the
// glow round it, being round, is not turned. `clay` throws it in lumpy
// clay like a doll — see CLAY. `shadow` false keeps it out of the
// shadows — it neither casts one nor takes one, where a scene flags its
// things (see interior/Interior.jsx's Rooms): a window's glass, which
// the day comes through.
export default function Primitive({
  shape,
  radius,
  sides,
  detail = 1,
  form,
  half,
  clay,
  rotation,
  swatch,
  light = LIGHT,
  casts = false,
  shadow = true,
}) {
  const L = lightOf(light);
  const isLit = L.type === "lit";
  const geometry = useMemo(
    () => primitiveGeometry(shape, radius, sides, detail, form, half, clay),
    [shape, radius, sides, detail, form, half, clay],
  );
  return (
    <group>
      <group rotation={eulerOf(rotation)}>
        <mesh
          geometry={geometry}
          material={paintOf(swatch, L)}
          {...(shadow ? {} : { userData: NO_SHADOW })}
        />
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

// What marks a mesh as casting no shadow and taking none.
export const NO_SHADOW = { noShadow: true };

// What a thing is painted with, by its resolved light's type.
export const paintOf = (swatch, L) =>
  L.type === "glowing" ? glowingMat(swatch, L)
  : L.type === "lit" ? litMat(swatch)
  : unlitMat(swatch);
