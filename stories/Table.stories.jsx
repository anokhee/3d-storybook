// Table: one entry, as it was made. Its defaults live in
// src/nouns/table/objects.js; to give it knobs, see Bench.stories.jsx.
import Table from "../src/nouns/table/Table.jsx";
import { TABLE, TABLE_KNOBS } from "../src/nouns/table/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TABLE, TABLE_KNOBS, {}, {});

export default {
  title: "Furniture/Surfaces/Table",
  component: Table,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Table config={K.configOf(a)} />,
};

export const Default = {};
