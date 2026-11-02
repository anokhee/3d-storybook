import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import Plate, { plateHeightOf } from "../plate/Plate.jsx";
import { PLATE_STACK } from "./objects.js";

// How tall the stack stands.
export const plateStackHeightOf = (C) => {
  const P = C.plate, rimH = P.height * 1.9;
  return rimH + (Math.max(1, Math.round(C.count)) - 1) * rimH * C.nest;
};

// ONE STACK OF PLATES (see PLATE_STACK), standing on y = 0. `config`
// overrides its fields.
export default function PlateStack({ config }) {
  const C = useMemo(() => merge(PLATE_STACK, config), [config]);
  const plate = useMemo(() => ({ ...C.plate, food: { on: false } }), [C.plate]);
  const n = Math.max(1, Math.round(C.count)), step = C.plate.height * 1.9 * C.nest;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        // a fixed little scatter, the same each time
        const a = i * 2.39996, d = C.plate.radius * C.wobble * ((i * 7) % 3) / 2;
        return (
          <group key={i} position={[Math.cos(a) * d, i * step, Math.sin(a) * d]}>
            <Plate config={plate} />
          </group>
        );
      })}
    </group>
  );
}
export { plateHeightOf };
