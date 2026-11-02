// Flowering Tree: the deciduous tree in bloom, flower heads over its lobes. The tree component's "flowering" kind
// (TREE_KINDS in src/nouns/tree/objects.js), with the knobs every tree has,
// fitted to the characters (TREE_FIT there). See Bench.stories.jsx for how
// argTypes, args and render fit together.
import Tree from "../src/nouns/tree/Tree.jsx";
import { TREE_MAP, TREE_FIT, TREE_KNOBS } from "../src/nouns/tree/objects.js";
import { TREE_PALETTES } from "../src/nouns/tree/palettes.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TREE_MAP, TREE_KNOBS, { kind: "flowering", ...TREE_FIT }, { leafColor: TREE_PALETTES.blossom[0].hex });

export default {
  title: "Nature/Trees/Flowering Tree",
  component: Tree,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Tree config={K.configOf(a)} />,
};

export const Default = {};
