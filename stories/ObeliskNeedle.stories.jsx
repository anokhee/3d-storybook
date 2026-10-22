// Needle: a tapering shaft. From the albatross game; see stories/helpers/albatross.jsx.
import { Obelisk } from "./helpers/albatross.jsx";

export default {
  title: "Monuments/Needle",
  argTypes: { k: { control: { type: "range", min: 0, max: 7, step: 1 }, name: "height" } },
  args: { k: 3 },
  render: (a) => <Obelisk kind="needle" k={a.k} />,
};

export const Default = {};
