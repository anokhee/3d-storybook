// Fish Head: the fish that pop up out of the sand as the steel drums are
// played, gulping (src/xylophone/fish.js). One, risen as far as it comes:
// the game's own animation is run to the top of its rise and held there.
// `color` tints the body with a note's color, as a note would.
import { Built } from "./helpers/xylophone.jsx";
import { makeFishHeads, FISH_HEADS } from "../src/xylophone/fish.js";
import { COLOR_PALETTE } from "../src/xylophone/palette.js";

const one = (color) => (scene, tools) => {
  const fish = makeFishHeads(scene, tools);
  const f = fish.sprout(0, 0, 0, color, FISH_HEADS.sizeByPitch[0], 0);
  for (let t = 0; t < FISH_HEADS.rise; t += 1 / 60) fish.update(f, 1 / 60);
};

export default {
  title: "Animals/Fish Head",
  argTypes: { color: { control: "color", name: "note color" } },
  args: { color: COLOR_PALETTE.fish },
  render: (a) => <Built build={one(a.color)} />,
};

export const Default = {};
