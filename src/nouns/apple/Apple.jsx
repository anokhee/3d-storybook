import { useEffect, useMemo } from "react";

import { merge } from "../../world/merge.js";
import { APPLE } from "./objects.js";
import { buildApple, disposeFruit } from "./build.js";

// One apple (see APPLE), resting on the ground. `config` overrides
// APPLE's fields.
export default function Apple({ config }) {
  const C = useMemo(() => merge(APPLE, config), [config]);
  const fruit = useMemo(() => buildApple(C), [C]);
  useEffect(() => () => disposeFruit(fruit), [fruit]);
  return <primitive object={fruit} />;
}
