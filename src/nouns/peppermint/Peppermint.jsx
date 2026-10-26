import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { PEPPERMINT } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// How tall it stands, in its own units: its diameter.
export const peppermintHeightOf = (C) => 2 * C.radius;

// One red band: a curved wedge winding out from the middle, its two edges
// spirals `turn` radians round by the rim, `span` radians wide, from `a`.
function band(radius, a, span, turn) {
  const steps = 24;
  const s = new THREE.Shape();
  const at = (k, w) => {
    const r = (k / steps) * radius;
    const t = a + turn * (k / steps) + (w ? span : 0);
    return [r * Math.cos(t), r * Math.sin(t)];
  };
  s.moveTo(0, 0);
  for (let k = 1; k <= steps; k++) s.lineTo(...at(k, 0));
  for (let k = steps; k >= 1; k--) s.lineTo(...at(k, 1));
  s.closePath();
  return s;
}

// One peppermint (see PEPPERMINT), standing on its edge at y = 0 facing +z.
// `config` overrides any of PEPPERMINT's fields.
export default function Peppermint({ config }) {
  const C = useMemo(() => merge(PEPPERMINT, config), [config]);

  const disc = useMemo(
    () =>
      new THREE.CylinderGeometry(C.radius, C.radius, C.thickness, 40).rotateX(
        Math.PI / 2,
      ),
    [C.radius, C.thickness],
  );
  // The red bands, each winding out from the middle in a smooth spiral,
  // standing a hair proud of the disc's faces.
  const bands = useMemo(() => {
    const step = (Math.PI * 2) / C.wedges;
    const shapes = Array.from({ length: C.wedges }, (_, w) =>
      band(C.radius, w * step, step * 0.5, rad(C.twist)),
    );
    return new THREE.ExtrudeGeometry(shapes, {
      depth: C.thickness * 1.04,
      bevelEnabled: false,
      curveSegments: 6,
    }).translate(0, 0, -C.thickness * 0.52);
  }, [C.radius, C.thickness, C.wedges, C.twist]);
  useEffect(
    () => () => {
      disc.dispose();
      bands.dispose();
    },
    [disc, bands],
  );

  return (
    <group scale={C.scale}>
      <group position-y={C.radius}>
        <mesh geometry={disc} material={unlitMat(C.white)} />
        <mesh geometry={bands} material={unlitMat(C.red)} />
      </group>
    </group>
  );
}
