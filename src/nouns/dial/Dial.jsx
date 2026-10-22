import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import Primitive from "../primitive/Primitive.jsx";
import { DIAL } from "./objects.js";

const deg = (rad) => (rad * 180) / Math.PI;

// One coin dial, lying in its own x/y plane and standing out along +z — so
// whoever seats it on a face turns +z along the face's normal and it sits
// flat, floated off the face by `stand`. Stacked out along +z: decal,
// dial, handle. Each is a primitive cylinder, which is built standing
// along y and two radii tall, so it is pressed to its depth with `tall`
// and laid on its side; the handle, laid on ITS side the other way, runs
// across the dial's face. The dial and handle are clay; the decal is paint
// on the face behind them, so it stays smooth. `config` overrides any of
// DIAL's fields for this one instance.
export default function Dial({ config }) {
  const L = useMemo(() => merge(DIAL, config), [config]);
  const D = L.decal,
    H = L.handle;
  const size = L.radius * H.size;
  const decalRadius = L.radius * D.padding;
  const handleLength = L.radius * H.length;
  return (
    <group position-z={L.stand + D.lift}>
      <group position-z={D.depth / 2}>
        <Primitive
          shape="cylinder"
          radius={decalRadius}
          sides={L.detail}
          form={{ tall: D.depth / (2 * decalRadius) }}
          rotation={{ x: 90 }}
          swatch={D.color}
        />
      </group>
      <group position-z={D.depth + L.depth / 2}>
        <Primitive
          shape="cylinder"
          radius={L.radius}
          sides={L.detail}
          form={{ tall: L.depth / (2 * L.radius) }}
          clay={L.clay}
          rotation={{ x: 90 }}
          swatch={L.color}
        />
      </group>
      <group position-z={D.depth + L.depth + size}>
        <Primitive
          shape="cylinder"
          radius={size}
          sides={L.detail}
          form={{ tall: handleLength / (2 * size) }}
          clay={L.clay}
          rotation={{ z: 90 + deg(H.turn) }}
          swatch={H.color ?? L.color}
        />
      </group>
    </group>
  );
}
