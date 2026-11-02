// Cutting Board: a wooden board lying flat, rounds sliced on it, a knife across it. Its code is src/nouns/cuttingBoard/CuttingBoard.jsx and its defaults
// src/nouns/cuttingBoard/objects.js.
import CuttingBoard from "../src/nouns/cuttingBoard/CuttingBoard.jsx";
import { CUTTING_BOARD, CUTTING_BOARD_KNOBS } from "../src/nouns/cuttingBoard/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CUTTING_BOARD, CUTTING_BOARD_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Cutting Board",
  component: CuttingBoard,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <CuttingBoard config={K.configOf(a)} />,
};

export const Default = {};
