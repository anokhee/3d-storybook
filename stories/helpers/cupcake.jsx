// A CUPCAKE STORY: one flavour of cupcake house (src/nouns/house/cupcake/variants.js)
// as an entry of its own, its knobs starting at that flavour's values.
// `...cupcakeStory(flavour)` is spread into the story file's default export, which sets
// `title` itself: Storybook's indexer needs an object literal with a static title.
import Cupcake from "../../src/nouns/house/cupcake/Cupcake.jsx";
import { CUPCAKE, CUPCAKE_KNOBS } from "../../src/nouns/house/cupcake/objects.js";
import { CUPCAKE_VARIANTS } from "../../src/nouns/house/cupcake/variants.js";
import { merge } from "../../src/world/merge.js";
import { knobStory } from "./knobs.js";

export function cupcakeStory(flavour) {
  const variant = CUPCAKE_VARIANTS[flavour];
  const K = knobStory(merge(CUPCAKE, variant), CUPCAKE_KNOBS, {}, {});
  return {
    component: Cupcake,
    argTypes: K.argTypes,
    args: K.args,
    render: (a) => <Cupcake config={merge(variant, K.configOf(a))} />,
  };
}
