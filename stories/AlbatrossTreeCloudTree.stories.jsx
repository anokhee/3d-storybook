// Cloud Tree: a trunk holding up clouds of leaves. From the albatross game; see stories/helpers/albatross.jsx.
import { AlbatrossTree } from "./helpers/albatross.jsx";

export default {
  title: "Nature/Trees/Cloud Tree",
  argTypes: { k: { control: { type: "range", min: 0, max: 5, step: 1 }, name: "shape" } },
  args: { k: 0 },
  render: (a) => <AlbatrossTree kind="cloud" k={a.k} />,
};

export const Default = {};
