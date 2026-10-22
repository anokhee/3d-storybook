// Pool: a tiled swimming pool with a ladder, dug into the ground (the
// stage's ground is cut away round it the way the planet's is).
// One of the water kinds (src/nouns/water/objects.js, KINDS.pool), stood on
// its own by stories/helpers/water.jsx.
import { WaterFeature } from "./helpers/water.jsx";
import { WATER, WATER_KNOBS } from "../src/nouns/water/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WATER, WATER_KNOBS, {}, {});

export default {
  title: "Furniture/Water Fixtures/Pool",
  parameters: { stage: { ground: "planet" } },
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <WaterFeature kind="pool" config={K.configOf(a)} lift={0} />,
};

export const Default = {};

