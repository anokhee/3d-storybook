// Stele: a flat standing stone. From the albatross game; see stories/helpers/albatross.jsx.
import { Obelisk } from "./helpers/albatross.jsx";

export default {
  title: "Monuments/Stele",
  argTypes: { k: { control: { type: "range", min: 0, max: 7, step: 1 }, name: "height" } },
  args: { k: 3 },
  render: (a) => <Obelisk kind="stele" k={a.k} />,
};

export const Default = {};
