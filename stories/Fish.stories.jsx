// Fish: a toy fish swimming in the air just off the ground, nose to +z:
// its tail beats, its body sways, its side fins paddle and it bobs. Its
// code lives in src/nouns/fish/ (Fish.jsx, defaults and knobs in
// objects.js). The steel drums' fish heads, popping up out of the sand,
// stay the game's own (src/xylophone/fish.js).
import Fish from "../src/nouns/fish/Fish.jsx";
import { FISH, FISH_KNOBS } from "../src/nouns/fish/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(FISH, FISH_KNOBS, {}, {});

export default {
  title: "Animals/Fish",
  component: Fish,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Fish config={K.configOf(a)} />,
};

export const Default = {};
