// Fern: what the vibraphone grows with each note, a frond unfurled and
// arched over, its leaflets open (src/xylophone/meadow.js, settings in
// src/xylophone/ferns.js). `pitch` is the note: low notes short and
// big, high notes tall and small. Fitted to the characters (XYLO_FIT).
import { Built, XYLO_FIT } from "./helpers/xylophone.jsx";
import { buildFern } from "../src/xylophone/meadow.js";

const fitted = (g) => (g.scale.setScalar(XYLO_FIT), g);

export default {
  title: "Nature/Plants/Fern",
  argTypes: { pitch: { control: { type: "range", min: 0, max: 1, step: 0.05 } } },
  args: { pitch: 0.5 },
  render: (a) => <Built build={(scene, tools) => scene.add(fitted(buildFern(tools, a.pitch)))} />,
};

export const Default = {};
