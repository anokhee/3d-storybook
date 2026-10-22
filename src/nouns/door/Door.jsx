import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import Primitive from "../primitive/Primitive.jsx";
import { DOOR } from "./objects.js";

// One door: a primitive's front half, its cut in the x/y plane at z = 0
// and bulging out along +z — so whoever seats it on a face turns +z along
// the face's normal and it sits flush. `config` overrides any of DOOR's
// fields for this one instance.
export default function Door({ config }) {
  const R = useMemo(() => merge(DOOR, config), [config]);
  const light = useMemo(() => merge(LIGHT, R.light), [R.light]);
  return (
    <Primitive
      shape={R.shape}
      radius={R.radius}
      detail={R.detail}
      form={R.form}
      clay={R.clay}
      half="front"
      swatch={R.color}
      light={light}
    />
  );
}
