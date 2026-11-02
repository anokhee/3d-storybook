import { useEffect, useMemo } from "react";

import { merge } from "../../world/merge.js";
import { BANANA } from "./objects.js";
import { buildBanana, disposeFruit } from "./build.js";

// One banana, or a bunch of them (see BANANA), lying on the ground.
// `config` overrides BANANA's fields.
export default function Banana({ config }) {
  const C = useMemo(() => merge(BANANA, config), [config]);
  const fruit = useMemo(() => buildBanana(C), [C]);
  useEffect(() => () => disposeFruit(fruit), [fruit]);
  return <primitive object={fruit} />;
}
