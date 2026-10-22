// A STORY FILE. One of these per object. Storybook finds every file whose
// name ends in .stories.jsx (see .storybook/main.js) and turns it into a
// sidebar entry with the named variants under it.
//
// The shape is always the same:
//   1. import the component, its defaults and its knobs: the knobs live
//      beside the defaults in src/nouns/<thing>/objects.js, as <THING>_KNOBS,
//      so a project reading the settings sees what can be turned
//   2. knobStory (stories/helpers/knobs.js) turns those into the Controls
//      panel (argTypes), the starting values read from the defaults (args),
//      and configOf, which turns the knobs back into the nested config the
//      component takes
//   3. `export default` describes the object: its title and those three
//   4. every other `export const` is a preset: a named variant that shows
//      up in the sidebar and overrides a few args
import Bench from "../src/nouns/bench/Bench.jsx";
import { BENCH, BENCH_KNOBS } from "../src/nouns/bench/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BENCH, BENCH_KNOBS);

export default {
  // Slashes make folders in the sidebar: Furniture ▸ Seating ▸ Wooden Bench.
  title: "Furniture/Seating/Wooden Bench",
  component: Bench,
  argTypes: K.argTypes,
  args: K.args,
  // Only the knobs' fields are passed; everything else falls through to
  // BENCH's defaults, because the component deep-merges config over them.
  render: (a) => <Bench config={K.configOf(a)} />,
};

// PRESETS. An empty object means "all the defaults". Anything in `args`
// overrides the defaults above, and only for that preset.
export const Default = {};

