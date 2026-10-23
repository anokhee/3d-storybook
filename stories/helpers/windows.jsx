// WINDOWS: the two builders the window entries share (stories/Fixture*Window.stories.jsx,
// FixturePorthole, FixtureArchedWindow, FixturePictureWindow). Each returns
// what a story's default export holds but its title, which stays in the story
// file as a plain literal: Storybook's indexer reads titles without running
// the file, and wants the default export to be an object.
//
// indoorWindow(over): the house's window as it is indoors, on a piece
// of wall — the way the dollies game's edit mode indoors has it. A slab for
// the glass with its top and bottom edges bowed on a curve each (1 a
// half-round, 0 flat; both 1 on a square one is a round window), one clear
// pane or divided into so many by bars, its own bezel behind it, and the
// house's moulding ringing the lot (Opening and Molding in src/interior/,
// INDOOR_WINDOW in src/nouns/house/objects.js its settings,
// INDOOR_WINDOW_KNOBS its knobs). Built as the game's Pane builds one
// (interior/Interior.jsx there): the opening's foot at the window's bottom
// edge, the moulding dropped by the bezel's share of the bottom curve so it
// springs from the same height, the bezel in the trim's colour. `over` are
// the starting values that make the entry what it is (arched, round, three
// panes); the knobs reach the rest, so one entry covers its whole family.
//
// facadeWindow(over): one of the two on the front of the house, on a
// piece of wall: the lit pane in its frame (Window in
// src/nouns/house/House.jsx, HOUSE.windows its settings, WINDOW_KNOBS its
// knobs). `over` likewise.
import Opening from "../../src/interior/Opening.jsx";
import Molding from "../../src/interior/Molding.jsx";
import { Window } from "../../src/nouns/house/House.jsx";
import { HOUSE, INDOOR_WINDOW, INDOOR_WINDOW_KNOBS, WINDOW_KNOBS } from "../../src/nouns/house/objects.js";
import { WallPanel } from "./mounts.jsx";
import { PALETTE } from "../../src/world/palette.js";
import { merge } from "../../src/world/merge.js";
import { knobStory } from "./knobs.js";

export function indoorWindow(over = {}) {
  const K = knobStory(INDOOR_WINDOW, INDOOR_WINDOW_KNOBS, {}, over);
  return {
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
              <Molding width={W.width + 2 * ft} height={W.height + ft * (top + bottom)} topCurve={top} bottomCurve={bottom} closed frame={T} />
            </group>
          </group>
        </WallPanel>
      );
    },
  };
}

export function facadeWindow(over = {}) {
  const K = knobStory(HOUSE.windows, WINDOW_KNOBS, {}, over);
  return {
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
}
