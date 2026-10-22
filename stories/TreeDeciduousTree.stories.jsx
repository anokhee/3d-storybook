// Deciduous Tree: a round, lobed canopy on a trunk. The tree component's "deciduous" kind
// (TREE_KINDS in src/nouns/tree/objects.js), with the knobs every tree has.
// See Bench.stories.jsx for how argTypes, args and render fit together.
import Tree from "../src/nouns/tree/Tree.jsx";
import { TREE, TREE_KNOBS } from "../src/nouns/tree/objects.js";
import { TREE_PALETTES } from "../src/nouns/tree/palettes.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TREE, TREE_KNOBS, { kind: "deciduous" }, {});

export default {
  title: "Nature/Trees/Deciduous Tree",
  component: Tree,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Tree config={K.configOf(a)} />,
};

export const Default = {};

