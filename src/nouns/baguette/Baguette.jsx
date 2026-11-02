import { useEffect, useMemo } from "react";

import { merge } from "../../world/merge.js";
import { BAGUETTE } from "./objects.js";
import { buildBaguette, disposeBaguette } from "./build.js";

// One baguette (see BAGUETTE), lying on the ground along z, its slashes up.
// `config` overrides BAGUETTE's fields.
export default function Baguette({ config }) {
  const C = useMemo(() => merge(BAGUETTE, config), [config]);
  const loaf = useMemo(() => buildBaguette(C), [C]);
  useEffect(() => () => disposeBaguette(loaf), [loaf]);
  return (
    <group position-y={C.radius} rotation-x={-Math.PI / 2}>
      <primitive object={loaf} />
    </group>
  );
}
