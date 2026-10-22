// Two-Story House: the house with a floor on top. Its defaults are TWO_STORY_HOUSE in
// src/nouns/house/twoStory/objects.js; the component merges this config over them.
import TwoStoryHouse from "../src/nouns/house/twoStory/TwoStoryHouse.jsx";
import { TWO_STORY_HOUSE, TWO_STORY_HOUSE_KNOBS } from "../src/nouns/house/twoStory/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TWO_STORY_HOUSE, TWO_STORY_HOUSE_KNOBS, {}, {});

export default {
  title: "Buildings/Houses/Two-Story House",
  component: TwoStoryHouse,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <TwoStoryHouse config={K.configOf(a)} />,
};

export const Default = {};
