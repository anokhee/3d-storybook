// Dead Tree: a bare trunk with a few branches flung out of it. The tree component's "dead" kind
// (TREE_KINDS in src/nouns/tree/objects.js), with the knobs every tree has,
// fitted to the characters (TREE_FIT there). See Bench.stories.jsx for how
// argTypes, args and render fit together.
import Tree from "../src/nouns/tree/Tree.jsx";
import { TREE_MAP, TREE_FIT, TREE_KNOBS } from "../src/nouns/tree/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TREE_MAP, TREE_KNOBS, { kind: "dead", ...TREE_FIT }, { leafColor: TREE_MAP.trunk.deadColor.hex });

export default {
  title: "Nature/Trees/Dead Tree",
  component: Tree,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Tree config={K.configOf(a)} />,
};

export const Default = {};
