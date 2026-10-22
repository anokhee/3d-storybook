// Fern: what the vibraphone grows with each note, a frond unfurled and
// arched over, its leaflets open (src/xylophone/meadow.js, settings in
// src/xylophone/ferns.js). `pitch` is the note: low notes short and
// big, high notes tall and small.
import { Built } from "./helpers/xylophone.jsx";
import { buildFern } from "../src/xylophone/meadow.js";

export default {
  title: "Nature/Plants/Fern",
  argTypes: { pitch: { control: { type: "range", min: 0, max: 1, step: 0.05 } } },
  args: { pitch: 0.5 },
  render: (a) => <Built build={(scene, tools) => scene.add(buildFern(tools, a.pitch))} />,
};

export const Default = {};
