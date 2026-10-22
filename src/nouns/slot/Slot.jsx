import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { SLOT } from "./objects.js";

// How far proud of the plate's face the slit is laid: clear of the
// plate's own lumps, so the two never fight over the same pixels.
const PROUD = 0.06;

// One coin slot, lying in its own x/y plane and standing out along +z — so
// whoever seats it on a face turns +z along the face's normal and it sits
// flat, floated off the face by `stand`. The plate is a clay cube pulled
// to its proportions — `radius` half the height, the form pulling it
// `width` across and squashing it to `depth` along z — and the slit a thin
// dark plate laid proud of it. `config` overrides any of SLOT's fields for
// this one instance.
export default function Slot({ config }) {
  const S = useMemo(() => merge(SLOT, config), [config]);
  const form = useMemo(
    () => ({ widen: S.width / S.height, deepen: S.depth / S.height }),
    [S.width, S.height, S.depth],
  );
  return (
    <group position-z={S.stand}>
      <group position-z={S.depth / 2}>
        <Primitive
          shape="cube"
          radius={S.height / 2}
          form={form}
          clay={S.clay}
          swatch={S.color}
        />
      </group>
      <mesh position-z={S.depth + PROUD}>
        <boxGeometry args={[S.slit.width, S.slit.height, 0.01]} />
        <primitive object={unlitMat(S.slit.color)} attach="material" />
      </mesh>
    </group>
  );
}
