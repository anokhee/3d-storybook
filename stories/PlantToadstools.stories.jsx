// Toadstools: what the kalimba grows with each note, a cluster of spotted
// toadstools, the first full size and the rest small round its foot
// (src/xylophone/meadow.js, settings in src/xylophone/mushrooms.js).
// `pitch` is the note: low notes short and big, high notes tall and small.
import { Built } from "./helpers/xylophone.jsx";
import { buildToadstools } from "../src/xylophone/meadow.js";

export default {
  title: "Nature/Plants/Toadstools",
  argTypes: { pitch: { control: { type: "range", min: 0, max: 1, step: 0.05 } } },
  args: { pitch: 0.5 },
  render: (a) => <Built build={(scene, tools) => scene.add(buildToadstools(tools, a.pitch))} />,
};

export const Default = {};
