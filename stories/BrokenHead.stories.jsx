// Broken Head: one of the field's statue heads, broken and lying on its
// largest broken face, as the fallen heads do among the cedars. `variant`
// picks which head, `seed` how it breaks. From the albatross game; see
// stories/helpers/albatross.jsx.
import { BrokenHead } from "./helpers/albatross.jsx";

export default {
  title: "Monuments/Broken Head",
  argTypes: {
    variant: { control: { type: "range", min: 1, max: 23, step: 1 } },
    seed: { control: { type: "range", min: 1, max: 40, step: 1 } },
  },
  args: { variant: 1, seed: 1 },
  render: (a) => <BrokenHead variant={a.variant} seed={a.seed} />,
};

export const Default = {};
