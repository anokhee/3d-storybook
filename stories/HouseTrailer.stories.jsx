// Trailer: a caravan on wheels. Its defaults are TRAILER in
// src/nouns/house/trailer/objects.js; the component merges this config over them.
import Trailer from "../src/nouns/house/trailer/Trailer.jsx";
import { TRAILER, TRAILER_KNOBS } from "../src/nouns/house/trailer/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TRAILER, TRAILER_KNOBS, {}, {});

export default {
  title: "Buildings/Houses/Trailer",
  component: Trailer,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Trailer config={K.configOf(a)} />,
};

export const Default = {};
