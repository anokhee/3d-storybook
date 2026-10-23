// Wall clock: a round case with a face, ticks and two hands, its foot at
// y = 0 and facing +z, hung `hang` up the wall. Shown on a stretch of wall
// (stories/helpers/mounts.jsx) in the house's wall color, standing on the
// ground. Its code is src/nouns/wallClock/WallClock.jsx and its defaults
// src/nouns/wallClock/objects.js. Turn on `run` to watch the hands go.
import WallClock from "../src/nouns/wallClock/WallClock.jsx";
import { WALL_CLOCK, WALL_CLOCK_KNOBS } from "../src/nouns/wallClock/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WALL_CLOCK, WALL_CLOCK_KNOBS);

export default {
  title: "Furniture/Wall Decor/Wall Clock",
  component: WallClock,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  // On a piece of wall sized to it: as wide as it plus a margin, as tall as it hangs
  render: (a) => {
    const C = merge(WALL_CLOCK, K.configOf(a));
    const wallTop = C.hang + 2 * C.radius + 0.5;
    return (
      <WallPanel width={2 * C.radius + 1.4} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.house.walls}>
        <WallClock config={C} />
      </WallPanel>
    );
  },
};

export const Default = {};
