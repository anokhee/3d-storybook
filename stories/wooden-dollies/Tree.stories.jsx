// The tree. Same shape as Bench.stories.jsx (read that one first; it has
// the long comments). What is different here: a `kind` knob that is a radio
// button, because the project's TREE_KINDS list says which kinds exist.

// `block()` is the palette's clay colour: a hex plus a little allowed drift.
// Trees use it rather than `solid()`, so the picker value gets wrapped in it.
import { block } from "@world/palette.js";
import Tree from "@dollies/refactored/nouns/tree/Tree.jsx";
import { TREE, TREE_KINDS } from "@dollies/refactored/nouns/tree/objects.js";
import { TREE_PALETTES } from "@dollies/refactored/nouns/tree/palettes.js";

export default {
  title: "Wooden Dollies/Nature/Tree",
  component: Tree,
  argTypes: {
    // A radio group. `options` is the list of choices.
    kind: { control: "radio", options: TREE_KINDS },
    barkColor: { control: "color", name: "bark colour" },
    leafColor: { control: "color", name: "leaf colour" },
    trunkHeight: { control: { type: "range", min: 2, max: 20, step: 0.2 } },
    canopyRadius: { control: { type: "range", min: 1, max: 10, step: 0.1 } },
    // Lobes only matter for a deciduous canopy, tiers only for a conifer.
    // Both are always shown; the one that does not apply just does nothing.
    lobes: { control: { type: "range", min: 1, max: 6, step: 1 } },
    tiers: { control: { type: "range", min: 1, max: 6, step: 1 } },
    blooms: { control: { type: "range", min: 0, max: 40, step: 1 } },
  },
  args: {
    kind: TREE.kind,
    barkColor: TREE.trunk.color.hex,
    leafColor: TREE.deciduous.color.hex,
    trunkHeight: TREE.trunk.height,
    canopyRadius: TREE.deciduous.radius,
    lobes: TREE.deciduous.lobes,
    tiers: TREE.conifer.tiers,
    blooms: TREE.blooms.count,
  },
  render: ({ kind, barkColor, leafColor, trunkHeight, canopyRadius, lobes, tiers, blooms }) => (
    <Tree
      config={{
        kind,
        trunk: { color: block(barkColor), height: trunkHeight },
        // The same leaf colour goes to both canopy types, so switching
        // `kind` keeps whatever colour was picked.
        deciduous: { color: block(leafColor), radius: canopyRadius, lobes },
        conifer: { color: block(leafColor), radius: canopyRadius, tiers },
        blooms: { count: blooms },
      }}
    />
  ),
};

export const Deciduous = {};

export const Flowering = {
  args: { kind: "flowering", leafColor: TREE_PALETTES.blossom[0].hex },
};

export const Conifer = {
  args: { kind: "conifer", leafColor: TREE_PALETTES.needles[0].hex, tiers: 4 },
};

export const Dead = { args: { kind: "dead", trunkHeight: 8 } };

export const Sapling = { args: { trunkHeight: 3, canopyRadius: 2.2, lobes: 2 } };
