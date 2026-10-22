import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { unlitMat } from "../../adjectives/unlit/material.js";
import { roundedRect } from "../water/Pad.jsx";
import Pattern from "../pattern/Pattern.jsx";

// One rug, lying on the ground at y = 0 with its middle at the origin:
// a rounded rectangle pulled up `thickness` (see RUG), with its pattern
// of dots raised on top (see ../pattern/Pattern.jsx). Its own mesh, so
// the edit view has it to press on and drag by, the way it does a bench.
export default function Rug({ config: R }) {
  const slab = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(
      roundedRect(R.width, R.length, R.cornerRadius),
      { depth: R.thickness, bevelEnabled: false, curveSegments: 8 },
    );
    // Drawn in x/y and pulled out along +z; laid flat, y up, its
    // underside on the ground.
    g.rotateX(-Math.PI / 2);
    return g;
  }, [R.width, R.length, R.cornerRadius, R.thickness]);
  useEffect(() => () => slab.dispose(), [slab]);
  return (
    <group>
      <mesh geometry={slab} material={unlitMat(R.color)} />
      <group position-y={R.thickness}>
        <Pattern
          width={R.width}
          length={R.length}
          cornerRadius={R.cornerRadius}
          pattern={R.pattern}
        />
      </group>
    </group>
  );
}
