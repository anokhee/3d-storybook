// Gachapon: one entry, as it was made. Its defaults live in
// src/nouns/gachapon/objects.js; to give it knobs, see Bench.stories.jsx.
import Gachapon from "../src/nouns/gachapon/Gachapon.jsx";

export default {
  title: "Machines/Gachapon",
  component: Gachapon,
  // No overrides: the component merges this over its own defaults.
  render: () => <Gachapon config={{}} />,
};

export const Default = {};
