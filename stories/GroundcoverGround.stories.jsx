// Ground: the albatross field's grass over the whole stage, the park's
// green with paint pentagons scattered over it, big and small, each turned
// its own way: the field's own shader (src/albatross/beach.js, SPLOTCH).
// See stories/helpers/albatross.jsx.
import { GroundPatch } from "./helpers/albatross.jsx";

export default {
  title: "Nature/Groundcover/Ground",
  render: () => <GroundPatch sand={false} />,
};

export const Default = {};
