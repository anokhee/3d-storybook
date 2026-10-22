// StickLamp: one entry, as it was made. Its defaults live in
// src/nouns/lamp/objects.js; to give it knobs, see Bench.stories.jsx.
import StickLamp from "../src/nouns/lamp/StickLamp.jsx";
import { STICK_LAMP, STICK_LAMP_KNOBS } from "../src/nouns/lamp/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(STICK_LAMP, STICK_LAMP_KNOBS, {}, {});

export default {
  title: "Lighting/Basic Lamp",
  component: StickLamp,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <StickLamp config={K.configOf(a)} />,
};

export const Default = {};
