// Spring: a hot spring: milky water, steam, rocks round its bank. The water kind "spring"
// (src/nouns/water/objects.js), stood on its own by stories/helpers/water.jsx,
// in the planet's curved ground as in the game.
import { WaterFeature } from "./helpers/water.jsx";
import { WATER, WATER_KNOBS } from "../src/nouns/water/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WATER, WATER_KNOBS, {}, {});

export default {
  title: "Nature/Water/Spring",
  parameters: { stage: { ground: "planet" } },
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <WaterFeature kind="spring" config={K.configOf(a)} lift={0} />,
};

export const Default = {};

