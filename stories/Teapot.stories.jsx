// Teapot: a round-bellied pot with a lid, a curved spout and a loop
// handle, standing on the ground. Its code is src/nouns/teapot/Teapot.jsx
// and its defaults src/nouns/teapot/objects.js.
import Teapot from "../src/nouns/teapot/Teapot.jsx";
import { TEAPOT, TEAPOT_KNOBS } from "../src/nouns/teapot/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TEAPOT, TEAPOT_KNOBS, {}, {});

export default {
  title: "Props/Kitchen/Teapot",
  component: Teapot,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Teapot config={K.configOf(a)} />,
};

export const Default = {};

export const Tall = { args: { bodyTall: 1.5, bodyBelly: 0.4, colorsBody: "#7c56be" } };
