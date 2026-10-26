// Jack-in-the-Box Head: a clown's head on its coiled spring. Its code is src/nouns/jackHead/JackHead.jsx and its
// defaults src/nouns/jackHead/objects.js.
import JackHead from "../src/nouns/jackHead/JackHead.jsx";
import { JACK_HEAD, JACK_HEAD_KNOBS } from "../src/nouns/jackHead/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(JACK_HEAD, JACK_HEAD_KNOBS, {}, {});

export default {
  title: "Toys/Jack-in-the-Box Head",
  component: JackHead,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <JackHead config={K.configOf(a)} />,
};

export const Default = {};
