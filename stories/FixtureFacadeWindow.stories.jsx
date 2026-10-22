// Facade Window: one of the two on the front of the house, on a piece of wall:
// the lit pane in its frame (Window in src/nouns/house/House.jsx, HOUSE.windows
// its settings, WINDOW_KNOBS its knobs). The variants are the same window
// at other sizes, and dark. The window as it is indoors, which can be
// arched, round or divided into panes, is the Window entry
// (FixtureWindow.stories.jsx).
import { Window } from "../src/nouns/house/House.jsx";
import { HOUSE, WINDOW_KNOBS } from "../src/nouns/house/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(HOUSE.windows, WINDOW_KNOBS);

export default {
  title: "Fixtures/Windows/Facade Window",
  component: Window,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  // On a piece of wall sized to it: as wide as it plus a margin, as tall as it sits
  render: (a) => {
    const W = merge(HOUSE.windows, K.configOf(a));
    const wallTop = W.y + W.height / 2 + 1.5;
    return (
      <WallPanel width={W.width + 3} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.house.walls}>
        <Window W={W} x={0} face={0} />
      </WallPanel>
    );
  },
};

// VARIANTS: the house's own, and a few more shapes.
export const Default = {};
export const Tall = { args: { width: 1.1, height: 2.3 } };
export const Wide = { args: { width: 2.6, height: 1.1 } };
export const Small = { args: { width: 0.8, height: 0.8 } };
export const Picture = { name: "Picture Window", args: { width: 2.6, height: 1.9, frameThickness: 0.1 } };
export const Dark = { args: { lit: false } };
