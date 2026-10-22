// Window: the house's window as it is indoors, on a piece of wall — the
// way the dollies game's edit mode indoors has it. A slab for the glass
// with its top and bottom edges bowed on a curve each (1 a half-round, 0
// flat; both 1 on a square one is a round window), one clear pane or
// divided into so many by bars, its own bezel behind it, and the house's
// moulding ringing the lot (Opening and Molding in src/interior/,
// INDOOR_WINDOW in src/nouns/house/objects.js its settings,
// INDOOR_WINDOW_KNOBS its knobs). Built as the game's Pane builds one
// (interior/Interior.jsx there): the opening's foot at the window's
// bottom edge, the moulding dropped by the bezel's share of the bottom
// curve so it springs from the same height, the bezel in the trim's
// colour. The variants are the shapes the knobs reach: arched, round,
// plain, more panes, an odd count, and dark.
import Opening from "../src/interior/Opening.jsx";
import Molding from "../src/interior/Molding.jsx";
import { INDOOR_WINDOW, INDOOR_WINDOW_KNOBS } from "../src/nouns/house/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(INDOOR_WINDOW, INDOOR_WINDOW_KNOBS);

export default {
  title: "Fixtures/Windows/Window",
  component: Opening,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  // On a piece of wall sized to it: as wide as the window, its bezel and
  // its trim plus a margin, as tall as its top stands plus the same.
  render: (a) => {
    const W = merge(INDOOR_WINDOW, K.configOf(a));
    const T = W.trim?.thickness > 0 && W.trim?.depth > 0 ? W.trim : null;
    const glass = { ...W, frame: W.frame && T?.color ? { ...W.frame, color: T.color } : W.frame };
    const ft = W.frame?.thickness ?? 0;
    const top = W.topCurve ?? 0;
    const bottom = W.bottomCurve ?? 0;
    const edge = ft + (T?.thickness ?? 0);
    const wallTop = W.y + W.height / 2 + edge + 1.5;
    return (
      <WallPanel width={W.width + 2 * edge + 3} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.house.walls}>
        <group position-y={W.y - W.height / 2}>
          <Opening O={glass} />
          <group position-y={-ft * bottom}>
            <Molding
              width={W.width + 2 * ft}
              height={W.height + ft * (top + bottom)}
              topCurve={top}
              bottomCurve={bottom}
              closed
              frame={T}
            />
          </group>
        </group>
      </WallPanel>
    );
  },
};

// VARIANTS: the house's own (four panes, square), and the shapes indoors.
export const Default = {};
export const Plain = { args: { style: "plain" } };
export const Arched = { args: { height: 2, topCurve: 1 } };
export const ArchedPlain = { name: "Arched, Plain", args: { height: 2, topCurve: 1, style: "plain" } };
export const Round = { name: "Round", args: { width: 1.4, height: 1.4, topCurve: 1, bottomCurve: 1 } };
export const Porthole = { args: { width: 1.2, height: 1.2, topCurve: 1, bottomCurve: 1, style: "plain" } };
export const SixPanes = { name: "Six Panes", args: { height: 1.9, panes: 6 } };
export const ThreePanes = { name: "Three Panes", args: { height: 1.9, panes: 3 } };
export const Tall = { args: { width: 1, height: 2.6, topCurve: 1, panes: 8 } };
export const Dark = { args: { lit: false } };
