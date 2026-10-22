// Dead Tree: a bare trunk with a few branches. The tree component's "dead" kind
// (TREE_KINDS in src/nouns/tree/objects.js), with the knobs every tree has.
// See Bench.stories.jsx for how argTypes, args and render fit together.
import Tree from "../src/nouns/tree/Tree.jsx";
import { TREE, TREE_KNOBS } from "../src/nouns/tree/objects.js";
import { TREE_PALETTES } from "../src/nouns/tree/palettes.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TREE, TREE_KNOBS, { kind: "dead" }, { leafColor: TREE.trunk.deadColor.hex });

export default {
  title: "Nature/Trees/Dead Tree",
  component: Tree,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Tree config={K.configOf(a)} />,
};

export const Default = {};

