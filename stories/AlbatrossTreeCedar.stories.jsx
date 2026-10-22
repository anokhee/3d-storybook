// Cedar: a tall cedar, as at Okunoin. From the albatross game; see stories/helpers/albatross.jsx.
import { AlbatrossTree } from "./helpers/albatross.jsx";

export default {
  title: "Nature/Trees/Cedar",
  argTypes: { k: { control: { type: "range", min: 0, max: 5, step: 1 }, name: "shape" } },
  args: { k: 0 },
  render: (a) => <AlbatrossTree kind="cedar" k={a.k} />,
};

export const Default = {};
