import { useEffect, useMemo } from "react";

import { merge } from "../../world/merge.js";
import { ORANGE } from "./objects.js";
import { buildOrange, disposeFruit } from "./build.js";

// One orange (see ORANGE), resting on the ground. `config` overrides
// ORANGE's fields.
export default function Orange({ config }) {
  const C = useMemo(() => merge(ORANGE, config), [config]);
  const fruit = useMemo(() => buildOrange(C), [C]);
  useEffect(() => () => disposeFruit(fruit), [fruit]);
  return <primitive object={fruit} />;
}
