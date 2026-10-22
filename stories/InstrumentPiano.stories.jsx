// Piano: an electric piano: the bars as white keys with black keys between, on a thin body and leg frame, a music stand at the middle.
// From the xylophone project (src/xylophone/instruments.js), stood on the
// stage by stories/helpers/xylophone.jsx. Its settings are in
// src/xylophone/piano.js.
import { Built } from "./helpers/xylophone.jsx";
import { buildPiano } from "../src/xylophone/instruments.js";

export default {
  title: "Instruments/Piano",
  render: () => <Built build={buildPiano} />,
};

export const Default = {};
