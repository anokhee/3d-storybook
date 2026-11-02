// Wall planter: a Window Box hung on a wall, on two brackets with a board
// behind — growing whatever a window box grows (the pot plant's kinds, or
// ivy trailing down the wall). Shown on a stretch of wall
// (stories/helpers/mounts.jsx). Its code is src/nouns/wallPlanter/
// WallPlanter.jsx, its defaults and knobs src/nouns/wallPlanter/objects.js.
import WallPlanter from "../src/nouns/wallPlanter/WallPlanter.jsx";
import { WALL_PLANTER, WALL_PLANTER_KNOBS } from "../src/nouns/wallPlanter/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WALL_PLANTER, WALL_PLANTER_KNOBS);

export default {
  title: "Furniture/Pot Plants/Wall Planter",
  component: WallPlanter,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => {
    const P = merge(WALL_PLANTER, K.configOf(a));
    const top = P.hang + P.box.height + 1.2;
    return (
      <WallPanel width={P.box.width + 2.4} height={top} center={[0, top / 2]} swatch={PALETTE.house.walls}>
        <WallPlanter config={P} />
      </WallPanel>
    );
  },
};

export const Default = {};
export const Tulips = { args: { plant: "tulip", count: 5, size: 0.14, stem: 0.3 } };
export const Bush = { args: { plant: "bush", count: 4, size: 0.18, stem: 0.12 } };
