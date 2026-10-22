// Single-Story House: a one-room house with a pitched roof. Its defaults are HOUSE in
// src/nouns/house/objects.js; the component merges this config over them.
import House from "../src/nouns/house/House.jsx";
import { HOUSE, HOUSE_KNOBS } from "../src/nouns/house/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(HOUSE, HOUSE_KNOBS, {}, {});

export default {
  title: "Buildings/Houses/Single-Story House",
  component: House,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <House config={K.configOf(a)} />,
};

export const Default = {};
