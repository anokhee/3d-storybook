// Kiddie Pool: an inflatable paddling pool, rings stacked up.
// One of the water kinds (src/nouns/water/objects.js, KINDS.kiddie), stood on
// its own by stories/helpers/water.jsx.
import { WaterFeature } from "./helpers/water.jsx";
import { WATER, WATER_KNOBS } from "../src/nouns/water/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WATER, WATER_KNOBS, {}, { width: 6, length: 6 });

export default {
  title: "Furniture/Water Fixtures/Kiddie Pool",
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <WaterFeature kind="kiddie" config={K.configOf(a)} lift={0} />,
};

export const Default = {};

