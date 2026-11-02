// Apple: its code is src/nouns/apple/build.js (plain three.js, so the shopping
// bag carries clones of it) and src/nouns/apple/Apple.jsx; its defaults
// src/nouns/apple/objects.js.
import Apple from "../src/nouns/apple/Apple.jsx";
import { APPLE, APPLE_KNOBS } from "../src/nouns/apple/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(APPLE, APPLE_KNOBS, {}, {});

export default {
  title: "Food/Produce/Apple",
  component: Apple,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Apple config={K.configOf(a)} />,
};

export const Default = {};
