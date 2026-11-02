// Deciduous Tree: a few lobes of leaf-green clay on a trunk. The tree component's "deciduous" kind
// (TREE_KINDS in src/nouns/tree/objects.js), with the knobs every tree has,
// fitted to the characters (TREE_FIT there). See Bench.stories.jsx for how
// argTypes, args and render fit together.
import Tree from "../src/nouns/tree/Tree.jsx";
import { TREE_MAP, TREE_FIT, TREE_KNOBS } from "../src/nouns/tree/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TREE_MAP, TREE_KNOBS, { kind: "deciduous", ...TREE_FIT }, {});

export default {
  title: "Nature/Trees/Deciduous Tree",
  component: Tree,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Tree config={K.configOf(a)} />,
};

export const Default = {};
