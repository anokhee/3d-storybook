// Curtain: a theater curtain on a rod. From the xylophone
// project (src/xylophone/curtain.js), stood on the stage by
// stories/helpers/xylophone.jsx. Its settings are the CURTAIN-style
// constant at the top of that file.
import { Built } from "./helpers/xylophone.jsx";
import { buildCurtain } from "../src/xylophone/curtain.js";

export default {
  title: "Buildings/Curtain",
  render: () => <Built build={buildCurtain} />,
};

export const Default = {};
