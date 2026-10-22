// Stage: a stage with an audience in front of it. From the xylophone
// project (src/xylophone/stage.js), stood on the stage by
// stories/helpers/xylophone.jsx. Its settings are the STAGE-style
// constant at the top of that file.
import { Built } from "./helpers/xylophone.jsx";
import { buildStage } from "../src/xylophone/stage.js";

export default {
  title: "Buildings/Stage",
  render: () => <Built build={buildStage} />,
};

export const Default = {};
