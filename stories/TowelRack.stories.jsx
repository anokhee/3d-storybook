// Towel rack: a bar on two wall brackets with a towel draped over it, its
// foot at y = 0 and facing +z, the bar hung `hang` up the wall. Shown on a
// stretch of wall (stories/helpers/mounts.jsx) in the house's wall color,
// standing on the ground. Its code lives in src/nouns/towelRack/
// (TowelRack.jsx, objects.js).
import TowelRack, { towelRackHeightOf } from "../src/nouns/towelRack/TowelRack.jsx";
import { TOWEL_RACK, TOWEL_RACK_KNOBS } from "../src/nouns/towelRack/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TOWEL_RACK, TOWEL_RACK_KNOBS);

export default {
  title: "Furniture/Bathroom/Towel Rack",
  component: TowelRack,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  // On a piece of wall sized to it: as wide as the bar plus a margin, as tall as it hangs
  render: (a) => {
    const R = merge(TOWEL_RACK, K.configOf(a));
    const wallTop = towelRackHeightOf(R) + 1;
    return (
      <WallPanel width={R.width + 2} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.house.walls}>
        <TowelRack config={R} />
      </WallPanel>
    );
  },
};

export const Default = {};

// Two bars stacked, a towel on each.
export const TwoBars = { args: { bars: 2 } };
