// Drain: what is let into a street — a slotted grate in the gutter by the
// kerb, or a round manhole cover. Its defaults are DRAIN in
// src/nouns/drain/objects.js; the style knob picks which.
import Drain from "../src/nouns/drain/Drain.jsx";
import { DRAIN, DRAIN_KNOBS } from "../src/nouns/drain/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(DRAIN, DRAIN_KNOBS, {}, {});

export default {
  title: "Furniture/Street/Drain",
  component: Drain,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Drain config={K.configOf(a)} />,
};

export const Grate = {};
export const Manhole = { args: { style: "manhole" } };
