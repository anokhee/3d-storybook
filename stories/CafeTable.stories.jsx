// Café Table: a little round table on one leg with chairs round it; and
// Umbrella Table, the same with a parasol up through it (a straight pole, no
// crook, no beads on its rim) — the library's Table, Wooden Chair and Umbrella
// put together at the characters' size. Its defaults are CAFE_TABLE in
// src/nouns/cafeTable/objects.js.
import CafeTable from "../src/nouns/cafeTable/CafeTable.jsx";
import { CAFE_TABLE, CAFE_TABLE_KNOBS } from "../src/nouns/cafeTable/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CAFE_TABLE, CAFE_TABLE_KNOBS, {}, {});

export default {
  title: "Furniture/Street/Café Table",
  component: CafeTable,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <CafeTable config={K.configOf(a)} />,
};

export const Default = {};
export const UmbrellaTable = { name: "Umbrella Table", args: { parasol: true } };
