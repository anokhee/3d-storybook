// Wall hanging: a framed picture, its foot at y = 0 and facing +z, hung
// `hang` up the wall. Shown on a stretch of wall (stories/helpers/mounts.jsx)
// in the house's wall color, standing on the ground. The component takes its
// config as given, so the knobs are merged over the whole default object.
import WallHanging from "../src/nouns/wallHanging/WallHanging.jsx";
import { WALL_HANGING, WALL_HANGING_KNOBS } from "../src/nouns/wallHanging/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WALL_HANGING, WALL_HANGING_KNOBS);

export default {
  title: "Furniture/Wall Decor/Wall Hanging",
  component: WallHanging,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  // On a piece of wall sized to it: as wide as it plus a margin, as tall as it hangs
  render: (a) => {
    const H = merge(WALL_HANGING, K.configOf(a));
    const wallTop = H.hang + H.height + 1;
    return (
      <WallPanel width={H.width + 2} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.house.walls}>
        <WallHanging config={H} />
      </WallPanel>
    );
  },
};

export const Default = {};
