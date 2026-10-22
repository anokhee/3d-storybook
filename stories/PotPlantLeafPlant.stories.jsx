// Leaf Plant in a pot: broad leaves on stems. The pot plant's "leaf" kind (PLANT_KINDS in
// src/nouns/potPlant/objects.js), with every color and size of POT_PLANT
// as a knob. See Bench.stories.jsx for how the three parts fit together.
import PotPlant from "../src/nouns/potPlant/PotPlant.jsx";
import { POT_PLANT, POT_PLANT_KNOBS } from "../src/nouns/potPlant/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(POT_PLANT, POT_PLANT_KNOBS, { plant: { kind: "leaf" } });

export default {
  title: "Furniture/Pot Plants/Leaf Plant",
  component: PotPlant,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <PotPlant config={K.configOf(a)} />,
};

export const Default = {};

