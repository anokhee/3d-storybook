// Skyscraper: the tower from the Car project, in the dollies' house
// style: cream walls stacked up floors of the house's windows, a plum
// cornice between each, a narrower tier set back on top under violet
// slabs, a spire, and the house's door at the foot (src/car/skyscraper.js).
// The panes are lit at any hour, the way the game lights them.
import { useEffect, useMemo } from "react";
import { buildSkyscraper, SKYSCRAPER } from "../src/car/skyscraper.js";
import { toon } from "../src/adjectives/unlit/toon.js";
import { hue } from "../src/world/palette.js";

function Tower({ floors, tierFloors, width }) {
  const group = useMemo(() => buildSkyscraper({ toon: (c) => toon(hue(c)), hue }, floors, { ...SKYSCRAPER, width, depth: width, tier: { ...SKYSCRAPER.tier, floors: tierFloors } }), [floors, tierFloors, width]);
  useEffect(() => () => group.traverse((o) => o.geometry?.dispose?.()), [group]);
  return <primitive object={group} />;
}

export default {
  title: "Buildings/Skyscraper",
  argTypes: {
    floors: { control: { type: "range", min: 2, max: 14, step: 1 }, name: "floors (main tier)" },
    tierFloors: { control: { type: "range", min: 0, max: 6, step: 1 }, name: "floors (top tier)" },
    width: { control: { type: "range", min: 4, max: 12, step: 0.5 } },
  },
  args: { floors: 8, tierFloors: SKYSCRAPER.tier.floors, width: SKYSCRAPER.width },
  render: (a) => <Tower floors={a.floors} tierFloors={a.tierFloors} width={a.width} />,
};

export const Default = {};
