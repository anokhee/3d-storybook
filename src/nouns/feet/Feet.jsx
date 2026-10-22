import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { primitiveGeometry } from "../primitive/geometry.js";
import { FEET } from "./objects.js";

// How far the feet lift whatever stands on them: their height less what is
// sunk into the ground. No feet, no lift.
export function feetLiftOf(config) {
  const F = merge(FEET, config);
  return F.count > 0 ? F.height - F.sink : 0;
}

// One leg: a clay cylinder pinched to `taper` at the top and pressed to
// `height` — a primitive cylinder stands two radii tall — built about its
// own middle, so it is stood up by half its height to put its foot at
// y = 0.
const legGeometry = (F) =>
  primitiveGeometry(
    "cylinder",
    F.radius,
    F.detail,
    1,
    { top: { inflate: F.taper }, tall: F.height / (2 * F.radius) },
    undefined,
    F.clay,
  );

// The feet under a base that spreads `footprint` { x, z } from its middle,
// stood on the ground at y = 0 and sunk by `sink`, in `swatch` unless the
// config names its own color. `config` overrides any of FEET's fields.
// Each stands on the RECTANGLE `in` of the footprint rather than an
// ellipse — its bearing pushed out until the longer of its two components
// reaches the edge — so four at `turn` 45 land on a box's corners.
export default function Feet({ config, footprint, swatch }) {
  const F = useMemo(() => merge(FEET, config), [config]);
  const geometry = useMemo(() => legGeometry(F), [F]);
  if (!(F.count > 0)) return null;
  const material = unlitMat(F.color ?? swatch);
  return Array.from({ length: F.count }, (_, i) => {
    const a = ((F.turn + (360 / F.count) * i) * Math.PI) / 180;
    const out = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    return (
      <mesh
        key={i}
        geometry={geometry}
        material={material}
        position={[
          Math.cos(a) * out * footprint.x * F.in,
          F.height / 2 - F.sink,
          Math.sin(a) * out * footprint.z * F.in,
        ]}
      />
    );
  });
}
