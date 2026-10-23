// Campfire: a ring of stones with logs leant together in it and the fire
// standing up out of them, lit, flickering on its own. Its code is in
// src/nouns/campfire/ (Campfire.jsx, CAMPFIRE and CAMPFIRE_KNOBS in
// objects.js). The embers-only switch burns it down: a low flame barely
// moving over the coals.
import Campfire from "../src/nouns/campfire/Campfire.jsx";
import { CAMPFIRE, CAMPFIRE_KNOBS } from "../src/nouns/campfire/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CAMPFIRE, CAMPFIRE_KNOBS, {}, {});

export default {
  title: "Lighting/Campfire",
  component: Campfire,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Campfire config={K.configOf(a)} />,
};

export const Default = {};
