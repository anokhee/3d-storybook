// Sand: the albatross field's beach over the whole stage, the azaleas'
// white with pebbles dotted over it in their own grays: the field's own
// shader (src/albatross/beach.js, SAND). See stories/helpers/albatross.jsx.
import { GroundPatch } from "./helpers/albatross.jsx";

export default {
  title: "Nature/Groundcover/Sand",
  render: () => <GroundPatch sand={true} />,
};

export const Default = {};
