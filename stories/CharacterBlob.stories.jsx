// Alien Blob: the xylophone's player, a round body on a squash with noodle
// arms that reach out to the bars, each ending in a mallet, and a face
// that blinks and gurns (src/xylophone/blob.js). It needs the bars to aim
// at, so the arc of bars is built for it, unseen. The toppers and
// accessories are what the instruments dress it in. In the game the arms
// only come out to play a note; here the "arms" slider holds that many out
// over their bars, so the mallets (or bare tentacles) can be seen.
import { Built } from "./helpers/xylophone.jsx";
import { buildBlob } from "../src/xylophone/blob.js";
import { buildBars, BAR_T } from "../src/xylophone/instruments.js";
import { XYLOPHONE } from "../src/xylophone/xylophone.js";
import { outlineMat } from "../src/xylophone/ink.js";

const one = (a) => (scene, tools) => {
  const { bars } = buildBars(tools); // not added: the blob only needs to know where they are
  const blob = buildBlob(scene, { ...tools, outlineMat, wood: tools.toonMat(XYLOPHONE.colors.wood) }, 0, 0, { bars, barT: BAR_T });
  blob.setInstrument(a.mallets, 0, { antennae: a.topper, sunglasses: a.sunglasses, clownNose: a.clownNose, headphones: a.headphones });
  blob.holdArms(a.arms);
  // its `animate(now, dt)` keeps it blinking and breathing; it counts `now` in milliseconds, as the game's loop
  // gives it, where the stage gives seconds
  return { ...blob, animate: (now, dt) => blob.animate(now * 1000, dt) };
};

export default {
  title: "Characters/Alien Blob",
  argTypes: {
    arms: { control: { type: "range", min: 0, max: 8, step: 1 }, description: "how many arms are out" },
    topper: { control: "radio", options: ["antennae", "stars", "hats", "mushrooms", "none"], name: "on its head" },
    mallets: { control: "boolean" },
    sunglasses: { control: "boolean" },
    clownNose: { control: "boolean", name: "clown nose" },
    headphones: { control: "boolean" },
  },
  args: { arms: 2, topper: "antennae", mallets: true, sunglasses: false, clownNose: false, headphones: false },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
