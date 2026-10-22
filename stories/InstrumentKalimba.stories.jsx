// Kalimba: a kalimba: a wooden box round the arc with a sound hole, the bars as steel tines over a bridge under a pressure bar.
// From the xylophone project (src/xylophone/instruments.js), stood on the
// stage by stories/helpers/xylophone.jsx. Its settings are in
// src/xylophone/kalimba.js.
import { Built } from "./helpers/xylophone.jsx";
import { buildKalimba } from "../src/xylophone/instruments.js";

export default {
  title: "Instruments/Kalimba",
  render: () => <Built build={buildKalimba} />,
};

export const Default = {};
