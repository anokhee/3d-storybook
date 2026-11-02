// Toadstools: what the kalimba grows with each note, a cluster of spotted
// toadstools, the first full size and the rest small round its foot
// (src/xylophone/meadow.js, settings in src/xylophone/mushrooms.js).
// `pitch` is the note: low notes short and big, high notes tall and small.
// Fitted to the characters (XYLO_FIT).
import { Built, XYLO_FIT } from "./helpers/xylophone.jsx";
import { buildToadstools } from "../src/xylophone/meadow.js";

const fitted = (g) => (g.scale.setScalar(XYLO_FIT), g);

export default {
  title: "Nature/Plants/Toadstools",
  argTypes: { pitch: { control: { type: "range", min: 0, max: 1, step: 0.05 } } },
  args: { pitch: 0.5 },
  render: (a) => <Built build={(scene, tools) => scene.add(fitted(buildToadstools(tools, a.pitch)))} />,
};

export const Default = {};
