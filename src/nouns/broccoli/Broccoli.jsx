import { useEffect, useMemo } from "react";

import { merge } from "../../world/merge.js";
import { BROCCOLI } from "./objects.js";
import { buildBroccoli, disposeBroccoli } from "./build.js";

// A head of broccoli (see BROCCOLI), standing on its stalk. `config`
// overrides BROCCOLI's fields.
export default function Broccoli({ config }) {
  const C = useMemo(() => merge(BROCCOLI, config), [config]);
  const head = useMemo(() => buildBroccoli(C), [C]);
  useEffect(() => () => disposeBroccoli(head), [head]);
  return <primitive object={head} />;
}
