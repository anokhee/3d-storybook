// Vibraphone: the vibraphone: the bars on a steel frame with a resonator tube under each, longer under the low notes, on legs with casters.
// From the xylophone project (src/xylophone/instruments.js), stood on the
// stage by stories/helpers/xylophone.jsx. Its settings are in
// src/xylophone/vibraphone.js.
import { Built } from "./helpers/xylophone.jsx";
import { buildVibraphone } from "../src/xylophone/instruments.js";

export default {
  title: "Instruments/Vibraphone",
  render: () => <Built build={buildVibraphone} />,
};

export const Default = {};
