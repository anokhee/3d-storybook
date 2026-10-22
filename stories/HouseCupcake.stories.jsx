// Cupcake House: a café in a cupcake. Its defaults are CUPCAKE in
// src/nouns/house/cupcake/objects.js; the component merges this config over them.
import Cupcake from "../src/nouns/house/cupcake/Cupcake.jsx";
import { CUPCAKE, CUPCAKE_KNOBS } from "../src/nouns/house/cupcake/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CUPCAKE, CUPCAKE_KNOBS, {}, {});

export default {
  title: "Buildings/Houses/Cupcake House",
  component: Cupcake,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Cupcake config={K.configOf(a)} />,
};

export const Default = {};
