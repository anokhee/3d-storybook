// Toad: a toad, sat by the fence, that nods along. From the xylophone
// project (src/xylophone/toad.js), stood on the stage by
// stories/helpers/xylophone.jsx. Its settings are the TOAD-style
// constant at the top of that file.
import { Built } from "./helpers/xylophone.jsx";
import { buildToad } from "../src/xylophone/toad.js";

export default {
  title: "Animals/Toad",
  render: () => <Built build={buildToad} />,
};

export const Default = {};
