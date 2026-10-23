// Pot plant: a pot with soil in it and stems growing up out of it, each tipped
// with a bush, a leaf blade, a daisy, a tulip or a poppy — the plant knob
// picks which. One entry; every color and size of POT_PLANT is a knob. Its
// code is src/nouns/potPlant/PotPlant.jsx and its defaults and knobs
// src/nouns/potPlant/objects.js. See Bench.stories.jsx for how the three
// parts fit together.
import PotPlant from "../src/nouns/potPlant/PotPlant.jsx";
import { POT_PLANT, POT_PLANT_KNOBS, PLANT_KINDS } from "../src/nouns/potPlant/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(POT_PLANT, { kind: { path: "plant.kind", options: PLANT_KINDS, name: "plant" }, ...POT_PLANT_KNOBS });

export default {
  title: "Furniture/Pot Plants/Pot Plant",
  component: PotPlant,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <PotPlant config={K.configOf(a)} />,
};

export const Default = {};
