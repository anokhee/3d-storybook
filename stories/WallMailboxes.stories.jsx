// Wall mailboxes: the grid of little letterboxes on a lobby wall, one to a
// flat — a cabinet hung flat against the wall, each door with its letter
// slot, its name card and its lock, and here and there a letter poking
// out. Shown on a stretch of wall (stories/helpers/mounts.jsx). Its code is
// src/nouns/wallMailboxes/WallMailboxes.jsx and its defaults
// src/nouns/wallMailboxes/objects.js; a lobby (Shopfronts/Shop Interior)
// has one on its side wall.
import WallMailboxes from "../src/nouns/wallMailboxes/WallMailboxes.jsx";
import { WALL_MAILBOXES, WALL_MAILBOXES_KNOBS, wallMailboxesSizeOf } from "../src/nouns/wallMailboxes/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WALL_MAILBOXES, WALL_MAILBOXES_KNOBS);

export default {
  title: "Furniture/Wall Decor/Wall Mailboxes",
  component: WallMailboxes,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  // on a piece of wall sized to it: as wide as it plus a margin, as tall as it hangs
  render: (a) => {
    const C = merge(WALL_MAILBOXES, K.configOf(a));
    const { w, h } = wallMailboxesSizeOf(C);
    const wallTop = C.hang + h + 0.6;
    return (
      <WallPanel width={w + 1.4} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.house.walls}>
        <WallMailboxes config={C} />
      </WallPanel>
    );
  },
};

export const Default = {};
// a small building's: two across, three up, no post today
export const Small = { args: { cols: 2, rows: 3, post: 0 } };
