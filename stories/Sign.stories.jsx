// Sign: one entry, as it was made. Its defaults live in
// src/nouns/sign/objects.js; to give it knobs, see Bench.stories.jsx.
import Sign from "../src/nouns/sign/Sign.jsx";

export default {
  title: "Buildings/Sign",
  component: Sign,
  // No overrides: the component merges this over its own defaults.
  render: () => <Sign config={{}} />,
};

export const Default = {};
