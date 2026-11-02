// Story Window: a window on the storeys over the shop floor (SHOPFRONT.storyWindow), with its sill —
// the library's window (Fixtures/Windows: Opening and its Molding) as a
// shopfront wears it, on a piece of the default shop's wall. Its knobs are
// the shopfront's own for it (windowKnobs in src/nouns/shopfront/objects.js),
// plus its size.
import { ShopfrontWindow } from "../src/nouns/shopfront/Shopfront.jsx";
import { SHOPFRONT, windowKnobs } from "../src/nouns/shopfront/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const DEFAULTS = { ...SHOPFRONT, storyWindow: { ...SHOPFRONT.storyWindow, width: SHOPFRONT.storyWindow.width, height: SHOPFRONT.storyWindow.height } };
const K = knobStory(DEFAULTS, {
  width: { path: "storyWindow.width", range: [0.4, 4, 0.05] },
  height: { path: "storyWindow.height", range: [0.4, 4, 0.05] },
  ...windowKnobs("storyWindow", "story window"),
  trimColor: { path: "colors.trim.hex", color: true, name: "trim color" },
  wallColor: { path: "colors.wall.hex", color: true, name: "wall color" },
});

export default {
  title: "Shopfronts/Story Window",
  component: ShopfrontWindow,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => {
    const S = merge(DEFAULTS, K.configOf(a)), w = S.storyWindow;
    const edge = w.frame + w.trim, foot = 0.6 + edge;
    const wallTop = foot + w.height + edge + 0.8;
    return (
      <WallPanel width={w.width + 2 * edge + 1.6} height={wallTop} center={[0, wallTop / 2]} swatch={S.colors.wall}>
        <group position-y={foot}>
          <ShopfrontWindow width={w.width} height={w.height} look={w} trim={S.colors.trim} />
        </group>
      </WallPanel>
    );
  },
};

export const Default = {};
