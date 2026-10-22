// The vending machine. Same shape as Bench.stories.jsx (that one has the
// long comments). The one thing to notice: its parameter file nests the
// lit case under `window`, so that is where the panel color and shelf
// count go in `render`. When a knob does nothing, this is the first thing
// to check: open the object's objects.js and match the nesting exactly.

import VendingMachine from "../src/nouns/vendingMachine/VendingMachine.jsx";
import { VENDING_MACHINE, VENDING_MACHINE_KNOBS } from "../src/nouns/vendingMachine/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(VENDING_MACHINE, VENDING_MACHINE_KNOBS);

export default {
  title: "Machines/Vending Machine",
  component: VendingMachine,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <VendingMachine config={K.configOf(a)} />,
};

export const Default = {};

