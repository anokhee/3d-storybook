// Mushroom House: a house under a mushroom cap. Its defaults are MUSHROOM_HOUSE in
// src/nouns/house/mushroom/objects.js; the component merges this config over them.
import MushroomHouse from "../src/nouns/house/mushroom/MushroomHouse.jsx";
import { MUSHROOM_HOUSE, MUSHROOM_HOUSE_KNOBS } from "../src/nouns/house/mushroom/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(MUSHROOM_HOUSE, MUSHROOM_HOUSE_KNOBS, {}, {});

export default {
  title: "Buildings/Houses/Mushroom House",
  component: MushroomHouse,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <MushroomHouse config={K.configOf(a)} />,
};

export const Default = {};
