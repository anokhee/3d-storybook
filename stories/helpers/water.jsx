// WATER FEATURE: one pond, pool, spring, tub, kiddie pool or bath on its
// own. In the game a water feature is laid out by the lot it sits on, and
// the pool is worked out from the lot's position on the planet (see
// src/nouns/water/pools.js). So this stands one lot at the planet's north
// pole, where "up" is +y, puts a single water feature in the middle of it,
// and brings the result down to the stage's ground.
import { useMemo } from "react";
import { Pools } from "../../src/nouns/water/Water.jsx";
import { PLANET } from "../../src/nouns/planet/objects.js";

export function WaterFeature({ kind, config = {}, lift = 0 }) {
  const stations = useMemo(
    () => [
      {
        body: "planet",
        lat: 90,
        lon: 0,
        config: { objects: [{ type: "waterFeature", config: { kind, ...config } }] },
      },
    ],
    [kind, config],
  );
  return (
    <group position-y={-PLANET.radius + lift}>
      <Pools stations={stations} />
    </group>
  );
}
