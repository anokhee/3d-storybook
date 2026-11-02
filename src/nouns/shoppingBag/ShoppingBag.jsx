import { useEffect, useMemo } from "react";

import { merge } from "../../world/merge.js";
import { SHOPPING_BAG } from "./objects.js";
import { buildShoppingBag, disposeShoppingBag } from "./build.js";

// One shopping bag (see SHOPPING_BAG), set down on the ground: its handle's
// grip is its origin (it is built to hang from a hand), so it is lifted by
// its full height to stand on y = 0. `config` overrides SHOPPING_BAG's fields.
export default function ShoppingBag({ config }) {
  const C = useMemo(() => merge(SHOPPING_BAG, config), [config]);
  const bag = useMemo(() => buildShoppingBag(C), [C]);
  useEffect(() => () => disposeShoppingBag(bag), [bag]);
  return <primitive object={bag} position-y={C.height + C.handle.height} />;
}
