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

// A tall one, for a floor (POT_PLANT_TALL): a tall pot, long stems near
// upright, blades all the way up them
export const Tall = {
  args: { potRadius: 0.45, potFlare: 0.85, potHeight: 1.15, stemCount: 5, stemHeight: 2.5, stemSpread: 1.3, stemLeaves: 5, stemLeafSize: 1.15, plantSize: 0.32, kind: "leaf", leafAspect: 2.1 },
};
