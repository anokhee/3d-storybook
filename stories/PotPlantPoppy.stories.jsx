// Poppy in a pot: poppies on stems. The pot plant's "poppy" kind (PLANT_KINDS in
// src/nouns/potPlant/objects.js), with every color and size of POT_PLANT
// as a knob. See Bench.stories.jsx for how the three parts fit together.
import PotPlant from "../src/nouns/potPlant/PotPlant.jsx";
import { POT_PLANT, POT_PLANT_KNOBS } from "../src/nouns/potPlant/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(POT_PLANT, POT_PLANT_KNOBS, { plant: { kind: "poppy" } });

export default {
  title: "Furniture/Pot Plants/Poppy",
  component: PotPlant,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <PotPlant config={K.configOf(a)} />,
};

export const Default = {};

