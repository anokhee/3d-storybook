// Trampoline: one entry, as it was made. Its defaults live in
// src/nouns/trampoline/objects.js; to give it knobs, see Bench.stories.jsx.
import Trampoline from "../src/nouns/trampoline/Trampoline.jsx";

export default {
  title: "Machines/Trampoline",
  component: Trampoline,
  // No overrides: the component merges this over its own defaults.
  render: () => <Trampoline config={{}} />,
};

export const Default = {};
